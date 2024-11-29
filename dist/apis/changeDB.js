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
const handleBdd = (data, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, processBdd_1.default)(data);
        res.status(200).json({
            status: enums_1.Status.success,
            message: result.message,
            errors: result.errors,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            handleErrorResponse(res, 400, error.message, []);
        }
        else {
            handleErrorResponse(res, 500, "An unknown error occurred.", []);
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
            handleErrorResponse(res, 400, error.message, []);
        }
        else {
            handleErrorResponse(res, 500, "An unknown error occurred.", []);
        }
    }
});
/**
 * Main route handler for posting student data
 */
router.post("/api/server/postStudentData", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { type } = req.query;
    const data = req.body;
    if (!type || typeof type !== "string") {
        return handleErrorResponse(res, 400, "Type parameter is required.");
    }
    switch (type.toLowerCase()) {
        case "bdd":
            yield handleBdd(data, res);
            break;
        case "stages":
            yield handleInternships(data, res);
            break;
        default:
            handleErrorResponse(res, 400, "Unsupported type parameter.", [
                "Supported types are 'bdd' and 'stages'.",
            ]);
            break;
    }
}));
exports.default = router;
//# sourceMappingURL=changeDB.js.map