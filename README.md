# 🚀 ProConnect - Professional Networking & Job Portal

<div align="center">

![ProConnect](https://img.shields.io/badge/ProConnect-Professional%20Network-blue)
![MERN Stack](https://img.shields.io/badge/Stack-MERN-green)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)
![Production](https://img.shields.io/badge/Status-Production%20Ready-success)

**A LinkedIn + Internshala inspired professional networking and job portal platform**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [API Docs](#-api-documentation) • [Screenshots](#-screenshots)

</div>

---

## 📖 About

ProConnect is an enterprise-level, full-stack professional networking platform that combines the best features of LinkedIn and Internshala. Built with modern technologies and production-ready architecture, it showcases advanced full-stack development skills.

### 🎯 Project Goals
- Create a production-ready social networking platform
- Implement complex business logic and relationships
- Demonstrate enterprise-level code architecture
- Showcase full-stack development expertise

---

## ✨ Features

### 🔐 Authentication & Security
- JWT-based authentication
- Secure password hashing (bcrypt)
- Protected routes
- Role-based access control

### 👤 User Profiles
- Comprehensive profile management
- Profile picture support
- Skills, experience, and education sections
- Profile completion tracking
- View/Edit mode

### 💼 Job Portal
- **For Job Seekers:**
  - Advanced job search with filters
  - One-click apply with resume
  - Application tracking dashboard
  - Saved jobs
  - Application status updates

- **For Employers:**
  - Post job openings
  - Manage applications
  - Update application status
  - View applicant profiles
  - Job analytics

### 📱 Social Feed
- Create posts with media
- Like and comment on posts (with real-time counts)
- Share functionality (Twitter, Facebook, LinkedIn, WhatsApp, Copy Link)
- Hashtag support
- Edit/Delete posts
- Visibility controls
- Comment section with avatars
- Real-time engagement updates

### 🤝 Networking
- Send connection requests
- Accept/Reject connections
- Connection suggestions
- View mutual connections
- Network management

### 🔔 Notifications
- Real-time notifications
- Connection requests
- Post interactions
- Job application updates
- Unread count badge

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Authentication:** JWT + Bcrypt
- **Validation:** Custom middleware

### Frontend
- **Framework:** React 19
- **Language:** TypeScript
- **Routing:** React Router DOM v7
- **HTTP Client:** Axios
- **Animations:** Framer Motion
- **Notifications:** React Hot Toast
- **Icons:** React Icons

### DevOps
- **Version Control:** Git
- **Backend Hosting:** Render/Railway
- **Frontend Hosting:** Vercel
- **Database:** MongoDB Atlas

---

## 📦 Installation

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key

# Start server
npm start
```

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create .env file
VITE_API_URL=http://localhost:5000/api

# Start development server
npm run dev
```

### Quick Start (Both Servers)

```bash
# From project root
# Double-click start.bat (Windows)
# Or run manually:
cd backend && npm start
cd frontend && npm run dev
```

---

## 📁 Project Structure

```
ProConnect/
├── backend/
│   ├── controllers/      # Business logic
│   ├── models/          # Database schemas
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth & validation
│   ├── config/          # Configuration files
│   └── server.js        # Entry point
│
├── frontend/
│   ├── src/
│   │   ├── api/         # API calls
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── context/     # State management
│   │   ├── hooks/       # Custom hooks
│   │   ├── types/       # TypeScript types
│   │   └── utils/       # Helper functions
│   └── public/          # Static assets
│
└── docs/                # Documentation
```

---

## 🔌 API Documentation

### Authentication
```http
POST /api/auth/register
POST /api/auth/login
```

### Users
```http
GET    /api/users/profile
PUT    /api/users/profile
```

### Jobs
```http
GET    /api/jobs?search=&location=&jobType=&page=1
GET    /api/jobs/:id
POST   /api/jobs
POST   /api/jobs/:id/apply
GET    /api/jobs/my-applications
GET    /api/jobs/my-jobs
PATCH  /api/jobs/application-status
DELETE /api/jobs/:id
```

### Posts
```http
GET    /api/posts/feed?page=1&limit=10
POST   /api/posts
POST   /api/posts/:id/like
POST   /api/posts/:id/comment
PUT    /api/posts/:id
DELETE /api/posts/:id
GET    /api/posts/user/:userId
```

### Connections
```http
POST   /api/connections/request
POST   /api/connections/:id/accept
POST   /api/connections/:id/reject
GET    /api/connections
GET    /api/connections/requests
GET    /api/connections/suggestions
DELETE /api/connections/:id
```

### Notifications
```http
GET    /api/notifications?unreadOnly=true
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
DELETE /api/notifications/:id
```

---

## 🗄️ Database Schema

### User
- Authentication (email, password)
- Profile (name, bio, headline, location, website)
- Skills, experience, education
- Preferences & settings

### Job
- Job details (title, company, location, salary)
- Requirements & responsibilities
- Applicants with status tracking
- View count & analytics

### Post
- Content & media
- Likes, comments, shares
- Visibility controls
- Edit history

### Connection
- Requester/Recipient relationship
- Status (pending, accepted, rejected)
- Custom message

### Notification
- Type-based notifications
- Read/Unread status
- Metadata for linking

---

## 🎨 Key Features Showcase

### Advanced Job Search
- Multi-filter support (location, type, experience, salary)
- Text search across multiple fields
- Pagination for performance
- Real-time results

### Application Workflow
```
Applied → Reviewing → Shortlisted → Interviewed → Accepted/Rejected
```

### Social Interactions
- Like/Unlike posts
- Nested comments
- Share posts
- Edit with history
- Pin posts

### Network Growth
- Smart connection suggestions
- Mutual connections display
- Connection request messages
- Network analytics

---

## 🚀 Deployment

### Backend (Render)
1. Create new Web Service
2. Connect GitHub repository
3. Set environment variables
4. Deploy

### Frontend (Vercel)
1. Import GitHub repository
2. Set `VITE_API_URL` environment variable
3. Deploy

### Database (MongoDB Atlas)
1. Create cluster
2. Whitelist IP (0.0.0.0/0)
3. Get connection string
4. Update backend .env

---

## 📊 Performance Optimizations

- Database indexing for fast queries
- Pagination for large datasets
- Lazy loading components
- Image optimization
- API response caching
- Debounced search inputs

---

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Input validation & sanitization
- CORS configuration
- Protected API routes
- XSS protection

---

## 🎯 Future Enhancements

- [x] Real-time chat messaging
- [x] Analytics dashboard with custom charts
- [x] Project showcase system
- [x] Social sharing (5 platforms)
- [x] Like/Comment with real-time counts
- [ ] Video call integration
- [ ] Email notifications
- [ ] File upload (resume, images)
- [ ] Company pages
- [ ] Job recommendations AI
- [ ] Skill endorsements
- [ ] Profile views tracking
- [ ] Export profile as PDF

---

## 👨‍💻 Developer

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your Profile](https://linkedin.com/in/yourprofile)
- Email: your.email@example.com

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Inspired by LinkedIn and Internshala
- Built with modern web technologies
- Designed for production use

---

## 📞 Support

For support, email your.email@example.com or create an issue in the repository.

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

Made with ❤️ and ☕

</div>
