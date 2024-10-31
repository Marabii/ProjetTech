import { Router, Request, Response, NextFunction } from "express";
import Etudiant from "../models/students"; // Ensure this path correctly points to your models

const router = Router();

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
router.get(
  "/api/suggestions",
  async (req: Request, res: Response): Promise<any> => {
    const { field, query } = req.query as { field: string; query?: string };

    if (!field) {
      return res.status(400).json({ error: "Field parameter is required" });
    }

    if (!allowedFields.includes(field)) {
      return res.status(400).json({ error: "Invalid field" });
    }

    // Build the MongoDB regex query
    const regex = query ? new RegExp("^" + query, "i") : new RegExp("^", "i"); // Case-insensitive starts with 'query' or any string if query is undefined

    try {
      let suggestions = new Set<string>();

      // Query the database, limited to 5 results
      const results = await Etudiant.find({ [field]: { $regex: regex } })
        .limit(5) // Only take the first 5
        .select(field + " -_id"); // Select only the field and exclude the _id field

      // Extract unique suggestions
      results.forEach((item) => {
        const value = item[field as keyof typeof item]; // Correctly access the property using key type
        if (value) {
          suggestions.add(value.toString());
        }
      });

      res.json({ suggestions: Array.from(suggestions) });
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

export default router;
