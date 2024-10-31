import { Router, Request, Response } from "express";
import Etudiant from "../models/students"; // Adjust the import according to your project structure

interface EtudiantData {
  etablissementOrigine: string;
  filiere: string;
  matriculeInterne: string;
  nationalite: string;
  nom: string;
  prenom: string;
  situationActuelle: string;
  defi?: string;
  a?: string;
  majeure?: string;
}

const router = Router();

router.post(
  "/api/students/create",
  async (req: Request<{}, {}, EtudiantData>, res: Response) => {
    try {
      const etudiantData = req.body;

      const newEtudiant = new Etudiant(etudiantData);
      await newEtudiant.save();

      res.status(201).json(newEtudiant);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

export default router;
