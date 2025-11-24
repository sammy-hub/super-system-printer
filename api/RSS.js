const Parser = require("rss-parser");
const rssParser = new Parser();

module.exports = async (req, res) => {
  const { url } = req.query || {};

  if (!url) {
    res.status(400).json({ error: "Missing url query param" });
    return;
  }

  try {
    const feed = await rssParser.parseURL(url.toString());
    const items = (feed.items || []).slice(0, 5).map(item => ({
      title: item.title,
      link: item.link,
      date: item.isoDate || item.pubDate,
      contentSnippet: item.contentSnippet || ""
    }));
    res.status(200).json({ title: feed.title, items });
  } catch (err) {
    console.error("RSS error:", err.message);
    res.status(500).json({ error: "Failed to fetch RSS" });
  }
};
