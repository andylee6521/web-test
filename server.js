const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// 提供 public 資料夾的靜態檔案
app.use(express.static("public"));

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Render!" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});