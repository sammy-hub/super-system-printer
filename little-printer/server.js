// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import Parser from "rss-parser";

const app = express();
const rssParser = new Parser();

// Let your frontend origin hit this
app.use(cors({
  origin: [
    "http://localhost:4173",   // dev
    "https://your-domain.com"  // prod
  ]
}));

// ---- RSS proxy ----
app.get("/api/rss", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "Missing url" });

  try {
    const feed = await rssParser.parseURL(url.toString());
    // send first few items, stripped down
    const items = (feed.items || []).slice(0, 5).map(item => ({
      title: item.title,
      link: item.link,
      date: item.isoDate || item.pubDate,
      contentSnippet: item.contentSnippet || ""
    }));
    res.json({ title: feed.title, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch RSS" });
  }
});

// ---- Reddit proxy ----
// Example: /api/reddit?sub=aww
app.get("/api/reddit", async (req, res) => {
  const sub = req.query.sub || "aww";
  const limit = parseInt(req.query.limit || "5", 10);
  const sort = req.query.sort || "hot"; // hot/top/new

  try {
    const url = `https://www.reddit.com/r/${encodeURIComponent(sub)}/${sort}.json?limit=${limit}`;
    const r = await fetch(url, {
      headers: {
        "User-Agent": "LittleThermalPrinter/1.0 (by u-yourname)"
      }
    });

    if (!r.ok) {
      return res.status(r.status).json({ error: "Reddit fetch failed" });
    }

    const data = await r.json();
    const items = data.data.children.map(c => {
      const p = c.data;
      return {
        title: p.title,
        author: p.author,
        score: p.score,
        url: p.url_overridden_by_dest || p.url,
        permalink: "https://reddit.com" + p.permalink,
        is_self: p.is_self,
        selftext: p.selftext,
        created_utc: p.created_utc
      };
    });

    res.json({ subreddit: sub, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Reddit error" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Little Printer proxy on " + port);
});
