# MFMCF FUTA — Member, Visitation & Attendance Portal

A modern, responsive, and secure membership database and attendance tracking web portal designed for the **Mountain of Fire and Miracles Ministries Campus Fellowship (MFMCF), FUTA Chapter**. This application enables coordinators to seamlessly register members, track first-timers, manage attendance, audit system activities, and coordinate follow-up visitations.

---

## 🌟 Key Features

### 1. Membership & Kiosk Registration
- **Self-Service Registration**: Public forms for new members and first-timers to register their details (Name, Contact, Address, Department, Level, Gender).
- **First-Timer Pipeline**: Track incoming visitors, coordinate initial contacts, and log follow-up notes.
- **Department & Level Sorting**: Easily sort members by their academic departments and academic level directories.

### 2. Double-Sided Attendance Tracking
- **Public Kiosk Mode (`/mark-attendance`)**: Let members search by name or phone number and mark themselves present at service events via a clean tablet/desktop interface.
- **Admin Verification (`/attendance`)**: Administrators can batch-mark attendance, view logs, and audit who checked in.
- **Redesigned Marker Visuals**: Clearly distinguish between entries checked in by members themselves (**Self-Marked**) and those registered by administrators, showing marker avatars and colored role badges.
- **CSV Data Exporter**: Query and extract monthly level-by-level attendance matrices for offline analysis.

### 3. Interactive Coordinator Dashboard
- **Key Metrics**: Monitor active members, new visitors, monthly attendance volumes, and average attendance rates.
- **Data Visualizations**: Responsive charts showing 7-day attendance trends (Line chart) and member distribution by academic levels (Pie chart).
- **Activity & Birthdays**: Real-time log of recent registrations and interactive widget highlighting members celebrating birthdays.

### 4. Comprehensive Reports & Audits
- **Demographics Breakdown**: Summarize attendance by academic levels, gender ratios, and departments.
- **Audit Trails**: Security logs recording administrative actions (creation/modification of records) for transparency.

### 5. Multi-Tiered Access Control
- Granular permission scopes enforced via Supabase Row-Level Security (RLS) policies mapping to specific coordinator and fellowship roles.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React (Icons), Recharts (Charts).
- **UI Architecture**: Radix UI primitives, Shadcn/ui components, and Tailwind-based design systems.
- **Backend / Database**: Supabase (PostgreSQL, Realtime subscriptions, Custom Database RPC triggers).
- **Date Management**: `date-fns` for robust date math and calendar formats.

---

## 📂 Project Structure

```text
├── src/
│   ├── assets/             # Logo and landing page visual assets
│   ├── components/
│   │   ├── attendance/     # MarkAttendance, AttendanceHistory, AttendanceStats
│   │   ├── dashboard/      # Widget wrappers and custom statistics cards
│   │   ├── layout/         # Shell navigation header and sidebar wrappers
│   │   └── ui/             # Reusable Shadcn UI primitives (Avatar, Table, Dialog, etc.)
│   ├── contexts/           # AuthContext (Auth state and authorization middleware)
│   ├── hooks/              # Custom React hooks (e.g. useDashboardLayout)
│   ├── integrations/       # Supabase Client setup and auto-generated database types
│   ├── pages/              # App views (Dashboard, Members, Attendance, Birthdays, etc.)
│   ├── App.tsx             # Route settings and security guards
│   ├── index.css           # Global theme variables and overrides
│   └── main.tsx            # Application entrypoint
├── supabase/
│   ├── migrations/         # PostgreSQL schema files, RLS policies, and triggers
│   └── config.toml         # Local Supabase developer settings
└── package.json            # Scripts and dependencies
```

---

## 🔒 Role Hierarchy & Permissions

The application supports the following custom user roles:

| Role Code | Display Label | Permission Scope |
| :--- | :--- | :--- |
| `visitation_coordinator` | Visitation Coordinator | **Super Admin**: Full database access, user management, reports, settings, and department setups. |
| `assistant_coordinator` | Assistant Coordinator | **Admin**: View and update members, log first-timers, manage attendance, and generate reports. |
| `president` | Fellowship President | View members, read attendance records, and review dashboard analytics. |
| `central` | Central Executive | Access reports and inspect attendance dashboards. |
| `level_coordinator` | Level Coordinator | View and update members/attendance *only* for students in their assigned academic level. |
| `admin` | System Admin | System-level configurations and report generation. |
| `user` | Fellowship Helper | Basic dashboard view access. |

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18 or higher)
- Bun or NPM

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/Nouth-Ayinla/MFMCF-Visitation-Unit.git
cd MFMCF-Visitation-Unit
npm install
```

### 3. Local Environment Variables
Create a `.env` file in the root directory and specify your Supabase project credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Running the Development Server
Launch the local Vite server:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

### 5. Build for Production
To build the production bundle:
```bash
npm run build
```
This builds static assets into the `dist/` directory, optimized and ready for hosting on Vercel, Netlify, or similar platforms.

---

## 🛡️ Database Setup & Migrations
Supabase schema, triggers, and function definitions are located inside the `supabase/migrations/` directory.

- `search_members_public(p_search_query)`: Remote procedure call (RPC) allowing members to search name/phone details securely from the public kiosk without exposing underlying profiles database tables.
- `mark_self_attendance(p_member_id, p_service_type, p_attendance_date)`: Custom insert wrapper generating public check-in logs and logging them directly to `attendance_audit` table.
