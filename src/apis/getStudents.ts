import { Router, Request, Response } from "express";
import Etudiant from "../models/students";

const router = Router();

router.post("/api/students", async (req: Request, res: Response) => {
  try {
    let { page, limit, ...query } = req.body;

    // Set default values if none are provided
    page = page || 1;
    limit = limit || 20;

    // Calculate the skipping number
    const skip = (page - 1) * limit;

    // Filter out empty string values
    Object.keys(query).forEach((key) => {
      if (query[key] === "") {
        delete query[key];
      }
    });

    // Query the database with pagination
    const students = await Etudiant.find(query).skip(skip).limit(limit);
    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).send(error);
  }
});

export default router;
