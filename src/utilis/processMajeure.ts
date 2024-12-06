// models/students.ts
import Etudiant from "../models/students";
import {
  FileProcessorResult,
  SheetData,
  IEtudiant,
} from "../Interfaces/Interface";

/**
 * Processes the "Alpha" sheet data to update the "Majeure" information for students.
 *
 * @param data - The incoming sheet data containing the "Alpha" sheet.
 * @returns A promise that resolves to a FileProcessorResult indicating the outcome.
 */
export default async function processMajeure(
  data: SheetData
): Promise<FileProcessorResult> {
  const errors: string[] = [];
  let modifiedCount = 0;

  // Step 1: Validate the incoming data structure
  if (data.length !== 1) {
    errors.push("Input data should contain exactly one sheet object.");
  }

  const sheetObj = data[0];

  if (!sheetObj.hasOwnProperty("Alpha")) {
    errors.push('Missing "Alpha" sheet in input data.');
  }

  const alphaData = sheetObj["Alpha"];

  if (!Array.isArray(alphaData)) {
    errors.push('"Alpha" sheet should be an array of objects.');
  } else {
    alphaData.forEach((row, index) => {
      const requiredFields = ["Prénom", "Nom", "A", "Majeure"];
      requiredFields.forEach((field) => {
        if (!(field in row)) {
          errors.push(
            `Row ${index + 1} in "Alpha" sheet is missing the "${field}" field.`
          );
        }
      });

      // Additional type checks can be added here if necessary
      if (
        typeof row["Prénom"] !== "string" ||
        typeof row["Nom"] !== "string" ||
        typeof row["A"] !== "string" ||
        typeof row["Majeure"] !== "string"
      ) {
        errors.push(
          `Row ${
            index + 1
          } in "Alpha" sheet has invalid data types for one or more fields.`
        );
      }
    });
  }

  // If critical validation errors exist, return early
  if (errors.length > 0) {
    return {
      message: "Validation failed with errors.",
      errors,
    };
  }

  // Step 2: Extract unique "Prénom Nom" pairs from the incoming data
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
      'No valid "Prénom" and "Nom" pairs found in "Alpha" sheet to process.'
    );
    return {
      message: "No valid data to process.",
      errors,
    };
  }

  // Step 3: Query the database for matching students
  const orConditions = namePairsArray.map((name) => {
    const [prenom, ...nomParts] = name.split(" ");
    const nom = nomParts.join(" ");
    return { Prénom: prenom, Nom: nom };
  });

  let matchedStudents: IEtudiant[] = [];
  try {
    matchedStudents = await Etudiant.find({ $or: orConditions }).exec();
  } catch (dbError: any) {
    errors.push(`Database query failed: ${dbError.message}`);
    return {
      message: "Failed to query the database.",
      errors,
    };
  }

  // Step 4: Map "Prénom Nom" to corresponding student documents
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

  // Step 5: Prepare bulk operations for updating and adding "Majeure"
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
          `No matching student found for "Prénom": "${firstName}", "Nom": "${lastName}" at row ${
            index + 1
          }.`
        );
        return;
      }

      if (students.length > 1) {
        errors.push(
          `Multiple students found for "Prénom": "${firstName}", "Nom": "${lastName}" at row ${
            index + 1
          }. No update performed.`
        );
        return;
      }

      const student = students[0];

      // Prepare the update operation to set "promo" if "majeure" exists
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

      // Prepare the add operation to add the "majeure" if it doesn't exist
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
        `Insufficient data to match student at row ${
          index + 1
        }. "Prénom", "Nom", "A", and "Majeure" are required.`
      );
    }
  });

  // Step 6: Execute bulkWrite for $set operations if any
  let bulkWriteSetResult: any = null;
  if (bulkSetOperations.length > 0) {
    try {
      bulkWriteSetResult = await Etudiant.bulkWrite(bulkSetOperations, {
        ordered: false, // Continue processing even if some operations fail
      });
      modifiedCount += bulkWriteSetResult.modifiedCount;
    } catch (bulkError: any) {
      errors.push(`Bulk set write failed: ${bulkError.message}`);
    }
  }

  // Step 7: Execute bulkWrite for $addToSet operations if any
  let bulkWriteAddResult: any = null;
  if (bulkAddOperations.length > 0) {
    try {
      bulkWriteAddResult = await Etudiant.bulkWrite(bulkAddOperations, {
        ordered: false, // Continue processing even if some operations fail
      });
      modifiedCount += bulkWriteAddResult.modifiedCount;
    } catch (bulkError: any) {
      errors.push(`Bulk add write failed: ${bulkError.message}`);
    }
  }

  // Step 8: Prepare the result message
  let message = "";

  if (bulkWriteSetResult || bulkWriteAddResult) {
    message += `Successfully modified ${modifiedCount} document(s).`;
  } else if (bulkSetOperations.length > 0 || bulkAddOperations.length > 0) {
    message += `Attempted to modify ${
      bulkSetOperations.length + bulkAddOperations.length
    } document(s), but encountered errors.`;
  } else {
    message += "No documents were modified.";
  }

  if (errors.length > 0) {
    message += ` Encountered ${errors.length} issue(s).`;
  }

  return {
    message,
    errors,
  };
}
