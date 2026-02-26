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

// Security: disable x-powered-by header
app.disable("x-powered-by");

// In-memory storage (Report objects)
const items = [];

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

// GET / - home (show report form)
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

// GET /report - show the report form (5pts)
app.get("/report", (req, res) => {
  res.render("reportform");
});

// POST /report - handle form submission
app.post("/report", (req, res) => {
  const form = new multiparty.Form({ uploadDir: UPLOAD_DIR });

  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).send("Error parsing form");
    }

    const name = fields.name?.[0]?.trim();
    const description = fields.description?.[0]?.trim();
    const location = fields.location?.[0]?.trim();
    const date = fields.date?.[0]?.trim();
    const contact = fields.contact?.[0]?.trim();
    const imageFile = files.image?.[0];

    // Validate that all fields are present
    if (!name || !description || !location || !date || !contact || !imageFile) {
      return res.status(400).send("All fields are required");
    }

    // Save the image - multiparty already saved to uploadDir
    const savedFilename = path.basename(imageFile.path);
    const imagePath = "/uploads/" + savedFilename;

    // Push new object to array with initial status of Lost (Report schema)
    const newItem = {
      id: String(Date.now()),
      name,
      description,
      location,
      date,
      contact,
      imagePath,
      status: "Lost",
    };

    items.push(newItem);
    res.redirect("/");
  });
});

app.get("/detail", (req, res) => {
  res.render("detail");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
