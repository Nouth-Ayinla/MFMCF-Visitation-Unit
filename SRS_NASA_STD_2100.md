Software Requirements Specification (SRS)
NASA-STD-2100 compliant

Project: MFMCF-FUTA Member Management Web Application
Document ID: SRS-MFM-001
Revision: 0.1
Date: 2026-01-21
Authors: Systems Engineering (Generated)

**1. Introduction**

- **Purpose:** This SRS specifies the software requirements for the MFMCF-FUTA Member Management Web Application ("the Software") to manage member registration, profiles, attendance, reporting, and administrative workflows. It is written to be compliant with NASA-STD-2100 software engineering requirements for clarity, verifiability, traceability, and change control.
- **Scope:** The Software provides a web-based UI (React + TypeScript) and backend functions (Supabase, serverless functions) to support registration, CRUD for members, attendance marking, role-based access, reporting (CSV export), and limited integrations (SMS, scheduled tasks). It supports internal organization administration and mission support operations for the MFMCF FUTA chapter.
- **Document Organization:** Sections follow NASA-STD-2100 structure: Introduction, General Description, Specific Requirements (Functional, Performance, Interface, Data, Safety, Security, Quality, Constraints), Traceability, Verification, Qualification Provisions, Requirements Attributes, Appendices.
- **Relationship to Other Documents:** Connects to system-level requirements, Interface Control Documents (ICD) for Supabase and external SMS providers, and project README. Relevant implementation artifacts include `src/components/members/AddMemberDialog.tsx` ([src/components/members/AddMemberDialog.tsx](src/components/members/AddMemberDialog.tsx#L1-L400)), `src/pages/Members.tsx` ([src/pages/Members.tsx](src/pages/Members.tsx#L1-L400)) and Supabase function `supabase/functions/register-member/index.ts` ([supabase/functions/register-member/index.ts](supabase/functions/register-member/index.ts#L1-L400)).
- **Definitions, Acronyms, Abbreviations:**
  - SRS: Software Requirements Specification
  - RAMS: Reliability, Availability, Maintainability, Safety
  - RTM: Requirements Traceability Matrix
  - FR: Functional Requirement
  - NFR: Non-Functional Requirement
  - ICD: Interface Control Document
  - V: Verification method shorthand (T-Test, A-Analysis, I-Inspection, D-Demonstration)
- **References:**
  - NASA-STD-2100 Software Engineering Requirements (applicable sections)
  - Supabase JS SDK docs
  - Project `package.json` ([package.json](package.json#L1-L200))

**Software Classification**

- Classification: Mission Support — The Software supports mission operations (membership and event management) but is not safety-critical or mission-critical hardware control. Rationale: loss or degradation impacts operations and data privacy but does not result in physical harm.

**2. General Description**

- **Product Perspective & Mission Context:** The Software is a web application front-end (`React`, `TypeScript`) integrated with a Supabase backend (Postgres, auth, realtime), and serverless functions for specialized registration and SMS tasks. It supports organization mission by managing member lifecycle and event attendance.
- **Software Functions Overview:**
  - Member registration (UI form + serverless endpoint)
  - Create / read / update / delete member records
  - Role-based access control (RBAC) for admin features (`AuthContext` implementation) — see `src/contexts/AuthContext.tsx` ([src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx#L1-L400))
  - Attendance marking and history
  - Export reporting (CSV)
  - Auxiliary features: birthdays, first-timers, SMS triggers
- **User Characteristics & Operational Scenarios:**
  - Users: Admins (role-based elevated privileges), Coordinators, Level Coordinators, Regular Users
  - Operations: day-to-day admin (add/edit members), first-timer registration, attendance capture, periodic reports and exports
- **Operating Environment:**
  - Client: modern browsers supporting ES2020+, TLS
  - Server: Supabase Postgres, serverless functions (Deno for Supabase Edge Functions), environment variables for keys
  - Development: Node toolchain per `package.json` dependencies
- **General Constraints:**
  - Must use Supabase for persistence and auth
  - Must store staff/service keys in environment variables
  - Browser compatibility: evergreen browsers
- **Assumptions & Dependencies:**
  - Supabase service is available and reachable
  - Environment variables are present for service role key and endpoints
  - Users have network access
- **Modes of Operation:**
  - Normal mode: full feature set available
  - Offline/degraded mode: read-only fallback not implemented (out of scope)
  - Maintenance mode: admin disables write operations (operator action)

**3. Specific Requirements**
Requirements are uniquely identified as FR-, NFR-, PERF-, INT-, DATA-, SAF-, SEC-, QA-, CON- IDs. Each requirement includes verification method(s): T (Test), A (Analysis), I (Inspection), D (Demonstration).

3.1 Functional Requirements (FR)

- FR-001: Member Registration — The Software shall allow a user to register a new member using a UI form and/or serverless registration endpoint which inserts a `members` record with fields: `full_name`, `phone_number`, `date_of_birth`, `gender`, `address`, `level_id`, `department_id`, `department_other`, `how_did_you_hear`, `is_first_timer`. (Source: `AddMemberDialog` and `register-member` function) (V: T, I)
- FR-002: Duplicate Phone Check — When registering, the system shall detect duplicate phone numbers and reject with HTTP 409 conflict if found (serverless function performs check). (V: T)
- FR-003: Department 'Other' Handling — If department selected as `other`, the system shall create a new `departments` row (case-insensitive check) and associate its id; else record `department_other` accordingly. (V: T, A)
- FR-004: Member CRUD — Authorized users shall be able to create, read, update, and delete member records via UI and Supabase APIs. Delete operations restricted to `isSuperAdmin()` role. (V: T, I)
- FR-005: Role-Based Access Control — The Software shall enforce RBAC matching `AuthContext` role semantics: admin/assistant/visitation_coordinator roles have elevated privileges (manage members, mark attendance). (V: I, T)
- FR-006: Realtime Updates — The client shall subscribe to `members` table changes via Supabase realtime channel to refresh member listings automatically. (V: D)
- FR-007: Export to CSV — The Software shall allow exporting current filtered member list to CSV with specified columns. (V: T)
- FR-008: Promote First-Timer — Authorized users shall be able to mark `is_first_timer=false` and set `promoted_to_member_at` timestamp. (V: T)
- FR-009: Authentication Workflows — The Software shall provide sign-in, sign-up, sign-out flows integrated with Supabase Auth, including handling token refresh failures. (V: I, T)

  3.2 Performance Requirements (PERF)

- PERF-001: Page Response Time — Standard UI actions (open members list, open dialogs) shall render within 1 second under typical load (<=200 members). (V: T)
- PERF-002: API Latency — Supabase queries (member list) shall return within 2 seconds for dataset <=10k rows with reasonable DB indices. (V: A, T)
- PERF-003: Concurrency — The system shall support concurrent use by up to 200 simultaneous authenticated users without functional degradation (scaling dependent on Supabase plan). (V: A)
- PERF-004: Resource Utilization — Client memory usage shall remain within typical browser limits; backend serverless functions must complete within edge function time limits (configured per host). (V: A)

  3.3 Interface Requirements (INT)

- INT-001: User Interface — UI components shall follow accessible patterns and display validation messages for input errors. (V: I, T)
- INT-002: Hardware Interfaces — None required beyond standard network and client hardware. (V: I)
- INT-003: Software Interfaces — The Software shall use Supabase JS SDK and serverless HTTP functions. All APIs must accept/return JSON and use HTTPS/TLS. (V: I, T)
- INT-004: Communications Protocols — Use HTTPS for all client-server communications and secure websockets/realtime channels provided by Supabase. (V: I, A)

  3.4 Data Requirements (DATA)

- DATA-001: Data Schema — Members table shall include fields in FR-001; fields must be typed and constrained in DB (e.g., unique constraint on `phone_number`). (V: I, A)
- DATA-002: Data Retention — Member records shall be retained indefinitely unless deleted by an authorized operator. Deletions must be logged. (V: I)
- DATA-003: Data Accuracy — Date-of-birth stored as MM-DD format for birthday features; canonical `date_of_birth` column must allow consistent format or store full date with masking as needed. (V: T)
- DATA-004: Backups — Database backups shall run per organizational policy (outside application scope), and RTO/RPO shall be defined by ops. (V: A)

  3.5 Safety Requirements (SAF)

- SAF-001: Hazard: Data Loss — The Software shall minimize risk of unintentional data loss by requiring confirmation for destructive actions and restricting deletes to super-admin roles. (V: I, T)
- SAF-002: Fault Handling — Serverless functions and client shall catch errors and present user-friendly messages; logs must capture error details for operators. (V: I, T)
- SAF-003: Degraded State — On external service outage (Supabase), the UI shall surface a clear error and prevent further write operations to avoid inconsistent state. (V: D)

  3.6 Security Requirements (SEC)

- SEC-001: Authentication & Access Control — All access to member data shall require authenticated sessions; role-based checks performed on both client and server; sensitive operations validated server-side. (V: I, T)
- SEC-002: Secrets Management — Service role keys and environment variables shall be stored in secure secrets management and never committed to source. (V: I)
- SEC-003: Data Protection — PII (phone numbers, addresses) must be transmitted over TLS and stored in DB with appropriate access controls. Encryption-at-rest handled by provider. (V: A, I)
- SEC-004: Audit Logging — Administrative actions (delete, promote, create via admin UI) shall be logged with user id, timestamp, and action details. (V: I, T)
- SEC-005: Rate Limiting & Abuse — Serverless endpoints shall include protection against abusive registration attempts (rate limiting, CAPTCHA optional). (V: A)

  3.7 Quality Attributes (QA)

- QA-001: Reliability — Target MTBF consistent with SaaS dependencies; detect and recover from transient errors gracefully. (V: A)
- QA-002: Availability — Target 99.9% availability excluding maintenance windows, subject to Supabase SLA. (V: A)
- QA-003: Maintainability — Code shall follow agreed coding standards; components modular and documented to allow change within 2-person-week estimates for moderate feature additions. (V: I)
- QA-004: Portability — The client runs in standard browsers; backend relies on Supabase and Deno Edge Functions (portability constrained). (V: A)
- QA-005: Usability — Core workflows (add member, search, export) shall be performable by trained operator within two minutes. (V: D)
- QA-006: Scalability — System design allows scaling DB and edge functions; limits depend on provisioning. (V: A)

  3.8 Design Constraints (CON)

- CON-001: Use React + TypeScript for front-end (as per repo). (V: I)
- CON-002: Use Supabase for persistence, auth, realtime. (V: I)
- CON-003: Use Deno-based serverless functions for registration logic (existing `register-member` function). (V: I)
- CON-004: Must comply with applicable data privacy regulations for user PII in the deployment jurisdiction. (V: A)

  3.9 Verification Requirements (VER)

- For each numbered requirement above, verification methods are listed parenthetically (T, A, I, D). The verification plan shall include unit tests (where feasible), integration tests against a staging Supabase instance, manual acceptance tests, and code inspections.
- Test Environment Requirements: isolated staging Supabase project, test DB seed, test user accounts, CI pipelines to run unit tests and linters.

**4. Traceability**

- RTM Summary (example mapping):
  - FR-001 -> System Req SR-001 (Member Management) -> Verified by T, I
  - FR-002 -> SR-002 (Data Integrity) -> Verified by T
  - FR-005 -> SR-003 (Security) -> Verified by I, T
- Requirements are traceable to implementation files:
  - FR-001, FR-003 -> `supabase/functions/register-member/index.ts` ([supabase/functions/register-member/index.ts](supabase/functions/register-member/index.ts#L1-L400))
  - FR-001, FR-004 -> `src/components/members/AddMemberDialog.tsx` ([src/components/members/AddMemberDialog.tsx](src/components/members/AddMemberDialog.tsx#L1-L400)) and `src/pages/Members.tsx` ([src/pages/Members.tsx](src/pages/Members.tsx#L1-L400))
  - FR-005 -> `src/contexts/AuthContext.tsx` ([src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx#L1-L400))

**5. Qualification Provisions**

- Verification Approach: Combination of unit tests (front-end form validation, helper utilities), integration tests against staging Supabase, automated linting, and manual acceptance tests by stakeholder representatives.
- Acceptance Criteria: All Critical and High requirements verified (pass) in staging; no unresolved High-risk items; security scan and code review completed.
- Validation Approach: Deploy to staging with production-like data (sanitized) and run representative operational scenarios (registration, bulk export, attendance marking)

**6. Requirements Attributes**

- Priority legend: Critical (C), High (H), Medium (M), Low (L)
- Example attribute table (sample entries):
  - FR-001: Priority C, Stability: medium, Source: Stakeholder (Admin), Rationale: core functionality, Risk: H
  - FR-002: Priority H, Stability: high, Source: Developer, Rationale: data integrity, Risk: H
  - PERF-001: Priority M, Stability: medium, Source: Ops, Rationale: UX, Risk: M

**7. Risk Identification**

- Risk R-001: Unauthorized data access due to leaked service key. Mitigation: enforce secret management and rotate keys. (Residual risk: M)
- Risk R-002: Data corruption from race conditions on concurrent writes. Mitigation: DB constraints, server-side checks, optimistic locking if needed. (Residual risk: M)
- Risk R-003: Availability impact due to Supabase outage. Mitigation: operational runbooks, backups, and notifications. (Residual risk: H)

**8. Change Control & Baseline**

- Baseline: This SRS Revision 0.1 dated 2026-01-21. All changes must be submitted via change request and recorded with change log entries (author, date, summary, impact assessment). Version control: store document in repository `SRS_NASA_STD_2100.md` with PR-based changes.

**9. Appendices**

- A: Glossary
- B: Supporting Diagrams: recommended addition of data model ERD and component diagram mapping UI -> Supabase -> Functions
- C: Use Cases / Scenarios: Add Member, Register via public endpoint, Promote First-Timer, Export CSV, Delete Member (admin only)

**NASA-STD-2100 Compliance Checklist**

- Requirements Characteristics: Requirements above are written to be necessary, verifiable, attainable, clear, and traceable.
- Software Classification: Declared as Mission Support.
- Verification Methods: Each requirement includes verification shorthand (T, A, I, D). A full verification matrix should be produced and linked to test cases.
- Requirements Quality: Document aims for unambiguous language; follow-up reviews recommended to refine ambiguous items (e.g., exact SLA numbers).
- Risk Identification: Primary risks and mitigations are recorded.
- Standards Compliance: Cite NASA-STD-2100; follow code quality standards and external standards for TLS and data protection.
- Change Control: Baseline and change tracking described; recommend using PR-based review and tagging for baselines.

**Next Steps & Recommendations**

- Produce a mapping RTM spreadsheet linking each FR/NFR to implementation file lines and test cases.
- Produce ERD and component diagrams; add to Appendix B.
- Create staging environment with seeded data for verification and automated integration testing.
- Run security review focusing on PII handling and secrets in Supabase functions.
