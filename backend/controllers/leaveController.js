const Leave = require('../models/Leave');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const moment = require('moment');

// @desc Apply for leave
// @route POST /api/leaves
exports.applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    const start = moment(startDate);
    const end = moment(endDate);
    const totalDays = end.diff(start, 'days') + 1;

    // Check leave balance
    const employee = await User.findById(req.user._id);
    if (leaveType !== 'unpaid' && employee.leaveBalance[leaveType] < totalDays) {
      return res.status(400).json({ success: false, message: `Insufficient ${leaveType} leave balance` });
    }

    // Check for overlapping leaves
    const existing = await Leave.findOne({
      employee: req.user._id,
      status: { $ne: 'rejected' },
      $or: [
        { startDate: { $lte: end.toDate() }, endDate: { $gte: start.toDate() } },
      ],
    });
    if (existing) return res.status(400).json({ success: false, message: 'Leave already applied for these dates' });

    const leave = await Leave.create({
      employee: req.user._id,
      leaveType,
      startDate: start.toDate(),
      endDate: end.toDate(),
      totalDays,
      reason,
    });

    await leave.populate('employee', 'name department employeeId');
    res.status(201).json({ success: true, message: 'Leave application submitted', leave });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get all leaves (admin)
// @route GET /api/leaves
exports.getAllLeaves = async (req, res) => {
  try {
    const { status, employeeId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (employeeId) {
      const emp = await User.findOne({ employeeId });
      if (emp) filter.employee = emp._id;
    }

    const leaves = await Leave.find(filter)
      .populate('employee', 'name department employeeId designation')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: leaves.length, leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get my leaves (employee)
// @route GET /api/leaves/my
exports.getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ employee: req.user._id })
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Approve / Reject leave (admin)
// @route PUT /api/leaves/:id/status
exports.updateLeaveStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const leave = await Leave.findById(req.params.id).populate('employee');

    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });
    if (leave.status !== 'pending') return res.status(400).json({ success: false, message: 'Leave already processed' });

    leave.status = status;
    leave.approvedBy = req.user._id;
    leave.approvedAt = new Date();
    if (status === 'rejected') leave.rejectionReason = rejectionReason;

    if (status === 'approved') {
      // Deduct leave balance
      const employee = await User.findById(leave.employee._id);
      if (leave.leaveType !== 'unpaid') {
        employee.leaveBalance[leave.leaveType] = Math.max(0, employee.leaveBalance[leave.leaveType] - leave.totalDays);
        await employee.save();
      }

      // Mark attendance as on-leave for the dates
      let current = moment(leave.startDate);
      const end = moment(leave.endDate);
      while (current.isSameOrBefore(end)) {
        if (current.day() !== 0) { // Skip Sundays
          await Attendance.findOneAndUpdate(
            { employee: leave.employee._id, date: current.format('YYYY-MM-DD') },
            { employee: leave.employee._id, employeeId: leave.employee.employeeId, date: current.format('YYYY-MM-DD'), status: 'on-leave', markedBy: 'leave-approval' },
            { upsert: true }
          );
        }
        current.add(1, 'days');
      }
    }

    await leave.save();
    await leave.populate('employee', 'name department employeeId');

    res.json({ success: true, message: `Leave ${status}`, leave });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Cancel leave application (employee)
// @route DELETE /api/leaves/:id
exports.cancelLeave = async (req, res) => {
  try {
    const leave = await Leave.findOne({ _id: req.params.id, employee: req.user._id });
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });
    if (leave.status === 'approved') return res.status(400).json({ success: false, message: 'Cannot cancel approved leave' });

    await Leave.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Leave cancelled' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
