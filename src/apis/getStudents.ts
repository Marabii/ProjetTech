// routes/students.ts

import { Router, Request, Response } from "express";
import Etudiant from "../models/students";
import { Status } from "../Interfaces/enums";
import { ApiResponse, ApiResponseWithData } from "../Interfaces/Interface";

const router = Router();

router.post(
  "/api/students",
  async (req: Request, res: Response<ApiResponse>) => {
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

      // Construct the success response
      const response: ApiResponseWithData<typeof students> = {
        status: Status.success,
        message: "Students fetched successfully.",
        data: students,
      };

      res.json(response);
    } catch (error: any) {
      console.error("Error fetching students:", error);

      // Construct the error response
      const response: ApiResponse = {
        status: Status.failure,
        message: "Failed to fetch students.",
        errors: [error.message || "An unexpected error occurred."],
      };

      res.status(500).json(response);
    }
  }
);

export default router;
