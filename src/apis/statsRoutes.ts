// backend/src/routes/statsRoutes.ts
import { Router, Request, Response } from "express";
import Etudiant from "../models/students";

const router = Router();

// Get total number of students
router.get("/total-students", async (req: Request, res: Response) => {
  try {
    const count = await Etudiant.countDocuments({});
    res.json({ count });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

// Distribution by Nationality
router.get(
  "/nationality-distribution",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { graduationYear } = req.query;

      // Build the match object with proper typing
      const matchObj: Record<string, any> = {
        Nationalité: { $exists: true, $ne: null },
      };

      if (graduationYear) {
        matchObj["ANNÉE DE DIPLOMATION"] = graduationYear;
      }

      // Perform the aggregation pipeline
      const distribution = await Etudiant.aggregate([
        { $match: matchObj },
        { $group: { _id: "$Nationalité", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      // Send the response
      res.json(distribution);
    } catch (error) {
      console.error("Error in /nationality-distribution:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Distribution by Filière (Field of Study)
router.get(
  "/filiere-distribution",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { graduationYear } = req.query;

      // Build the match object with proper typing
      const matchObj: Record<string, any> = {
        Filière: { $exists: true, $ne: null },
      };

      if (graduationYear) {
        matchObj["ANNÉE DE DIPLOMATION"] = graduationYear;
      }

      // Perform the aggregation pipeline
      const distribution = await Etudiant.aggregate([
        { $match: matchObj },
        { $group: { _id: "$Filière", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      // Send the response
      res.json(distribution);
    } catch (error) {
      console.error("Error in /filiere-distribution:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Internship by Country Distribution
router.get(
  "/internship-by-country",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { graduationYear } = req.query;

      // Build the match object with proper typing
      const matchObj: Record<string, any> = {
        "CONVENTION DE STAGE.Pays": { $exists: true, $ne: null },
      };

      if (graduationYear) {
        matchObj["ANNÉE DE DIPLOMATION"] = graduationYear;
      }

      // Perform the aggregation pipeline
      const distribution = await Etudiant.aggregate([
        {
          $unwind: {
            path: "$CONVENTION DE STAGE",
            preserveNullAndEmptyArrays: true,
          },
        },
        { $match: matchObj },
        { $group: { _id: "$CONVENTION DE STAGE.Pays", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      // Send the response
      res.json(distribution);
    } catch (error) {
      console.error("Error in /internship-by-country:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
