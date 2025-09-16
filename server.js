import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fs from "fs-extra";

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = "./videos.json";

app.use(cors());
app.use(bodyParser.json());

// --------------------
// Helpers
// --------------------
const readVideos = async () => {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading videos.json:", err);
    return {};
  }
};

const writeVideos = async (videos) => {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(videos, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing videos.json:", err);
  }
};

// --------------------
// VIDEO ROUTES
// --------------------

// GET all videos (by category)
app.get("/api/videos", async (req, res) => {
  const videos = await readVideos();
  res.json(videos);
});


// GET all videos for a category
app.get("/api/videos/:category", async (req, res) => {
  const { category } = req.params;
  const videosData = await readVideos();

  console.log(`[GET] Serving videos for category "${category}"`);
  res.json(videosData[category] || { videos: [] });
});

// POST new video to a category
app.post("/api/videos/:category", async (req, res) => {
  const { category } = req.params;
  const { title, description, url, thumbnail } = req.body;

  console.log(`[POST] Incoming new video for "${category}":`, req.body);

  const videosData = await readVideos();

  if (!videosData[category]) {
    console.warn(`[POST] Category "${category}" not found in videos.json`);
    return res.status(404).json({ error: "Category does not exist" });
  }

  const newVideo = { title, description: description || "", url };
  if (thumbnail) newVideo.thumbnail = thumbnail;

  videosData[category].videos.push(newVideo);
  await writeVideos(videosData);

  console.log(`[POST] Updated videos.json after adding:`, JSON.stringify(videosData, null, 2));
  res.json({ ok: true, videos: videosData[category].videos });
});
// DELETE video by index
app.delete("/api/videos/:category/:index", async (req, res) => {
  const { category, index } = req.params;
  const videos = await readVideos();

  if (!videos[category] || !videos[category].videos[index]) {
    return res.status(404).json({ error: "Video not found" });
  }

  videos[category].videos.splice(index, 1);
  await writeVideos(videos);

  res.json({ ok: true, videos: videos[category].videos });
});

// --------------------
// CATEGORY ROUTES
// --------------------

// GET all categories
app.get("/api/categories", async (req, res) => {
  const videos = await readVideos();
  const categories = Object.keys(videos).map((cat) => ({
    name: cat,
    categoryThumbnail: videos[cat].categoryThumbnail || "",
  }));
  res.json(categories);
});

// CREATE new category
app.post("/api/categories", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Category name is required" });

  const videos = await readVideos();
  if (videos[name]) return res.status(400).json({ error: "Category already exists" });

  videos[name] = { categoryThumbnail: "", videos: [] };
  await writeVideos(videos);

  res.json({ ok: true, categories: Object.keys(videos) });
});

// PATCH category thumbnail
app.patch("/api/categories/:name/thumbnail", async (req, res) => {
  const { name } = req.params;
  const { thumbnail } = req.body;

  if (!thumbnail) return res.status(400).json({ error: "Thumbnail URL is required" });

  const videos = await readVideos();
  if (!videos[name]) return res.status(404).json({ error: "Category not found" });

  videos[name].categoryThumbnail = thumbnail;
  await writeVideos(videos);

  res.json({ ok: true, thumbnail });
});

// DELETE category
app.delete("/api/categories/:name", async (req, res) => {
  const { name } = req.params;
  const videos = await readVideos();

  if (!videos[name]) return res.status(404).json({ error: "Category not found" });

  delete videos[name];
  await writeVideos(videos);

  res.json({ ok: true, categories: Object.keys(videos) });
});

// --------------------
app.listen(PORT, () => {
  console.log(`YouTube service running on port ${PORT}`);
});