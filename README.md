# 🥂 Rate the Blind Items

A real-time web app for **blind tasting sessions**. A host creates a room and enters the
items to be tasted; players join with a room code, then **drag-and-drop** their guess onto each
blind sample and **rate it 1–5 stars**. When the host ends the game, everyone sees the results —
players get a personal breakdown *and* the room-wide aggregate.

Built as a portfolio project with an emphasis on clean architecture, end-to-end type safety,
tests, and reproducible local/Docker setups.

---

## ✨ Features

- **Host flow** — create a game, get a shareable room code, enter the tasting items, start/stop the game.
- **Player flow** — join with a code + nickname, drag option chips onto samples, rate each with stars.
- **Real-time** — live lobby roster, "start game" broadcast, and submission progress via Socket.IO.
- **Results** — per-player "My results" (your guesses ✓/✗ + stars) and a ranked "Room results" aggregate.
- **Ephemeral host auth** — host identity via a `hostToken` (a clean seam to add real accounts later).

## 🧱 Tech stack

| Layer | Choices |
| --- | --- |
| **Frontend** | React 19, Vite 6, TypeScript, Tailwind CSS v4, Zustand, React Router 7, @dnd-kit, socket.io-client |
| **Backend** | Node.js, Express, Socket.IO, Mongoose, Zod, Helmet, Pino, nanoid |
| **Database** | MongoDB |
| **Tooling** | npm workspaces, ESLint, Prettier, Vitest, Testing Library, supertest, mongodb-memory-server, tsup, Docker |

## 🗂️ Monorepo layout

```
.
├── shared/   # @blind/shared — domain types, DTOs, and typed Socket.IO event contracts
├── server/   # Express + Socket.IO + Mongoose API
├── client/   # React + Vite single-page app
├── docker-compose.yml
└── tsconfig.base.json
```

The `shared` package is the source of truth for the types crossing the wire, so the client and
server can never drift on a DTO or socket-event payload.

---

## 🚀 Getting started

### Prerequisites

- **Node.js ≥ 20** and npm
- **One of:** Docker Desktop _or_ a MongoDB connection string (local install or [Atlas](https://www.mongodb.com/atlas))

### 1. Install

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

| Variable | Used by | Description |
| --- | --- | --- |
| `NODE_ENV` | server | `development` \| `test` \| `production` |
| `PORT` | server | API port (default `4000`) |
| `MONGODB_URI` | server | MongoDB connection string |
| `CLIENT_ORIGIN` | server | Allowed CORS / Socket.IO origin (the client URL) |
| `VITE_API_URL` | client | API base URL |
| `VITE_SOCKET_URL` | client | Socket.IO server URL |

### 3. Run it

You have three ways to run the app locally — pick one:

**A) Fast hot-reload, zero infra (in-memory MongoDB)**

No Docker or Mongo install required — boots a throwaway in-memory database.

```bash
npm run dev:client        # client on http://localhost:5173
npm run dev:memdb -w server   # API on http://localhost:4000 (ephemeral DB)
```

**B) Hot-reload against a real MongoDB**

Point `MONGODB_URI` at a running Mongo (local or Atlas), then:

```bash
npm run dev               # runs client + server together
```

**C) Containerized / production-like (Docker)**

Runs MongoDB + the built API + the static client behind nginx.

```bash
docker compose up --build
# client → http://localhost:8080
# API    → http://localhost:4000
```

Data persists in the `mongo-data` volume. `docker compose down -v` wipes it.

---

## 📜 Scripts (run from the repo root)

| Command | Description |
| --- | --- |
| `npm run dev` | Run client + server together (hot reload) |
| `npm run dev:client` | Run only the client |
| `npm run dev:memdb -w server` | Run the API against an in-memory MongoDB |
| `npm run build` | Build server (tsup) and client (Vite) |
| `npm run typecheck` | Type-check every workspace |
| `npm run lint` | ESLint across the repo |
| `npm run format` | Prettier write |
| `npm test` | Run all test suites |

## 🧪 Testing

- **Server** — Vitest + supertest (REST) + a real Socket.IO flow, all backed by
  `mongodb-memory-server` (no external database needed).
- **Client** — Vitest + Testing Library component tests.

```bash
npm test                  # everything
npm test -w server        # server only
npm test -w client        # client only
```

---

## 🔌 How it fits together

- **REST** (`/api/games`) handles host setup before the game is live: create a game, set items,
  and fetch state. Host-only routes are guarded by the `x-host-token` header.
- **Socket.IO** handles everything live: joining, the lobby roster, starting the game, rating
  submissions, progress, and results. Events and payloads are typed via `@blind/shared`.
- On **start**, items are shuffled into anonymized samples; the option pool is the shuffled item
  names. On **end**, the server reveals identities to compute per-player and room results.

## ☁️ Deployment

Designed for a free-tier deploy:

- **Database** — MongoDB Atlas (M0 free tier). Set `MONGODB_URI` to the Atlas connection string.
- **API** — a Docker web service (e.g. Render) built from `server/Dockerfile`.
  Set `MONGODB_URI` and `CLIENT_ORIGIN`.
- **Client** — a static site built with `npm run build -w client`, publishing `client/dist`.
  Set `VITE_API_URL` and `VITE_SOCKET_URL` to the deployed API URL at build time.

> Note: free-tier hosts often spin idle web services down, which drops live Socket.IO connections
> until the next request wakes them — fine for an on-demand party game.

## 🔄 Continuous integration

CI (lint → typecheck → test → build on every push/PR) is set up via GitHub Actions.
A step-by-step, learn-it-yourself walkthrough lives in
[`docs/github-actions-guide.md`](docs/github-actions-guide.md).

## 🗺️ Roadmap

- Host accounts + saved game history (the `hostToken` seam is ready for this)
- Reconnect/resume after a refresh
- Richer result visualizations and shareable summaries
