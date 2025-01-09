// routes/suggestions.ts

import { Router, Request, Response } from "express";
import Etudiant from "../models/students";

const router = Router();

// Corrected Mapping of field names to their actual paths in the schema
const fieldMappings: { [key: string]: string } = {
  // Common Search Fields
  "Identifiant OP": "Identifiant OP",
  "Etablissement d'origine": "Etablissement d'origine",
  "ANNÉE DE DIPLOMATION": "ANNÉE DE DIPLOMATION",
  Filière: "Filière",
  Nationalité: "Nationalité",
  Nom: "Nom",
  Prénom: "Prénom",

  // Convention de Stage fields
  "CONVENTION DE STAGE.Entité liée - Identifiant OP":
    "CONVENTION DE STAGE.Entité liée - Identifiant OP",
  "CONVENTION DE STAGE.Date de début du stage":
    "CONVENTION DE STAGE.Date de début du stage",
  "CONVENTION DE STAGE.Date de fin du stage":
    "CONVENTION DE STAGE.Date de fin du stage",
  "CONVENTION DE STAGE.Stage Fonction occupée":
    "CONVENTION DE STAGE.Stage Fonction occupée",
  "CONVENTION DE STAGE.Nom Stage": "CONVENTION DE STAGE.Nom Stage",
  "CONVENTION DE STAGE.Indemnités du stage":
    "CONVENTION DE STAGE.Indemnités du stage",
  "CONVENTION DE STAGE.Durée": "CONVENTION DE STAGE.Durée",
  "CONVENTION DE STAGE.Code SIRET": "CONVENTION DE STAGE.Code SIRET",
  "CONVENTION DE STAGE.Pays": "CONVENTION DE STAGE.Pays",
  "CONVENTION DE STAGE.Ville": "CONVENTION DE STAGE.Ville",
  "CONVENTION DE STAGE.Ville (Hors France)":
    "CONVENTION DE STAGE.Ville (Hors France)",

  // Universite Visitant fields
  "UNIVERSITE visitant.Date de début mobilité":
    "UNIVERSITE visitant.Date de début mobilité",
  "UNIVERSITE visitant.Date de fin mobilité":
    "UNIVERSITE visitant.Date de fin mobilité",
  "UNIVERSITE visitant.Type Mobilité": "UNIVERSITE visitant.Type Mobilité",
  "UNIVERSITE visitant.Nom mobilité": "UNIVERSITE visitant.Nom mobilité",

  // DéfiEtMajeure fields
  "DéfiEtMajeure.défi": "DéfiEtMajeure.défi",
  "DéfiEtMajeure.majeures.nom": "DéfiEtMajeure.majeures.nom",
};

// Extract allowed fields for validation
const allowedFields = Object.keys(fieldMappings);

// Fields that correspond to arrays in the schema (used to determine where to $unwind)
const arrayFields = [
  "CONVENTION DE STAGE",
  "UNIVERSITE visitant",
  "DéfiEtMajeure.majeures",
];

// GET /api/suggestions?field=FIELD_NAME&query=QUERY_STRING
router.get("/api/suggestions", async (req: Request, res: Response) => {
  const { field, query } = req.query as { field: string; query?: string };

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
  const regex = query ? new RegExp("^" + query, "i") : new RegExp("^", "i");

  try {
    let suggestions: string[] = [];

    // Check if field is nested
    const pathSegments = decodedField.split(".");
    // Example: "DéfiEtMajeure.majeures.nom" => ["DéfiEtMajeure", "majeures", "nom"]

    if (pathSegments.length > 1) {
      // Handle nested fields
      const pipeline: any[] = [];

      // For each level of nesting that corresponds to an array, we must unwind
      // We'll build partial paths and check if they match known arrays
      for (let i = 0; i < pathSegments.length - 1; i++) {
        const partialPath = pathSegments.slice(0, i + 1).join(".");
        if (arrayFields.includes(partialPath)) {
          pipeline.push({ $unwind: `$${partialPath}` });
        }
      }

      // Build the final match stage
      const finalField = pathSegments.join(".");
      pipeline.push({ $match: { [finalField]: { $regex: regex } } });
      pipeline.push({
        $group: {
          _id: null,
          values: { $addToSet: `$${finalField}` },
        },
      });
      pipeline.push({
        $project: {
          _id: 0,
          values: { $slice: ["$values", 5] },
        },
      });

      const results = await Etudiant.aggregate(pipeline);
      if (results.length > 0) {
        suggestions = results[0].values;
      }
    } else {
      // For non-nested fields, use aggregation to get distinct values with limit
      const results = await Etudiant.aggregate([
        { $match: { [decodedField]: { $regex: regex } } },
        { $group: { _id: `$${decodedField}` } },
        { $limit: 5 },
      ]);

      suggestions = results.map((item) => item._id).filter(Boolean) as string[];
    }

    res.json({ suggestions });
    return;
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    res.status(500).json({ error: "Server error" });
    return;
  }
});

export default router;
