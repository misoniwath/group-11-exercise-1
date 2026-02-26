const express = require("express");
const { engine } = require("express-handlebars");
const path = require("path");
const fs = require("fs");
const multiparty = require("multiparty");

const app = express();
const PORT = 3000;
const items = [
  {
    id: `item-${Date.now()}`,
    name: "Blue Wallet",
    description: "Leather wallet with student ID",
    location: "Library Hall B",
    date: "2023-10-25",
    contact: "student@univ.edu",
    imagePath: "/uploads/filename.jpg",
    status: "Lost",
  },
  {
    id: "item-2",
    name: "Silver Watch",
    description: "Metal band, small scratch on clasp",
    location: "Gym Locker Room",
    date: "2023-10-27",
    contact: "staff@univ.edu",
    imagePath: "/uploads/watch.jpg",
    status: "Found",
  },
];

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

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// GET / - home (show report form)
app.get("/", (req, res) => {
  res.render("dashboard", { items });
});

app.get("/items/:id", (req, res) => {
  const item = items.find((entry) => entry.id === req.params.id);

  if (!item) {
    res.status(404).send("Item not found");
    return;
  }

  res.render("detail", { item });
});

app.post("/items", (req, res) => {
  const form = new multiparty.Form({
    uploadDir: path.join(__dirname, "uploads"),
  });

  form.parse(req, (err, fields, files) => {
    if (err) {
      res.status(500).send("Error processing form");
      return;
    }

    const newItem = {
      id: `item-${Date.now()}`,
      name: fields.name[0],
      description: fields.description[0],
      location: fields.location[0],
      date: fields.date[0],
      contact: fields.contact[0],
      imagePath: files.image
        ? `/uploads/${path.basename(files.image[0].path)}`
        : null,
      status: "Lost",
    };

    items.push(newItem);
    res.redirect("/");
  });
});

app.post("/items/:id/status", (req, res) => {
  const item = items.find((entry) => entry.id === req.params.id);

  if (!item) {
    res.status(404).send("Item not found");
    return;
  }

  const { status } = req.body;
  if (["Lost", "Found", "Closed"].includes(status)) {
    item.status = status;
  }

  res.redirect(`/items/${item.id}`);
});

app.post("/items/:id/delete", (req, res) => {
  const index = items.findIndex((entry) => entry.id === req.params.id);

  if (index === -1) {
    res.status(404).send("Item not found");
    return;
  }

  items.splice(index, 1);
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
