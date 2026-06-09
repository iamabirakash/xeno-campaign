const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const CRM_PORT = Number(process.env.CRM_PORT || 3000);
const CHANNEL_PORT = Number(process.env.CHANNEL_PORT || 4000);
const DATA_DIR = path.join(__dirname, "data");
const STATE_FILE = path.join(DATA_DIR, "state.json");
const DIST_DIR = path.join(__dirname, "dist");

const EVENT_ORDER = ["sent", "delivered", "opened", "read", "clicked", "converted", "failed"];
const CHANNEL_CONFIG = {
  whatsapp: { delivery: 0.94, open: 0.78, read: 0.67, click: 0.22, convert: 0.07 },
  sms: { delivery: 0.91, open: 0.62, read: 0.51, click: 0.14, convert: 0.04 },
  email: { delivery: 0.96, open: 0.46, read: 0.37, click: 0.16, convert: 0.05 },
  rcs: { delivery: 0.89, open: 0.69, read: 0.57, click: 0.2, convert: 0.06 }
};

const state = loadState();

function loadState() {
  ensureDataDir();

  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  }

  const initialState = seedState();
  saveState(initialState);
  return initialState;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function saveState(nextState = state) {
  ensureDataDir();
  fs.writeFileSync(STATE_FILE, JSON.stringify(nextState, null, 2));
}

function seedState() {
  const rows = [
    ["cus_001", "Aarav Mehta", "Bengaluru", "vip", "whatsapp", "outerwear", 11750, 8, 18],
    ["cus_002", "Maya Rao", "Mumbai", "loyal", "email", "skincare", 8200, 5, 41],
    ["cus_003", "Nikhil Sen", "Delhi", "at_risk", "sms", "coffee", 2400, 3, 96],
    ["cus_004", "Zoya Khan", "Pune", "new", "rcs", "sneakers", 1800, 1, 9],
    ["cus_005", "Reya Das", "Kolkata", "vip", "whatsapp", "beauty", 15400, 10, 24],
    ["cus_006", "Kabir Shah", "Ahmedabad", "at_risk", "email", "denim", 5200, 4, 131],
    ["cus_007", "Anika Bose", "Chennai", "loyal", "rcs", "coffee", 6700, 7, 33],
    ["cus_008", "Ishaan Gill", "Jaipur", "new", "sms", "accessories", 950, 1, 6],
    ["cus_009", "Tara Iyer", "Hyderabad", "loyal", "whatsapp", "skincare", 9300, 6, 52],
    ["cus_010", "Dev Malhotra", "Gurugram", "vip", "email", "sneakers", 20100, 9, 14],
    ["cus_011", "Sara Joseph", "Kochi", "at_risk", "sms", "beauty", 3100, 2, 88],
    ["cus_012", "Rohan Batra", "Noida", "loyal", "whatsapp", "coffee", 7600, 8, 27],
    ["cus_013", "Meera Kapoor", "Mumbai", "vip", "rcs", "occasionwear", 18400, 7, 21],
    ["cus_014", "Aditya Nair", "Bengaluru", "new", "email", "denim", 1450, 1, 12],
    ["cus_015", "Priya Menon", "Pune", "at_risk", "whatsapp", "skincare", 4300, 3, 145],
    ["cus_016", "Vihaan Arora", "Delhi", "loyal", "sms", "outerwear", 6800, 5, 61]
  ];

  const customers = rows.map(([id, name, city, lifecycle, preferredChannel, favoriteCategory, totalSpend, orderCount, daysSinceLastOrder], index) => ({
    id,
    name,
    city,
    lifecycle,
    preferredChannel,
    favoriteCategory,
    totalSpend,
    orderCount,
    daysSinceLastOrder,
    phone: `+91${7800000000 + index * 37491}`,
    email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`
  }));

  const orders = customers.flatMap((customer) =>
    Array.from({ length: customer.orderCount }, (_, index) => ({
      id: `ord_${customer.id}_${index + 1}`,
      customerId: customer.id,
      category: customer.favoriteCategory,
      amount: Math.max(300, Math.round(customer.totalSpend / customer.orderCount + index * 43)),
      orderedAt: daysAgo(customer.daysSinceLastOrder + index * 19)
    }))
  );

  return {
    customers,
    orders,
    segments: [
      {
        id: "seg_vip_refresh",
        name: "VIPs ready for a refresh",
        description: "High spenders who purchased in the last 30 days.",
        rule: { lifecycle: "vip", maxDaysSinceLastOrder: 30 },
        createdBy: "AI copilot"
      },
      {
        id: "seg_winback",
        name: "At-risk winback shoppers",
        description: "Customers who have not ordered in 75+ days.",
        rule: { minDaysSinceLastOrder: 75 },
        createdBy: "AI copilot"
      }
    ],
    campaigns: [],
    communications: [],
    receipts: []
  };
}

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  response.end(JSON.stringify(body));
}

function sendText(response, status, body, contentType = "text/plain") {
  response.writeHead(status, {
    "Content-Type": contentType,
    "Access-Control-Allow-Origin": "*"
  });
  response.end(body);
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Payload too large"));
        request.destroy();
      }
    });
    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function createCrmServer() {
  return http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === "OPTIONS") {
      sendJson(response, 204, {});
      return;
    }

    try {
      if (url.pathname.startsWith("/api/")) {
        await handleCrmApi(request, response, url);
        return;
      }

      serveReactApp(response, url.pathname);
    } catch (error) {
      sendJson(response, 500, { error: error.message });
    }
  });
}

async function handleCrmApi(request, response, url) {
  if (request.method === "GET" && url.pathname === "/api") {
    sendJson(response, 200, {
      service: "Xeno Campaign Copilot CRM API",
      routes: [
        "GET /api/summary",
        "GET /api/customers",
        "GET /api/orders",
        "GET /api/segments",
        "POST /api/segments/preview",
        "POST /api/ai/recommend",
        "POST /api/campaigns",
        "GET /api/campaigns",
        "GET /api/communications",
        "POST /api/receipts"
      ]
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/summary") {
    sendJson(response, 200, getSummary());
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/customers") {
    sendJson(response, 200, state.customers);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/orders") {
    sendJson(response, 200, state.orders);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/segments") {
    sendJson(response, 200, enrichSegments());
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/segments/preview") {
    const body = await readBody(request);
    sendJson(response, 200, previewSegment(body.rule || {}));
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/ai/recommend") {
    const body = await readBody(request);
    sendJson(response, 200, recommendCampaign(body.goal || ""));
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/campaigns") {
    const body = await readBody(request);
    const campaign = createCampaign(body);
    sendJson(response, 201, campaign);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/campaigns") {
    sendJson(response, 200, getCampaigns());
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/communications") {
    sendJson(response, 200, state.communications);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/receipts") {
    const receipt = await readBody(request);
    ingestReceipt(receipt);
    sendJson(response, 202, { accepted: true });
    return;
  }

  sendJson(response, 404, { error: "Route not found" });
}

function serveReactApp(response, requestedPath) {
  if (!fs.existsSync(DIST_DIR)) {
    sendText(response, 200, "React build not found. Run npm run build, or use npm run dev:web for local frontend development.");
    return;
  }

  const safePath = requestedPath === "/" ? "/index.html" : requestedPath;
  let filePath = path.normalize(path.join(DIST_DIR, safePath));

  if (!filePath.startsWith(DIST_DIR) || !fs.existsSync(filePath)) {
    filePath = path.join(DIST_DIR, "index.html");
  }

  const ext = path.extname(filePath);
  const contentTypes = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".svg": "image/svg+xml"
  };
  sendText(response, 200, fs.readFileSync(filePath), contentTypes[ext] || "application/octet-stream");
}

function getSummary() {
  const campaigns = getCampaigns();
  const revenue = campaigns.reduce((sum, campaign) => sum + campaign.stats.converted * campaign.estimatedOrderValue, 0);

  return {
    customers: state.customers.length,
    orders: state.orders.length,
    campaigns: state.campaigns.length,
    activeCampaigns: campaigns.filter((campaign) => campaign.status !== "completed").length,
    revenue,
    strongestSegment: enrichSegments().sort((left, right) => right.size - left.size)[0]
  };
}

function enrichSegments() {
  return state.segments.map((segment) => ({
    ...segment,
    size: filterCustomers(segment.rule).length
  }));
}

function previewSegment(rule) {
  const customers = filterCustomers(rule);
  return { size: customers.length, customers, rule };
}

function filterCustomers(rule = {}) {
  return state.customers.filter((customer) => {
    if (rule.lifecycle && customer.lifecycle !== rule.lifecycle) return false;
    if (rule.city && customer.city !== rule.city) return false;
    if (rule.favoriteCategory && customer.favoriteCategory !== rule.favoriteCategory) return false;
    if (rule.preferredChannel && customer.preferredChannel !== rule.preferredChannel) return false;
    if (Number.isFinite(rule.minSpend) && customer.totalSpend < rule.minSpend) return false;
    if (Number.isFinite(rule.maxSpend) && customer.totalSpend > rule.maxSpend) return false;
    if (Number.isFinite(rule.minOrders) && customer.orderCount < rule.minOrders) return false;
    if (Number.isFinite(rule.minDaysSinceLastOrder) && customer.daysSinceLastOrder < rule.minDaysSinceLastOrder) return false;
    if (Number.isFinite(rule.maxDaysSinceLastOrder) && customer.daysSinceLastOrder > rule.maxDaysSinceLastOrder) return false;
    return true;
  });
}

function recommendCampaign(goal) {
  const normalizedGoal = goal.toLowerCase();
  const isWinback = /win|risk|inactive|lost|return|churn/.test(normalizedGoal);
  const isVip = /vip|premium|high|loyal|best/.test(normalizedGoal);
  const isLaunch = /launch|new|drop|collection|introduce/.test(normalizedGoal);

  let segmentDraft = {
    name: "Likely repeat buyers",
    description: "Loyal shoppers with multiple orders and recent purchase intent.",
    rule: { minOrders: 4, maxDaysSinceLastOrder: 65 }
  };

  if (isWinback) {
    segmentDraft = {
      name: "Winback audience",
      description: "At-risk shoppers with enough history to justify a sharper offer.",
      rule: { minDaysSinceLastOrder: 75, minOrders: 2 }
    };
  } else if (isVip) {
    segmentDraft = {
      name: "VIP early-access shoppers",
      description: "High-value shoppers who respond well to exclusivity.",
      rule: { lifecycle: "vip", minSpend: 10000 }
    };
  } else if (isLaunch) {
    segmentDraft = {
      name: "Launch-ready loyalists",
      description: "Recent loyal buyers who are likely to try a new collection.",
      rule: { minOrders: 3, maxDaysSinceLastOrder: 60 }
    };
  }

  const preview = previewSegment(segmentDraft.rule);
  const channel = chooseBestChannel(preview.customers);
  const offer = isWinback ? "15% comeback reward" : isVip ? "24-hour early access" : "personalized picks";
  const tone = isWinback ? "warm comeback" : isVip ? "exclusive" : "fresh and useful";

  return {
    goal,
    segmentDraft,
    audienceSize: preview.size,
    recommendedChannel: channel,
    subject: isWinback ? "A little nudge back to what you love" : "Picked for your next purchase",
    messageTemplate: `Hi {{firstName}}, we saved ${offer} for you based on your love for {{favoriteCategory}}. Tap to see your edit before it closes.`,
    reasoning: [
      `Audience selected for ${segmentDraft.description.toLowerCase()}`,
      `${channel.toUpperCase()} is strongest across this audience's preferences.`,
      `The ${tone} tone keeps the offer specific and brand-safe.`
    ]
  };
}

function chooseBestChannel(customers) {
  if (!customers.length) return "whatsapp";

  const counts = customers.reduce((result, customer) => {
    result[customer.preferredChannel] = (result[customer.preferredChannel] || 0) + 1;
    return result;
  }, {});

  return Object.entries(counts).sort((left, right) => right[1] - left[1])[0][0];
}

function createCampaign(body) {
  const segment = body.segment || recommendCampaign(body.goal || "").segmentDraft;
  const audience = filterCustomers(segment.rule || {});
  const campaign = {
    id: `camp_${Date.now()}`,
    name: body.name || segment.name || "AI campaign",
    goal: body.goal || "Drive repeat purchases",
    channel: body.channel || chooseBestChannel(audience),
    segment,
    messageTemplate: body.messageTemplate || "Hi {{firstName}}, we picked something fresh for you in {{favoriteCategory}}.",
    status: "sending",
    estimatedOrderValue: Number(body.estimatedOrderValue || 2100),
    createdAt: new Date().toISOString()
  };

  state.campaigns.unshift(campaign);

  for (const customer of audience) {
    const communication = {
      id: `msg_${campaign.id}_${customer.id}`,
      campaignId: campaign.id,
      customerId: customer.id,
      customerName: customer.name,
      channel: campaign.channel,
      recipient: campaign.channel === "email" ? customer.email : customer.phone,
      message: personalize(campaign.messageTemplate, customer),
      status: "queued",
      events: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    state.communications.unshift(communication);
    postToChannel({
      communicationId: communication.id,
      campaignId: campaign.id,
      customerId: customer.id,
      recipient: communication.recipient,
      channel: communication.channel,
      message: communication.message,
      callbackUrl: `http://localhost:${CRM_PORT}/api/receipts`
    });
  }

  saveState();
  return getCampaign(campaign.id);
}

function personalize(template, customer) {
  return template
    .replaceAll("{{firstName}}", customer.name.split(" ")[0])
    .replaceAll("{{favoriteCategory}}", customer.favoriteCategory)
    .replaceAll("{{city}}", customer.city);
}

function postToChannel(payload) {
  const body = JSON.stringify(payload);
  const request = http.request(
    {
      hostname: "localhost",
      port: CHANNEL_PORT,
      path: "/send",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body)
      }
    },
    (response) => response.resume()
  );

  request.on("error", () => {
    ingestReceipt({
      communicationId: payload.communicationId,
      campaignId: payload.campaignId,
      event: "failed",
      reason: "Channel service unavailable",
      occurredAt: new Date().toISOString()
    });
  });
  request.write(body);
  request.end();
}

function ingestReceipt(receipt) {
  const communication = state.communications.find((item) => item.id === receipt.communicationId);
  if (!communication) return;

  const alreadyExists = communication.events.some((event) => event.event === receipt.event);
  if (alreadyExists) return;

  const normalizedReceipt = {
    id: `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    ...receipt,
    occurredAt: receipt.occurredAt || new Date().toISOString()
  };

  communication.events.push(normalizedReceipt);
  communication.events.sort((left, right) => EVENT_ORDER.indexOf(left.event) - EVENT_ORDER.indexOf(right.event));
  communication.status = receipt.event;
  communication.updatedAt = normalizedReceipt.occurredAt;
  state.receipts.unshift(normalizedReceipt);

  const campaign = state.campaigns.find((item) => item.id === receipt.campaignId);
  if (campaign) {
    const campaignMessages = state.communications.filter((item) => item.campaignId === campaign.id);
    const hasTerminalProviderState = campaignMessages.every((item) => item.events.some((event) => ["delivered", "failed"].includes(event.event)));
    if (hasTerminalProviderState) {
      campaign.status = "completed";
    }
  }

  saveState();
}

function getCampaigns() {
  return state.campaigns.map((campaign) => getCampaign(campaign.id)).filter(Boolean);
}

function getCampaign(campaignId) {
  const campaign = state.campaigns.find((item) => item.id === campaignId);
  if (!campaign) return null;

  const communications = state.communications.filter((item) => item.campaignId === campaign.id);
  const stats = communications.reduce(
    (result, communication) => {
      result.total += 1;
      for (const event of communication.events) {
        result[event.event] = (result[event.event] || 0) + 1;
      }
      return result;
    },
    { total: 0, sent: 0, delivered: 0, failed: 0, opened: 0, read: 0, clicked: 0, converted: 0 }
  );

  return {
    ...campaign,
    stats,
    communications: communications.slice(0, 8)
  };
}

function createChannelServer() {
  return http.createServer(async (request, response) => {
    if (request.method === "OPTIONS") {
      sendJson(response, 204, {});
      return;
    }

    if (request.method === "GET" && request.url === "/") {
      sendJson(response, 200, {
        service: "Xeno stubbed channel service",
        routes: ["POST /send"],
        note: "Open the CRM frontend at http://localhost:3000"
      });
      return;
    }

    if (request.method !== "POST" || request.url !== "/send") {
      sendJson(response, 404, { error: "Route not found" });
      return;
    }

    try {
      const payload = await readBody(request);
      simulateDelivery(payload);
      sendJson(response, 202, { accepted: true, communicationId: payload.communicationId });
    } catch (error) {
      sendJson(response, 500, { error: error.message });
    }
  });
}

function simulateDelivery(payload) {
  const config = CHANNEL_CONFIG[payload.channel] || CHANNEL_CONFIG.whatsapp;
  const steps = ["sent"];
  const delivered = Math.random() <= config.delivery;

  if (delivered) {
    steps.push("delivered");
    if (Math.random() <= config.open) steps.push("opened");
    if (steps.includes("opened") && Math.random() <= config.read) steps.push("read");
    if (steps.includes("read") && Math.random() <= config.click) steps.push("clicked");
    if (steps.includes("clicked") && Math.random() <= config.convert) steps.push("converted");
  } else {
    steps.push("failed");
  }

  steps.forEach((event, index) => {
    const delay = 250 + index * 600 + Math.floor(Math.random() * 450);
    setTimeout(() => postReceipt(payload, event), delay);
  });
}

function postReceipt(payload, event) {
  const receipt = JSON.stringify({
    communicationId: payload.communicationId,
    campaignId: payload.campaignId,
    customerId: payload.customerId,
    channel: payload.channel,
    event,
    occurredAt: new Date().toISOString(),
    providerMessageId: `stub_${payload.communicationId}`
  });

  const callbackUrl = new URL(payload.callbackUrl);
  const request = http.request(
    {
      hostname: callbackUrl.hostname,
      port: callbackUrl.port,
      path: callbackUrl.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(receipt)
      }
    },
    (response) => response.resume()
  );

  request.on("error", () => {});
  request.write(receipt);
  request.end();
}

createCrmServer().listen(CRM_PORT, () => {
  console.log(`CRM running at http://localhost:${CRM_PORT}`);
});

createChannelServer().listen(CHANNEL_PORT, () => {
  console.log(`Channel service running at http://localhost:${CHANNEL_PORT}`);
});
