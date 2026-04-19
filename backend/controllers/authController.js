const jwt = require('jsonwebtoken');
const User = require('../models/User');
const QRCode = require('qrcode');

// Generate JWT Token
const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'attendance_super_secret_key_2026';
  const expire = process.env.JWT_EXPIRE || '7d';
  return jwt.sign({ id }, secret, { expiresIn: expire });
};

// Generate Employee ID Automatically (EMP001, EMP002...)
const generateEmployeeId = async () => {
  const lastUser = await User.findOne().sort({ createdAt: -1 });

  if (!lastUser || !lastUser.employeeId) {
    return "EMP001";
  }

  const lastNumber = parseInt(lastUser.employeeId.replace("EMP", ""));
  const newNumber = String(lastNumber + 1).padStart(3, "0");
  return `EMP${newNumber}`;
};



// =============================================
// @desc Register new employee
// @route POST /api/auth/register
// =============================================
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, department, designation, phone } = req.body;

    // 1️⃣ Check existing email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // 2️⃣ Auto generate employeeId
    const employeeId = await generateEmployeeId();

    // 3️⃣ Create user with employeeId
    const user = await User.create({
      name,
      email,
      password,
      role,
      department,
      designation,
      phone,
      employeeId
    });

    // 4️⃣ Generate QR Code
    const qrData = JSON.stringify({
      employeeId: user.employeeId,
      userId: user._id,
      name: user.name
    });

    const qrCode = await QRCode.toDataURL(qrData);
    user.qrCode = qrCode;
    await user.save();

    // 5️⃣ Generate Token
    const token = generateToken(user._id);

    // 6️⃣ Send response
    res.status(201).json({
      success: true,
      message: 'Employee registered successfully',
      token,
      user: {
        _id: user._id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
        qrCode: user.qrCode,
        leaveBalance: user.leaveBalance,
      },
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// =============================================
// @desc Login
// @route POST /api/auth/login
// =============================================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user with password
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account deactivated. Contact admin.'
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
        qrCode: user.qrCode,
        leaveBalance: user.leaveBalance,
        joiningDate: user.joiningDate,
      },
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// =============================================
// @desc Get current user profile
// @route GET /api/auth/me
// =============================================
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// =============================================
// @desc Change password
// @route PUT /api/auth/change-password
// =============================================
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({
        success: false,
        message: 'Current password incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};