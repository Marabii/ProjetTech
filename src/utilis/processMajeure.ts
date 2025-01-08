// models/students.ts
import Etudiant from "../models/students";
import {
  FileProcessorResult,
  SheetData,
  IEtudiant,
} from "../Interfaces/Interface";

/**
 * Traite les données de la feuille "Alpha" pour mettre à jour les informations "Majeure" des étudiants.
 *
 * @param data - Les données de la feuille entrante contenant la feuille "Alpha".
 * @returns Une promesse qui résout un FileProcessorResult indiquant le résultat.
 */
export default async function processMajeure(
  data: SheetData
): Promise<FileProcessorResult> {
  const errors: string[] = [];
  let modifiedCount = 0;

  // Étape 1 : Valider la structure des données entrantes
  if (data.length !== 1) {
    errors.push(
      "Les données d'entrée doivent contenir exactement un objet de feuille."
    );
  }

  const sheetObj = data[0];

  if (!sheetObj.hasOwnProperty("Alpha")) {
    errors.push('Feuille "Alpha" manquante dans les données d\'entrée.');
  }

  const alphaData = sheetObj["Alpha"];

  if (!Array.isArray(alphaData)) {
    errors.push('La feuille "Alpha" doit être un tableau d\'objets.');
  } else {
    alphaData.forEach((row, index) => {
      const requiredFields = ["Prénom", "Nom", "A", "Majeure"];
      requiredFields.forEach((field) => {
        if (!(field in row)) {
          errors.push(
            `La ligne ${
              index + 1
            } dans la feuille "Alpha" est manquante le champ "${field}".`
          );
        }
      });

      // Des vérifications de type supplémentaires peuvent être ajoutées ici si nécessaire
      if (
        typeof row["Prénom"] !== "string" ||
        typeof row["Nom"] !== "string" ||
        typeof row["A"] !== "string" ||
        typeof row["Majeure"] !== "string"
      ) {
        errors.push(
          `La ligne ${
            index + 1
          } dans la feuille "Alpha" a des types de données invalides pour un ou plusieurs champs.`
        );
      }
    });
  }

  // Si des erreurs de validation critiques existent, retourner immédiatement
  if (errors.length > 0) {
    return {
      message: "La validation a échoué avec des erreurs.",
      errors,
    };
  }

  // Étape 2 : Extraire les paires uniques "Prénom Nom" des données entrantes
  const namePairs = new Set<string>();

  alphaData.forEach((row) => {
    const firstName = row["Prénom"];
    const lastName = row["Nom"];

    if (firstName && lastName) {
      const key = `${firstName.trim()} ${lastName.trim()}`;
      namePairs.add(key);
    }
  });

  const namePairsArray = Array.from(namePairs);

  if (namePairsArray.length === 0) {
    errors.push(
      'Aucune paire valide "Prénom" et "Nom" trouvée dans la feuille "Alpha" à traiter.'
    );
    return {
      message: "Aucune donnée valide à traiter.",
      errors,
    };
  }

  // Étape 3 : Interroger la base de données pour les étudiants correspondants
  const orConditions = namePairsArray.map((name) => {
    const [prenom, ...nomParts] = name.split(" ");
    const nom = nomParts.join(" ");
    return { Prénom: prenom, Nom: nom };
  });

  let matchedStudents: IEtudiant[] = [];
  try {
    matchedStudents = await Etudiant.find({ $or: orConditions }).exec();
  } catch (dbError: any) {
    errors.push(
      `Échec de la requête à la base de données : ${dbError.message}`
    );
    return {
      message: "Échec de la requête à la base de données.",
      errors,
    };
  }

  // Étape 4 : Mapper "Prénom Nom" aux documents étudiants correspondants
  const studentMap: { [key: string]: IEtudiant[] } = {};

  matchedStudents.forEach((student) => {
    const prenom = student.Prénom ? student.Prénom.trim() : "";
    const nom = student.Nom ? student.Nom.trim() : "";
    const key = `${prenom} ${nom}`;

    if (!studentMap[key]) {
      studentMap[key] = [];
    }
    studentMap[key].push(student);
  });

  // Étape 5 : Préparer les opérations en masse pour mettre à jour et ajouter "Majeure"
  const bulkSetOperations: any[] = [];
  const bulkAddOperations: any[] = [];

  alphaData.forEach((row, index) => {
    const firstName = row["Prénom"] ? row["Prénom"].trim() : null;
    const lastName = row["Nom"] ? row["Nom"].trim() : null;
    const promo = row["A"] ? row["A"].trim() : null;
    const majeure = row["Majeure"] ? row["Majeure"].trim() : null;

    if (firstName && lastName && promo && majeure) {
      const key = `${firstName} ${lastName}`;
      const students = studentMap[key];

      if (!students || students.length === 0) {
        errors.push(
          `Aucun étudiant correspondant trouvé pour "Prénom" : "${firstName}", "Nom" : "${lastName}" à la ligne ${
            index + 1
          }.`
        );
        return;
      }

      if (students.length > 1) {
        errors.push(
          `Plusieurs étudiants trouvés pour "Prénom" : "${firstName}", "Nom" : "${lastName}" à la ligne ${
            index + 1
          }. Aucune mise à jour effectuée.`
        );
        return;
      }

      const student = students[0];

      // Préparer l'opération de mise à jour pour définir "promo" si "majeure" existe
      bulkSetOperations.push({
        updateOne: {
          filter: {
            _id: student._id,
            "DéfiEtMajeure.majeures.nom": majeure,
          },
          update: {
            $set: {
              "DéfiEtMajeure.majeures.$.promo": promo,
            },
          },
        },
      });

      // Préparer l'opération d'ajout pour ajouter la "majeure" si elle n'existe pas
      bulkAddOperations.push({
        updateOne: {
          filter: {
            _id: student._id,
            "DéfiEtMajeure.majeures.nom": { $ne: majeure },
          },
          update: {
            $addToSet: {
              "DéfiEtMajeure.majeures": {
                nom: majeure,
                promo: promo,
              },
            },
          },
        },
      });
    } else {
      errors.push(
        `Données insuffisantes pour identifier l'étudiant à la ligne ${
          index + 1
        }. Les champs "Prénom", "Nom", "A" et "Majeure" sont requis.`
      );
    }
  });

  // Étape 6 : Exécuter bulkWrite pour les opérations $set si présentes
  let bulkWriteSetResult: any = null;
  if (bulkSetOperations.length > 0) {
    try {
      bulkWriteSetResult = await Etudiant.bulkWrite(bulkSetOperations, {
        ordered: false, // Continuer le traitement même si certaines opérations échouent
      });
      modifiedCount += bulkWriteSetResult.modifiedCount;
    } catch (bulkError: any) {
      errors.push(
        `Échec de l'écriture en masse pour les mises à jour : ${bulkError.message}`
      );
    }
  }

  // Étape 7 : Exécuter bulkWrite pour les opérations $addToSet si présentes
  let bulkWriteAddResult: any = null;
  if (bulkAddOperations.length > 0) {
    try {
      bulkWriteAddResult = await Etudiant.bulkWrite(bulkAddOperations, {
        ordered: false, // Continuer le traitement même si certaines opérations échouent
      });
      modifiedCount += bulkWriteAddResult.modifiedCount;
    } catch (bulkError: any) {
      errors.push(
        `Échec de l'écriture en masse pour les ajouts : ${bulkError.message}`
      );
    }
  }

  // Étape 8 : Préparer le message de résultat
  let message = "";

  if (bulkWriteSetResult || bulkWriteAddResult) {
    message += `Modification réussie de ${modifiedCount} document(s).`;
  } else if (bulkSetOperations.length > 0 || bulkAddOperations.length > 0) {
    message += `Tentative de modification de ${
      bulkSetOperations.length + bulkAddOperations.length
    } document(s), mais des erreurs ont été rencontrées.`;
  } else {
    message += "Aucun document n'a été modifié.";
  }

  if (errors.length > 0) {
    message += ` A rencontré ${errors.length} problème(s).`;
  }

  return {
    message,
    errors,
  };
}
