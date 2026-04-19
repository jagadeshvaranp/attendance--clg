const User = require('../models/User');
const Attendance = require('../models/Attendance');
const QRCode = require('qrcode');

// @desc Get all employees (admin)
// @route GET /api/employees
exports.getAllEmployees = async (req, res) => {
  try {
    const { department, search, isActive } = req.query;
    const filter = { role: 'employee' };

    if (department) filter.department = department;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const employees = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: employees.length, employees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get single employee
// @route GET /api/employees/:id
exports.getEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id).select('-password');
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update employee
// @route PUT /api/employees/:id
exports.updateEmployee = async (req, res) => {
  try {
    const allowed = ['name', 'department', 'designation', 'phone', 'isActive', 'leaveBalance'];
    const updates = {};
    allowed.forEach(field => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });

    const employee = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-password');
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    res.json({ success: true, message: 'Employee updated', employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Delete/deactivate employee
// @route DELETE /api/employees/:id
exports.deleteEmployee = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Employee deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Regenerate QR code for employee
// @route POST /api/employees/:id/qr
exports.regenerateQR = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    const qrData = JSON.stringify({ employeeId: employee.employeeId, userId: employee._id, name: employee.name });
    const qrCode = await QRCode.toDataURL(qrData);
    employee.qrCode = qrCode;
    await employee.save();

    res.json({ success: true, qrCode, message: 'QR code regenerated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get department summary stats (admin dashboard)
// @route GET /api/employees/stats/departments
exports.getDepartmentStats = async (req, res) => {
  try {
    const departments = ['Engineering', 'Design', 'Marketing', 'HR', 'Finance', 'Operations', 'Sales'];
    const stats = await Promise.all(
      departments.map(async (dept) => {
        const count = await User.countDocuments({ department: dept, role: 'employee', isActive: true });
        return { department: dept, count };
      })
    );
    res.json({ success: true, stats: stats.filter(s => s.count > 0) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
