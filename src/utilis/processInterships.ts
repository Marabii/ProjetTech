import { FileProcessorResult, IEtudiant } from "../Interfaces/Interface";
import Etudiant from "../models/students";

export type SheetData = Array<{ [sheetName: string]: any[] }>;

export async function processInternships(
  internships: SheetData
): Promise<FileProcessorResult> {
  const errors: string[] = [];
  let message: string = "";

  try {
    // Convert internships array into a Map for easier access
    const sheetsMap = new Map<string, any[]>();
    internships.forEach((sheetObj) => {
      for (const sheetName in sheetObj) {
        sheetsMap.set(sheetName, sheetObj[sheetName]);
      }
    });

    const entitePrincipaleData = sheetsMap.get("Entité principale");
    const entrepriseAccueilData = sheetsMap.get("ENTREPRISE D'ACCUEIL");

    if (!entitePrincipaleData || !entrepriseAccueilData) {
      throw new Error("Missing required sheets in internships data");
    }

    // Collect all Identifiant OP values from the internships input data
    const identifiantOPSet = new Set<string>();

    // From 'Entité principale'
    for (const epRow of entitePrincipaleData) {
      const identifiantOP = epRow["Identifiant OP"];
      if (identifiantOP) {
        identifiantOPSet.add(identifiantOP);
      } else {
        errors.push("Missing Identifiant OP in Entité principale row.");
      }
    }

    if (identifiantOPSet.size === 0) {
      errors.push("No valid Identifiant OP values found in input data.");
      message = "Processing complete with errors.";
      return { message, errors };
    }

    // Query the database once to get all relevant Etudiant documents
    const identifiantOPArray = Array.from(identifiantOPSet);
    const etudiants = await Etudiant.find({
      "CONVENTION DE STAGE.Entité liée - Identifiant OP": {
        $in: identifiantOPArray,
      },
    });

    if (etudiants.length === 0) {
      errors.push(
        "No Etudiant found with matching Entité liée - Identifiant OP in CONVENTION DE STAGE."
      );
      message = "Processing complete with errors.";
      return { message, errors };
    }

    // Build a mapping from Identifiant OP to Etudiant documents
    const etudiantMap = new Map<string, any>();

    for (const etudiant of etudiants) {
      if (etudiant["CONVENTION DE STAGE"]) {
        for (const convention of etudiant["CONVENTION DE STAGE"]) {
          const identifiantOP = convention["Entité liée - Identifiant OP"];
          if (identifiantOP) {
            etudiantMap.set(identifiantOP, etudiant);
          }
        }
      }
    }

    const updatedEtudiantIds = new Set<string>();

    // Process 'Entité principale' data
    for (const epRow of entitePrincipaleData) {
      const identifiantOP = String(epRow["Identifiant OP"]);
      const indemnitesDuStage = epRow["Indemnités du stage"];
      const duree = epRow["Durée"];

      const etudiant: IEtudiant = etudiantMap.get(identifiantOP);

      if (!etudiant) {
        errors.push(`No Etudiant found for Identifiant OP: ${identifiantOP}`);
        continue;
      }

      let updated = false;
      if (etudiant["CONVENTION DE STAGE"]) {
        for (const convention of etudiant["CONVENTION DE STAGE"]) {
          if (convention["Entité liée - Identifiant OP"] === identifiantOP) {
            // Merge data into the convention
            if (indemnitesDuStage !== undefined)
              convention["Indemnités du stage"] = indemnitesDuStage;
            if (duree !== undefined) convention["Durée"] = duree;
            updated = true;
            break;
          }
        }
      }

      if (updated) {
        updatedEtudiantIds.add(etudiant._id.toString());
      } else {
        errors.push(
          `No matching CONVENTION DE STAGE entry found in Etudiant for Entité liée - Identifiant OP: ${identifiantOP}`
        );
      }
    }

    // Process 'ENTREPRISE D'ACCUEIL' data
    for (const eaRow of entrepriseAccueilData) {
      const identifiantOP: string = String(
        eaRow["Entité principale - Identifiant OP"]
      );
      const codeSiret = eaRow["Entité liée - Code SIRET"];
      const pays = eaRow["Entité liée - Pays"];
      const ville = eaRow["Entité liée - Ville"];
      const villeHorsFrance = eaRow["Entité liée - Ville (Hors France)"];
      if (!identifiantOP) {
        // Already reported missing Identifiant OP
        continue;
      }

      const etudiant = etudiantMap.get(identifiantOP);

      if (!etudiant) {
        errors.push(`No Etudiant found for Identifiant OP: ${identifiantOP}`);
        continue;
      }

      let updated = false;

      if (etudiant["CONVENTION DE STAGE"]) {
        for (const convention of etudiant["CONVENTION DE STAGE"]) {
          if (
            String(convention["Entité liée - Identifiant OP"]) === identifiantOP
          ) {
            // Strip 'Entité liée - ' from field names and merge data
            if (codeSiret !== undefined) convention["Code SIRET"] = codeSiret;
            if (pays !== undefined) convention["Pays"] = pays;
            if (ville !== undefined) convention["Ville"] = ville;
            if (villeHorsFrance !== undefined)
              convention["Ville (Hors France)"] = villeHorsFrance;
            updated = true;
            break;
          }
        }
      }

      if (updated) {
        updatedEtudiantIds.add(etudiant._id.toString());
      } else {
        errors.push(
          `No matching CONVENTION DE STAGE entry found in Etudiant for Entité liée - Identifiant OP: ${identifiantOP}`
        );
      }
    }

    // Prepare bulk write operations for updated Etudiants
    const bulkOps = [];

    for (const etudiantId of updatedEtudiantIds) {
      const etudiant = etudiants.find((e) => e._id.toString() === etudiantId);
      if (etudiant) {
        bulkOps.push({
          updateOne: {
            filter: { _id: etudiant._id },
            update: { $set: etudiant },
          },
        });
      }
    }
    // Execute bulk update
    if (bulkOps.length > 0) {
      await Etudiant.bulkWrite(bulkOps);
    }

    const updatedCount = updatedEtudiantIds.size;
    message = `Processing complete. Updated ${updatedCount} student(s).`;
  } catch (err) {
    errors.push(`Error: ${err.message}`);
  }

  return { message, errors };
}
