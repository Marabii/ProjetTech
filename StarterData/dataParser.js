const fs = require("fs");
const path = require("path");

// Define the expected keys
const expectedKeys = [
  "Identifiant OP",
  "Etablissement d'origine",
  "Filière",
  "Matricule (interne)",
  "Nationalité",
  "Nom",
  "Prénom",
  "Situation actuelle",
  "Défi",
  "A",
  "Majeure",
];

// Load and parse the combined.json file
const combinedFilePath = path.join(__dirname, "combined.json");
const combinedData = JSON.parse(fs.readFileSync(combinedFilePath, "utf8"));

// Filter each object to contain only the expected keys
const cleanedData = combinedData.map((item) => {
  // Create a new object with only the expected keys
  const cleanedItem = {};

  expectedKeys.forEach((key) => {
    if (item.hasOwnProperty(key)) {
      cleanedItem[key] = item[key];
    } else {
      cleanedItem[key] = null; // Add missing keys with null values
    }
  });

  return cleanedItem;
});

// Write the cleaned data back to combined.json
fs.writeFileSync(
  combinedFilePath,
  JSON.stringify(cleanedData, null, 2),
  "utf8"
);

console.log(
  `Data in ${combinedFilePath} has been cleaned to match the specified key structure.`
);

const obj = {
  nom: Nom,
  prenom: Prénom,
  A: A,
  Parcours: {
    filiere_d_origine: Filière,
    prepa_d_origine: "Etablissement d'origine",
    nationalite: Nationalité,
    electifs: [{ type_electif: Majeure }],
  },
};
