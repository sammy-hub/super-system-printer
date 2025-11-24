const fetch = require("node-fetch");

module.exports = async (req, res) => {
  const { sub = "aww", sort = "hot", limit = "5" } = req.query || {};

  try {
    const url = `https://www.reddit.com/r/${encodeURIComponent(
      sub
    )}/${sort}.json?limit=${encodeURIComponent(limit)}`;

    const r = await fetch(url, {
      headers: {
        "User-Agent": "LittleThermalPrinter/1.0 (by u-yourname)"
      }
    });

    if (!r.ok) {
      console.error("Reddit HTTP error:", r.status);
      res.status(r.status).json({ error: "Reddit fetch failed" });
      return;
    }

    const data = await r.json();
    const items = (data.data && data.data.children || []).map(c => {
      const p = c.data;
      return {
        title: p.title,
        author: p.author,
        score: p.score,
        url: p.url_overridden_by_dest || p.url,
        permalink: "https://reddit.com" + p.permalink,
        is_self: p.is_self,
        selftext: p.selftext,
        created_utc: p.created_utc,
        over_18: p.over_18
      };
    });

    res.status(200).json({ subreddit: sub, items });
  } catch (err) {
    console.error("Reddit error:", err.message);
    res.status(500).json({ error: "Reddit error" });
  }
};
