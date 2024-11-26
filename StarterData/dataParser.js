const fs = require("fs");

function reformatDate(dateString) {
  if (!dateString) return null;
  const [month, day, year] = dateString.split("/");
  const fullYear = parseInt(year) < 50 ? `20${year}` : `19${year}`;
  return `${fullYear}-${month.padStart(2, "0")}-${day.padStart(
    2,
    "0"
  )}T00:00:00`;
}

fs.readFile("combined_data.json", "utf8", (err, data) => {
  if (err) {
    console.error("Error reading file:", err);
    return;
  }

  let students = JSON.parse(data);

  students = students.map((student) => {
    if (student.conventionsDeStage) {
      student.conventionsDeStage = student.conventionsDeStage.map((stage) => {
        return {
          identifiantOP: stage.identifiantOP,
          entiteLieeIdentifiantOP: stage.entiteLieeIdentifiantOP,
          entiteLieeDateDebutStage: reformatDate(
            stage.entiteLieeDateDebutStage
          ),
          entiteLieeDateFinStage: reformatDate(stage.entiteLieeDateFinStage),
          entiteLieeFonctionOccupee: stage.entiteLieeFonctionOccupee,
          entiteLieeNom: stage.entiteLieeNom,
        };
      });
    }
    return student;
  });

  fs.writeFile(
    "combined_data.json",
    JSON.stringify(students, null, 2),
    "utf8",
    (err) => {
      if (err) {
        console.error("Error writing file:", err);
      } else {
        console.log("File has been updated successfully.");
      }
    }
  );
});
