# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Fullstack online learning platform (Vietnamese course material). Monorepo with two independent npm projects, no shared root package.json or workspace tooling — always `cd` into `backend/` or `frontend/` before running commands.

## Commands

### Backend (`backend/`)
- `npm run dev` — start with nodemon (auto-reload), listens on `PORT` from `.env` (default 5000)
- `npm start` — production start
- `npx prisma generate` — regenerate Prisma client after schema changes
- `npx prisma migrate dev` — create/apply a migration during development
- `npx prisma db seed` — run the seed script (`prisma/seed.js`)
- `npm run seed:student-courses-reviews` / `npm run seed:students` — standalone seed scripts
- No test suite exists (`npm test` is a stub that exits 1). Don't assume Jest/Supertest are configured.

### Frontend (`frontend/`)
- `npm run dev` — Vite dev server, default `http://localhost:5173`
- `npm run build` — production build
- `npm run preview` — preview a production build
- `npm run lint` — ESLint over the whole project

There is no root-level command runner; the two terminals (backend + frontend) are started independently per the README.

## Architecture

### Backend: layered Express app
`src/index.js` wires everything: `cors`, `helmet`, `express.json()`, then four route groups mounted at `/api/auth`, `/api/admin`, `/api/student`, `/api` (public, no prefix segment), then `notFound` + `errorHandler` last.

Request pipeline convention used throughout: `route → verifyToken → roleMiddleware → validate(schema) → controller`.
- `middlewares/authMiddleware.js` (`verifyToken`) decodes the JWT and sets `req.user = { userId, role }`. Required before any role check.
- `middlewares/roleMiddleware.js` (`isAdmin`, `isStudent`) gate by `req.user.role`. Note: `studentRoutes.js` deliberately does **not** use `isStudent` — controllers check business rules (e.g. enrollment/`is_paid`) directly so admins aren't locked out of student endpoints.
- `middlewares/validateMiddleware.js` (`validate(zodSchema)`) parses `req.body`; on `ZodError` returns `400 { errors }`, otherwise forwards to `errorHandler`.
- `middlewares/errorMiddleware.js`: `notFound` (404 catch-all) and `errorHandler` (centralized error JSON, includes `stack` only outside production) must be registered last, in that order.
- Route ordering matters in `publicRoutes.js`: `/courses/top-purchased` must be declared before `/courses/:id` or Express treats "top-purchased" as an `:id`.

### Database access
Single Prisma client singleton in `config/prisma.js`, built with the `@prisma/adapter-pg` driver adapter over a `pg.Pool` (not Prisma's default engine). The instance is cached on `globalThis.prisma` outside production to survive dev hot-reloads without exhausting the connection pool — always import this singleton, never instantiate `PrismaClient` directly elsewhere.

Schema (`prisma/schema.prisma`): `User` (role: `"student" | "admin"`, plain string not enum) → `Enrollment` (join table with `is_paid` gate) / `Review`; `Category` → `Course` → `Lesson` → `LessonChunk`. `LessonChunk` stores RAG embeddings as `Json` and is keyed by both `course_id` and `lesson_id` for fast course-wide and lesson-scoped lookups.

Access-control pattern repeated in controllers (`chatController.js`, `studentController.js`): the first 2 lessons (`order_index` ascending) of any course are free; everything else requires an `Enrollment` row with `is_paid = true` for the requesting user.

### AI Chatbot — Dynamic Retrieval Augmentation (DRA)
This is the most architecturally involved part of the backend (`src/services/`, `src/controllers/chatController.js`). It is not a single RAG call — it's a router that picks between two strategies per query:

1. **`queryRouter.js`** (`routeQuery`) scores the incoming question using Vietnamese/English keyword heuristics (comparison/analysis verbs raise the score, factual "what is X" phrasing lowers it, long/multi-clause queries raise it). Score `>= ROUTER_LCP_THRESHOLD` (env, default 3) → `LCP` strategy, else `RAG`.
2. **RAG path** (`ragPipeline.js`): embeds the query (`embeddingService.js`, Gemini `text-embedding-004`), retrieves top-K `LessonChunk` rows for the *whole course* by cosine similarity (`vectorUtils.js`), and answers with DeepSeek chat completion using only the retrieved context. Falls back to raw lesson metadata if the course was never indexed.
3. **LCP path** ("long-context pipeline", `lcpPipeline.js`): skips retrieval and stuffs the *entire course's* lesson content into the prompt (capped at `LCP_MAX_CHARS`, default 200k chars) — used when the router decides the question needs cross-lesson synthesis rather than a single fact lookup.
4. Indexing (`indexingService.js` + `chunkingService.js`) is a separate, explicit admin action (`POST /api/admin/courses/:id/index`) — chunks lesson content (sliding window, `RAG_CHUNK_SIZE`/`RAG_CHUNK_OVERLAP` env vars), embeds each chunk, and stores it. RAG retrieval reads whatever was last indexed; editing lesson content does not auto-reindex.

Two separate AI providers are involved: **Gemini** (`@google/generative-ai`, via `GEMINI_API_KEY`) does embeddings only; **DeepSeek** (`config/deepseek.js`, OpenAI-SDK-compatible client pointed at `https://api.deepseek.com/v1`, via `DEEPSEEK_API_KEY`) does chat completions for both RAG and LCP. Both throw explicit errors if their API key env var is missing rather than failing silently.

### File uploads
`config/cloudinary.js` defines two Multer storages backed by `multer-storage-cloudinary`: `uploadCourseImage` (folder `courses`, image formats) and `uploadLessonVideo` (folder `lessons`, `resource_type: 'video'`, video formats). Admin course/lesson create-and-update routes chain `upload*.single(field)` before `validate(schema)` — file metadata lands on `req.file`, not `req.body`.

### Frontend: route-guard-based access control
`App.jsx` defines three route groups: public+student under `MainLayout` (student routes wrapped in `<ProtectedRoute/>`), admin routes under `/admin` wrapped in `<AdminRoute/>` + `AdminLayout`, and a wildcard 404. Guards (`routes/RouteGuards.jsx`) read `useAuth()` and redirect: no token → `/login`; logged in but wrong role (admin area) → `/`.

Auth state lives in `context/AuthContext.jsx` — a `{ token, user }` object persisted to `localStorage` and rehydrated on app load. `utils/axiosInstance.js` is the single Axios instance: its request interceptor auto-attaches `Authorization: Bearer <token>` from `localStorage`, and its response interceptor unwraps `response.data` so callers receive payloads directly (not `res.data`) — errors still reject normally for `catch` blocks. API base URL is hardcoded to `http://localhost:5000/api`.

Services in `frontend/src/services/` (`admin.service.js`, `auth.service.js`, `public.service.js`, `student.service.js`) are the only layer that should call `axiosInstance` directly; pages/components consume these rather than building requests inline.

## Conventions worth knowing
- Backend source comments and error/user-facing messages are written in Vietnamese; keep that convention when touching existing files unless told otherwise.
- Database tables/columns use `snake_case` (`@map`/`@@map` in Prisma) while the JS-side Prisma client fields mirror that snake_case directly (e.g. `course_id`, `user_id`) rather than being camelCased.
- Zod schemas live under `src/schemas/*.schema.js` (backend) and are the single source of input validation — controllers assume `req.body` is already valid by the time they run.
