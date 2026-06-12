# 🎓 LISHA Academy

An Online Learning Management System (LMS) designed to provide a seamless learning experience for students, instructors, and administrators.


---
## 🚀 Features

| 👨‍🎓 Student | 👨‍🏫 Instructor | 👨‍💼 Admin |
|-------------|---------------|------------|
| User Registration & Authentication | Create & Manage Courses | User Management |
| Browse & Enroll in Courses | Upload Videos & Resources | Course Approval System |
| Watch Video Lectures | Create Quizzes & Assignments | Instructor Management |
| Access Learning Materials | Conduct Live Classes | Platform Analytics |
| Take Quizzes & Assignments | Track Student Performance | Enrollment Monitoring |
| Track Learning Progress | Review Quiz $ Assignment Submissions | Reports & Moderation |
| Download Certificates | Manage Course Content | Announcement Management |
| Wishlist Courses | Answer Student Q&A | System Configuration |
| Post reviews | Course Analytics | User Role Management |
| Track daily streak and leaderboard | Student Management | Platform Monitoring |

---

## 🛠️ Tech Stack

| Frontend | Backend | Database |
|-----------|----------|----------|
| React.js | Node.js | MongoDB Atlas |
| React Router | Express.js | Mongoose ODM |
| Axios | JWT Authentication |  |
| CSS3 | bcrypt.js |  |
| Lucide React Icons | REST APIs | |


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
![LISHA Academy](./screenshots/home.png)





## 📄 License

This project is developed for educational and portfolio purposes.

© 2026 LISHA Academy. All Rights Reserved.
