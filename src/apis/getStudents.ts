// routes/students.ts

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

    // Build the MongoDB query
    const mongoQuery: any = {};

    // Process each field in the query
    for (const key in query) {
      if (query[key] !== undefined && query[key] !== null) {
        if (typeof query[key] === "object") {
          // Handle nested fields within arrays
          const arrayField = key;
          const subQuery = query[key];
          const subMongoQuery: any = {};

          Object.keys(subQuery).forEach((subKey) => {
            subMongoQuery[subKey] = subQuery[subKey];
          });

          mongoQuery[arrayField] = { $elemMatch: subMongoQuery };
        } else {
          // Direct fields
          mongoQuery[key] = query[key];
        }
      }
    }

    // Query the database with pagination
    const students = await Etudiant.find(mongoQuery).skip(skip).limit(limit);
    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).send(error);
  }
});

export default router;
