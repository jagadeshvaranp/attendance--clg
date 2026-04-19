const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  employeeId: {
    type: String,
    required: true,
  },
  date: {
    type: String, // YYYY-MM-DD format
    required: true,
  },
  checkIn: {
    type: Date,
  },
  checkOut: {
    type: Date,
  },
  checkInLocation: {
    type: String,
    default: 'Office',
  },
  checkOutLocation: {
    type: String,
    default: 'Office',
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'half-day', 'late', 'on-leave'],
    default: 'absent',
  },
  workHours: {
    type: Number,
    default: 0,
  },
  overtime: {
    type: Number,
    default: 0,
  },
  notes: {
    type: String,
    default: '',
  },
  markedBy: {
    type: String,
    default: 'qr-scanner',
  },
}, { timestamps: true });

// Compound index to prevent duplicate attendance for same employee on same day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

// Auto-calculate work hours when checkOut is set
attendanceSchema.pre('save', function (next) {
  if (this.checkIn && this.checkOut) {
    const diff = (this.checkOut - this.checkIn) / (1000 * 60 * 60);
    this.workHours = parseFloat(diff.toFixed(2));
    const standard = 8;
    if (this.workHours > standard) {
      this.overtime = parseFloat((this.workHours - standard).toFixed(2));
    }
    if (this.workHours >= 4 && this.workHours < 7) {
      this.status = 'half-day';
    }
  }
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);
