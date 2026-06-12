# 🎓 LISHA Academy

An Online Learning Management System (LMS) designed to provide a seamless learning experience for students, instructors, and administrators.


---
## 🚀 Features

### 👨‍🎓 Student
- User Registration & Authentication
- Browse & Enroll in Courses
- Watch Video Lectures
- Access Learning Materials
- Take Quizzes & Assignments
- Track Learning Progress
- Download Certificates
- Wishlist Courses
- Real-Time Notifications
- Messaging & Support System

### 👨‍🏫 Instructor
- Create & Manage Courses
- Upload Videos & Resources
- Create Quizzes & Assignments
- Conduct Live Classes
- Track Student Performance
- Review Quiz Submissions
- Manage Course Content
- Send Announcements

### 👨‍💼 Admin
- User Management
- Course Approval System
- Instructor Management
- Platform Analytics
- Enrollment Monitoring
- Reports & Moderation
- Announcement Management
- System Configuration

---

## 🛠️ Tech Stack

### Frontend
- React.js
- React Router
- Axios
- CSS3
- Lucide React Icons

### Backend
- Node.js
- Express.js
- JWT Authentication
- bcrypt.js

### Database
- MongoDB Atlas
- Mongoose ODM

---
## 🔐 Authentication

Role-Based Access Control (RBAC)

| Role | Permissions |
|--------|-------------|
| Student | Learn, Take Quizzes, Submit Assignments |
| Instructor | Create Courses, Quizzes & Assignments |
| Admin | Manage Platform & Users |

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/yourusername/lisha-academy.git
cd lisha-academy
```

### Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

### Backend Setup

```bash
cd backend

npm install

npm run dev
```

---

## 🔑 Environment Variables

Create a `.env` file inside backend folder.

```env
PORT=5000

MONGO_URI=your_mongodb_atlas_connection_string

JWT_SECRET=your_secret_key

EMAIL_USER=your_email

EMAIL_PASS=your_password
```

---

## 📸 Screenshots

### Login Page

```text
LISHA Academy Login
```

### Student Dashboard

```text
Track courses, progress, quizzes, and certificates
```

### Instructor Dashboard

```text
Manage courses, students, assignments, and quizzes
```

### Admin Dashboard

```text
Manage users, courses, reports, and platform analytics
```


## 📄 License

This project is developed for educational and portfolio purposes.

© 2026 LISHA Academy. All Rights Reserved.
