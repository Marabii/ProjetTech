import Etudiant from "../models/students";
import {
  ConventionDeStage,
  FileProcessorResult,
  IEtudiant,
  SheetData,
  UniversiteVisitant,
} from "../Interfaces/Interface";

import { parseExcelDate } from "./parseExcelDate";

type RequiredSheet = {
  name: string;
  requiredColumns: string[];
};

const requiredSheets: RequiredSheet[] = [
  {
    name: "Entité principale",
    requiredColumns: [
      "Identifiant OP",
      "Etablissement d'origine",
      "Filière",
      "Nationalité",
      "Nom",
      "Prénom",
    ],
  },
  {
    name: "CONVENTION DE STAGE",
    requiredColumns: [
      "Entité principale - Identifiant OP",
      "Entité liée - Identifiant OP",
      "Entité liée - Date de début du stage",
      "Entité liée - Date de fin du stage",
      "Entité liée - Fonction occupée",
      "Entité liée - Nom",
    ],
  },
  {
    name: "UNIVERSITE visitant",
    requiredColumns: [
      "Entité principale - Identifiant OP",
      "Date de début",
      "Date de fin",
      "Type Mobilité",
      "Entité liée - Nom",
    ],
  },
];

export default async function processBddFile(
  bdd: SheetData,
  graduationYear: number
): Promise<FileProcessorResult> {
  const errors: string[] = [];
  const sheetDataMap: { [sheetName: string]: any[] } = {};

  // Étape 1 : Organiser les feuilles par nom
  bdd.forEach((sheetObj, index) => {
    const sheetNames = Object.keys(sheetObj);
    if (sheetNames.length !== 1) {
      errors.push(
        `La feuille à l'index ${index} doit avoir exactement un nom de feuille.`
      );
      return;
    }
    const sheetName = sheetNames[0];
    if (!requiredSheets.some((s) => s.name === sheetName)) {
      errors.push(
        `Nom de feuille inattendu "${sheetName}" à l'index ${index}.`
      );
      return;
    }
    if (sheetDataMap[sheetName]) {
      errors.push(`Nom de feuille en double "${sheetName}" trouvé.`);
      return;
    }
    sheetDataMap[sheetName] = sheetObj[sheetName];
  });

  // Étape 2 : Valider la présence des feuilles requises
  requiredSheets.forEach((requiredSheet) => {
    if (!sheetDataMap[requiredSheet.name]) {
      errors.push(`Feuille requise "${requiredSheet.name}" manquante.`);
    }
  });

  // Étape 3 : Valider les colonnes dans chaque feuille
  requiredSheets.forEach((sheet) => {
    const data = sheetDataMap[sheet.name];
    if (!data) return; // Passer si la feuille est manquante

    data.forEach((row, rowIndex) => {
      sheet.requiredColumns.forEach((col) => {
        if (!(col in row)) {
          errors.push(
            `Colonne "${col}" manquante dans la feuille "${
              sheet.name
            }" à la ligne ${rowIndex + 1}.`
          );
        }
      });
    });
  });

  // Étape 4 : Indexer "Entité principale" par "Identifiant OP"
  const entitePrincipaleData = sheetDataMap["Entité principale"] || [];
  const entitePrincipaleMap: { [identifiantOP: string]: IEtudiant } = {};

  entitePrincipaleData.forEach((row, index) => {
    const identifiantOP: string = row["Identifiant OP"];
    if (!identifiantOP) {
      errors.push(
        `"Identifiant OP" manquant dans "Entité principale" à la ligne ${
          index + 1
        }.`
      );
      return;
    }
    if (entitePrincipaleMap[identifiantOP]) {
      errors.push(
        `"Identifiant OP" en double "${identifiantOP}" dans "Entité principale" à la ligne ${
          index + 1
        }.`
      );
      return;
    }
    // Initialiser l'objet IEtudiant
    entitePrincipaleMap[identifiantOP] = {
      "Identifiant OP": identifiantOP,
      "Etablissement d'origine": row["Etablissement d'origine"],
      Filière: row["Filière"],
      Nationalité: row["Nationalité"],
      Nom: row["Nom"],
      Prénom: row["Prénom"],
      "ANNÉE DE DIPLOMATION": graduationYear,
    };
  });

  // Étape 5 : Traiter "CONVENTION DE STAGE"
  const conventionDeStage = sheetDataMap["CONVENTION DE STAGE"] || [];
  conventionDeStage.forEach((row, index) => {
    const identifiantOP: string = row["Entité principale - Identifiant OP"];
    if (!identifiantOP) {
      errors.push(
        `"Entité principale - Identifiant OP" manquant dans "CONVENTION DE STAGE" à la ligne ${
          index + 1
        }.`
      );
      return;
    }
    const entite = entitePrincipaleMap[identifiantOP];
    if (!entite) {
      errors.push(
        `Aucune "Entité principale" correspondante pour "Identifiant OP" "${identifiantOP}" dans "CONVENTION DE STAGE" à la ligne ${
          index + 1
        }.`
      );
      return;
    }

    // Appliquer parseExcelDate aux champs de date
    const dateDebutSerial = row["Entité liée - Date de début du stage"];
    const dateFinSerial = row["Entité liée - Date de fin du stage"];
    const dateDebut = parseExcelDate(dateDebutSerial);
    const dateFin = parseExcelDate(dateFinSerial);

    // Renommer les clés comme spécifié et assurer la conformité des types
    const renamedRow: ConventionDeStage = {
      "Entité principale - Identifiant OP": identifiantOP,
      "Date de début du stage": dateDebut,
      "Date de fin du stage": dateFin,
      "Stage Fonction occupée": row["Entité liée - Fonction occupée"],
      "Entité liée - Identifiant OP": row["Entité liée - Identifiant OP"],
      "Nom Stage": row["Entité liée - Nom"],
    };

    // Attacher à l'entité
    if (!entite["CONVENTION DE STAGE"]) {
      entite["CONVENTION DE STAGE"] = [];
    }
    entite["CONVENTION DE STAGE"]!.push(renamedRow);
  });

  // Étape 6 : Traiter "UNIVERSITE visitant"
  const universiteVisitant = sheetDataMap["UNIVERSITE visitant"] || [];
  universiteVisitant.forEach((row, index) => {
    const identifiantOP: string = row["Entité principale - Identifiant OP"];
    if (!identifiantOP) {
      errors.push(
        `"Entité principale - Identifiant OP" manquant dans "UNIVERSITE visitant" à la ligne ${
          index + 1
        }.`
      );
      return;
    }
    const entite = entitePrincipaleMap[identifiantOP];
    if (!entite) {
      errors.push(
        `Aucune "Entité principale" correspondante pour "Identifiant OP" "${identifiantOP}" dans "UNIVERSITE visitant" à la ligne ${
          index + 1
        }.`
      );
      return;
    }

    // Appliquer parseExcelDate aux champs de date
    const dateDebutMobilitySerial = row["Date de début"];
    const dateFinMobilitySerial = row["Date de fin"];
    const dateDebutMobility = parseExcelDate(dateDebutMobilitySerial);
    const dateFinMobility = parseExcelDate(dateFinMobilitySerial);

    // Renommer les clés comme spécifié et assurer la conformité des types
    const renamedRow: UniversiteVisitant = {
      "Entité principale - Identifiant OP": identifiantOP,
      "Date de début mobilité": dateDebutMobility,
      "Date de fin mobilité": dateFinMobility,
      "Type Mobilité": row["Type Mobilité"],
      "Nom mobilité": row["Entité liée - Nom"],
    };

    // Attacher à l'entité
    if (!entite["UNIVERSITE visitant"]) {
      entite["UNIVERSITE visitant"] = [];
    }
    entite["UNIVERSITE visitant"]!.push(renamedRow);
  });

  // Étape 7 : Préparer les données combinées
  const combinedData: IEtudiant[] = Object.values(entitePrincipaleMap);

  // Si des erreurs de traitement existent, les retourner
  if (errors.length > 0) {
    return { message: "Quelque chose s'est mal passé", errors };
  }

  if (combinedData.length === 0) {
    return {
      message: "Aucune donnée étudiante à traiter.",
      errors: [],
    };
  }

  // Préparer les opérations en masse
  const bulkOperations = combinedData.map((student: IEtudiant) => ({
    updateOne: {
      filter: { "Identifiant OP": student["Identifiant OP"] },
      update: { $set: student },
      upsert: true,
    },
  }));

  // Exécuter bulkWrite pour des opérations d'upsert efficaces
  const result = await Etudiant.bulkWrite(bulkOperations, {
    ordered: true, // Continuer le traitement même si certaines opérations échouent
  });

  return {
    message: `Résumé de l'écriture en masse : Correspondus : ${
      result.matchedCount
    }, Modifiés : ${result.modifiedCount}, Insérés : ${
      result.upsertedCount
    }, Écritures réussies totales : ${
      result.modifiedCount + result.upsertedCount
    }`,
    errors,
  };
}
