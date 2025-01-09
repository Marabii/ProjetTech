import { FileProcessorResult, IEtudiant } from "../Interfaces/Interface";
import Etudiant from "../models/students";
import type { SheetData } from "../Interfaces/Interface";

export async function processInternships(
  internships: SheetData
): Promise<FileProcessorResult> {
  const errors: string[] = [];
  let message: string = "";

  try {
    // Convertir le tableau des stages en une Map pour un accès plus facile
    const sheetsMap = new Map<string, any[]>();
    internships.forEach((sheetObj) => {
      for (const sheetName in sheetObj) {
        sheetsMap.set(sheetName, sheetObj[sheetName]);
      }
    });

    const entitePrincipaleData = sheetsMap.get("Entité principale");
    const entrepriseAccueilData = sheetsMap.get("ENTREPRISE D'ACCUEIL");

    if (!entitePrincipaleData || !entrepriseAccueilData) {
      throw new Error(
        "Feuilles requises manquantes dans les données des stages"
      );
    }

    // Collecter toutes les valeurs Identifiant OP des données d'entrée des stages
    const identifiantOPSet = new Set<string>();

    // Depuis 'Entité principale'
    for (const epRow of entitePrincipaleData) {
      const identifiantOP = epRow["Identifiant OP"];
      if (identifiantOP) {
        identifiantOPSet.add(identifiantOP);
      } else {
        errors.push(
          "Identifiant OP manquant dans la ligne de l'Entité principale."
        );
      }
    }

    if (identifiantOPSet.size === 0) {
      errors.push(
        "Aucune valeur Identifiant OP valide trouvée dans les données d'entrée."
      );
      message = "Traitement terminé avec des erreurs.";
      return { message, errors };
    }

    // Interroger la base de données une seule fois pour obtenir tous les documents Etudiant pertinents
    const identifiantOPArray = Array.from(identifiantOPSet);
    const etudiants = await Etudiant.find({
      "CONVENTION DE STAGE.Entité liée - Identifiant OP": {
        $in: identifiantOPArray,
      },
    });

    if (etudiants.length === 0) {
      errors.push(
        "Aucun Etudiant trouvé avec un Identifiant OP correspondant dans CONVENTION DE STAGE."
      );
      message = "Traitement terminé avec des erreurs.";
      return { message, errors };
    }

    // Construire une map de Identifiant OP vers les documents Etudiant
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

    // Traiter les données de 'Entité principale'
    for (const epRow of entitePrincipaleData) {
      const identifiantOP = String(epRow["Identifiant OP"]);
      const indemnitesDuStage = epRow["Indemnités du stage"];
      const duree = epRow["Durée"];

      const etudiant: IEtudiant = etudiantMap.get(identifiantOP);

      if (!etudiant) {
        errors.push(
          `Aucun Etudiant trouvé pour l'Identifiant OP : ${identifiantOP}`
        );
        continue;
      }

      let updated = false;
      if (etudiant["CONVENTION DE STAGE"]) {
        for (const convention of etudiant["CONVENTION DE STAGE"]) {
          if (convention["Entité liée - Identifiant OP"] === identifiantOP) {
            // Fusionner les données dans la convention
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
          `Aucune entrée CONVENTION DE STAGE correspondante trouvée dans Etudiant pour l'Identifiant OP de l'Entité liée : ${identifiantOP}`
        );
      }
    }

    // Traiter les données de 'ENTREPRISE D'ACCUEIL'
    for (const eaRow of entrepriseAccueilData) {
      const identifiantOP: string = String(
        eaRow["Entité principale - Identifiant OP"]
      );
      const codeSiret = eaRow["Entité liée - Code SIRET"];
      const pays = eaRow["Entité liée - Pays"];
      const ville = eaRow["Entité liée - Ville"];
      const villeHorsFrance = eaRow["Entité liée - Ville (Hors France)"];
      const internshipCompany = eaRow["Entité liée - Nom"];

      if (!identifiantOP) {
        // Déjà signalé Identifiant OP manquant
        continue;
      }

      const etudiant = etudiantMap.get(identifiantOP);

      if (!etudiant) {
        errors.push(
          `Aucun Etudiant trouvé pour l'Identifiant OP : ${identifiantOP}`
        );
        continue;
      }

      let updated = false;

      if (etudiant["CONVENTION DE STAGE"]) {
        for (const convention of etudiant["CONVENTION DE STAGE"]) {
          if (
            String(convention["Entité liée - Identifiant OP"]) === identifiantOP
          ) {
            // Retirer 'Entité liée - ' des noms de champs et fusionner les données
            if (codeSiret !== undefined) convention["Code SIRET"] = codeSiret;
            if (pays !== undefined) convention["Pays"] = pays;
            if (ville !== undefined) convention["Ville"] = ville;
            if (internshipCompany !== undefined)
              convention["ENTREPRISE DE STAGE"] = internshipCompany;
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
          `Aucune entrée CONVENTION DE STAGE correspondante trouvée dans Etudiant pour l'Identifiant OP de l'Entité liée : ${identifiantOP}`
        );
      }
    }

    // Préparer les opérations d'écriture en masse pour les Etudiants mis à jour
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
    // Exécuter l'écriture en masse
    if (bulkOps.length > 0) {
      await Etudiant.bulkWrite(bulkOps);
    }

    const updatedCount = updatedEtudiantIds.size;
    message = `Traitement terminé. ${updatedCount} étudiant(s) mis à jour.`;
  } catch (err) {
    errors.push(`Erreur : ${err.message}`);
  }

  return { message, errors };
}
