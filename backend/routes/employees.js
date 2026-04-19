// routes/employees.js
const express = require('express');
const router = express.Router();
const { getAllEmployees, getEmployee, updateEmployee, deleteEmployee, regenerateQR, getDepartmentStats } = require('../controllers/employeeController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, adminOnly, getAllEmployees);
router.get('/stats/departments', protect, adminOnly, getDepartmentStats);
router.get('/:id', protect, getEmployee);
router.put('/:id', protect, adminOnly, updateEmployee);
router.delete('/:id', protect, adminOnly, deleteEmployee);
router.post('/:id/qr', protect, adminOnly, regenerateQR);

module.exports = router;
