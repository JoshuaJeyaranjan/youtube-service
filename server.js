import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fs from "fs-extra";

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = "./videos.json";

app.use(cors());
app.use(bodyParser.json());

// Helper: read JSON
const readVideos = async () => {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading videos.json:", err);
    return {};
  }
};

// Helper: write JSON
const writeVideos = async (videos) => {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(videos, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing videos.json:", err);
  }
};

/* --------------------
   VIDEO ROUTES
-------------------- */

// GET all videos (all categories)
app.get("/api/videos", async (req, res) => {
  const videos = await readVideos();
  res.json(videos);
});

// GET videos for a specific category
app.get("/api/videos/:category", async (req, res) => {
  const { category } = req.params;
  const videos = await readVideos();

  if (!videos[category]) {
    return res.status(404).json({ error: "Category not found" });
  }

  res.json(videos[category]);
});

// POST new video to category
app.post("/api/videos/:category", async (req, res) => {
  const { category } = req.params;
  const { title, description, url } = req.body;

  if (!title || !url) {
    return res.status(400).json({ error: "Title and URL are required" });
  }

  const videos = await readVideos();
  if (!videos[category]) videos[category] = [];

  videos[category].push({ title, description: description || "", url });
  await writeVideos(videos);

  res.json({ ok: true, videos: videos[category] });
});

// DELETE video by index
app.delete("/api/videos/:category/:index", async (req, res) => {
  const { category, index } = req.params;
  const videos = await readVideos();

  if (!videos[category] || !videos[category][index]) {
    return res.status(404).json({ error: "Video not found" });
  }

  videos[category].splice(index, 1);
  await writeVideos(videos);

  res.json({ ok: true, videos: videos[category] });
});

/* --------------------
   CATEGORY ROUTES
-------------------- */

// CREATE new category
app.post("/api/categories", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Category name is required" });

  const videos = await readVideos();
  if (videos[name]) {
    return res.status(400).json({ error: "Category already exists" });
  }

  videos[name] = [];
  await writeVideos(videos);

  res.json({ ok: true, categories: Object.keys(videos) });
});

// DELETE category
app.delete("/api/categories/:name", async (req, res) => {
  const { name } = req.params;
  const videos = await readVideos();

  if (!videos[name]) {
    return res.status(404).json({ error: "Category not found" });
  }

  delete videos[name];
  await writeVideos(videos);

  res.json({ ok: true, categories: Object.keys(videos) });
});

// GET all categories
app.get("/api/categories", async (req, res) => {
  const videos = await readVideos();
  res.json(Object.keys(videos));
});

/* -------------------- */

app.listen(PORT, () => {
  console.log(`YouTube service running on port ${PORT}`);
});