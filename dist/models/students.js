"use strict";
// models/Etudiant.ts
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
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
// Define the ConventionDeStage schema
// models/Etudiant.ts
const ConventionDeStageSchema = new mongoose_1.Schema({
    "Entité liée - Identifiant OP": { type: String, required: true },
    "Date de début du stage": { type: Date, required: false },
    "Date de fin du stage": { type: Date, required: false },
    "Stage Fonction occupée": { type: String, required: false },
    "Nom Stage": { type: String, required: false },
    "Indemnités du stage": { type: String, required: false },
    Durée: { type: String, required: false },
    // Fields from 'ENTREPRISE D'ACCUEIL' without 'Entité liée - ' prefix
    "Code SIRET": { type: String, required: false },
    Pays: { type: String, required: false },
    Ville: { type: String, required: false },
    "Ville (Hors France)": { type: String, required: false },
    "ENTREPRISE DE STAGE": { type: String, required: false },
}, { _id: false });
// Define the UniversiteVisitant schema
const UniversiteVisitantSchema = new mongoose_1.Schema({
    "Entité principale - Identifiant OP": {
        type: String,
        required: true,
    },
    "Date de début mobilité": {
        type: Date,
        required: false,
    },
    "Date de fin mobilité": {
        type: Date,
        required: false,
    },
    "Type Mobilité": {
        type: String,
        required: false,
    },
    "Nom mobilité": {
        type: String,
        required: false,
    },
}, { _id: false });
const MajeureSchema = new mongoose_1.Schema({
    nom: {
        type: String,
        required: true,
    },
    promo: {
        type: String,
        required: true,
    },
}, { _id: false });
const DéfiEtMajeureSchema = new mongoose_1.Schema({
    défi: {
        type: String,
        required: true,
    },
    majeures: {
        type: [MajeureSchema],
        default: [],
    },
}, { _id: false });
// Define the IEtudiant schema
const EtudiantSchema = new mongoose_1.Schema({
    "Identifiant OP": {
        type: String,
        required: true,
        unique: true,
    },
    "Etablissement d'origine": {
        type: String,
        required: false,
    },
    Filière: {
        type: String,
        required: true,
        default: "AST",
    },
    Nationalité: {
        type: String,
        required: false,
    },
    Nom: {
        type: String,
        required: false,
    },
    Prénom: {
        type: String,
        required: false,
    },
    "ANNÉE DE DIPLOMATION": {
        type: String,
        required: true,
    },
    "CONVENTION DE STAGE": {
        type: [ConventionDeStageSchema],
        default: undefined, // Makes the array optional
    },
    "UNIVERSITE visitant": {
        type: [UniversiteVisitantSchema],
        default: undefined, // Makes the array optional
    },
    DéfiEtMajeure: {
        type: DéfiEtMajeureSchema,
        default: undefined,
    },
}, {
    timestamps: true, // Optional: adds createdAt and updatedAt fields
});
// Create an index on "Identifiant OP" for faster queries
EtudiantSchema.index({ "Identifiant OP": 1 });
const Etudiant = mongoose_1.default.model("Etudiant", EtudiantSchema);
exports.default = Etudiant;
//# sourceMappingURL=students.js.map