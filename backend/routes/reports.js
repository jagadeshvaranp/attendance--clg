const express = require('express');
const router = express.Router();
const { downloadDailyReport, downloadWeeklyReport, downloadMonthlyReport, getDashboardStats } = require('../controllers/reportController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/dashboard', protect, getDashboardStats);
router.get('/daily', protect, adminOnly, downloadDailyReport);
router.get('/weekly', protect, adminOnly, downloadWeeklyReport);
router.get('/monthly', protect, adminOnly, downloadMonthlyReport);

module.exports = router;
