// routes/postStudentData.ts

import { Router, Request, Response } from "express";
import {
  ApiResponse,
  SheetData,
  FileProcessorResult,
} from "../Interfaces/Interface";
import { Status } from "../Interfaces/enums";
import processBddFile from "../utilis/processBdd";
import { processInternships } from "../utilis/processInterships";

const router = Router();

/**
 * Utility function to handle error responses
 */
const handleErrorResponse = (
  res: Response,
  statusCode: number,
  message: string,
  errors: string[] = []
) => {
  res.status(statusCode).json({
    status: Status.failure,
    message,
    errors,
  } as ApiResponse);
};

/**
 * Handler for processing 'bdd' type data
 */
const handleBdd = async (data: SheetData, res: Response) => {
  try {
    const result: FileProcessorResult = await processBddFile(data);
    res.status(200).json({
      status: Status.success,
      message: result.message,
      errors: result.errors,
    } as ApiResponse);
  } catch (error: unknown) {
    if (error instanceof Error) {
      handleErrorResponse(res, 400, error.message, []);
    } else {
      handleErrorResponse(res, 500, "An unknown error occurred.", []);
    }
  }
};

/**
 * Handler for processing 'stages' type data
 */
const handleInternships = async (data: SheetData, res: Response) => {
  try {
    const result: FileProcessorResult = await processInternships(data);
    res.status(200).json({
      status: Status.success,
      message: result.message,
      errors: result.errors,
    } as ApiResponse);
  } catch (error: unknown) {
    if (error instanceof Error) {
      handleErrorResponse(res, 400, error.message, []);
    } else {
      handleErrorResponse(res, 500, "An unknown error occurred.", []);
    }
  }
};

/**
 * Main route handler for posting student data
 */
router.post(
  "/api/server/postStudentData",
  async (req: Request, res: Response) => {
    const { type } = req.query;
    const data = req.body as SheetData;

    if (!type || typeof type !== "string") {
      return handleErrorResponse(res, 400, "Type parameter is required.");
    }

    switch (type.toLowerCase()) {
      case "bdd":
        await handleBdd(data, res);
        break;
      case "stages":
        await handleInternships(data, res);
        break;
      default:
        handleErrorResponse(res, 400, "Unsupported type parameter.", [
          "Supported types are 'bdd' and 'stages'.",
        ]);
        break;
    }
  }
);

export default router;
