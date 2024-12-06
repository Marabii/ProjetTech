// models/students.ts
import Etudiant from "../models/students";
import {
  FileProcessorResult,
  SheetData,
  IEtudiant,
} from "../Interfaces/Interface";

/**
 * Processes the "Alpha" sheet data to update the "Défi" field for students.
 *
 * @param data - The incoming sheet data containing the "Alpha" sheet.
 * @returns A promise that resolves to a FileProcessorResult indicating the outcome.
 */
export default async function processDefis(
  data: SheetData
): Promise<FileProcessorResult> {
  const errors: string[] = [];

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
      if (!("Prénom" in row || "Nom" in row || "Défi" in row)) {
        errors.push(
          `Row ${
            index + 1
          } in "Alpha" sheet must have at least one of "Prénom", "Nom", or "Défi".`
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

  // Step 5: Prepare bulk operations for updating "Défi"
  const bulkOperations: any[] = [];

  alphaData.forEach((row, index) => {
    const firstName = row["Prénom"] ? row["Prénom"].trim() : null;
    const lastName = row["Nom"] ? row["Nom"].trim() : null;
    const defi = row["Défi"] ? row["Défi"].trim() : null;

    if (firstName && lastName) {
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

      if (!defi) {
        errors.push(
          `No "Défi" provided for "Prénom": "${firstName}", "Nom": "${lastName}" at row ${
            index + 1
          }.`
        );
        return;
      }

      const student = students[0];

      bulkOperations.push({
        updateOne: {
          filter: { _id: student._id },
          update: { $set: { "DéfiEtMajeure.défi": defi } },
        },
      });
    } else {
      errors.push(
        `Insufficient data to match student at row ${
          index + 1
        }. Both "Prénom" and "Nom" are required.`
      );
    }
  });

  // Step 6: Execute bulkWrite if there are operations to perform
  let bulkWriteResult: any = null;
  if (bulkOperations.length > 0) {
    try {
      bulkWriteResult = await Etudiant.bulkWrite(bulkOperations, {
        ordered: false, // Continue processing even if some operations fail
      });
    } catch (bulkError: any) {
      errors.push(`Bulk write failed: ${bulkError.message}`);
    }
  }

  // Step 7: Prepare the result message
  let message = "";

  if (bulkWriteResult) {
    message += `Successfully modified ${bulkWriteResult.modifiedCount} document(s).`;
  } else if (bulkOperations.length > 0) {
    message += `Attempted to modify ${bulkOperations.length} document(s), but encountered errors.`;
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
