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

// 產生頁面 HTML 字串（深色樣式，包含：標題、クレジット、作品紹介）
function buildPageHtml({ title, credits, intro, link1, link2, coverImageUrl }) {
  const safeTitle = String(title || "無標題");
  const safeIntro = String(intro || "");
  const safeCredits = String(credits || "");
  const safeLink1 = String(link1 || "");
  const safeLink2 = String(link2 || "");
  const safeCover = String(coverImageUrl || "");

  const linksHtml = [safeLink1, safeLink2]
    .filter(Boolean)
    .map((url) => `<a href="${url}" target="_blank" rel="noopener" class="sales-button">${url}</a>`) 
    .join("");

  const creditsHtml = safeCredits
    ? `<div class="credit-container">${safeCredits
        .split(/\r?\n/)
        .filter(Boolean)
        .map(line => `<div class="credit-item">${line}</div>`) 
        .join("")}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans JP', 'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', Arial, sans-serif; background-color: #121212; color: #E0E0E0; margin: 0; padding: 20px; }
    .background { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: url('${safeCover}') center/cover no-repeat; filter: blur(20px) opacity(0.25); z-index: -1; }
    .container { max-width: 560px; margin: auto; background: #1E1E1E; padding: 20px; border-radius: 10px; box-shadow: 0 0 15px rgba(255,255,255,0.1); }
    h2, h3 { color: #FFFFFF; margin: 16px 0; }
    a { color: #FFFFFF; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .cover { width: 100%; border-radius: 8px; }
    .sales-button { display: block; margin: 10px 0; padding: 10px 12px; background: #FFFFFF; color: #000; border-radius: 4px; text-align: center; }
    .credit-item { margin: 6px 0; }
    .intro { white-space: pre-wrap; }
    .footer { text-align: center; font-size: 12px; color: #888; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="background"></div>
  <div class="container">
    <h2>${safeTitle}</h2>
    ${safeCover ? `<img class="cover" src="${safeCover}" alt="cover" />` : ""}
    ${linksHtml ? `<h3>配信サイト</h3><div class="sales-buttons">${linksHtml}</div>` : ""}
    ${creditsHtml ? `<h3>クレジット</h3>${creditsHtml}` : ""}
    ${safeIntro ? `<h3>作品紹介</h3><div class="intro">${safeIntro}</div>` : ""}
    <div class="footer"><a href="/">トップへ戻る</a></div>
  </div>
</body>
</html>`;
}

// 建立頁面：POST /api/pages
app.post("/api/pages", (req, res) => {
  try {
    const { title, credits, intro, link1, link2, coverImageUrl } = req.body || {};
    if (!title) {
      return res.status(400).json({ error: "title 為必填" });
    }

    const timestamp = Date.now();
    const slugBase = String(title).trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, "-").replace(/^-+|-+$/g, "") || "page";
    const slug = `${slugBase}-${timestamp}`;
    const filename = `${slug}.html`;
    const filePath = path.join(PAGES_DIR, filename);

    const html = buildPageHtml({ title, credits, intro, link1, link2, coverImageUrl });
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