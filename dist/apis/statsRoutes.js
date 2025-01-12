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
// backend/src/routes/statsRoutes.ts
const express_1 = require("express");
const students_1 = __importDefault(require("../models/students"));
const router = (0, express_1.Router)();
// Get total number of students
router.get("/total-students", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const count = yield students_1.default.countDocuments({});
        res.json({ count });
        return;
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
        return;
    }
}));
// Distribution by Nationality
router.get("/nationality-distribution", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { graduationYear } = req.query;
        // Build the match object with proper typing
        const matchObj = {
            Nationalité: { $exists: true, $ne: null },
        };
        if (graduationYear) {
            matchObj["ANNÉE DE DIPLOMATION"] = graduationYear;
        }
        // Perform the aggregation pipeline
        const distribution = yield students_1.default.aggregate([
            { $match: matchObj },
            { $group: { _id: "$Nationalité", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);
        // Send the response
        res.json(distribution);
    }
    catch (error) {
        console.error("Error in /nationality-distribution:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}));
// Distribution by Filière (Field of Study)
router.get("/filiere-distribution", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { graduationYear } = req.query;
        // Build the match object with proper typing
        const matchObj = {
            Filière: { $exists: true, $ne: null },
        };
        if (graduationYear) {
            matchObj["ANNÉE DE DIPLOMATION"] = graduationYear;
        }
        // Perform the aggregation pipeline
        const distribution = yield students_1.default.aggregate([
            { $match: matchObj },
            { $group: { _id: "$Filière", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);
        // Send the response
        res.json(distribution);
    }
    catch (error) {
        console.error("Error in /filiere-distribution:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}));
// Internship by Country Distribution
router.get("/internship-by-country", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { graduationYear } = req.query;
        // Build the match object with proper typing
        const matchObj = {
            "CONVENTION DE STAGE.Pays": { $exists: true, $ne: null },
        };
        if (graduationYear) {
            matchObj["ANNÉE DE DIPLOMATION"] = graduationYear;
        }
        // Perform the aggregation pipeline
        const distribution = yield students_1.default.aggregate([
            {
                $unwind: {
                    path: "$CONVENTION DE STAGE",
                    preserveNullAndEmptyArrays: true,
                },
            },
            { $match: matchObj },
            { $group: { _id: "$CONVENTION DE STAGE.Pays", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);
        // Send the response
        res.json(distribution);
    }
    catch (error) {
        console.error("Error in /internship-by-country:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}));
exports.default = router;
//# sourceMappingURL=statsRoutes.js.map