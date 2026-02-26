const express = require("express");
const { engine } = require("express-handlebars");
const path = require("path");
const fs = require("fs");
const multiparty = require("multiparty");
const hbs = require("hbs");

const app = express();
const PORT = 3000;

app.engine(
  "hbs",
  engine({
    defaultLayout: "main",
    extname: "hbs",
    layoutsDir: path.join(__dirname, "views/layouts"),
  }),
);

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.render("dashboard");
});

app.get("/detail", (req, res) => {
  res.status(200);
  res.render("detail");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
