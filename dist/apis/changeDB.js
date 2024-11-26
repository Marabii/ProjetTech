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
const students_1 = __importDefault(require("../models/students"));
const processBdd_1 = __importDefault(require("../utilis/processBdd")); // Ensure the correct path
const router = (0, express_1.Router)();
/**
 * POST /api/server/postStudentData
 * Endpoint to process and save student data.
 */
router.post("/api/server/postStudentData", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { type } = req.query;
    const data = req.body;
    switch (type) {
        case "bdd":
            try {
                // Process the incoming data
                const { result, errors } = (0, processBdd_1.default)(data);
                // If there are processing errors, return them
                if (errors.length > 0) {
                    res.status(400).json({ status: enums_1.Status.failure, errors });
                    return;
                }
                if (result.length === 0) {
                    res.status(200).json({
                        status: enums_1.Status.success,
                        message: "No student data to process.",
                    });
                    return;
                }
                // Prepare bulk operations
                const bulkOperations = result.map((student) => ({
                    updateOne: {
                        filter: { "Identifiant OP": student["Identifiant OP"] },
                        update: { $set: student },
                        upsert: true,
                    },
                }));
                // Execute bulkWrite for efficient upsert operations
                yield students_1.default.bulkWrite(bulkOperations, {
                    ordered: true, // Continue processing even if some operations fail
                });
                // Optionally, you can provide more detailed feedback based on bulkWriteResult
                res.status(200).json({
                    status: enums_1.Status.success,
                });
                return;
            }
            catch (error) {
                // Handle any unexpected errors during processing or database operations
                if (error instanceof Error) {
                    res
                        .status(500)
                        .json({ status: enums_1.Status.failure, errors: [error.message] });
                    return;
                }
                else {
                    res.status(500).json({
                        status: enums_1.Status.failure,
                        errors: ["An unknown error occurred."],
                    });
                    return;
                }
            }
        default:
            // Handle unsupported 'type' values
            res.status(400).json({
                status: enums_1.Status.failure,
                errors: ["Unsupported type parameter."],
            });
            return;
    }
}));
exports.default = router;
//# sourceMappingURL=changeDB.js.map