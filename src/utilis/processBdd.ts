import {
  ConventionDeStage,
  IEtudiant,
  ProcessBddResult,
  SheetData,
  UniversiteVisitant,
} from "../Interfaces/Interface";

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

export default function processBddFile(bdd: SheetData): ProcessBddResult {
  const errors: string[] = [];
  const sheetDataMap: { [sheetName: string]: any[] } = {};

  // Step 1: Organize sheets by name
  bdd.forEach((sheetObj, index) => {
    const sheetNames = Object.keys(sheetObj);
    if (sheetNames.length !== 1) {
      errors.push(
        `Sheet at index ${index} should have exactly one sheet name.`
      );
      return;
    }
    const sheetName = sheetNames[0];
    if (!requiredSheets.some((s) => s.name === sheetName)) {
      errors.push(`Unexpected sheet name "${sheetName}" at index ${index}.`);
      return;
    }
    if (sheetDataMap[sheetName]) {
      errors.push(`Duplicate sheet name "${sheetName}" found.`);
      return;
    }
    sheetDataMap[sheetName] = sheetObj[sheetName];
  });

  // Step 2: Validate required sheets are present
  requiredSheets.forEach((requiredSheet) => {
    if (!sheetDataMap[requiredSheet.name]) {
      errors.push(`Missing required sheet "${requiredSheet.name}".`);
    }
  });

  // Step 3: Validate columns in each sheet
  requiredSheets.forEach((sheet) => {
    const data = sheetDataMap[sheet.name];
    if (!data) return; // Skip if sheet is missing

    data.forEach((row, rowIndex) => {
      sheet.requiredColumns.forEach((col) => {
        if (!(col in row)) {
          errors.push(
            `Missing column "${col}" in sheet "${sheet.name}" at row ${
              rowIndex + 1
            }.`
          );
        }
      });
    });
  });

  // Step 4: Index "Entité principale" by "Identifiant OP"
  const entitePrincipaleData = sheetDataMap["Entité principale"] || [];
  const entitePrincipaleMap: { [identifiantOP: string]: IEtudiant } = {};

  entitePrincipaleData.forEach((row, index) => {
    const identifiantOP: string = row["Identifiant OP"];
    if (!identifiantOP) {
      errors.push(
        `Missing "Identifiant OP" in "Entité principale" at row ${index + 1}.`
      );
      return;
    }
    if (entitePrincipaleMap[identifiantOP]) {
      errors.push(
        `Duplicate "Identifiant OP" "${identifiantOP}" in "Entité principale" at row ${
          index + 1
        }.`
      );
      return;
    }
    // Initialize the IEtudiant object
    entitePrincipaleMap[identifiantOP] = {
      "Identifiant OP": identifiantOP,
      "Etablissement d'origine": row["Etablissement d'origine"],
      Filière: row["Filière"],
      Nationalité: row["Nationalité"],
      Nom: row["Nom"],
      Prénom: row["Prénom"],
    };
  });

  // Step 5: Process "CONVENTION DE STAGE"
  const conventionDeStage = sheetDataMap["CONVENTION DE STAGE"] || [];
  conventionDeStage.forEach((row, index) => {
    const identifiantOP: string = row["Entité principale - Identifiant OP"];
    if (!identifiantOP) {
      errors.push(
        `Missing "Entité principale - Identifiant OP" in "CONVENTION DE STAGE" at row ${
          index + 1
        }.`
      );
      return;
    }
    const entite = entitePrincipaleMap[identifiantOP];
    if (!entite) {
      errors.push(
        `No matching "Entité principale" for "Identifiant OP" "${identifiantOP}" in "CONVENTION DE STAGE" at row ${
          index + 1
        }.`
      );
      return;
    }

    // Rename keys as specified and ensure type conformity
    const renamedRow: ConventionDeStage = {
      "Entité principale - Identifiant OP": identifiantOP,
      "Date de début du stage": row["Entité liée - Date de début du stage"],
      "Date de fin du stage": row["Entité liée - Date de fin du stage"],
      "Stage Fonction occupée": row["Entité liée - Fonction occupée"],
      "Nom Stage": row["Entité liée - Nom"],
    };

    // Attach to the entite
    if (!entite["CONVENTION DE STAGE"]) {
      entite["CONVENTION DE STAGE"] = [];
    }
    entite["CONVENTION DE STAGE"]!.push(renamedRow);
  });

  // Step 6: Process "UNIVERSITE visitant"
  const universiteVisitant = sheetDataMap["UNIVERSITE visitant"] || [];
  universiteVisitant.forEach((row, index) => {
    const identifiantOP: string = row["Entité principale - Identifiant OP"];
    if (!identifiantOP) {
      errors.push(
        `Missing "Entité principale - Identifiant OP" in "UNIVERSITE visitant" at row ${
          index + 1
        }.`
      );
      return;
    }
    const entite = entitePrincipaleMap[identifiantOP];
    if (!entite) {
      errors.push(
        `No matching "Entité principale" for "Identifiant OP" "${identifiantOP}" in "UNIVERSITE visitant" at row ${
          index + 1
        }.`
      );
      return;
    }

    // Rename keys as specified and ensure type conformity
    const renamedRow: UniversiteVisitant = {
      "Entité principale - Identifiant OP": identifiantOP,
      "Date de début mobilité": row["Date de début"],
      "Date de fin mobilité": row["Date de fin"],
      "Type Mobilité": row["Type Mobilité"],
      "Nom mobilité": row["Entité liée - Nom"],
    };

    // Attach to the entite
    if (!entite["UNIVERSITE visitant"]) {
      entite["UNIVERSITE visitant"] = [];
    }
    entite["UNIVERSITE visitant"]!.push(renamedRow);
  });

  // Step 7: Prepare the combined data
  const combinedData: IEtudiant[] = Object.values(entitePrincipaleMap);

  return { result: combinedData, errors };
}
