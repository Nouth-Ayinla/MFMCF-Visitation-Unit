# MFMCF Visitation Unit - Backend API

Node.js backend API built with **Clean Architecture** principles using MongoDB.

## 🏗️ Architecture

This project follows **Clean Architecture** with clear separation of concerns:

```
backend/
├── src/
│   ├── domain/              # Business Logic Layer
│   │   ├── entities/        # Business entities/models
│   │   ├── repositories/    # Repository interfaces
│   │   └── use-cases/       # Business rules & use cases
│   ├── application/         # Application Layer
│   │   ├── dtos/            # Data Transfer Objects
│   │   ├── services/        # Application services
│   │   └── middleware/      # Express middleware
│   ├── infrastructure/      # Infrastructure Layer
│   │   ├── database/        # Database connection
│   │   ├── repositories/    # Repository implementations
│   │   ├── services/        # External services (SMS, Email)
│   │   └── config/          # Configuration
│   ├── presentation/        # Presentation Layer
│   │   ├── routes/          # API routes
│   │   ├── controllers/     # Route controllers
│   │   └── validators/      # Request validators
│   └── shared/              # Shared Layer
│       ├── errors/          # Custom error classes
│       ├── utils/           # Helper functions
│       └── types/           # TypeScript types
└── tests/                   # Test files
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- MongoDB >= 6.0
- npm >= 9.0.0

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your values
```

### Running the Application

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication
All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Main Endpoints

- **Auth**: `/api/v1/auth/*`
- **Users**: `/api/v1/users/*`
- **Members**: `/api/v1/members/*`
- **Attendance**: `/api/v1/attendance/*`
- **Departments**: `/api/v1/departments/*`
- **Levels**: `/api/v1/levels/*`
- **Dashboard**: `/api/v1/dashboard/*`
- **Reports**: `/api/v1/reports/*`

(Detailed documentation will be added as endpoints are implemented)

## 🔐 Environment Variables

See `.env.example` for all required environment variables.

## 📝 Development Guidelines

### Naming Conventions

- **Files**: kebab-case (e.g., `user-repository.ts`)
- **Classes**: PascalCase (e.g., `UserRepository`)
- **Functions/Variables**: camelCase (e.g., `getUserById`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_PAGE_SIZE`)

### Layer Dependencies

- **Domain Layer**: No dependencies on other layers
- **Application Layer**: Depends only on Domain
- **Infrastructure Layer**: Depends on Domain and Application
- **Presentation Layer**: Depends on Application

### Code Style

Run linting and formatting:
```bash
npm run lint
npm run lint:fix
npm run format
```

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Language**: TypeScript
- **Authentication**: JWT
- **Validation**: Zod + Express Validator
- **Testing**: Jest + Supertest
- **Logging**: Winston + Morgan

## 📦 Project Status

🚧 **Under Development** - Backend migration in progress
