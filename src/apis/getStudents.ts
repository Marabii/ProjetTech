import { Router, Request, Response } from "express";
import Etudiant from "../models/students";

const router = Router();

// API endpoint that handles all filters
router.post("/api/students", async (req: Request, res: Response) => {
  try {
    // Get the request body
    let query: Record<string, unknown> = req.body;

    // Filter out empty string values from the query
    Object.keys(query).forEach((key) => {
      if (query[key] === "") {
        delete query[key];
      }
    });

    // Query the database with the filtered query object
    const students = await Etudiant.find(query);
    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).send(error);
  }
});

export default router;
