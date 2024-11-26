// routes/suggestions.ts

import { Router, Request, Response } from "express";
import Etudiant from "../models/students";

const router = Router();

// Mapping of field names to their actual paths in the schema
const fieldMappings: { [key: string]: string } = {
  "Identifiant OP": "Identifiant OP",
  "Etablissement d'origine": "Etablissement d'origine",
  Filière: "Filière",
  Nationalité: "Nationalité",
  Nom: "Nom",
  Prénom: "Prénom",
  // Convention de Stage fields
  "CONVENTION DE STAGE.Entité principale - Identifiant OP":
    "CONVENTION DE STAGE.Entité principale - Identifiant OP",
  "CONVENTION DE STAGE.Date de début du stage":
    "CONVENTION DE STAGE.Date de début du stage",
  "CONVENTION DE STAGE.Date de fin du stage":
    "CONVENTION DE STAGE.Date de fin du stage",
  "CONVENTION DE STAGE.Stage Fonction occupée":
    "CONVENTION DE STAGE.Stage Fonction occupée",
  "CONVENTION DE STAGE.Nom Stage": "CONVENTION DE STAGE.Nom Stage",
  // Universite Visitant fields
  "UNIVERSITE visitant.Entité principale - Identifiant OP":
    "UNIVERSITE visitant.Entité principale - Identifiant OP",
  "UNIVERSITE visitant.Date de début mobilité":
    "UNIVERSITE visitant.Date de début mobilité",
  "UNIVERSITE visitant.Date de fin mobilité":
    "UNIVERSITE visitant.Date de fin mobilité",
  "UNIVERSITE visitant.Type Mobilité": "UNIVERSITE visitant.Type Mobilité",
  "UNIVERSITE visitant.Nom mobilité": "UNIVERSITE visitant.Nom mobilité",
};

const allowedFields = Object.keys(fieldMappings);

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
  const regex = query ? new RegExp("^" + query, "i") : new RegExp("^", "i"); // Case-insensitive starts with 'query' or any string if query is undefined

  try {
    let suggestions = new Set<string>();

    // Handle nested fields
    if (decodedField.includes(".")) {
      const [arrayField, subField] = decodedField.split(".");

      // Use aggregation to unwind the array and match
      const results = await Etudiant.aggregate([
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
        results[0].values.forEach((value: string) => suggestions.add(value));
      }
    } else {
      // Query the database, limited to 5 results
      const results = await Etudiant.find({ [decodedField]: { $regex: regex } })
        .limit(5)
        .select(decodedField + " -_id");

      // Extract unique suggestions
      results.forEach((item) => {
        const value = item[decodedField as keyof typeof item];
        if (value) {
          suggestions.add(value.toString());
        }
      });
    }

    res.json({ suggestions: Array.from(suggestions) });
    return;
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    res.status(500).json({ error: "Server error" });
    return;
  }
});

export default router;
