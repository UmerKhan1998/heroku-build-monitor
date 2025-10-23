const axios = require("axios");
const cron = require("node-cron");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

// ✅ URLs to monitor
const MONITORED_URLS = [
  "https://server-monitoring-004f594d63b2.herokuapp.com",
  "https://quran-journey-staging-4e781e6719ce.herokuapp.com/ping",
  "https://api.heroku.com/apps/your-app-name-1",
  "https://server-monitoring-004f594d63b2.herokuapp.com",
  "https://quran-journey-staging-4e781e6719ce.herokuapp.com/ping",
  "https://server-monitoring-004f594d63b2.herokuapp.com/",
  "https://api.heroku.com/apps/your-app-name-2",
];

// ✅ Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ In-memory state cache (prevents duplicate alerts)
const lastStatus = {};

async function sendFailureEmail(url, reason) {
  await transporter.sendMail({
    from: `"Heroku Uptime Monitor" <${process.env.EMAIL_USER}>`,
    to: "muk9298@gmail.com",
    subject: `🚨 App Down: ${url}`,
    html: `
      <h2>App Down Alert</h2>
      <p><b>URL:</b> ${url}</p>
      <p><b>Reason:</b> ${reason}</p>
      <p><b>Time:</b> ${new Date().toLocaleString()}</p>
    `,
  });
  console.log(`📧 Alert email sent for ${url}`);
}

async function sendRecoveryEmail(url) {
  await transporter.sendMail({
    from: `"Heroku Uptime Monitor" <${process.env.EMAIL_USER}>`,
    to: "devUk9298@gmail.com",
    subject: `✅ App Recovered: ${url}`,
    html: `
      <h2>App Back Online</h2>
      <p><b>URL:</b> ${url}</p>
      <p><b>Time:</b> ${new Date().toLocaleString()}</p>
    `,
  });
  console.log(`📧 Recovery email sent for ${url}`);
}

async function checkUptime() {
  console.log(`[${new Date().toISOString()}] Checking uptime...`);

  for (const url of MONITORED_URLS) {
    try {
      const res = await axios.get(url, { timeout: 10000 });
      if (res.status === 200) {
        console.log(`✅ UP: ${url}`);

        if (lastStatus[url] === "DOWN") {
          await sendRecoveryEmail(url);
        }
        lastStatus[url] = "UP";
      } else {
        console.warn(`⚠️ ${url} returned ${res.status}`);
        if (lastStatus[url] !== "DOWN") {
          await sendFailureEmail(url, `Returned ${res.status}`);
        }
        lastStatus[url] = "DOWN";
      }
    } catch (err) {
      console.error(`❌ ${url} is DOWN: ${err.message}`);
      if (lastStatus[url] !== "DOWN") {
        await sendFailureEmail(url, err.message);
      }
      lastStatus[url] = "DOWN";
    }
  }
}

// 🕐 Run every 5 minutes
cron.schedule("*/5 * * * *", checkUptime);

console.log("🚀 Heroku Uptime Monitor running every 5 minutes...");
checkUptime(); // run immediately on startup
