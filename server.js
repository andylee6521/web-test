const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

// 中介層：解析 JSON 請求
app.use(express.json());

// 提供 public 資料夾的靜態檔案
app.use(express.static("public"));

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Render!" });
});

// 確保 public/pages 目錄存在
const PAGES_DIR = path.join(__dirname, "public", "pages");
if (!fs.existsSync(PAGES_DIR)) {
  fs.mkdirSync(PAGES_DIR, { recursive: true });
}

// 產生頁面 HTML 字串
function buildPageHtml({ title, content, link1, link2 }) {
  const safeTitle = String(title || "無標題");
  const safeContent = String(content || "");
  const safeLink1 = String(link1 || "");
  const safeLink2 = String(link2 || "");
  const linksHtml = [safeLink1, safeLink2]
    .filter(Boolean)
    .map((url, idx) => `<li><a href="${url}" target="_blank" rel="noopener noreferrer">連結${idx + 1}</a></li>`) 
    .join("");
  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 16px; line-height: 1.7; }
    h1 { margin: 0 0 16px; font-size: 28px; }
    .content { white-space: pre-wrap; }
    ul { padding-left: 20px; }
    a { color: #0d6efd; }
  </style>
  </head>
<body>
  <h1>${safeTitle}</h1>
  <div class="content">${safeContent}</div>
  ${linksHtml ? `<h3>相關連結</h3><ul>${linksHtml}</ul>` : ""}
  <p><a href="/">返回主頁</a></p>
</body>
</html>`;
}

// 建立頁面：POST /api/pages
app.post("/api/pages", (req, res) => {
  try {
    const { title, content, link1, link2 } = req.body || {};
    if (!title) {
      return res.status(400).json({ error: "title 為必填" });
    }

    const timestamp = Date.now();
    const slugBase = String(title).trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, "-").replace(/^-+|-+$/g, "") || "page";
    const slug = `${slugBase}-${timestamp}`;
    const filename = `${slug}.html`;
    const filePath = path.join(PAGES_DIR, filename);

    const html = buildPageHtml({ title, content, link1, link2 });
    fs.writeFileSync(filePath, html, "utf8");

    return res.status(201).json({ slug, filename, url: `/pages/${filename}` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "建立頁面失敗" });
  }
});

// 列出頁面：GET /api/pages
app.get("/api/pages", (req, res) => {
  try {
    const files = fs.readdirSync(PAGES_DIR)
      .filter(name => name.endsWith(".html"))
      .sort((a, b) => fs.statSync(path.join(PAGES_DIR, b)).mtimeMs - fs.statSync(path.join(PAGES_DIR, a)).mtimeMs);
    const items = files.map(name => ({ filename: name, url: `/pages/${name}` }));
    return res.json({ items });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "讀取列表失敗" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});