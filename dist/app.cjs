"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const port = process.env.PORT;
const Etudiant = require("./models/students");
const getStudents = require("./apis/getStudents");
// Create the Express application
const app = express();
// Configures the database and opens a global connection
require("./config/database");
const { connectDB } = require("./config/database");
connectDB();
app.use(cors({
    origin: process.env.FRONT_END,
    methods: ["POST", "PUT", "GET", "OPTIONS", "HEAD", "DELETE", "PATCH"],
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(getStudents);
// Create a new studen
app.post("/api/students/create", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const etudiantData = req.body;
        const newEtudiant = new Etudiant(etudiantData);
        yield newEtudiant.save();
        res.status(201).json(newEtudiant);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
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
app.get("/api/suggestions", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
            const results = yield Etudiant.aggregate(pipeline).exec();
            for (const arr of results.map((doc) => doc.values)) {
                arr.forEach((element) => suggestions.add(element));
            }
        }
        else {
            // Field is not inside an array
            const results = yield Etudiant.find({ [field]: regex })
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
    }
    catch (error) {
        console.error("Error fetching suggestions:", error);
        res.status(500).json({ error: "Server error" });
    }
}));
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
//# sourceMappingURL=app.cjs.map