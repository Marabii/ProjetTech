// routes/suggestions.ts

import { Router, Request, Response } from "express";
import Etudiant from "../models/students";

const router = Router();

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
