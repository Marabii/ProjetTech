import mongoose, { Schema, Document, Model } from "mongoose";
import fs from "fs";
import path from "path";

interface IEtudiant extends Document {
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

const identiteSchema = new Schema<IEtudiant>({
  etablissementOrigine: { type: String, required: false },
  filiere: { type: String, required: false },
  matriculeInterne: { type: String, required: false },
  nationalite: { type: String, required: false },
  nom: { type: String, required: false },
  prenom: { type: String, required: false },
  situationActuelle: { type: String, required: false },
  defi: { type: String, required: false },
  a: { type: String, required: false },
  majeure: { type: String, required: false },
});

const Etudiant: Model<IEtudiant> = mongoose.model<IEtudiant>(
  "Etudiant",
  identiteSchema
);

export default Etudiant;
