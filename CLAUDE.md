# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CustomerServiceSystem is an open-source AI Agent customer support system — AI-first replies with knowledge-base RAG, human handoff, ticket workflows, and self-hosted deployment. It is not just an LLM chat box; it is an AI Helpdesk designed around real support operations (conversations, agent workspace, knowledge base, tickets, teams).

## Commands

```bash
make dev          # Start backend (Go) and frontend (Next.js) dev servers concurrently
make build        # Build frontend SPA + current-platform Go binary into dist/
make release      # Build linux/darwin/windows release binaries into dist/
make generator    # Run Go code generation (model CRUD scaffolding via cmd/generator)
make enums        # Generate frontend enums from backend enum definitions
make help         # Show all available targets
```

Frontend-only (run from `web/` directory):
```bash
cd web && pnpm dev       # Next.js dev server (port 3000)
cd web && pnpm build     # Production build
cd web && pnpm lint      # ESLint
cd web && pnpm typecheck # TypeScript type checking (tsc --noEmit)
```

Go tests:
```bash
go test ./...                           # Run all tests
go test ./internal/services/...         # Run tests for a specific package
go test -run TestName ./path/to/package # Run a single test
```

LanceDB builds (requires native LanceDB libraries) — append `LANCEDB=1` to `build`/`release` targets.

## Architecture

### Backend Layering (strict one-way: `models → repositories → services → handlers → builders`)

- **`internal/models/`** — GORM entity definitions only (table mappings, fields, index tags). Registered in `internal/models/models.go` as `Models` slice for AutoMigrate and codegen.
- **`internal/repositories/`** — Data access layer. CRUD, query conditions via `sqls.Cnd`, filtering, pagination. Methods accept `db *gorm.DB` to support both `sqls.DB()` and transaction `ctx.Tx`.
- **`internal/services/`** — Business orchestration, transaction boundaries, cross-entity validation, state machines. Use `sqls.WithTransaction(func(ctx *sqls.TxContext) error { ... })` for multi-write atomicity.
- **`internal/builders/`** — Pure `Model → ResponseDTO` mapping. No DB access, no business logic.
- **`internal/handlers/`** — HTTP layer. Parse parameters, check permissions (via `AuthService`), call services, wrap responses with `httpx.WriteJSON`. Three sub-packages: `api/` (customer-facing), `dashboard/` (admin/agent workspace), `third/` (third-party callbacks).
- **`internal/middleware/`** — Gin middleware (auth, CORS, request ID, logging, etc.).

### AI Subsystem (`internal/ai/`)

The AI pipeline is the core differentiator of this project:

- **`internal/ai/runtime/`** — The main AI reply orchestrator. Entry point is the reply service which triggers on new customer messages. Handles conversation context loading, knowledge retrieval, skill/graph routing, tool calling, interrupt/resume, and reply commit.
  - `runtime/reply_service.go` — Main reply entry point
  - `runtime/reply_trigger_service.go` — Determines when AI should reply
  - `runtime/reply_eligibility.go` — Checks if AI is allowed to reply in the current conversation state
  - `runtime/executor/` — Answerability gate, event consumption, run options
  - `runtime/graphs/` — Pre-built AI workflows: triage, handoff, ticket draft, conversation analysis
  - `runtime/tooling/` — Tool integration layer
  - `runtime/instruction/` — System prompt assembly
- **`internal/ai/rag/`** — Retrieval-Augmented Generation. Document/FAQ indexing (chunking, embedding, vector storage), retrieval (search + rerank), and answer generation with answerability gating. Retrieval logs and hit tracking.
- **`internal/ai/skills/`** — Skill definition matching and routing. Skills are admin-configured instruction sets with tool whitelists; the runtime matches user intent to a skill and executes it.
- **`internal/ai/mcps/`** — MCP (Model Context Protocol) server registry, client, and runtime. Manages external tool servers that AI agents can call.
- **`internal/ai/application/`** — Application-layer AI integration (tool catalog, etc.).

### Route Registration

Routes are defined explicitly in `internal/bootstrap/routes.go` and split into `*_routes.go` files. Each resource group has a `registerDashboardXxxRoutes(group *gin.RouterGroup)` function. The Gin engine is created in `internal/bootstrap/server.go`; middleware is mounted there in order. Final URLs are determined by Gin route registration, NOT by handler method names.

API path conventions:
- `/api/dashboard/*` — Admin/agent workspace (auth required)
- `/api/third/*` — Third-party callbacks (WeChat, etc.)
- `/api/*` — Open/customer-facing APIs

### Key Backend Libraries

- `github.com/mlogclub/simple` — Provides `sqls.DB()`, `sqls.Cnd` (query conditions), `sqls.WithTransaction()`, and `web.PageResult`/`web.JsonResult` response helpers
- `github.com/cloudwego/eino` — AI agent orchestration framework (graph execution, tool calling, streaming)
- `github.com/qdrant/go-client` — Qdrant vector database client
- `github.com/lancedb/lancedb-go` — Alternative vector DB (LanceDB, CGO build tag required)

### Frontend Architecture (`web/`)

- **Framework**: Next.js 16 (App Router) + React 19 + shadcn/ui + Tailwind CSS v4
- **Pages**: `web/app/dashboard/` (admin/agent workspace), `web/app/support/` (customer-facing pages)
- **Components**: shadcn/ui base in `web/components/ui/` (do not modify), business components in `web/components/`
- **API layer**: All backend calls go through `web/lib/api/client.ts` → service modules in `web/lib/api/*.ts`; no raw `fetch` in pages/components
- **Forms**: `react-hook-form` + `zod` + `web/components/ui/field.tsx`
- **State**: Zustand stores in `web/lib/stores/`
- **Realtime**: WebSocket-based via `web/lib/im-realtime.ts` and `web/lib/realtime-connection.ts`
- **Enums**: Backend-defined, frontend-generated via `make enums` into `web/lib/enums.ts`

### Database Compatibility

Must work with both SQLite and MySQL. Use compatible types (`varchar`, `text`, `int`, `bigint`, `datetime`), primary keys are always `int64`. DDL goes through `AutoMigrate(models.Models...)`; DML/data migrations go through `internal/migration/runner.go` (idempotent, monotonically increasing `version`).

### Startup Flow

1. `config.Load()` — parse YAML config
2. `InitDB()` — connect to SQLite/MySQL, run AutoMigrate
3. `InitMigrations()` — run data migrations from `internal/migration/`
4. `vectordb.Init()` — connect to Qdrant or LanceDB
5. `cronx.Init()` — start scheduled tasks
6. `wxwork.Init()` / `oidcclient.Init()` — external integrations
7. `NewServer()` — create Gin engine, register middleware and routes, serve embedded SPA

### Important Conventions

- See `AGENTS.md` for exhaustive layer rules, handler naming conventions, transaction best practices, and frontend standards — it is the authoritative reference for all development rules in this repo.
- Handler names use the pattern `XxxList`, `XxxGetBy`, `XxxPostCreate`, `XxxPostUpdate`, `XxxPostDelete`. These do NOT auto-register routes; each endpoint must be explicitly registered in `internal/bootstrap/*_routes.go`.
- JSON fields use camelCase. Error codes: 1000-1999 params, 2000-2999 business, 3000-3999 auth, 5000-5999 system.
- All backend responses use the unified `JsonResult` structure (`success`, `errorCode`, `message`, `data`). Frontend must check `success`, not just HTTP status.
- Logging: use `log/slog` with structured key-value pairs. No other logging libraries.
- Use `any` in new Go code (not `interface{}`).
- Run `gofmt` after modifying Go code.
