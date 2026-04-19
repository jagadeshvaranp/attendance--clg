const express = require('express');
const router = express.Router();
const { applyLeave, getAllLeaves, getMyLeaves, updateLeaveStatus, cancelLeave } = require('../controllers/leaveController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/', protect, applyLeave);
router.get('/', protect, adminOnly, getAllLeaves);
router.get('/my', protect, getMyLeaves);
router.put('/:id/status', protect, adminOnly, updateLeaveStatus);
router.delete('/:id', protect, cancelLeave);

module.exports = router;
