require("dotenv").config();
const express = require("express");
const cors = require("cors");
const port = process.env.PORT;
const Etudiant = require("./models/students");

// Create the Express application
const app = express();

// Configures the database and opens a global connection
require("./config/database");
const { connectDB } = require("./config/database");
connectDB();

app.use(
  cors({
    origin: process.env.FRONT_END,
    methods: ["POST", "PUT", "GET", "OPTIONS", "HEAD", "DELETE", "PATCH"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Function to process the query and convert date strings to Date objects
function processQuery(obj) {
  if (Array.isArray(obj)) {
    obj.forEach(processQuery);
  } else if (typeof obj === "object" && obj !== null) {
    for (const key in obj) {
      if (typeof obj[key] === "object" && obj[key] !== null) {
        processQuery(obj[key]);
      } else {
        // Try to parse date strings into Date objects
        const date = new Date(obj[key]);
        if (!isNaN(date) && typeof obj[key] === "string") {
          obj[key] = date;
        }
      }
    }
  }
}

// API endpoint that handles all filters
app.post("/students", async (req, res) => {
  try {
    let query = req.body;
    console.log("Initial Query:", query);

    // Process the query to convert date strings to Date objects
    processQuery(query);

    console.log("Processed Query:", query);
    const students = await Etudiant.find(query);
    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).send(error);
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
