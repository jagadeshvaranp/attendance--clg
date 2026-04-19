const Attendance = require('../models/Attendance');
const User = require('../models/User');
const moment = require('moment');

// @desc Scan QR and mark attendance (check-in or check-out)
// @route POST /api/attendance/scan
exports.scanQR = async (req, res) => {
  try {
    const { qrData, scanType } = req.body; // scanType: 'checkin' | 'checkout'

    let parsed;
    try {
      parsed = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid QR code data' });
    }

    const { employeeId, userId } = parsed;
    const employee = await User.findById(userId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const today = moment().format('YYYY-MM-DD');
    let attendance = await Attendance.findOne({ employee: userId, date: today });

    if (scanType === 'checkin') {
      if (attendance && attendance.checkIn) {
        return res.status(400).json({ success: false, message: 'Already checked in today', attendance });
      }

      const checkInTime = new Date();
      const standardStart = moment().set({ hour: 9, minute: 0, second: 0 });
      const isLate = moment(checkInTime).isAfter(standardStart.add(15, 'minutes'));

      if (!attendance) {
        attendance = await Attendance.create({
          employee: userId,
          employeeId: employee.employeeId,
          date: today,
          checkIn: checkInTime,
          status: isLate ? 'late' : 'present',
          markedBy: 'qr-scanner',
        });
      } else {
        attendance.checkIn = checkInTime;
        attendance.status = isLate ? 'late' : 'present';
        await attendance.save();
      }

      await attendance.populate('employee', 'name department designation avatar');

      return res.json({
        success: true,
        type: 'checkin',
        message: `Welcome ${employee.name}! Check-in recorded at ${moment(checkInTime).format('hh:mm A')}`,
        attendance,
        employee: {
          name: employee.name,
          department: employee.department,
          employeeId: employee.employeeId,
          designation: employee.designation,
        },
      });
    }

    if (scanType === 'checkout') {
      if (!attendance || !attendance.checkIn) {
        return res.status(400).json({ success: false, message: 'No check-in found for today' });
      }
      if (attendance.checkOut) {
        return res.status(400).json({ success: false, message: 'Already checked out today' });
      }

      attendance.checkOut = new Date();
      await attendance.save();
      await attendance.populate('employee', 'name department designation');

      return res.json({
        success: true,
        type: 'checkout',
        message: `Goodbye ${employee.name}! Check-out recorded at ${moment(attendance.checkOut).format('hh:mm A')}. Total: ${attendance.workHours}h`,
        attendance,
        employee: {
          name: employee.name,
          department: employee.department,
          employeeId: employee.employeeId,
        },
      });
    }

    res.status(400).json({ success: false, message: 'Invalid scan type. Use checkin or checkout' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get today's attendance (admin)
// @route GET /api/attendance/today
exports.getTodayAttendance = async (req, res) => {
  try {
    const today = moment().format('YYYY-MM-DD');
    const records = await Attendance.find({ date: today })
      .populate('employee', 'name department designation avatar employeeId')
      .sort({ checkIn: 1 });

    const totalEmployees = await User.countDocuments({ role: 'employee', isActive: true });
    const present = records.filter(r => ['present', 'late', 'half-day'].includes(r.status)).length;

    res.json({
      success: true,
      date: today,
      stats: {
        total: totalEmployees,
        present,
        absent: totalEmployees - present,
        late: records.filter(r => r.status === 'late').length,
      },
      records,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get attendance for a specific employee
// @route GET /api/attendance/employee/:id
exports.getEmployeeAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { month, year } = req.query;

    const targetMonth = month || moment().month() + 1;
    const targetYear = year || moment().year();

    const startDate = moment(`${targetYear}-${String(targetMonth).padStart(2, '0')}-01`).format('YYYY-MM-DD');
    const endDate = moment(startDate).endOf('month').format('YYYY-MM-DD');

    const records = await Attendance.find({
      employee: id,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    const stats = {
      present: records.filter(r => r.status === 'present').length,
      late: records.filter(r => r.status === 'late').length,
      absent: records.filter(r => r.status === 'absent').length,
      halfDay: records.filter(r => r.status === 'half-day').length,
      totalWorkHours: records.reduce((sum, r) => sum + (r.workHours || 0), 0).toFixed(2),
      totalOvertime: records.reduce((sum, r) => sum + (r.overtime || 0), 0).toFixed(2),
    };

    res.json({ success: true, stats, records, month: targetMonth, year: targetYear });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get monthly attendance for all employees (admin)
// @route GET /api/attendance/monthly
exports.getMonthlyAttendance = async (req, res) => {
  try {
    const { month, year } = req.query;
    const targetMonth = month || moment().month() + 1;
    const targetYear = year || moment().year();

    const startDate = moment(`${targetYear}-${String(targetMonth).padStart(2, '0')}-01`).format('YYYY-MM-DD');
    const endDate = moment(startDate).endOf('month').format('YYYY-MM-DD');

    const employees = await User.find({ role: 'employee', isActive: true });
    const allAttendance = await Attendance.find({
      date: { $gte: startDate, $lte: endDate },
    });

    const workingDays = getWorkingDays(startDate, endDate);

    const summary = employees.map(emp => {
      const empRecords = allAttendance.filter(a => a.employee.toString() === emp._id.toString());
      const present = empRecords.filter(r => ['present', 'late'].includes(r.status)).length;
      const halfDay = empRecords.filter(r => r.status === 'half-day').length;
      const late = empRecords.filter(r => r.status === 'late').length;
      const absent = workingDays - present - halfDay;
      const totalHours = empRecords.reduce((sum, r) => sum + (r.workHours || 0), 0);

      return {
        employee: { _id: emp._id, name: emp.name, employeeId: emp.employeeId, department: emp.department, designation: emp.designation },
        present,
        halfDay,
        late,
        absent: Math.max(absent, 0),
        attendancePercent: workingDays > 0 ? Math.round(((present + halfDay * 0.5) / workingDays) * 100) : 0,
        totalHours: parseFloat(totalHours.toFixed(2)),
      };
    });

    res.json({ success: true, workingDays, summary, month: targetMonth, year: targetYear });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get weekly attendance stats
// @route GET /api/attendance/weekly
exports.getWeeklyAttendance = async (req, res) => {
  try {
    const startOfWeek = moment().startOf('isoWeek').format('YYYY-MM-DD');
    const endOfWeek = moment().endOf('isoWeek').format('YYYY-MM-DD');
    const totalEmployees = await User.countDocuments({ role: 'employee', isActive: true });

    const records = await Attendance.find({ date: { $gte: startOfWeek, $lte: endOfWeek } });

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = moment(startOfWeek).add(i, 'days');
      const dayStr = day.format('YYYY-MM-DD');
      const dayRecords = records.filter(r => r.date === dayStr);
      days.push({
        date: dayStr,
        dayName: day.format('ddd'),
        present: dayRecords.filter(r => ['present', 'late'].includes(r.status)).length,
        absent: totalEmployees - dayRecords.filter(r => ['present', 'late'].includes(r.status)).length,
        late: dayRecords.filter(r => r.status === 'late').length,
      });
    }

    res.json({ success: true, days, totalEmployees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Manual mark attendance (admin only)
// @route POST /api/attendance/manual
exports.manualMark = async (req, res) => {
  try {
    const { employeeId, date, status, checkIn, checkOut, notes } = req.body;

    const employee = await User.findOne({ employeeId });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    const attendance = await Attendance.findOneAndUpdate(
      { employee: employee._id, date },
      { employeeId, status, checkIn: checkIn ? new Date(checkIn) : null, checkOut: checkOut ? new Date(checkOut) : null, notes, markedBy: 'admin-manual' },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({ success: true, message: 'Attendance marked manually', attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: Get working days (Mon-Sat)
function getWorkingDays(startDate, endDate) {
  let count = 0;
  let current = moment(startDate);
  while (current.isSameOrBefore(endDate)) {
    if (current.day() !== 0) count++;
    current.add(1, 'days');
  }
  return count;
}

// @desc My attendance (logged in employee)
// @route GET /api/attendance/my
exports.getMyAttendance = async (req, res) => {
  try {
    req.params.id = req.user._id;
    return exports.getEmployeeAttendance(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
