const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config();

app.get("/", (req, res) => {
  res.send("🚀 Heroku Uptime Monitor Web Alive — Cron runs in worker dyno!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌍 Web server running on port ${PORT}`));
