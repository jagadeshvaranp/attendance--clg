# 📋 AttendMS — Attendance Management System
### Full Stack MERN Application

---

## 🗂️ Project Structure

```
attendance-system/
├── backend/                    # Node.js + Express + MongoDB
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js   # Login, register, JWT
│   │   ├── attendanceController.js  # QR scan, mark attendance
│   │   ├── employeeController.js    # CRUD employees
│   │   ├── leaveController.js       # Leave apply/approve
│   │   ├── taskController.js        # Task assignment
│   │   └── reportController.js      # Excel export
│   ├── middleware/
│   │   └── auth.js             # JWT protect, adminOnly
│   ├── models/
│   │   ├── User.js             # Employee model + QR
│   │   ├── Attendance.js       # Daily attendance records
│   │   ├── Leave.js            # Leave applications
│   │   └── Task.js             # Task assignments
│   ├── routes/
│   │   ├── auth.js
│   │   ├── attendance.js
│   │   ├── employees.js
│   │   ├── leaves.js
│   │   ├── tasks.js
│   │   └── reports.js
│   ├── .env.example
│   ├── package.json
│   └── server.js               # Main entry point
│
└── frontend/                   # React + Vite
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.jsx  # Global auth state
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── QRScanner.jsx    # Camera + QR scan
    │   │   ├── Attendance.jsx   # Admin: all attendance
    │   │   ├── Employees.jsx    # Admin: employee CRUD
    │   │   ├── Leaves.jsx       # Admin: approve/reject
    │   │   ├── Reports.jsx      # Excel downloads
    │   │   ├── Tasks.jsx        # Task management
    │   │   ├── MyAttendance.jsx # Employee: own records
    │   │   ├── MyLeaves.jsx     # Employee: apply leave
    │   │   └── Profile.jsx      # QR badge + password
    │   ├── components/
    │   │   └── Layout.jsx       # Sidebar + navigation
    │   ├── utils/
    │   │   └── api.js           # Axios instance + interceptors
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── package.json
    └── vite.config.js
```

---

## ⚙️ Setup Instructions

### Step 1: Prerequisites
```bash
# Install Node.js (v18+) and MongoDB
# https://nodejs.org
# https://www.mongodb.com/try/download/community
```

### Step 2: Clone / Extract the project
```bash
cd attendance-system
```

### Step 3: Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env with your values:
# PORT=5000
# MONGODB_URI=mongodb://localhost:27017/attendance_db
# JWT_SECRET=your_secret_key_here
# JWT_EXPIRE=7d
# FRONTEND_URL=http://localhost:5173

# Start backend
npm run dev
```

### Step 4: Create First Admin (via API or MongoDB Compass)
```bash
# POST http://localhost:5000/api/auth/login won't work until you create admin
# Use MongoDB Compass or this script:

# In a temporary route or mongo shell:
db.users.insertOne({
  employeeId: "EMP001",
  name: "Admin User",
  email: "admin@company.com",
  password: "$2a$12$...",  # bcrypt hash of "admin123"
  role: "admin",
  department: "HR",
  designation: "System Administrator",
  isActive: true
})

# OR run this seed script once:
node seed.js
```

### Step 5: Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Start frontend
npm run dev

# Open: http://localhost:5173
```

---

## 🌱 Seed Script (Create Initial Admin)

Create `backend/seed.js`:
```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI);

async function seed() {
  const User = require('./models/User');
  
  await User.deleteMany({ email: 'admin@company.com' });
  
  await User.create({
    employeeId: 'EMP001',
    name: 'Super Admin',
    email: 'admin@company.com',
    password: 'admin123',
    role: 'admin',
    department: 'HR',
    designation: 'System Administrator',
    isActive: true,
  });
  
  console.log('✅ Admin created: admin@company.com / admin123');
  process.exit(0);
}

seed();
```

Run it:
```bash
node seed.js
```

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/login` | Public | Login |
| POST | `/api/auth/register` | Admin | Add employee |
| GET | `/api/auth/me` | Auth | Get profile |
| PUT | `/api/auth/change-password` | Auth | Change password |

### Attendance
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/attendance/scan` | Admin | QR scan check-in/out |
| GET | `/api/attendance/today` | Admin | Today's records |
| GET | `/api/attendance/monthly` | Admin | Monthly summary |
| GET | `/api/attendance/weekly` | Admin | Weekly trend |
| POST | `/api/attendance/manual` | Admin | Manual entry |
| GET | `/api/attendance/my` | Employee | My attendance |

### Reports (Excel Downloads)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/reports/daily?date=YYYY-MM-DD` | Admin | Daily Excel |
| GET | `/api/reports/weekly?weekStart=YYYY-MM-DD` | Admin | Weekly Excel |
| GET | `/api/reports/monthly?month=3&year=2026` | Admin | Monthly Excel |
| GET | `/api/reports/dashboard` | Auth | Dashboard stats |

### Employees
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/employees` | Admin | All employees |
| GET | `/api/employees/:id` | Auth | Single employee |
| PUT | `/api/employees/:id` | Admin | Update employee |
| DELETE | `/api/employees/:id` | Admin | Deactivate |
| POST | `/api/employees/:id/qr` | Admin | Regenerate QR |

### Leaves
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/leaves` | Employee | Apply leave |
| GET | `/api/leaves` | Admin | All leaves |
| GET | `/api/leaves/my` | Employee | My leaves |
| PUT | `/api/leaves/:id/status` | Admin | Approve/Reject |
| DELETE | `/api/leaves/:id` | Employee | Cancel |

---

## 🔥 Key Features

### QR Scanner Workflow
1. Each employee gets a unique QR code on registration
2. Admin opens `/scanner` page → activates camera
3. Employee shows QR badge → system reads it via `html5-qrcode`
4. API call marks check-in or check-out with timestamp
5. Late detection: check-in after 9:15 AM = "late" status
6. Checkout auto-calculates work hours and overtime

### Excel Reports
- **Daily**: All employees with check-in/out times, work hours
- **Weekly**: Summary sheet + 6 day-wise sheets in one file
- **Monthly**: Attendance %, leave balance, overtime, dept breakdown

### Roles
- **Admin**: Full access — scanner, all attendance, employees, leave approval, reports, tasks
- **Employee**: Own attendance, apply/view leave, own tasks, QR badge

---

## 💡 Extra Features to Add (Future)

| Feature | How |
|---------|-----|
| Face Recognition | `face-api.js` + camera stream |
| Geo-fencing | `navigator.geolocation` + radius check |
| Shift Management | Add `shift` field to User model |
| WhatsApp Alerts | Twilio / WhatsApp Business API |
| Payroll Integration | Calculate salary from attendance data |
| Holiday Calendar | Add Holiday model, skip on attendance |
| Mobile App | React Native with same backend |
| Push Notifications | Socket.io for real-time updates |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + React Router |
| Styling | Pure CSS (custom design system) |
| Charts | Recharts |
| QR Reader | html5-qrcode |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Excel | SheetJS (xlsx) |
| QR Generator | qrcode npm package |
| Notifications | react-hot-toast |
