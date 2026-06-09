# Xeno Campaign Copilot

An AI-native Mini CRM for shopper engagement. It helps a D2C or retail brand decide who to talk to, what to say, which channel to use, and how each communication performed after it was sent.

Recommended repository name: `xeno-campaign-copilot`

## Overview

Xeno Campaign Copilot is a marketing CRM, not a sales or support CRM. It is designed around one focused workflow: a marketer describes a business goal, the AI copilot recommends an audience and message strategy, and the CRM launches a personalized campaign through a separate stubbed channel service.

The channel service does not send real WhatsApp, SMS, Email, or RCS messages. Instead, it simulates the real lifecycle of a communication and asynchronously calls back into the CRM with delivery and engagement receipts such as `sent`, `delivered`, `failed`, `opened`, `read`, `clicked`, and `converted`.

## Product Point Of View

The brief asks for an AI-native CRM. This project takes the stance that the best AI experience for a marketer is not just a chatbot and not just a text generator. The AI should help the marketer think and act.

The product therefore behaves like a campaign cockpit:

- The marketer enters a natural-language goal.
- The copilot recommends the audience, channel, and message.
- The marketer reviews the reasoning and launches the campaign.
- The CRM personalizes each communication.
- A separate channel service simulates real provider callbacks.
- The dashboard updates campaign performance as receipts arrive.

## Features

- Seeded customer and order data for a realistic D2C demo.
- Customer storage with lifecycle, spend, order count, city, category, and channel preference.
- Rule-based audience segmentation.
- AI-style campaign recommendation from natural-language goals.
- Personalized message templates using shopper attributes.
- Campaign launch API.
- Separate stubbed channel service.
- Asynchronous receipt callbacks from the channel service to the CRM.
- Communication lifecycle tracking.
- Campaign-level performance insights.
- Dashboard for customers, segments, campaigns, metrics, and delivery status.

## Tech Stack

- **Runtime:** Node.js
- **Backend:** Native Node.js HTTP server
- **Frontend:** HTML, CSS, vanilla JavaScript
- **Storage:** JSON file persistence in `data/state.json`
- **Architecture:** Two-service callback-driven system
- **CRM service:** Runs on port `3000`
- **Channel service:** Runs on port `4000`
- **Package manager:** npm
- **External messaging providers:** None, intentionally stubbed
- **External AI providers:** None, the current demo uses deterministic AI-like recommendation logic

This stack was chosen to keep the project easy to run, easy to review, and focused on product logic and system design rather than framework setup.

## Project Structure

```text
xeno-campaign-copilot/
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── scripts/
│   └── build-check.js
├── server.js
├── package.json
└── README.md
```

## How It Works

### 1. Data Ingestion

The CRM starts with simulated customer and order data. Each customer has attributes such as:

- Name
- City
- Lifecycle stage
- Preferred channel
- Favorite category
- Total spend
- Order count
- Days since last order
- Email and phone

Orders are linked to customers and used to make the dataset feel closer to a real retail CRM.

### 2. Segmentation

Segments are created using shopper attributes and behavior rules.

Supported rule examples:

- `lifecycle`
- `city`
- `favoriteCategory`
- `preferredChannel`
- `minSpend`
- `maxSpend`
- `minOrders`
- `minDaysSinceLastOrder`
- `maxDaysSinceLastOrder`

Example segment:

```json
{
  "name": "Winback audience",
  "rule": {
    "minDaysSinceLastOrder": 75,
    "minOrders": 2
  }
}
```

### 3. AI Campaign Copilot

The marketer enters a goal such as:

```text
Win back inactive shoppers with a personal offer before the weekend.
```

The copilot recommends:

- Audience name
- Audience rule
- Audience size
- Best channel
- Message subject
- Personalized message template
- Reasoning behind the recommendation

The current implementation uses deterministic recommendation logic instead of a live LLM so the demo is fully self-contained and does not require API keys.

### 4. Personalized Communication

When a campaign is launched, the CRM creates one communication per matching customer.

Templates support fields such as:

- `{{firstName}}`
- `{{favoriteCategory}}`
- `{{city}}`

Example:

```text
Hi {{firstName}}, we saved 15% comeback reward for you based on your love for {{favoriteCategory}}.
```

### 5. Stubbed Channel Service

The CRM calls the separate channel service for each communication.

The channel service accepts:

- Communication ID
- Campaign ID
- Customer ID
- Recipient
- Channel
- Message
- Callback URL

It then simulates the communication lifecycle asynchronously.

Possible events:

- `sent`
- `delivered`
- `failed`
- `opened`
- `read`
- `clicked`
- `converted`

### 6. Receipt Callback Loop

The channel service posts receipts back to:

```text
POST /api/receipts
```

The CRM ingests each receipt, updates the communication status, deduplicates repeated events, and recomputes campaign stats.

This models how real messaging providers work, where sending and delivery are not the same operation.

## API Reference

### CRM APIs

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/summary` | Returns dashboard summary metrics. |
| `GET` | `/api/customers` | Returns all ingested customers. |
| `GET` | `/api/orders` | Returns customer purchase history. |
| `GET` | `/api/segments` | Returns saved segments with live audience sizes. |
| `POST` | `/api/segments/preview` | Previews customers matching a segment rule. |
| `POST` | `/api/ai/recommend` | Converts a campaign goal into an audience, channel, and message recommendation. |
| `POST` | `/api/campaigns` | Launches a campaign and sends communications to the channel service. |
| `GET` | `/api/campaigns` | Returns campaigns with performance stats. |
| `GET` | `/api/communications` | Returns communication-level records. |
| `POST` | `/api/receipts` | Accepts async callbacks from the channel service. |

### Channel Service API

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/send` | Accepts a communication and simulates provider lifecycle callbacks. |

## Running Locally

Install dependencies:

```bash
npm install
```

Start both services:

```bash
npm start
```

Open the CRM:

```text
http://localhost:3000
```

The services run at:

```text
CRM: http://localhost:3000
Channel service: http://localhost:4000
```

## Build Check

Run:

```bash
npm run build
```

This performs a lightweight startup check to confirm that the CRM and channel service can boot.

## Demo Flow

1. Open `http://localhost:3000`.
2. Review the customer and segment data.
3. Enter a campaign goal in the copilot panel.
4. Generate an AI campaign plan.
5. Review the recommended audience, channel, message, and reasoning.
6. Launch the campaign.
7. Watch campaign stats update as the channel service sends callbacks.
8. Refresh or wait for the dashboard polling to show updated delivery and engagement metrics.

## Architecture

```text
Frontend Dashboard
        |
        v
CRM Service
        |
        | send communication
        v
Stubbed Channel Service
        |
        | async receipt callbacks
        v
CRM Receipt API
        |
        v
Campaign Stats + Communication State
```

## System Design Decisions

### Why two services?

Real messaging providers are asynchronous. A send request only means the provider accepted the message. Delivery, failure, open, click, and conversion signals arrive later as callbacks or webhooks.

This project keeps that separation by running the CRM and channel simulator as separate services.

### Why JSON storage?

For a challenge demo, JSON storage keeps the app easy to run and review. It avoids database setup while still preserving state across runs.

For production, this should move to a durable database such as PostgreSQL.

### Why deterministic AI logic?

The project demonstrates AI-native product behavior without requiring an external API key. The copilot still performs the core AI product role: turning marketer intent into audience, message, channel, and reasoning.

In production, this could be replaced or enhanced with an LLM.

## Scalability Notes

The current version is intentionally lightweight. For larger scale, I would add:

- PostgreSQL for customers, orders, campaigns, communications, and receipts.
- Redis or a queue for campaign dispatch.
- Worker processes for high-volume sending.
- Signed callback verification for channel receipts.
- Retry policies for failed channel calls.
- Idempotency keys for communication sends and receipt ingestion.
- Event timestamps and ordering rules for out-of-order provider callbacks.
- Campaign attribution windows for conversion tracking.
- Rate limits per channel.
- Multi-brand tenancy.

## Walkthrough Video Outline

Suggested 5-6 minute structure:

| Section | Time | What to Cover |
| --- | --- | --- |
| Product intro | 30 sec | What the product is and why it focuses on shopper engagement. |
| Functional demo | 90 sec | Show goal input, AI recommendation, launch, callbacks, and stats. |
| Architecture | 60 sec | Explain CRM service, channel service, receipt API, and storage. |
| Code walkthrough | 60 sec | Walk through `server.js`, `public/app.js`, and the callback flow. |
| AI-native workflow | 60 sec | Explain how AI helped shape product scope, implementation, and review. |
| Tradeoffs | 30 sec | Discuss JSON storage, deterministic AI, and production scaling path. |

## Deployment Notes

For a hosted submission, deploy the app to a platform that supports Node.js.

Suggested options:

- Render
- Railway
- Fly.io
- Vercel with serverless adaptation

Because this app runs two services in one Node process, the simplest deployment path is Render or Railway.

Use these environment variables if needed:

```text
CRM_PORT=3000
CHANNEL_PORT=4000
```

## Future Enhancements

- Real LLM integration for richer segment and copy generation.
- CSV upload for customer and order ingestion.
- Campaign scheduling.
- A/B testing for message variants.
- Brand tone controls.
- Channel cost simulation.
- Revenue attribution dashboard.
- Segment save/edit UI.
- Exportable campaign reports.

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
