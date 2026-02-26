const express = require("express");
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
