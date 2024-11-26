"use strict";
// routes/students.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const students_1 = __importDefault(require("../models/students"));
const router = (0, express_1.Router)();
router.post("/api/students", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let _a = req.body, { page, limit } = _a, query = __rest(_a, ["page", "limit"]);
        // Set default values if none are provided
        page = page || 1;
        limit = limit || 20;
        // Calculate the skipping number
        const skip = (page - 1) * limit;
        // Filter out empty string values
        Object.keys(query).forEach((key) => {
            if (query[key] === "") {
                delete query[key];
            }
        });
        // Build the MongoDB query
        const mongoQuery = {};
        // Process each field in the query
        for (const key in query) {
            if (query[key] !== undefined && query[key] !== null) {
                if (typeof query[key] === "object") {
                    // Handle nested fields within arrays
                    const arrayField = key;
                    const subQuery = query[key];
                    const subMongoQuery = {};
                    Object.keys(subQuery).forEach((subKey) => {
                        subMongoQuery[subKey] = subQuery[subKey];
                    });
                    mongoQuery[arrayField] = { $elemMatch: subMongoQuery };
                }
                else {
                    // Direct fields
                    mongoQuery[key] = query[key];
                }
            }
        }
        // Query the database with pagination
        const students = yield students_1.default.find(mongoQuery).skip(skip).limit(limit);
        res.json(students);
    }
    catch (error) {
        console.error("Error fetching students:", error);
        res.status(500).send(error);
    }
}));
exports.default = router;
//# sourceMappingURL=getStudents.js.map