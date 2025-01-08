"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = processDefis;
// models/students.ts
const students_1 = __importDefault(require("../models/students"));
/**
 * Traite les données de la feuille "Alpha" pour mettre à jour le champ "Défi" des étudiants.
 *
 * @param data - Les données de la feuille entrante contenant la feuille "Alpha".
 * @returns Une promesse qui résout un FileProcessorResult indiquant le résultat.
 */
function processDefis(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const errors = [];
        // Étape 1 : Valider la structure des données entrantes
        if (data.length !== 1) {
            errors.push("Les données d'entrée doivent contenir exactement un objet de feuille.");
        }
        const sheetObj = data[0];
        if (!sheetObj.hasOwnProperty("Alpha")) {
            errors.push('Feuille "Alpha" manquante dans les données d\'entrée.');
        }
        const alphaData = sheetObj["Alpha"];
        if (!Array.isArray(alphaData)) {
            errors.push('La feuille "Alpha" doit être un tableau d\'objets.');
        }
        else {
            alphaData.forEach((row, index) => {
                if (!("Prénom" in row || "Nom" in row || "Défi" in row)) {
                    errors.push(`La ligne ${index + 1} dans la feuille "Alpha" doit contenir au moins l'un des champs "Prénom", "Nom" ou "Défi".`);
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
        const namePairs = new Set();
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
            errors.push('Aucune paire valide "Prénom" et "Nom" trouvée dans la feuille "Alpha" à traiter.');
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
        let matchedStudents = [];
        try {
            matchedStudents = yield students_1.default.find({ $or: orConditions }).exec();
        }
        catch (dbError) {
            errors.push(`Échec de la requête à la base de données : ${dbError.message}`);
            return {
                message: "Échec de la requête à la base de données.",
                errors,
            };
        }
        // Étape 4 : Mapper "Prénom Nom" aux documents étudiants correspondants
        const studentMap = {};
        matchedStudents.forEach((student) => {
            const prenom = student.Prénom ? student.Prénom.trim() : "";
            const nom = student.Nom ? student.Nom.trim() : "";
            const key = `${prenom} ${nom}`;
            if (!studentMap[key]) {
                studentMap[key] = [];
            }
            studentMap[key].push(student);
        });
        // Étape 5 : Préparer les opérations en masse pour mettre à jour "Défi"
        const bulkOperations = [];
        alphaData.forEach((row, index) => {
            const firstName = row["Prénom"] ? row["Prénom"].trim() : null;
            const lastName = row["Nom"] ? row["Nom"].trim() : null;
            const defi = row["Défi"] ? row["Défi"].trim() : null;
            if (firstName && lastName) {
                const key = `${firstName} ${lastName}`;
                const students = studentMap[key];
                if (!students || students.length === 0) {
                    errors.push(`Aucun étudiant correspondant trouvé pour "Prénom" : "${firstName}", "Nom" : "${lastName}" à la ligne ${index + 1}.`);
                    return;
                }
                if (students.length > 1) {
                    errors.push(`Plusieurs étudiants trouvés pour "Prénom" : "${firstName}", "Nom" : "${lastName}" à la ligne ${index + 1}. Aucune mise à jour effectuée.`);
                    return;
                }
                if (!defi) {
                    errors.push(`Aucun "Défi" fourni pour "Prénom" : "${firstName}", "Nom" : "${lastName}" à la ligne ${index + 1}.`);
                    return;
                }
                const student = students[0];
                bulkOperations.push({
                    updateOne: {
                        filter: { _id: student._id },
                        update: { $set: { "DéfiEtMajeure.défi": defi } },
                    },
                });
            }
            else {
                errors.push(`Données insuffisantes pour identifier l'étudiant à la ligne ${index + 1}. Les champs "Prénom" et "Nom" sont requis.`);
            }
        });
        // Étape 6 : Exécuter bulkWrite s'il y a des opérations à effectuer
        let bulkWriteResult = null;
        if (bulkOperations.length > 0) {
            try {
                bulkWriteResult = yield students_1.default.bulkWrite(bulkOperations, {
                    ordered: false, // Continuer le traitement même si certaines opérations échouent
                });
            }
            catch (bulkError) {
                errors.push(`Échec de l'écriture en masse : ${bulkError.message}`);
            }
        }
        // Étape 7 : Préparer le message de résultat
        let message = "";
        if (bulkWriteResult) {
            message += `Modification réussie de ${bulkWriteResult.modifiedCount} document(s).`;
        }
        else if (bulkOperations.length > 0) {
            message += `Tentative de modification de ${bulkOperations.length} document(s), mais des erreurs ont été rencontrées.`;
        }
        else {
            message += "Aucun document n'a été modifié.";
        }
        if (errors.length > 0) {
            message += ` A rencontré ${errors.length} problème(s).`;
        }
        return {
            message,
            errors,
        };
    });
}
//# sourceMappingURL=processDefis.js.map