# Xeno Campaign Copilot

An AI-native Mini CRM for shopper engagement. It helps a D2C or retail brand decide who to talk to, what to say, which channel to use, and how each communication performed after it was sent.

Recommended repository name: `xeno-campaign-copilot`

## Project Summary

Xeno Campaign Copilot is a marketing CRM, not a sales pipeline CRM and not a support-ticket CRM. It is designed around one focused workflow:

1. A marketer describes a campaign goal in natural language.
2. The AI copilot recommends the audience, channel, message, and reasoning.
3. The marketer launches the campaign.
4. The CRM personalizes communications for every selected shopper.
5. A separate stubbed channel service simulates delivery and engagement.
6. The channel service asynchronously calls back into the CRM.
7. The CRM updates communication state and campaign performance insights.

The product point of view is intentionally narrow: make campaign creation smarter and faster for shopper engagement teams.

## Tech Stack Used

### Frontend

- React
- Vite
- Tailwind CSS
- Vanilla browser `fetch` for API calls

### Backend

- Node.js
- Native Node.js HTTP server
- REST-style JSON APIs
- JSON file persistence

### Services

- CRM service on port `3000`
- Stubbed channel service on port `4000`

### Storage

- Local JSON persistence in `data/state.json`

### Tooling

- npm
- Vite build pipeline
- Tailwind utility-first styling

No real messaging provider is integrated. WhatsApp, SMS, Email, and RCS are simulated through the local channel service.

## Why React And Tailwind

The first implementation used a static frontend. This version moves the product UI to React and Tailwind because:

- React gives the dashboard a cleaner component structure.
- Tailwind keeps styling close to the components.
- The app can evolve into a larger CRM without splitting behavior across plain DOM scripts.
- The evaluator can clearly see frontend state, API calls, and rendering logic.
- The UI is easier to extend with campaign builders, segment editors, charts, and future AI workflows.

## Product Features

- AI-style campaign copilot from natural-language goals.
- Simulated shopper and order ingestion.
- Customer storage with lifecycle, spend, city, preferred channel, category, and recency data.
- Rule-based audience segmentation.
- Segment previews with live audience sizes.
- Personalized campaign message generation.
- Campaign launch API.
- Separate channel service that simulates delivery lifecycle.
- Asynchronous callback ingestion through a CRM receipt API.
- Communication-level event tracking.
- Campaign-level performance metrics.
- React dashboard for metrics, segments, campaigns, customers, and AI recommendations.

## AI-Native Product Approach

This product treats AI as a decision assistant, not only a copywriting helper.

The copilot turns marketer intent into:

- Recommended segment
- Audience rule
- Audience size
- Best channel
- Message subject
- Personalized message template
- Reasoning behind the recommendation

Example goal:

```text
Win back inactive shoppers with a personal offer before the weekend.
```

Example output:

- Segment: Winback audience
- Rule: customers inactive for 75+ days with at least 2 orders
- Channel: most common preferred channel in the selected audience
- Message: personalized comeback offer using shopper category affinity

The current implementation uses deterministic AI-like recommendation logic so the app is self-contained and does not require API keys. In production, this layer can be replaced with or enhanced by an LLM.

## Architecture

```text
React + Tailwind Dashboard
          |
          v
CRM Service, Node.js
          |
          | send communication payload
          v
Stubbed Channel Service
          |
          | async delivery and engagement callback
          v
CRM Receipt API
          |
          v
Communication State + Campaign Metrics
```

## Communication Lifecycle

The channel service simulates the lifecycle of each communication.

Possible events:

- `sent`
- `delivered`
- `failed`
- `opened`
- `read`
- `clicked`
- `converted`

The CRM stores each callback as a receipt, updates the matching communication, deduplicates repeated events, and recalculates campaign stats.

## Project Structure

```text
xeno-campaign-copilot/
├── src/
│   ├── App.jsx
│   └── main.jsx
├── scripts/
│   └── build-check.js
├── data/
│   └── state.json
├── index.html
├── server.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── README.md
```

## API Reference

### CRM APIs

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/summary` | Returns dashboard summary metrics. |
| `GET` | `/api/customers` | Returns all ingested shoppers. |
| `GET` | `/api/orders` | Returns customer purchase history. |
| `GET` | `/api/segments` | Returns saved audience segments with live sizes. |
| `POST` | `/api/segments/preview` | Previews shoppers matching a segment rule. |
| `POST` | `/api/ai/recommend` | Converts a campaign goal into audience, channel, and message recommendations. |
| `POST` | `/api/campaigns` | Launches a campaign and sends messages to the channel service. |
| `GET` | `/api/campaigns` | Returns campaigns with performance stats. |
| `GET` | `/api/communications` | Returns communication-level records. |
| `POST` | `/api/receipts` | Accepts async callbacks from the channel service. |

### Channel Service API

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/send` | Accepts a communication payload and simulates lifecycle callbacks. |

## Running Locally

Install dependencies:

```bash
npm install
```

Run the backend CRM and channel service:

```bash
npm run dev:api
```

Run the React frontend:

```bash
npm run dev:web
```

Open:

```text
http://localhost:5173
```

The frontend talks to the backend at:

```text
http://localhost:3000
```

## Production Build

Build the React app:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

Open:

```text
http://localhost:3000
```

In production mode, the Node CRM server serves the built React app from `dist/`.

## Implementation Plan

### Phase 1: README and Stack Update

- Replace the static frontend plan with React + Tailwind.
- Document the two-service architecture.
- Document the API surface.
- Document local development and production scripts.

### Phase 2: Frontend Migration

- Create Vite React entry files.
- Move the dashboard into React components.
- Replace plain CSS with Tailwind utility classes.
- Use React state for summary, segments, campaigns, customers, and recommendations.
- Poll campaign data so callback results appear live.

### Phase 3: Backend Compatibility

- Keep the existing CRM APIs.
- Keep the separate channel service.
- Update static serving so the backend serves `dist/` in production.
- Preserve callback ingestion and campaign stat calculation.

### Phase 4: Verification

- Install React, Vite, and Tailwind dependencies.
- Run the production build.
- Start the backend.
- Confirm the dashboard loads.
- Launch a campaign.
- Confirm channel callbacks update campaign metrics.

## Demo Flow

1. Open the React dashboard.
2. Show seeded customers and saved segments.
3. Enter a campaign goal in the copilot panel.
4. Generate a recommendation.
5. Explain the recommended audience, channel, message, and reasoning.
6. Launch the campaign.
7. Show campaign metrics changing as simulated callbacks arrive.
8. Explain the CRM and channel service loop.

## System Design Decisions

### Two Services

The CRM and channel simulator are separate because real channel providers are asynchronous. A send API only confirms provider acceptance. Delivery, failure, read, click, and conversion events arrive later through callbacks.

### JSON Persistence

JSON storage keeps the demo simple and easy to review. For production, this should move to PostgreSQL or another durable database.

### Deterministic Copilot

The recommendation engine is deterministic so the project can run without external AI credentials. The product still demonstrates AI-native behavior by turning goals into decisions and actions.

### Idempotent Receipts

The CRM deduplicates receipt events per communication so duplicate callbacks do not inflate campaign stats.

## Scalability Improvements

For production scale, I would add:

- PostgreSQL for durable relational data.
- Redis or a queue for campaign dispatch.
- Worker processes for high-volume sending.
- Signed callback verification.
- Retry policies for failed channel requests.
- Idempotency keys for sends and receipts.
- Provider event ordering rules.
- Channel-level rate limits.
- Multi-brand tenancy.
- Campaign attribution windows.
- Real LLM integration for richer recommendations.

## Deployment Notes

The easiest hosting options for this implementation are:

- Render
- Railway
- Fly.io

The production deployment should:

1. Run `npm install`.
2. Run `npm run build`.
3. Run `npm start`.

Suggested environment variables:

```text
CRM_PORT=3000
CHANNEL_PORT=4000
```

## Walkthrough Video Outline

| Section | Time | What to Cover |
| --- | --- | --- |
| Product intro | 30 sec | What was built and why it focuses on shopper marketing. |
| Functional demo | 90 sec | Goal input, recommendation, campaign launch, callbacks, and stats. |
| Architecture | 60 sec | React dashboard, CRM service, channel service, receipt API. |
| Code walkthrough | 60 sec | `src/App.jsx`, `server.js`, and callback ingestion. |
| AI-native workflow | 60 sec | How AI helped scope, build, review, and refine the project. |
| Tradeoffs | 30 sec | JSON storage, deterministic AI, and production scaling path. |

## Repository Name

Use:

```text
xeno-campaign-copilot
```

Alternative names:

- `ai-native-mini-crm`
- `shopper-campaign-copilot`
- `xeno-shopper-crm`

## License

MIT
