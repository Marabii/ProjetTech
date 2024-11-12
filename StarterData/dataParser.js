const fs = require("fs");
const path = require("path");

// Load students data from JSON file
const filePath = path.join(__dirname, "students_data.json");
const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

// Split data into student and link records based on the presence of "Extrémité 2"
const students = data.filter(
  (record) => record.hasOwnProperty("Nom") && record.hasOwnProperty("Prénom")
);
const links = data.filter((record) => record.hasOwnProperty("Extrémité 2"));

// Helper function to merge objects with conflicting fields into arrays of unique values
const mergeRecords = (record1, record2) => {
  const merged = { ...record1 };
  Object.keys(record2).forEach((key) => {
    if (merged[key] === undefined) {
      // If the key doesn't exist in the first record, add it
      merged[key] = record2[key];
    } else if (merged[key] !== record2[key]) {
      // If the key exists but the values are different, merge into an array of unique values
      merged[key] = Array.isArray(merged[key]) ? merged[key] : [merged[key]];
      if (!merged[key].includes(record2[key])) {
        merged[key].push(record2[key]);
      }
    }
  });
  return merged;
};

// Combine students with their corresponding link records
const mergedData = students.map((student) => {
  const fullName = `${student.Nom} ${student.Prénom}`;
  const matchingLinks = links.filter(
    (link) => link["Extrémité 2"] === fullName
  );

  // Merge all matching links with the student record
  let combinedRecord = { ...student };
  matchingLinks.forEach((link) => {
    combinedRecord = mergeRecords(combinedRecord, link);
  });

  return combinedRecord;
});

// Save the merged data to a new JSON file
const outputPath = path.join(__dirname, "merged_students_data.json");
fs.writeFileSync(outputPath, JSON.stringify(mergedData, null, 2), "utf8");

console.log(`Merged data successfully saved to ${outputPath}`);
