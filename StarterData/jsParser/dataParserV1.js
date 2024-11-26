const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");

// Directory containing the xlsx files
const directoryPath = path.join(__dirname, "../bdd");

// Function to parse all xlsx files in the directory
const parseXlsxFiles = () => {
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error("Error reading directory:", err);
      return;
    }

    // Filter files that match the naming convention
    const xlsxFiles = files.filter(
      (file) => file.startsWith("bdd-parcours-dip") && file.endsWith(".xlsx")
    );

    // Initialize an empty array to store combined data from all files
    let allData = [];

    xlsxFiles.forEach((file) => {
      // Extract the number for the 'promo' key
      const promoMatch = file.match(/bdd-parcours-dip(\d+)\.xlsx/);
      const promo = promoMatch ? promoMatch[1] : null;

      // Throw an error if no promo number is found
      if (!promo) {
        throw new Error(`Promo number not found in file name: ${file}`);
      }

      // Parse the xlsx file
      const filePath = path.join(directoryPath, file);
      const workbook = xlsx.readFile(filePath);

      // Iterate over all sheets in the workbook
      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];

        // Convert each sheet to JSON, converting all cell values to strings
        const sheetData = xlsx.utils.sheet_to_json(worksheet, {
          raw: false, // Forces all data to be returned as strings
        });

        // Add promo key and convert every cell value to a string explicitly
        const sheetDataWithPromo = sheetData.map((row) => {
          const rowWithStrings = {};
          Object.keys(row).forEach((key) => {
            rowWithStrings[key] = String(row[key]);
          });
          rowWithStrings["promo"] = String(promo);
          return rowWithStrings;
        });

        // Append the processed data to the allData array
        allData = allData.concat(sheetDataWithPromo);
      });
    });

    // Save the processed data to a JSON file
    const outputPath = path.join(__dirname, "students_data.json");
    fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2), "utf8");

    console.log(`Data successfully saved to ${outputPath}`);
  });
};

// Execute the function
parseXlsxFiles();
