import { Router, Request, Response } from "express";
import Etudiant from "../models/students";
import { Status } from "../Interfaces/enums";
import { ApiResponse, IEtudiant } from "../Interfaces/Interface";
import { Document } from "mongoose";

const router = Router();

interface ApiResponseWithStudentsAndCount {
  status: Status;
  message: string;
  data: {
    students: (Document<unknown, {}, IEtudiant> &
      IEtudiant & { _id: string })[];
    totalCount: number;
  };
  errors?: string[];
}

router.post(
  "/api/students",
  async (
    req: Request,
    res: Response<ApiResponseWithStudentsAndCount | ApiResponse>
  ) => {
    try {
      let { page, limit, ...query } = req.body;
      let { sortingOrder } = req.query;
      // Set default values if none are provided
      page = page || 1;
      limit = limit || 20;
      sortingOrder = sortingOrder || "decreasing";

      // Calculate the skipping number
      const skip = (page - 1) * limit;

      // Filter out empty string values
      Object.keys(query).forEach((key) => {
        if (query[key] === "") {
          delete query[key];
        }
      });

      // Determine the sorting order
      const sortOrder = sortingOrder === "increasing" ? 1 : -1;

      // Execute queries in parallel for efficiency
      const [students, totalCount] = await Promise.all([
        Etudiant.find(query)
          .skip(skip)
          .limit(limit)
          .sort({ "ANNÉE DE DIPLOMATION": sortOrder }),
        Etudiant.countDocuments(query),
      ]);

      // Construct the success response
      const response: ApiResponseWithStudentsAndCount = {
        status: Status.success,
        message: "Étudiants récupérés avec succès.",
        data: {
          students, // Mongoose's `find` returns documents with the correct type
          totalCount,
        },
      };

      res.json(response);
    } catch (error: any) {
      console.error("Erreur lors de la récupération des étudiants :", error);

      // Construct the error response
      const response: ApiResponse = {
        status: Status.failure,
        message: "Échec de la récupération des étudiants.",
        errors: [error.message || "Une erreur inattendue est survenue."],
      };

      res.status(500).json(response);
    }
  }
);

export default router;
