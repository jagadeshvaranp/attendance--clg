const xlsx = require('xlsx');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Leave = require('../models/Leave');
const moment = require('moment');

// Helper: get working days
function getWorkingDays(startDate, endDate) {
  let count = 0;
  let current = moment(startDate);
  while (current.isSameOrBefore(endDate)) {
    if (current.day() !== 0) count++;
    current.add(1, 'days');
  }
  return count;
}

// @desc Download Daily Attendance Report (Excel)
// @route GET /api/reports/daily
exports.downloadDailyReport = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || moment().format('YYYY-MM-DD');

    const employees = await User.find({ role: 'employee', isActive: true });
    const records = await Attendance.find({ date: targetDate }).populate('employee', 'name department designation employeeId');

    const data = employees.map(emp => {
      const record = records.find(r => r.employee && r.employee._id.toString() === emp._id.toString());
      return {
        'Employee ID': emp.employeeId,
        'Name': emp.name,
        'Department': emp.department,
        'Designation': emp.designation,
        'Date': targetDate,
        'Check In': record?.checkIn ? moment(record.checkIn).format('hh:mm A') : '-',
        'Check Out': record?.checkOut ? moment(record.checkOut).format('hh:mm A') : '-',
        'Work Hours': record?.workHours || 0,
        'Status': record?.status || 'absent',
        'Remarks': record?.notes || '',
      };
    });

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);

    // Style header row
    const headerStyle = { font: { bold: true }, fill: { fgColor: { rgb: '1a1a2e' } } };
    ws['!cols'] = [
      { wch: 12 }, { wch: 22 }, { wch: 14 }, { wch: 18 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 20 },
    ];

    xlsx.utils.book_append_sheet(wb, ws, `Attendance_${targetDate}`);

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=daily_attendance_${targetDate}.xlsx`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Download Weekly Attendance Report (Excel)
// @route GET /api/reports/weekly
exports.downloadWeeklyReport = async (req, res) => {
  try {
    const { weekStart } = req.query;
    const startDate = weekStart ? moment(weekStart) : moment().startOf('isoWeek');
    const endDate = moment(startDate).endOf('isoWeek');

    const employees = await User.find({ role: 'employee', isActive: true });
    const records = await Attendance.find({
      date: { $gte: startDate.format('YYYY-MM-DD'), $lte: endDate.format('YYYY-MM-DD') },
    }).populate('employee', 'name department designation employeeId');

    const wb = xlsx.utils.book_new();

    // Summary Sheet
    const summaryData = employees.map(emp => {
      const empRecords = records.filter(r => r.employee && r.employee._id.toString() === emp._id.toString());
      const present = empRecords.filter(r => ['present', 'late'].includes(r.status)).length;
      const late = empRecords.filter(r => r.status === 'late').length;
      const halfDay = empRecords.filter(r => r.status === 'half-day').length;
      const onLeave = empRecords.filter(r => r.status === 'on-leave').length;
      const totalHours = empRecords.reduce((s, r) => s + (r.workHours || 0), 0);

      return {
        'Employee ID': emp.employeeId,
        'Name': emp.name,
        'Department': emp.department,
        'Week': `${startDate.format('DD/MM/YYYY')} - ${endDate.format('DD/MM/YYYY')}`,
        'Present': present,
        'Absent': 6 - present - halfDay - onLeave,
        'Half Day': halfDay,
        'Late': late,
        'On Leave': onLeave,
        'Total Hours': parseFloat(totalHours.toFixed(2)),
        'Attendance %': `${Math.round(((present + halfDay * 0.5) / 6) * 100)}%`,
      };
    });

    const wsSummary = xlsx.utils.json_to_sheet(summaryData);
    wsSummary['!cols'] = Array(11).fill({ wch: 16 });
    xlsx.utils.book_append_sheet(wb, wsSummary, 'Weekly Summary');

    // Daily detail sheets
    for (let i = 0; i < 6; i++) {
      const day = moment(startDate).add(i, 'days');
      const dayStr = day.format('YYYY-MM-DD');
      const dayRecords = records.filter(r => r.date === dayStr);

      const dayData = employees.map(emp => {
        const r = dayRecords.find(r => r.employee && r.employee._id.toString() === emp._id.toString());
        return {
          'Employee ID': emp.employeeId,
          'Name': emp.name,
          'Department': emp.department,
          'Check In': r?.checkIn ? moment(r.checkIn).format('hh:mm A') : '-',
          'Check Out': r?.checkOut ? moment(r.checkOut).format('hh:mm A') : '-',
          'Hours': r?.workHours || 0,
          'Status': r?.status || 'absent',
        };
      });

      const wsDay = xlsx.utils.json_to_sheet(dayData);
      wsDay['!cols'] = Array(7).fill({ wch: 16 });
      xlsx.utils.book_append_sheet(wb, wsDay, day.format('ddd_DD-MM'));
    }

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=weekly_attendance_${startDate.format('YYYY-MM-DD')}.xlsx`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Download Monthly Report (Excel)
// @route GET /api/reports/monthly
exports.downloadMonthlyReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    const targetMonth = month || moment().month() + 1;
    const targetYear = year || moment().year();
    const startDate = moment(`${targetYear}-${String(targetMonth).padStart(2, '0')}-01`).format('YYYY-MM-DD');
    const endDate = moment(startDate).endOf('month').format('YYYY-MM-DD');
    const workingDays = getWorkingDays(startDate, endDate);

    const employees = await User.find({ role: 'employee', isActive: true });
    const records = await Attendance.find({ date: { $gte: startDate, $lte: endDate } });
    const leaves = await Leave.find({
      status: 'approved',
      startDate: { $lte: new Date(endDate) },
      endDate: { $gte: new Date(startDate) },
    }).populate('employee', '_id');

    const wb = xlsx.utils.book_new();

    // Main summary
    const summaryData = employees.map(emp => {
      const empRecords = records.filter(r => r.employee.toString() === emp._id.toString());
      const present = empRecords.filter(r => ['present', 'late'].includes(r.status)).length;
      const halfDay = empRecords.filter(r => r.status === 'half-day').length;
      const late = empRecords.filter(r => r.status === 'late').length;
      const onLeave = empRecords.filter(r => r.status === 'on-leave').length;
      const absent = workingDays - present - halfDay - onLeave;
      const totalHours = empRecords.reduce((s, r) => s + (r.workHours || 0), 0);
      const attendance = Math.round(((present + halfDay * 0.5) / workingDays) * 100);

      return {
        'Employee ID': emp.employeeId,
        'Name': emp.name,
        'Department': emp.department,
        'Designation': emp.designation,
        'Month': moment(startDate).format('MMMM YYYY'),
        'Working Days': workingDays,
        'Present': present,
        'Late': late,
        'Half Day': halfDay,
        'On Leave': onLeave,
        'Absent': Math.max(absent, 0),
        'Total Hours': parseFloat(totalHours.toFixed(2)),
        'Attendance %': `${attendance}%`,
        'Status': attendance >= 85 ? 'GOOD' : attendance >= 70 ? 'AVERAGE' : 'LOW',
        'Casual Leave Balance': emp.leaveBalance.casual,
        'Sick Leave Balance': emp.leaveBalance.sick,
        'Earned Leave Balance': emp.leaveBalance.earned,
      };
    });

    const ws = xlsx.utils.json_to_sheet(summaryData);
    ws['!cols'] = Array(17).fill({ wch: 16 });
    xlsx.utils.book_append_sheet(wb, ws, `Monthly_${moment(startDate).format('MMM_YYYY')}`);

    // Department wise sheet
    const departments = [...new Set(employees.map(e => e.department))];
    const deptData = departments.map(dept => {
      const deptEmployees = employees.filter(e => e.department === dept);
      const avgAttendance = deptEmployees.reduce((sum, emp) => {
        const empRecords = records.filter(r => r.employee.toString() === emp._id.toString());
        const present = empRecords.filter(r => ['present', 'late'].includes(r.status)).length;
        return sum + ((present / workingDays) * 100);
      }, 0) / (deptEmployees.length || 1);

      return {
        'Department': dept,
        'Total Employees': deptEmployees.length,
        'Avg Attendance %': `${Math.round(avgAttendance)}%`,
      };
    });

    const wsDept = xlsx.utils.json_to_sheet(deptData);
    xlsx.utils.book_append_sheet(wb, wsDept, 'Department_Summary');

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=monthly_attendance_${targetYear}_${targetMonth}.xlsx`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get dashboard stats (admin)
// @route GET /api/reports/dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    const today = moment().format('YYYY-MM-DD');
    const thisMonthStart = moment().startOf('month').format('YYYY-MM-DD');
    const thisMonthEnd = moment().endOf('month').format('YYYY-MM-DD');

    const [totalEmployees, todayAttendance, pendingLeaves, monthlyAttendance] = await Promise.all([
      User.countDocuments({ role: 'employee', isActive: true }),
      Attendance.find({ date: today }),
      Leave.countDocuments({ status: 'pending' }),
      Attendance.find({ date: { $gte: thisMonthStart, $lte: thisMonthEnd } }),
    ]);

    const presentToday = todayAttendance.filter(a => ['present', 'late'].includes(a.status)).length;
    const lateToday = todayAttendance.filter(a => a.status === 'late').length;

    // Last 7 days trend
    const weekTrend = [];
    for (let i = 6; i >= 0; i--) {
      const day = moment().subtract(i, 'days');
      const dayStr = day.format('YYYY-MM-DD');
      const dayRecords = monthlyAttendance.filter(a => a.date === dayStr);
      weekTrend.push({
        date: dayStr,
        day: day.format('ddd'),
        present: dayRecords.filter(a => ['present', 'late'].includes(a.status)).length,
        absent: totalEmployees - dayRecords.filter(a => ['present', 'late'].includes(a.status)).length,
        late: dayRecords.filter(a => a.status === 'late').length,
      });
    }

    res.json({
      success: true,
      stats: {
        totalEmployees,
        presentToday,
        absentToday: totalEmployees - presentToday,
        lateToday,
        pendingLeaves,
        attendanceRate: totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0,
      },
      weekTrend,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
