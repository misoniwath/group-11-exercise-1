const express = require("express");
const { engine } = require("express-handlebars");
const path = require("path");
const fs = require("fs");
const multiparty = require("multiparty");

const app = express();
const PORT = 3000;
const reports = [];
const uploadsDir = path.join(__dirname, "public", "uploads");
const ALLOWED_STATUSES = new Set(["Lost", "Found", "Closed"]);

fs.mkdirSync(uploadsDir, { recursive: true });

app.disable("x-powered-by");

app.engine(
  "hbs",
  engine({
    defaultLayout: "main",
    extname: ".hbs",
    layoutsDir: path.join(__dirname, "views", "layouts"),
    partialsDir: path.join(__dirname, "views", "partials"),
  }),
);

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const getFirst = (value) => (Array.isArray(value) ? value[0] : value);

app.get("/", (req, res) => {
  res.redirect("/dashboard");
});

app.get("/report", (req, res) => {
  res.render("report");
});

app.post("/report", (req, res) => {
  const form = new multiparty.Form({ uploadDir: uploadsDir });

  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.redirect("/report");
    }

    const name = getFirst(fields.name);
    const description = getFirst(fields.description);
    const location = getFirst(fields.location);
    const date = getFirst(fields.date);
    const contact = getFirst(fields.contact);
    const image = files && files.image ? files.image[0] : null;

    if (!name || !description || !location || !date || !contact || !image || !image.path) {
      if (image && image.path) {
        fs.unlink(image.path, () => {});
      }
      return res.redirect("/report");
    }

    const ext = path.extname(image.originalFilename || "") || ".jpg";
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const targetPath = path.join(uploadsDir, fileName);

    fs.rename(image.path, targetPath, (renameErr) => {
      if (renameErr) {
        fs.unlink(image.path, () => {});
        return res.redirect("/report");
      }

      reports.push({
        id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
        name,
        description,
        location,
        date,
        contact,
        imagePath: `/uploads/${fileName}`,
        status: "Lost",
      });

      return res.redirect("/dashboard");
    });
  });
});

app.get("/dashboard", (req, res) => {
  res.render("dashboard", { reports });
});

app.get("/items", (req, res) => {
  res.render("items", { reports });
});

app.get("/items/:id", (req, res) => {
  const report = reports.find((item) => item.id === req.params.id);

  if (!report) {
    return res.status(404).send("Report not found");
  }

  return res.render("detail", { report });
});

app.post("/items/:id/status", (req, res) => {
  const report = reports.find((item) => item.id === req.params.id);
  if (!report) {
    return res.status(404).send("Report not found");
  }

  if (ALLOWED_STATUSES.has(req.body.status)) {
    report.status = req.body.status;
  }

  return res.redirect(`/items/${report.id}`);
});

app.post("/items/:id/delete", (req, res) => {
  const index = reports.findIndex((item) => item.id === req.params.id);

  if (index !== -1) {
    reports.splice(index, 1);
  }

  return res.redirect("/dashboard");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
