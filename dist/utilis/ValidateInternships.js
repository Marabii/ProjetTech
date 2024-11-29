"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateInternships = ValidateInternships;
const XLSX = __importStar(require("xlsx"));
/**
 * Validates an XLSX file to ensure it contains two specific sheets with required columns.
 *
 * @param file - The XLSX file to validate.
 * @throws Will throw an error if validation fails.
 */
function ValidateInternships(file) {
    return __awaiter(this, void 0, void 0, function* () {
        // Define required sheets and their respective required columns
        const requiredSheets = [
            {
                name: "Entité principale",
                requiredColumns: ["Identifiant OP", "Indemnités du stage", "Durée"],
            },
            {
                name: "ENTREPRISE D'ACCUEIL",
                requiredColumns: [
                    "Entité principale - Identifiant OP",
                    "Entité liée - Code SIRET",
                    "Entité liée - Pays",
                    "Entité liée - Ville",
                    "Entité liée - Ville (Hors France)",
                ],
            },
        ];
        // Read the file as ArrayBuffer
        const arrayBuffer = yield file.arrayBuffer();
        // Parse the workbook
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        // Get the actual sheet names from the workbook
        const actualSheetNames = workbook.SheetNames;
        // Validate the number of sheets
        if (actualSheetNames.length !== requiredSheets.length) {
            throw new Error(`Invalid number of sheets. Expected ${requiredSheets.length}, but found ${actualSheetNames.length}.`);
        }
        // Validate each required sheet and its columns
        for (const requiredSheet of requiredSheets) {
            const { name, requiredColumns } = requiredSheet;
            // Check if the sheet exists
            if (!actualSheetNames.includes(name)) {
                throw new Error(`Missing required sheet: "${name}".`);
            }
            // Get the sheet
            const sheet = workbook.Sheets[name];
            if (!sheet) {
                throw new Error(`Unable to read the sheet: "${name}".`);
            }
            // Convert the first row to get headers
            const sheetJson = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            if (sheetJson.length === 0) {
                throw new Error(`Sheet "${name}" is empty.`);
            }
            const headers = sheetJson[0].map((header) => String(header).trim());
            // Check for each required column
            for (const column of requiredColumns) {
                if (!headers.includes(column)) {
                    throw new Error(`Missing required column "${column}" in sheet "${name}".`);
                }
            }
        }
        // If all validations pass
        console.log("XLSX file is valid.");
    });
}
//# sourceMappingURL=ValidateInternships.js.map