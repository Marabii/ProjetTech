// routes/postStudentData.ts

import { Router, Request, Response } from "express";
import {
  ApiResponse,
  ProcessBddResult,
  SheetData,
  IEtudiant,
} from "../Interfaces/Interface";
import { Status } from "../Interfaces/enums";
import Etudiant from "../models/students";
import processBddFile from "../utilis/processBdd"; // Ensure the correct path

const router = Router();

/**
 * POST /api/server/postStudentData
 * Endpoint to process and save student data.
 */
router.post(
  "/api/server/postStudentData",
  async (req: Request, res: Response) => {
    const { type } = req.query;
    const data = req.body;

    switch (type) {
      case "bdd":
        try {
          // Process the incoming data
          const { result, errors }: ProcessBddResult = processBddFile(
            data as SheetData
          );

          // If there are processing errors, return them
          if (errors.length > 0) {
            res.status(400).json({ status: Status.failure, errors });
            return;
          }

          if (result.length === 0) {
            res.status(200).json({
              status: Status.success,
              message: "No student data to process.",
            } as ApiResponse);
            return;
          }

          // Prepare bulk operations
          const bulkOperations = result.map((student: IEtudiant) => ({
            updateOne: {
              filter: { "Identifiant OP": student["Identifiant OP"] },
              update: { $set: student },
              upsert: true,
            },
          }));

          // Execute bulkWrite for efficient upsert operations
          await Etudiant.bulkWrite(bulkOperations, {
            ordered: true, // Continue processing even if some operations fail
          });

          // Optionally, you can provide more detailed feedback based on bulkWriteResult
          res.status(200).json({
            status: Status.success,
          } as ApiResponse);
          return;
        } catch (error: unknown) {
          // Handle any unexpected errors during processing or database operations
          if (error instanceof Error) {
            res
              .status(500)
              .json({ status: Status.failure, errors: [error.message] });
            return;
          } else {
            res.status(500).json({
              status: Status.failure,
              errors: ["An unknown error occurred."],
            } as ApiResponse);
            return;
          }
        }

      default:
        // Handle unsupported 'type' values
        res.status(400).json({
          status: Status.failure,
          errors: ["Unsupported type parameter."],
        } as ApiResponse);
        return;
    }
  }
);

export default router;
