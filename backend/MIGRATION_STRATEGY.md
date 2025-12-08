# Migration Strategy: Supabase to Node.js + MongoDB

## 📋 Overview

This document outlines the strategy for migrating from Supabase (PostgreSQL) to a custom Node.js backend with MongoDB.

---

## 🎯 Migration Goals

1. **Independence**: Move away from Supabase dependency
2. **Flexibility**: Custom business logic and validation
3. **MongoDB**: Leverage document-based database for flexibility
4. **Clean Architecture**: Maintainable and testable codebase
5. **Type Safety**: Full TypeScript implementation
6. **API Standards**: RESTful API with proper error handling

---

## 📊 Database Schema Mapping

### Supabase Tables → MongoDB Collections

#### 1. **profiles** → **users**
```javascript
// MongoDB Schema
{
  _id: ObjectId,
  email: String,
  fullName: String,
  password: String, // bcrypt hashed
  role: String, // enum
  isApproved: Boolean,
  approvedBy: ObjectId, // ref: users
  approvedAt: Date,
  departmentId: ObjectId, // ref: departments
  levelId: ObjectId, // ref: levels
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. **user_roles** → Embedded in users collection
```javascript
// Instead of separate table, role is embedded in user document
// This simplifies queries and follows MongoDB best practices
{
  role: "visitation_coordinator" | "assistant_coordinator" | "president" | 
        "central" | "level_coordinator" | "admin" | "user"
}
```

#### 3. **members** → **members**
```javascript
{
  _id: ObjectId,
  fullName: String,
  phoneNumber: String,
  email: String,
  address: String,
  dateOfBirth: Date,
  gender: String,
  levelId: ObjectId, // ref: levels
  departmentId: ObjectId, // ref: departments
  departmentOther: String,
  howDidYouHear: String,
  isFirstTimer: Boolean,
  promotedToMemberAt: Date,
  registeredAt: Date,
  followUpNotes: [{
    note: String,
    addedBy: ObjectId, // ref: users
    addedAt: Date,
    followUpDate: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

#### 4. **attendance** → **attendance**
```javascript
{
  _id: ObjectId,
  memberId: ObjectId, // ref: members
  serviceDate: Date,
  serviceType: String,
  isPresent: Boolean,
  markedBy: ObjectId, // ref: users
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### 5. **departments** → **departments**
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### 6. **levels** → **levels**
```javascript
{
  _id: ObjectId,
  levelNumber: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### 7. **system_settings** → **settings**
```javascript
{
  _id: ObjectId,
  key: String, // unique
  value: Mixed, // any type
  type: String, // 'boolean', 'number', 'string', 'object'
  description: String,
  updatedAt: Date,
  updatedBy: ObjectId // ref: users
}
```

---

## 🔄 Key Changes from PostgreSQL to MongoDB

### 1. **Primary Keys**
- **Supabase**: UUID v4
- **MongoDB**: ObjectId (automatically generated)
- Migration: Frontend needs to adapt to ObjectId format

### 2. **Relationships**
- **Supabase**: Foreign keys with joins
- **MongoDB**: ObjectId references with populate/aggregation
- Approach: Use Mongoose `populate()` for relationships

### 3. **User Roles**
- **Supabase**: Separate `user_roles` table
- **MongoDB**: Embedded `role` field in user document
- Benefit: Simpler queries, better performance

### 4. **Real-time Subscriptions**
- **Supabase**: Built-in real-time via WebSockets
- **MongoDB**: Change Streams or Socket.io implementation
- Strategy: Phase 1 - REST API only, Phase 2 - Add Socket.io

### 5. **Row-Level Security (RLS)**
- **Supabase**: Database-level RLS policies
- **MongoDB**: Application-level middleware authorization
- Implementation: Custom middleware checks user roles/permissions

### 6. **Timestamps**
- **Supabase**: `created_at`, `updated_at` managed by database
- **MongoDB**: Mongoose timestamps: `createdAt`, `updatedAt`

---

## 🔐 Authentication Migration

### Supabase Auth → JWT Auth

**Current (Supabase)**:
```javascript
const { data, error } = await supabase.auth.signIn({
  email, password
});
```

**New (Custom JWT)**:
```javascript
const response = await fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Important: sends cookies
  body: JSON.stringify({ email, password })
});
const { data } = await response.json();
// Tokens automatically stored in HTTP-only cookies
```

**Changes**:
1. JWT tokens instead of Supabase sessions
2. HTTP-only cookies (more secure than localStorage)
3. Automatic token refresh mechanism
4. Custom authentication middleware
5. CSRF protection via SameSite cookies

---

## 📦 Frontend Changes Required

### 1. **Replace Supabase Client**

**Before**:
```typescript
import { supabase } from "@/integrations/supabase/client";

const { data } = await supabase
  .from("members")
  .select("*")
  .order("registered_at", { ascending: false });
```

**After**:
```typescript
import { apiClient } from "@/lib/api-client";

const { data } = await apiClient.get("/members", {
  params: { sortBy: "registeredAt", order: "desc" }
});
```

### 2. **Create API Client Wrapper**

Create `frontend/src/lib/api-client.ts`:
```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: sends cookies with requests
});

// Handle token refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt token refresh (cookies sent automatically)
        await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        
        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Redirect to login if refresh fails
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export { apiClient };
```

### 3. **Update All Supabase Queries**

Map each Supabase operation to REST API call:

| Supabase Operation | REST API Equivalent |
|-------------------|---------------------|
| `.from('members').select()` | `GET /api/v1/members` |
| `.from('members').insert()` | `POST /api/v1/members` |
| `.from('members').update()` | `PUT /api/v1/members/:id` |
| `.from('members').delete()` | `DELETE /api/v1/members/:id` |
| `.from('members').select().eq('id', id)` | `GET /api/v1/members/:id` |

### 4. **Real-time Subscriptions**

**Before**:
```typescript
const channel = supabase
  .channel('members-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, 
    () => loadMembers()
  )
  .subscribe();
```

**After (Phase 1 - Polling)**:
```typescript
// Use React Query's refetch interval
const { data } = useQuery({
  queryKey: ['members'],
  queryFn: fetchMembers,
  refetchInterval: 30000 // Poll every 30 seconds
});
```

**After (Phase 2 - Socket.io)**:
```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');
socket.on('members:updated', () => {
  queryClient.invalidateQueries(['members']);
});
```

### 5. **Update AuthContext**

**Changes needed**:
- Replace Supabase auth with custom JWT
- Implement automatic token refresh (handled by API client)
- Tokens stored in HTTP-only cookies (more secure)
- Handle login/logout/register with API calls
- No manual token management needed (cookies handled automatically)

---

## 🔀 Migration Steps

### Phase 1: Backend Setup ✅
1. ✅ Create backend folder structure
2. ✅ Setup Node.js/TypeScript project
3. ✅ Configure MongoDB connection
4. ✅ Define API endpoints documentation
5. ⏳ Implement domain entities
6. ⏳ Create repository interfaces
7. ⏳ Implement use cases

### Phase 2: Core Features
1. Authentication & Authorization
2. User Management
3. Member Management
4. Departments & Levels

### Phase 3: Advanced Features
1. Attendance System
2. Dashboard Statistics
3. Reports Generation
4. Birthday & SMS

### Phase 4: Frontend Migration
1. Create API client wrapper
2. Replace Supabase calls page by page
3. Update AuthContext
4. Test all features
5. Handle edge cases

### Phase 5: Testing & Deployment
1. Unit tests
2. Integration tests
3. End-to-end tests
4. Performance optimization
5. Deploy backend
6. Deploy frontend
7. Monitor and fix issues

---

## 📁 Files Requiring Changes

### Backend (New Files) - ~100+ files to create
```
backend/src/
├── domain/entities/        # 7 entities
├── domain/repositories/    # 7 repository interfaces
├── domain/use-cases/       # ~30 use cases
├── application/dtos/       # ~20 DTOs
├── application/services/   # ~10 services
├── application/middleware/ # ~5 middleware
├── infrastructure/database/# 2 files (connection, schemas)
├── infrastructure/repositories/ # 7 implementations
├── infrastructure/services/# 3 services (SMS, Email, Logger)
├── presentation/routes/    # 10 route files
├── presentation/controllers/ # 10 controller files
├── presentation/validators/ # 10 validator files
├── shared/                 # ~10 utility files
└── server.ts
```

### Frontend Changes - ~30+ files to modify
```
frontend/src/
├── lib/
│   └── api-client.ts           # NEW - API wrapper
├── contexts/
│   └── AuthContext.tsx         # UPDATE - Replace Supabase auth
├── pages/                      # UPDATE - All 14 pages
│   ├── Dashboard.tsx
│   ├── Members.tsx
│   ├── Attendance.tsx
│   ├── UserManagement.tsx
│   └── ... (all other pages)
├── components/                 # UPDATE - Components making API calls
│   ├── attendance/
│   ├── dashboard/
│   ├── members/
│   └── users/
└── integrations/
    └── supabase/               # DELETE - Remove Supabase integration
```

---

## 🔍 Query Mapping Reference

### Complex Queries Examples

**1. Members with Relationships**
```typescript
// Supabase
const { data } = await supabase
  .from("members")
  .select(`
    *,
    departments (id, name),
    levels (id, level_number)
  `)
  .order("registered_at", { ascending: false });

// New API
const { data } = await apiClient.get("/members", {
  params: { 
    populate: "department,level",
    sortBy: "registeredAt",
    order: "desc"
  }
});
```

**2. Filtered Search**
```typescript
// Supabase
const { data } = await supabase
  .from("members")
  .select("*")
  .ilike("full_name", `%${searchTerm}%`)
  .eq("level_id", levelId);

// New API
const { data } = await apiClient.get("/members", {
  params: { 
    search: searchTerm,
    level: levelId
  }
});
```

**3. Attendance Statistics**
```typescript
// Supabase (complex aggregation)
const { data } = await supabase
  .from("attendance")
  .select("*")
  .gte("service_date", startDate)
  .lte("service_date", endDate);
// Then calculate stats in frontend

// New API (calculated in backend)
const { data } = await apiClient.get("/attendance/stats", {
  params: { startDate, endDate }
});
// Returns pre-calculated statistics
```

---

## 🎨 Benefits of Migration

### 1. **Custom Business Logic**
- Complex validation rules
- Custom authorization logic
- Business-specific workflows

### 2. **Better Performance**
- Optimized queries
- Caching strategies
- Database indexing control

### 3. **Cost Control**
- No Supabase pricing tiers
- Self-hosted option
- Predictable costs

### 4. **Full Control**
- Database schema control
- Custom migrations
- Backup strategies
- Monitoring and logging

### 5. **MongoDB Advantages**
- Flexible schema (good for evolving requirements)
- Embedded documents (fewer joins)
- Horizontal scaling
- JSON-native storage

---

## ⚠️ Challenges & Solutions

### Challenge 1: Real-time Features
**Solution**: Phase 1 - Use polling, Phase 2 - Implement Socket.io

### Challenge 2: Complex Joins
**Solution**: Use MongoDB aggregation pipeline or multiple queries with population

### Challenge 3: Migration Downtime
**Solution**: 
1. Deploy backend first
2. Keep Supabase running
3. Migrate frontend page by page
4. Feature flags for gradual rollout

### Challenge 4: Data Migration
**Solution**: Write migration scripts to export from Supabase and import to MongoDB

---

## 📝 Next Steps

1. **Review and approve this migration strategy**
2. **Start implementing backend entities and use cases**
3. **Create comprehensive tests for each module**
4. **Build and test API endpoints**
5. **Create frontend API client wrapper**
6. **Migrate frontend page by page**
7. **End-to-end testing**
8. **Deploy and monitor**

---

**Estimated Timeline**: 4-6 weeks for full migration
- Backend: 2-3 weeks
- Frontend Migration: 1-2 weeks
- Testing & Deployment: 1 week

**Team Recommendation**: 2-3 developers for optimal progress
