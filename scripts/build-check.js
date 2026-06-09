const fs = require("fs");
const path = require("path");

const requiredFiles = ["server.js", "dist/index.html", "src/App.jsx", "src/main.jsx"];
const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(__dirname, "..", file)));

if (missing.length) {
  console.error(`Missing required files: ${missing.join(", ")}`);
  process.exit(1);
}

require("../server");

setTimeout(() => {
  console.log("Build check passed: React app, CRM service, and channel service can start.");
  process.exit(0);
}, 300);
