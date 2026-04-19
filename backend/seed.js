const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://adhi:adhi123@cluster0.onwwfol.mongodb.net/AUC-COM?retryWrites=true&w=majority&appName=Cluster0';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB Connected');

    // Get the User model
    const User = require('./models/User');

    // Delete ALL existing users completely
    await User.deleteMany({});
    console.log('🗑️  Cleared all users');

    // Define users
    const users = [
      { name: 'Super Admin',  email: 'admin@company.com', password: 'admin123', role: 'admin',    department: 'HR',         designation: 'System Administrator' },
      { name: 'Arjun Sharma', email: 'emp@company.com',   password: 'emp123',   role: 'employee', department: 'Engineering', designation: 'Software Engineer' },
      { name: 'Priya Patel',  email: 'priya@company.com', password: 'pass123',  role: 'employee', department: 'Design',      designation: 'UI/UX Designer' },
    ];

    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      const employeeId = `EMP${String(i + 1).padStart(3, '0')}`;

      // Hash password here manually
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(u.password, salt);

      console.log(`🔐 Hashed password for ${u.email}: ${hashedPassword.substring(0, 20)}...`);

      // Use insertOne directly to bypass pre-save hook
      const result = await User.collection.insertOne({
        employeeId,
        name: u.name,
        email: u.email,
        password: hashedPassword,
        role: u.role,
        department: u.department,
        designation: u.designation,
        isActive: true,
        qrCode: '',
        leaveBalance: { casual: 12, sick: 6, earned: 15 },
        joiningDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Generate QR
      const qrCode = await QRCode.toDataURL(JSON.stringify({
        employeeId,
        userId: result.insertedId,
        name: u.name,
      }));

      await User.collection.updateOne(
        { _id: result.insertedId },
        { $set: { qrCode } }
      );

      console.log(`✅ Created: ${u.email} / ${u.password} (ID: ${employeeId})`);
    }

    // Verify by testing password match
    console.log('\n🔍 Verifying passwords...');
    const admin = await User.findOne({ email: 'admin@company.com' }).select('+password');
    const isMatch = await bcrypt.compare('admin123', admin.password);
    console.log(`✅ Password verify test: ${isMatch ? 'PASSED ✓' : 'FAILED ✗'}`);

    if (!isMatch) {
      console.log('❌ Password verification failed! Something is wrong.');
    } else {
      console.log('\n🎉 All done! Login with:');
      console.log('   Admin:    admin@company.com / admin123');
      console.log('   Employee: emp@company.com   / emp123');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seed();