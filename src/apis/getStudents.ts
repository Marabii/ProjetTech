// routes/students.ts

import { Router, Request, Response } from "express";
import Etudiant from "../models/students";
import { Status } from "../Interfaces/enums";
import { ApiResponse } from "../Interfaces/Interface";

const router = Router();

router.post(
  "/api/students",
  async (req: Request, res: Response<ApiResponse<any>>) => {
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
          if (typeof query[key] === "object" && !Array.isArray(query[key])) {
            // Handle nested fields within objects
            const subQuery = query[key];
            mongoQuery[key] = { $elemMatch: subQuery };
          } else {
            // Direct fields
            mongoQuery[key] = query[key];
          }
        }
      }
      // Query the database with pagination
      const students = await Etudiant.find(mongoQuery).skip(skip).limit(limit);

      // Construct the success response
      const response: ApiResponse<typeof students> = {
        status: Status.success,
        message: "Students fetched successfully.",
        data: students,
      };

      res.json(response);
    } catch (error: any) {
      console.error("Error fetching students:", error);

      // Construct the error response
      const response: ApiResponse<null> = {
        status: Status.failure,
        message: "Failed to fetch students.",
        errors: [error.message || "An unexpected error occurred."],
        data: null,
      };

      res.status(500).json(response);
    }
  }
);

export default router;
