"use strict";
// routes/suggestions.ts
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
const students_1 = __importDefault(require("../models/students"));
const router = (0, express_1.Router)();
// Mapping of field names to their actual paths in the schema
const fieldMappings = {
    "Identifiant OP": "Identifiant OP",
    "Etablissement d'origine": "Etablissement d'origine",
    Filière: "Filière",
    Nationalité: "Nationalité",
    Nom: "Nom",
    Prénom: "Prénom",
    // Convention de Stage fields
    "CONVENTION DE STAGE.Entité principale - Identifiant OP": "CONVENTION DE STAGE.Entité principale - Identifiant OP",
    "CONVENTION DE STAGE.Date de début du stage": "CONVENTION DE STAGE.Date de début du stage",
    "CONVENTION DE STAGE.Date de fin du stage": "CONVENTION DE STAGE.Date de fin du stage",
    "CONVENTION DE STAGE.Stage Fonction occupée": "CONVENTION DE STAGE.Stage Fonction occupée",
    "CONVENTION DE STAGE.Nom Stage": "CONVENTION DE STAGE.Nom Stage",
    // Universite Visitant fields
    "UNIVERSITE visitant.Entité principale - Identifiant OP": "UNIVERSITE visitant.Entité principale - Identifiant OP",
    "UNIVERSITE visitant.Date de début mobilité": "UNIVERSITE visitant.Date de début mobilité",
    "UNIVERSITE visitant.Date de fin mobilité": "UNIVERSITE visitant.Date de fin mobilité",
    "UNIVERSITE visitant.Type Mobilité": "UNIVERSITE visitant.Type Mobilité",
    "UNIVERSITE visitant.Nom mobilité": "UNIVERSITE visitant.Nom mobilité",
};
const allowedFields = Object.keys(fieldMappings);
// GET /api/suggestions?field=FIELD_NAME&query=QUERY_STRING
router.get("/api/suggestions", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { field, query } = req.query;
    if (!field) {
        res.status(400).json({ error: "Field parameter is required" });
        return;
    }
    const decodedField = decodeURIComponent(field);
    if (!allowedFields.includes(decodedField)) {
        res.status(400).json({ error: "Invalid field" });
        return;
    }
    // Build the MongoDB regex query
    const regex = query ? new RegExp("^" + query, "i") : new RegExp("^", "i"); // Case-insensitive starts with 'query' or any string if query is undefined
    try {
        let suggestions = new Set();
        // Handle nested fields
        if (decodedField.includes(".")) {
            const [arrayField, subField] = decodedField.split(".");
            // Use aggregation to unwind the array and match
            const results = yield students_1.default.aggregate([
                { $unwind: `$${arrayField}` },
                { $match: { [`${arrayField}.${subField}`]: { $regex: regex } } },
                {
                    $group: {
                        _id: null,
                        values: { $addToSet: `$${arrayField}.${subField}` },
                    },
                },
                { $project: { _id: 0, values: 1 } },
                { $limit: 5 },
            ]);
            if (results.length > 0) {
                results[0].values.forEach((value) => suggestions.add(value));
            }
        }
        else {
            // Query the database, limited to 5 results
            const results = yield students_1.default.find({ [decodedField]: { $regex: regex } })
                .limit(5)
                .select(decodedField + " -_id");
            // Extract unique suggestions
            results.forEach((item) => {
                const value = item[decodedField];
                if (value) {
                    suggestions.add(value.toString());
                }
            });
        }
        res.json({ suggestions: Array.from(suggestions) });
        return;
    }
    catch (error) {
        console.error("Error fetching suggestions:", error);
        res.status(500).json({ error: "Server error" });
        return;
    }
}));
exports.default = router;
//# sourceMappingURL=getSuggestions.js.map