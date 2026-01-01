const express = require("express");
const axios = require("axios");
const cron = require("node-cron");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const app = express();

// URLs to monitor
const MONITORED_URLS = [
  "https://coworking-production-0f0eb9cd3ffa.herokuapp.com",
  "https://digitalbee-manager-e0678a88a0bb.herokuapp.com",
  "https://kids-read-0200f571e14c.herokuapp.com",
  "https://mqj-notification-cron-da8b18ca2577.herokuapp.com",
  "https://msj-production-63c5484c576d.herokuapp.com",
  "https://quran-journey-6099f24a05db.herokuapp.com",
  "https://salah-tracker-e5332bfa9837.herokuapp.com",
  "https://spaces-manager-production-20af1d9cf9d1.herokuapp.com",
  "https://academic-s3-39e259b9810d.herokuapp.com",
  "https://alif-kids-staging-423e69b228fa.herokuapp.com",
  "https://anf-dev-server-903cd9f18f9b.herokuapp.com",
  "https://anf-server-6ba38e970bcd.herokuapp.com",
  "https://dubai-hire-86ed9af4d0d7.herokuapp.com",
  "https://hifztracker-a022b026f23c.herokuapp.com",
  "https://mqj-dev-9e61eb3bc492.herokuapp.com",
  "https://mqj-staging-notification-cron-30cf306c6136.herokuapp.com",
  "https://quran-connect-eb76b6fd1de3.herokuapp.com",
  "https://quran-journey-staging-4e781e6719ce.herokuapp.com",
  "https://salah-tracker-dev-70afe4d97df5.herokuapp.com",
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
    // to: ["support@sidr.productions", "ibad@digitalbee.studio"],
    to: ["muk9298@gmail.com"],
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
