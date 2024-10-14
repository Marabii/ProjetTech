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
app.post("/api/students", async (req, res) => {
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

// Create a new student
app.post("/api/students/create", async (req, res) => {
  try {
    const etudiantData = req.body;

    const newEtudiant = new Etudiant(etudiantData);
    await newEtudiant.save();

    res.status(201).json(newEtudiant);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const allowedFields = [
  "nom",
  "prenom",
  "mail",
  "Parcours.type_de_bac",
  "Parcours.filiere_d_origine",
  "Parcours.prepa_d_origine",
  "Parcours.autre_parcours_diplomant.pays",
  "Parcours.stages.nom_d_entreprise",
  "Parcours.stages.poste",
  "Parcours.diplomes.nom",
  "Parcours.electifs.etablissement_electif",
  "Parcours.electifs.type_electif",
  // Add other fields as needed
];

// Helper function to determine if a field is inside an array
function isArrayField(field) {
  const arrayFields = [
    "Parcours.stages",
    "Parcours.diplomes",
    "Parcours.electifs",
    // Add other array fields here
  ];

  return arrayFields.some((arrayField) => field.startsWith(arrayField + "."));
}

function getNestedValue(obj, path) {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
}

// GET /api/suggestions?field=FIELD_NAME&query=QUERY_STRING
app.get("/api/suggestions", async (req, res) => {
  const { field, query } = req.query;

  if (!field || !query) {
    return res
      .status(400)
      .json({ error: "Field and query parameters are required" });
  }

  if (!allowedFields.includes(field)) {
    return res.status(400).json({ error: "Invalid field" });
  }

  // Build the MongoDB regex query
  const regex = new RegExp("^" + query, "i"); // Case-insensitive starts with 'query'

  try {
    let suggestions = new Set();

    if (isArrayField(field)) {
      // Field is inside an array
      const [arrayField, ...rest] = field.split(".");
      const nestedField = rest.join(".");

      // Build the aggregation pipeline
      const pipeline = [
        { $unwind: "$" + arrayField },
        { $match: { [field]: regex } },
        { $group: { _id: null, values: { $addToSet: "$" + field } } },
        { $project: { _id: 0, values: 1 } },
        { $unwind: "$values" },
        { $limit: 10 },
      ];

      const results = await Etudiant.aggregate(pipeline).exec();

      for (const arr of results.map((doc) => doc.values)) {
        arr.forEach((element) => suggestions.add(element));
      }
    } else {
      // Field is not inside an array
      const results = await Etudiant.find({ [field]: regex })
        .limit(10)
        .select(field);

      // Extract unique suggestions
      results.forEach((item) => {
        const value = getNestedValue(item._doc, field);
        if (value) {
          suggestions.add(value);
        }
      });
    }
    res.json({ suggestions: Array.from(suggestions) });
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
