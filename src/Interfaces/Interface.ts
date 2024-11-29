import { Status } from "./enums";

export interface ApiResponse {
  status: Status;
  message: string;
  errors?: string[];
}

export type SheetData = Array<{ [sheetName: string]: any[] }>;

export interface IEtudiant {
  _id: string;
  "Identifiant OP": string;
  "Etablissement d'origine": string;
  Filière: string;
  Nationalité: string;
  Nom: string;
  Prénom: string;
  "CONVENTION DE STAGE"?: ConventionDeStage[]; // Optional array
  "UNIVERSITE visitant"?: UniversiteVisitant[]; // Optional array
}

// interfaces/Etudiant.ts

export interface ConventionDeStage {
  "Entité principale - Identifiant OP": string;
  "Entité liée - Identifiant OP": string;
  "Date de début du stage"?: string;
  "Date de fin du stage"?: string;
  "Stage Fonction occupée"?: string;
  "Nom Stage"?: string;
  "Indemnités du stage"?: string;
  Durée?: string;
  "Code SIRET"?: string;
  Pays?: string;
  Ville?: string;
  "Ville (Hors France)"?: string;
}

export interface UniversiteVisitant {
  "Entité principale - Identifiant OP": string; // Retained for reference
  "Date de début mobilité": string; // Renamed from "Date de début"
  "Date de fin mobilité": string; // Renamed from "Date de fin"
  "Type Mobilité": string;
  "Nom mobilité": string; // Renamed from "Entité liée - Nom"
}

export interface FileProcessorResult {
  message: string;
  errors: string[];
}
