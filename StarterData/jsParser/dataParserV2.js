const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");

// Directory containing the Excel files
const bddDirectory = path.join(__dirname, "bdd");

// Output JSON file path
const outputFilePath = path.join(__dirname, "combined_data.json");

// Function to extract promo year from filename
const getPromoYear = (filename) => {
  const regex = /bdd-parcours-dip(\d{2})\.xlsx$/;
  const match = filename.match(regex);
  if (match && match[1]) {
    const yearSuffix = match[1];
    // Assuming years are from 2000 to 2099
    const year =
      parseInt(yearSuffix, 10) >= 50 ? `19${yearSuffix}` : `20${yearSuffix}`;
    return parseInt(year, 10);
  }
  return null;
};

// Function to read a sheet and convert to JSON with formatted values
const readSheet = (workbook, sheetName) => {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    console.warn(`Sheet "${sheetName}" not found in workbook.`);
    return [];
  }
  // Set 'raw' to false to get formatted values (e.g., dates as strings)
  return xlsx.utils.sheet_to_json(sheet, { defval: null, raw: false });
};

// Main function to combine data
const combineData = () => {
  try {
    // Ensure the 'bdd' directory exists
    if (!fs.existsSync(bddDirectory)) {
      console.error(`Directory "${bddDirectory}" does not exist.`);
      return;
    }

    // Read all files in the 'bdd' directory
    const files = fs
      .readdirSync(bddDirectory)
      .filter((file) => file.toLowerCase().endsWith(".xlsx"));

    if (files.length === 0) {
      console.warn(`No .xlsx files found in the directory "${bddDirectory}".`);
      return;
    }

    // Object to store students keyed by Identifiant OP
    const studentsMap = {};

    files.forEach((file) => {
      const filePath = path.join(bddDirectory, file);
      const promo = getPromoYear(file);
      if (!promo) {
        console.warn(
          `Could not determine promo year for file: "${file}". Skipping this file.`
        );
        return;
      }

      // Read the workbook
      let workbook;
      try {
        workbook = xlsx.readFile(filePath);
      } catch (error) {
        console.error(`Error reading file "${file}": ${error.message}`);
        return;
      }

      // Read "Entité principale" sheet
      const entitePrincipale = readSheet(workbook, "Entité principale");

      entitePrincipale.forEach((student) => {
        const identifiantOP = student["Identifiant OP"];
        if (!identifiantOP) {
          console.warn(
            `Missing "Identifiant OP" for a student in file: "${file}". Skipping this entry.`
          );
          return;
        }

        // Initialize student entry if not already present
        if (!studentsMap[identifiantOP]) {
          studentsMap[identifiantOP] = {
            identifiantOP: identifiantOP,
            etablissementOrigine: student["Etablissement d'origine"] || null,
            filiere: student["Filière"] || null,
            matriculeInterne: student["Matricule (interne)"] || null,
            nationalite: student["Nationalité"] || null,
            nom: student["Nom"] || null,
            prenom: student["Prénom"] || null,
            situationActuelle: student["Situation actuelle"] || null,
            promo: promo,
            conventionsDeStage: [],
            universitesVisitant: [],
          };
        } else {
          // If the student already exists, verify or update promo if necessary
          // This example assumes each student appears only once per promo
          // Adjust as needed based on your data
        }
      });

      // Read "CONVENTION DE STAGE" sheet
      const conventionsDeStage = readSheet(workbook, "CONVENTION DE STAGE");

      conventionsDeStage.forEach((stage) => {
        const entitePrincipaleID = stage["Entité principale - Identifiant OP"];
        if (!entitePrincipaleID) {
          console.warn(
            `Missing "Entité principale - Identifiant OP" in "CONVENTION DE STAGE" for file: "${file}". Skipping this entry.`
          );
          return;
        }

        if (!studentsMap[entitePrincipaleID]) {
          console.warn(
            `Entité principale ID "${entitePrincipaleID}" not found in "Entité principale" for file: "${file}". Skipping this internship.`
          );
          return;
        }

        // Create internship object with dates as strings
        const internship = {
          identifiantOP: stage["Identifiant OP"] || null,
          entiteLieeIdentifiantOP:
            stage["Entité liée - Identifiant OP"] || null,
          dateDebut: stage["Date de début"] || null,
          dateFin: stage["Date de fin"] || null,
          extremite1: stage["Extrémité 1"] || null,
          extremite2: stage["Extrémité 2"] || null,
          entiteLieeDateDebutStage:
            stage["Entité liée - Date de début du stage"] || null,
          entiteLieeDateFinStage:
            stage["Entité liée - Date de fin du stage"] || null,
          entiteLieeFonctionOccupee:
            stage["Entité liée - Fonction occupée"] || null,
          entiteLieeNom: stage["Entité liée - Nom"] || null,
        };

        // Add to the student's conventionsDeStage array
        studentsMap[entitePrincipaleID].conventionsDeStage.push(internship);
      });

      // Read "UNIVERSITE visitant" sheet
      const universitesVisitant = readSheet(workbook, "UNIVERSITE visitant");

      universitesVisitant.forEach((visit) => {
        const entitePrincipaleID = visit["Entité principale - Identifiant OP"];
        if (!entitePrincipaleID) {
          console.warn(
            `Missing "Entité principale - Identifiant OP" in "UNIVERSITE visitant" for file: "${file}". Skipping this entry.`
          );
          return;
        }

        if (!studentsMap[entitePrincipaleID]) {
          console.warn(
            `Entité principale ID "${entitePrincipaleID}" not found in "Entité principale" for file: "${file}". Skipping this university visit.`
          );
          return;
        }

        // Create university visit object with dates as strings
        const visitObj = {
          identifiantOP: visit["Identifiant OP"] || null,
          entiteLieeIdentifiantOP:
            visit["Entité liée - Identifiant OP"] || null,
          dateDebut: visit["Date de début"] || null,
          dateFin: visit["Date de fin"] || null,
          extremite1: visit["Extrémité 1"] || null,
          extremite2: visit["Extrémité 2"] || null,
          typeMobilite: visit["Type Mobilité"] || null,
          entiteLieeEtablissement: visit["Entité liée - Etablissement"] || null,
          entiteLieeNom: visit["Entité liée - Nom"] || null,
        };

        // Add to the student's universitesVisitant array
        studentsMap[entitePrincipaleID].universitesVisitant.push(visitObj);
      });
    });

    // Convert the studentsMap to an array
    const combinedData = Object.values(studentsMap);

    // Write the combined data to JSON file
    fs.writeFileSync(
      outputFilePath,
      JSON.stringify(combinedData, null, 2),
      "utf8"
    );

    console.log(`Data successfully combined and saved to "${outputFilePath}".`);
  } catch (error) {
    console.error(
      `An error occurred during data combination: ${error.message}`
    );
  }
};

// Execute the combineData function
combineData();
