import { Status } from "./enums";

export interface ApiResponseWithData<T> {
  status: Status;
  message: string;
  errors?: string[];
  data: T;
}

export interface ApiResponse {
  status: Status;
  message: string;
  errors?: string[];
}

export type SheetData = Array<{ [sheetName: string]: any[] }>;

export interface IEtudiant {
  _id?: string;
  "Identifiant OP": string;
  "Etablissement d'origine"?: string;
  Filière?: string;
  Nationalité?: string;
  Nom?: string;
  Prénom?: string;
  "ANNÉE DE DIPLOMATION": number;
  "CONVENTION DE STAGE"?: ConventionDeStage[]; // Optional array
  "UNIVERSITE visitant"?: UniversiteVisitant[]; // Optional array
  DéfiEtMajeure?: DéfiEtMajeure; // Optional field
}

/**
 * Represents a Convention de Stage.
 */
export interface ConventionDeStage {
  "Entité principale - Identifiant OP": string;
  "Entité liée - Identifiant OP": string;
  "Date de début du stage"?: Date;
  "Date de fin du stage"?: Date;
  "Stage Fonction occupée"?: string;
  "Nom Stage"?: string;
  "Indemnités du stage"?: string;
  Durée?: string;
  "Code SIRET"?: string;
  Pays?: string;
  Ville?: string;
  "Ville (Hors France)"?: string;
}

/**
 * Represents a Université Visitant.
 */
export interface UniversiteVisitant {
  "Entité principale - Identifiant OP": string;
  "Date de début mobilité"?: Date;
  "Date de fin mobilité"?: Date;
  "Type Mobilité"?: string;
  "Nom mobilité"?: string;
}

/**
 * Represents a Majeure.
 */
export interface Majeure {
  nom: string;
  promo: string;
}

/**
 * Represents DéfiEtMajeure.
 */
export interface DéfiEtMajeure {
  défi: string;
  majeures: Majeure[];
}

export interface FileProcessorResult {
  message: string;
  errors: string[];
}
