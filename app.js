const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.json({ msg: "hello" });
});

app.listen(3000, () => {
  console.log("listening on port 3000");
});
