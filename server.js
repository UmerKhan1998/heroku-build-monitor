const express = require("express");
const axios = require("axios");
const cron = require("node-cron");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const app = express();

// URLs to monitor
const MONITORED_URLS = [
  "https://school-journey-d80d29443185.herokuapp.com",
  "https://server-monitoring-004f594d63b2.herokuapp.com",
  "https://quran-journey-staging-4e781e6719ce.herokuapp.com/ping",
  "https://api.heroku1.com/apps/your-app-name-1/6546546",
  "https://server-monitoring-004f594d63b2.herokuapp.com",
  "https://quran-journey-staging-4e781e6719ce.herokuapp.com/ping",
  "https://server-monitoring-004f594d63b2.herokuapp.com/",
  "https://api.heroku.com/apps/your-app-name-2",
];

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendFailureEmail(url, reason) {
  await transporter.sendMail({
    from: `"Heroku Uptime Monitor" <${process.env.EMAIL_USER}>`,
    to: ["support@sidr.productions", "ibad@digitalbee.studio"],
    subject: `🚨 App Down: ${url}`,
    html: `<h2>App Down Alert</h2><p><b>URL:</b> ${url}</p><p><b>Reason:</b> ${reason}</p>`,
  });
  console.log(`📧 Alert email sent for ${url}`);
}

async function sendRecoveryEmail(url) {
  await transporter.sendMail({
    from: `"Heroku Uptime Monitor" <${process.env.EMAIL_USER}>`,
    to: "devUk9298@gmail.com",
    subject: `✅ App Recovered: ${url}`,
    html: `<h2>App Back Online</h2><p><b>URL:</b> ${url}</p>`,
  });
  console.log(`📧 Recovery email sent for ${url}`);
}

const lastStatus = {};
const lastEmailTime = {};
const EMAIL_INTERVAL = 1 * 60 * 1000;

async function checkUptime() {
  console.log(`[${new Date().toISOString()}] Checking uptime...`);
  for (const url of MONITORED_URLS) {
    try {
      const res = await axios.get(url, { timeout: 10000 });
      if (res.status === 200) {
        console.log(`✅ UP: ${url}`);
        if (lastStatus[url] === "DOWN") await sendRecoveryEmail(url);
        lastStatus[url] = "UP";
      }
    } catch (err) {
      console.error(`❌ ${url} is DOWN: ${err.message}`);
      const now = Date.now();
      if (!lastEmailTime[url] || now - lastEmailTime[url] > EMAIL_INTERVAL) {
        await sendFailureEmail(url, err.message);
        lastEmailTime[url] = now;
      }
      lastStatus[url] = "DOWN";
    }
  }
}

app.get("/", (req, res) => {
  res.send(
    "🚀 Heroku Uptime Monitor Web Alive — Cron job running in web dyno!"
  );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌍 Web server running on port ${PORT}`);
  console.log("🚀 Uptime monitoring cron job starting...");
  // Run initial check immediately
  checkUptime();
  // Schedule cron job to run every minute
  cron.schedule("*/10 * * * *", checkUptime);
  console.log("✅ Cron job scheduled to run every minute");
});
