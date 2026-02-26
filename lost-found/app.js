const express = require("express");
const { engine } = require("express-handlebars");
const path = require("path");
const fs = require("fs");
const multiparty = require("multiparty");

const app = express();
const PORT = 3000;
const UPLOAD_DIR = path.join(__dirname, "public", "uploads");

// Security: disable x-powered-by header
app.disable("x-powered-by");

// In-memory storage (Report objects)
const items = [];

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

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
app.use(express.static(path.join(__dirname, "public")));

// GET / - home (show report form)
app.get("/", (req, res) => {
  res.render("reportform");
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
