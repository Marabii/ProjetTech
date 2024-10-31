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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const students_1 = __importDefault(require("../models/students")); // Ensure this path correctly points to your models
const router = (0, express_1.Router)();
const allowedFields = [
    "etablissementOrigine",
    "filiere",
    "matriculeInterne",
    "nationalite",
    "nom",
    "prenom",
    "situationActuelle",
    "defi",
    "a",
    "majeure",
];
// GET /api/suggestions?field=FIELD_NAME&query=QUERY_STRING
router.get("/api/suggestions", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { field, query } = req.query;
    if (!field) {
        return res.status(400).json({ error: "Field parameter is required" });
    }
    if (!allowedFields.includes(field)) {
        return res.status(400).json({ error: "Invalid field" });
    }
    // Build the MongoDB regex query
    const regex = query ? new RegExp("^" + query, "i") : new RegExp("^", "i"); // Case-insensitive starts with 'query' or any string if query is undefined
    try {
        let suggestions = new Set();
        // Query the database, limited to 5 results
        const results = yield students_1.default.find({ [field]: { $regex: regex } })
            .limit(5) // Only take the first 5
            .select(field + " -_id"); // Select only the field and exclude the _id field
        // Extract unique suggestions
        results.forEach((item) => {
            const value = item[field]; // Correctly access the property using key type
            if (value) {
                suggestions.add(value.toString());
            }
        });
        res.json({ suggestions: Array.from(suggestions) });
    }
    catch (error) {
        console.error("Error fetching suggestions:", error);
        res.status(500).json({ error: "Server error" });
    }
}));
exports.default = router;
//# sourceMappingURL=getSuggestions.js.map