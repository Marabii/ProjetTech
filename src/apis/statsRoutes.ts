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
router.get("/nationality-distribution", async (req: Request, res: Response) => {
  try {
    const distribution = await Etudiant.aggregate([
      { $match: { Nationalité: { $exists: true, $ne: null } } },
      { $group: { _id: "$Nationalité", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // If no data is found
    if (!distribution || distribution.length === 0) {
      res.json({ error: "No nationality data available" });
      return;
    }

    res.json(distribution);
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

// Distribution by Filière (Field of Study)
router.get("/filiere-distribution", async (req: Request, res: Response) => {
  try {
    const distribution = await Etudiant.aggregate([
      { $match: { Filière: { $exists: true, $ne: null } } },
      { $group: { _id: "$Filière", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    if (!distribution || distribution.length === 0) {
      res.json({ error: "No filière data available" });
      return;
    }

    res.json(distribution);
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

// Internship by Country Distribution
router.get("/internship-by-country", async (req: Request, res: Response) => {
  try {
    const distribution = await Etudiant.aggregate([
      {
        $unwind: {
          path: "$CONVENTION DE STAGE",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $match: { "CONVENTION DE STAGE.Pays": { $exists: true, $ne: null } } },
      { $group: { _id: "$CONVENTION DE STAGE.Pays", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    if (!distribution || distribution.length === 0) {
      res.json({ error: "No internship country data available" });
      return;
    }

    res.json(distribution);
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

export default router;
