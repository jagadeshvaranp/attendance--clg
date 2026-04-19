const express = require('express');
const router = express.Router();
const {
  scanQR, getTodayAttendance, getEmployeeAttendance,
  getMonthlyAttendance, getWeeklyAttendance, manualMark, getMyAttendance,
} = require('../controllers/attendanceController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/scan', protect, adminOnly, scanQR);
router.get('/today', protect, adminOnly, getTodayAttendance);
router.get('/weekly', protect, adminOnly, getWeeklyAttendance);
router.get('/monthly', protect, adminOnly, getMonthlyAttendance);
router.post('/manual', protect, adminOnly, manualMark);
router.get('/my', protect, getMyAttendance);
router.get('/employee/:id', protect, getEmployeeAttendance);

module.exports = router;
