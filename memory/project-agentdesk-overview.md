---
name: project-agentdesk-overview
description: AgentDesk 项目核心信息 — AI Agent 客服系统，Go + Next.js，自托管
metadata:
  type: project
---

AgentDesk 是一个开源的 AI Agent 客服系统，位于 `D:\vibe_code\newCustomer\CustomerServiceSystem`。

**技术栈**：Go (Gin+GORM) + Next.js 16 (React 19, shadcn/ui, Tailwind CSS) + SQLite/MySQL + Qdrant 向量数据库

**核心能力**：
- AI Agent 优先回复（RAG + Answerability Gate）
- 人工坐席工作台（转接、会话标签、关联客户、工单）
- 知识库 FAQ/文档管理（分块、嵌入、向量检索）
- 工单系统（从会话创建、状态流转、进度记录）
- 多入口：管理后台 `/dashboard`、客服工作台、客服网页 SDK、Open API

**关键路径**：
- 后端 `internal/` — models→repositories→services→handlers→builders 严格单向分层
- AI 子系统 `internal/ai/` — runtime（编排器）、rag（检索）、skills（技能）、mcps（MCP 工具）、application（应用层）
- 路由注册 `internal/bootstrap/routes.go` 显式定义
- 前端 `web/` — Next.js App Router，所有后端调用走 `web/lib/api/client.ts`

**常用命令**：`make dev`（前后端开发）、`make build`（构建）、`make release`（发布）

**默认管理员账户**：admin / ChangeMe123!
**启动方式**：`docker compose up -d --build`（端口 8083）
