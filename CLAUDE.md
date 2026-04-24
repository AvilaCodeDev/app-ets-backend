# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install        # install dependencies
bun run index.ts   # start dev server (port 3000)
bun start          # production start
```

No test runner configured yet.

## Architecture

Express.js REST API — TypeScript + Bun runtime, ES modules (`"type": "module"`).

**Entry flow:** `index.ts` → loads `.env` → instantiates `Server` (from `src/controllers/server.ts`) → `listen()`.

`Server` class owns: Express app init, middleware registration, route mounting. Routes base path is `/api`.

**Current state:** skeleton only — no routes, no DB, no auth, no error middleware.

## Known Issues

`src/controllers/server.ts` line 25: `express.json` missing invocation parentheses — should be `express.json()`.

## Conventions

- Strict TypeScript — no implicit `any`
- Bun as runtime and package manager (use `bun` not `npm`/`yarn`)
- Module resolution: `bundler` mode (`tsconfig.json`)
- CORS allows all origins (no restrictions configured)
