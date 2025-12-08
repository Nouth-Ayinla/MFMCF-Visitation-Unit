# MFMCF Visitation Unit - Full Stack Application

Church visitation and member management system with attendance tracking, reports, and analytics.

---

## 📁 Project Structure

This is a **monorepo** containing both frontend and backend applications:

```
MFMCF-Visitation-Unit/
├── frontend/          # React + TypeScript + Vite
├── backend/           # Node.js + Express + MongoDB
└── supabase/          # Legacy Supabase migrations (reference only)
```

---

## 🎯 Current Status

🚧 **Backend Migration in Progress**

We are migrating from **Supabase (BaaS)** to a custom **Node.js backend with MongoDB**.

### ✅ Completed
- [x] Dev branch created
- [x] Project restructured (frontend/backend separation)
- [x] Backend folder structure (Clean Architecture)
- [x] Backend configuration files
- [x] API endpoints documentation
- [x] Migration strategy documented

### ⏳ In Progress
- [ ] Backend implementation (domain entities, use cases, controllers)
- [ ] Frontend API client wrapper
- [ ] Replace Supabase calls with REST API calls

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- MongoDB >= 6.0
- npm >= 9.0.0

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and other configs
npm run dev
```

Backend API runs on: `http://localhost:5000`

---

## 📚 Documentation

### Backend Documentation
- [Backend README](./backend/README.md) - Backend overview
- [API Endpoints](./backend/API_ENDPOINTS.md) - Complete API documentation (~60+ endpoints)
- [Migration Strategy](./backend/MIGRATION_STRATEGY.md) - Supabase to Node.js migration guide

### Architecture
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express + MongoDB + Mongoose (Clean Architecture)
- **Authentication**: JWT tokens
- **Database**: MongoDB (document-based)

---

## 🏗️ Backend Architecture (Clean Architecture)

```
backend/src/
├── domain/              # Business Logic (Entities, Repositories, Use Cases)
├── application/         # Application Logic (DTOs, Services, Middleware)
├── infrastructure/      # External Services (Database, Repositories, SMS, Email)
├── presentation/        # API Layer (Routes, Controllers, Validators)
└── shared/              # Shared Utilities (Errors, Types, Utils)
```

**Key Principles**:
- ✅ Separation of Concerns
- ✅ Dependency Inversion
- ✅ Single Responsibility
- ✅ Testability
- ✅ Type Safety (TypeScript)

---

## 🎯 Main Features

### Member Management
- Member registration & profiles
- First-timers tracking
- Member promotion system
- Department & level assignment
- Follow-up notes

### Attendance System
- Mark attendance by service type
- Attendance history & statistics
- Attendance trends & analytics
- Bulk attendance marking

### User Management
- Role-based access control (RBAC)
- User approval system
- 7 user roles (coordinator, assistant, president, central, level coordinator, admin, user)

### Dashboard & Reports
- Real-time statistics
- Attendance trends (charts)
- Level distribution
- Member reports
- Attendance reports
- First-timers reports

### Additional Features
- Birthday tracking & SMS notifications
- Department management
- Settings management
- Export reports (JSON/CSV/Excel)

---

## 🔐 User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **visitation_coordinator** | Full access (super admin) |
| **assistant_coordinator** | Most admin features |
| **president** | View reports & dashboard |
| **central** | View reports & dashboard |
| **level_coordinator** | Manage level members & attendance |
| **admin** | General admin access |
| **user** | Limited access (pending approval) |

---

## 🗄️ Database Schema

### Collections
1. **users** - User accounts & profiles
2. **members** - Church members & first-timers
3. **attendance** - Attendance records
4. **departments** - Church departments
5. **levels** - Church levels
6. **settings** - System settings

See [MIGRATION_STRATEGY.md](./backend/MIGRATION_STRATEGY.md) for detailed schema.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18.3
- **Language**: TypeScript
- **Build Tool**: Vite
- **UI Library**: Radix UI + shadcn/ui
- **Styling**: Tailwind CSS
- **State Management**: React Query
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB
- **ODM**: Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod + Express Validator
- **Logging**: Winston + Morgan
- **Testing**: Jest + Supertest

---

## 📦 API Overview

**Base URL**: `http://localhost:5000/api/v1`

### Main Endpoints
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/members` - List members
- `POST /api/v1/members` - Create member
- `POST /api/v1/attendance` - Mark attendance
- `GET /api/v1/dashboard/stats` - Dashboard statistics
- `GET /api/v1/reports/members` - Member reports

See [API_ENDPOINTS.md](./backend/API_ENDPOINTS.md) for complete documentation.

---

## 🔄 Migration from Supabase

We are migrating from Supabase to a custom backend for:
- ✅ Full control over business logic
- ✅ Cost optimization
- ✅ Custom features & workflows
- ✅ Better performance
- ✅ MongoDB flexibility

**Migration Progress**: 20% complete

See [MIGRATION_STRATEGY.md](./backend/MIGRATION_STRATEGY.md) for details.

---

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test                  # Run all tests
npm run test:watch       # Watch mode
```

### Frontend Testing
```bash
cd frontend
npm test
```

---

## 🚀 Deployment

### Backend Deployment
- Deploy to: Heroku, Railway, Render, or AWS
- MongoDB: MongoDB Atlas or self-hosted
- Environment variables required (see `.env.example`)

### Frontend Deployment
- Deploy to: Vercel, Netlify, or AWS S3
- Update API URL in environment variables

---

## 📝 Development Workflow

1. **Create feature branch** from `dev`
2. **Implement feature** (backend + frontend)
3. **Write tests**
4. **Run linters**: `npm run lint`
5. **Test locally**
6. **Create pull request** to `dev`
7. **Review & merge**
8. **Deploy** from `main` branch

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is private and proprietary.

---

## 👥 Team

- **Project Owner**: MFMCF Visitation Unit
- **Repository**: [Nouth-Ayinla/MFMCF-Visitation-Unit](https://github.com/Nouth-Ayinla/MFMCF-Visitation-Unit)
- **Current Branch**: `dev`

---

## 📞 Support

For questions or issues, please create an issue in the GitHub repository.

---

**Last Updated**: December 6, 2025  
**Version**: 1.0.0  
**Status**: 🚧 Under Active Development
