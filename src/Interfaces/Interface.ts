import { Status } from "./enums";

export interface ApiResponse {
  status: Status;
  errors?: string[];
}

export type SheetData = Array<{ [sheetName: string]: any[] }>;

export interface IEtudiant {
  "Identifiant OP": string;
  "Etablissement d'origine": string;
  Filière: string;
  Nationalité: string;
  Nom: string;
  Prénom: string;
  "CONVENTION DE STAGE"?: ConventionDeStage[]; // Optional array
  "UNIVERSITE visitant"?: UniversiteVisitant[]; // Optional array
}

export interface ConventionDeStage {
  "Entité principale - Identifiant OP": string; // Retained for reference
  "Date de début du stage": string;
  "Date de fin du stage": string;
  "Stage Fonction occupée": string; // Renamed from "Entité liée - Fonction occupée"
  "Nom Stage": string; // Renamed from "Entité liée - Nom"
}

export interface UniversiteVisitant {
  "Entité principale - Identifiant OP": string; // Retained for reference
  "Date de début mobilité": string; // Renamed from "Date de début"
  "Date de fin mobilité": string; // Renamed from "Date de fin"
  "Type Mobilité": string;
  "Nom mobilité": string; // Renamed from "Entité liée - Nom"
}

export interface ProcessBddResult {
  result: IEtudiant[];
  errors: string[];
}
