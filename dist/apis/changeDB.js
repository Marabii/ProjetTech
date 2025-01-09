"use strict";
// routes/postStudentData.ts
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
const express_1 = require("express");
const enums_1 = require("../Interfaces/enums");
const processBdd_1 = __importDefault(require("../utilis/processBdd"));
const processInterships_1 = require("../utilis/processInterships");
const processDefis_1 = __importDefault(require("../utilis/processDefis"));
const processMajeure_1 = __importDefault(require("../utilis/processMajeure"));
const router = (0, express_1.Router)();
/**
 * Utility function to handle error responses
 */
const handleErrorResponse = (res, statusCode, message, errors = []) => {
    res.status(statusCode).json({
        status: enums_1.Status.failure,
        message,
        errors,
    });
};
/**
 * Handler for processing 'bdd' type data
 */
const handleBdd = (data, graduationYear, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, processBdd_1.default)(data, graduationYear);
        res.status(200).json({
            status: enums_1.Status.success,
            message: result.message,
            errors: result.errors,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            handleErrorResponse(res, 400, "", [error.message]);
        }
        else {
            handleErrorResponse(res, 500, "", ["An unknown error occurred."]);
        }
    }
});
/**
 * Handler for processing 'stages' type data
 */
const handleInternships = (data, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, processInterships_1.processInternships)(data);
        res.status(200).json({
            status: enums_1.Status.success,
            message: result.message,
            errors: result.errors,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            handleErrorResponse(res, 400, "", [error.message]);
        }
        else {
            handleErrorResponse(res, 500, "", ["An unknown error occurred."]);
        }
    }
});
/**
 * Handler for processing 'defis' type data
 */
const handleDefis = (data, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, processDefis_1.default)(data);
        res.status(200).json({
            status: enums_1.Status.success,
            message: result.message,
            errors: result.errors,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            handleErrorResponse(res, 400, "", [error.message]);
        }
        else {
            handleErrorResponse(res, 500, "", ["An unknown error occurred."]);
        }
    }
});
/**
 * Handler for processing 'Majeure' type data
 */
const handleMajeure = (data, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, processMajeure_1.default)(data);
        res.status(200).json({
            status: enums_1.Status.success,
            message: result.message,
            errors: result.errors,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            handleErrorResponse(res, 400, "", [error.message]);
        }
        else {
            handleErrorResponse(res, 500, "", ["An unknown error occurred."]);
        }
    }
});
/**
 * Main route handler for posting student data
 */
router.post("/api/server/postStudentData", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { type, graduationYearQuery } = req.query;
    const data = req.body;
    let graduationYear;
    // Validate `type`
    if (!type || typeof type !== "string") {
        return handleErrorResponse(res, 400, "Type parameter is required.");
    }
    // Validate `graduationYearQuery` if type is bdd
    if (type.toLocaleLowerCase() === "bdd") {
        if (!graduationYearQuery)
            return handleErrorResponse(res, 400, "Graduation year is missing");
        const currentYear = new Date().getFullYear();
        const yearAsNumber = Number(graduationYearQuery);
        if (isNaN(yearAsNumber) || // Graduation year must be a number
            yearAsNumber < currentYear - 30 || // Cannot be earlier than 30 years ago
            yearAsNumber > currentYear // Cannot be later than the current year
        ) {
            return handleErrorResponse(res, 400, `GraduationYearQuery must be a number between ${currentYear - 30} and ${currentYear} if provided.`);
        }
        graduationYear = yearAsNumber;
    }
    // Handle different types
    switch (type.toLowerCase()) {
        case "bdd":
            yield handleBdd(data, graduationYear, res);
            return;
        case "stages":
            yield handleInternships(data, res);
            return;
        case "defis":
            yield handleDefis(data, res);
            return;
        case "majeure":
            yield handleMajeure(data, res);
            return;
        default:
            handleErrorResponse(res, 400, "Unsupported type parameter.", [
                "Supported types are 'bdd', 'stages', 'defis', and 'majeure'.",
            ]);
            return;
    }
}));
exports.default = router;
//# sourceMappingURL=changeDB.js.map