# AI Sales CRM Platform — Supabase Backend & Full-Stack Architecture

A production-ready, AI-powered Sales CRM platform built with **Supabase (PostgreSQL, Auth, RLS)**, **FastAPI**, **Next.js (App Router, SSR)**, and **Redis**.

---

## 🏛️ System Architecture

```text
Sales Manager
      │
      ▼
Next.js / React (App Router, Tailwind CSS, @supabase/ssr)
      │
      ▼
Supabase Auth (JWT Session)
      │
      ▼
FastAPI (Python 3.11 Backend)
      │
 ┌────┴────────────────────────┐
 ▼                             ▼
Supabase PostgreSQL       Redis (Job Queue)
 ├── tenants                   ├── Workers (Phase 6)
 ├── profiles (RLS)            └── Long-running tasks
 └── (Leads, Jobs in Phase 3)
```

---

## 🚀 Phase 1 Foundation Status

Phase 1 establishes the core foundation:
- [x] **Next.js Project**: App Router, TypeScript, Tailwind CSS, `@supabase/ssr` cookies session handling.
- [x] **FastAPI Project**: Structured architecture, Pydantic v2 schemas, CORS, dependencies.
- [x] **Supabase Database Schemas**: Migrations for `tenants`, `profiles`, and auto-provisioning triggers.
- [x] **Row Level Security (RLS)**: Enforced tenant isolation and profile access policies at database level.
- [x] **Supabase Auth Integration**: Signup (with organization creation), Login, Session exchange callback, and route protection middleware.
- [x] **FastAPI Auth Verification**: JWT validation dependency, authenticated user context (`/api/v1/auth/me`), and user-scoped RLS client.
- [x] **System Health & Connectivity**: Realtime health check (`/api/v1/health`) probing FastAPI, Supabase, and Redis.
- [x] **Docker Infrastructure**: `docker-compose.yml` for frontend, backend, and Redis (NO duplicate postgres container).

---

## 📁 Repository Structure

```text
sales-crm-ai/
├── frontend/                     # Next.js 14 Web Application
│   ├── app/
│   │   ├── (auth)/login/page.tsx # Supabase Auth Login
│   │   ├── (auth)/signup/page.tsx# Supabase Auth Signup + Tenant Creation
│   │   ├── dashboard/page.tsx    # Protected Dashboard & FastAPI verification
│   │   ├── auth/callback/route.ts# Supabase Auth code exchange
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Landing page & health monitor
│   │   └── globals.css
│   ├── components/               # Navbar, HealthBadge UI components
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts         # Browser client (createBrowserClient)
│   │       ├── server.ts         # Server client (createServerClient)
│   │       └── middleware.ts     # Edge session updater & route guard
│   ├── middleware.ts             # Next.js edge middleware
│   ├── Dockerfile
│   └── package.json
│
├── backend/                      # FastAPI AI & Business Logic Server
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── endpoints/
│   │   │   │   │   ├── health.py # GET /api/v1/health
│   │   │   │   │   └── auth.py   # GET /api/v1/auth/me & test-rls
│   │   │   │   └── api.py
│   │   │   └── deps.py           # get_current_user, get_user_db, RBAC
│   │   ├── core/
│   │   │   ├── config.py         # pydantic-settings config
│   │   │   ├── security.py       # Supabase JWT token verification
│   │   │   └── supabase.py       # Dual Supabase clients (User RLS vs Service-Role)
│   │   ├── schemas/              # Pydantic models (auth, profile, tenant, health)
│   │   └── main.py               # FastAPI entry point & lifespan
│   ├── Dockerfile
│   └── requirements.txt
│
├── supabase/                     # Supabase Database Migrations
│   ├── migrations/
│   │   ├── 001_initial_schema.sql# tenants, profiles & trigger function
│   │   └── 002_rls.sql           # PostgreSQL Row Level Security policies
│   ├── config.toml               # Supabase CLI configuration
│   └── seed.sql                  # Seed data
│
├── docker-compose.yml            # Frontend + Backend + Redis Orchestration
├── .env.example                  # Environment configuration template
└── README.md
```

---

## 🛠️ Quick Start Guide

### 1. Configure Supabase

You can use either a free **Hosted Supabase Project** at [supabase.com](https://supabase.com) or the **Supabase CLI** locally.

#### Option A: Hosted Supabase Project (Recommended)
1. Go to the [Supabase Dashboard](https://supabase.com/dashboard) and create a new project.
2. Open the **SQL Editor** in Supabase and run:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls.sql`
   - `supabase/seed.sql` (optional seed)
3. Obtain your Project API credentials from **Project Settings → API**:
   - `Project URL`
   - `anon / public key`
   - `service_role key` (keep secret!)

#### Option B: Local Supabase CLI
```bash
# Start local Supabase containers (Auth, PostgreSQL, Studio)
supabase start

# Apply migrations
supabase db reset
```

---

### 2. Configure Environment Variables

Create `.env` in the root (or copy `.env.example` to `backend/.env` and `frontend/.env.local`):

```bash
# In backend/.env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
REDIS_URL=redis://localhost:6379/0
MOCK_EXTERNAL_SERVICES=true

# In frontend/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

### 3. Run the Stack

#### Running with Docker Compose
```bash
docker compose up --build
```
- **Frontend**: `http://localhost:3000`
- **FastAPI**: `http://localhost:8000` (API Docs: `http://localhost:8000/docs`)
- **Redis**: `localhost:6379`

#### Running Locally (Manual)

1. **Start Redis**:
   ```bash
   docker run -d -p 6379:6379 --name redis redis:7-alpine
   ```

2. **Start Backend (FastAPI)**:
   ```bash
   cd backend
   python -m venv venv
   # Windows: .\venv\Scripts\activate | Unix: source venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```

3. **Start Frontend (Next.js)**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 🔒 Security & RLS Principles

1. **Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code**: The frontend only receives `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
2. **Dual-Client Architecture in FastAPI**:
   - `get_user_db(token)`: Runs on behalf of the user's JWT so PostgreSQL Row Level Security is automatically enforced.
   - `get_admin_db()`: Controlled server-side client used strictly for background orchestration and user provisioning.
3. **Tenant Isolation**: All business tables use `tenant_id`, and queries from users are restricted to their tenant via `public.current_tenant_id()`.
4. **FastAPI Authorization**: FastAPI acts as a gatekeeper, verifying the Supabase session token before executing backend operations.

---

## 🚦 Verification Checklist

| Component | Endpoint / Feature | Verification Method |
|---|---|---|
| **FastAPI** | `GET /api/v1/health` | Returns `200 OK` with status of API, Redis, and Supabase |
| **Supabase Auth** | `POST /auth/v1/signup` | Signs up user, triggers tenant and profile record creation |
| **Protected Route** | `/dashboard` | Redirects unauthenticated visitors to `/login` via Edge Middleware |
| **FastAPI JWT Auth**| `GET /api/v1/auth/me` | Validates Bearer token & returns user profile and tenant ID |
| **PostgreSQL RLS** | `GET /api/v1/auth/test-rls` | Executes user-scoped query respecting tenant boundaries |

---

*Phase 1 Complete. Ready for Phase 2: Authentication & RBAC expansions.*
