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
const express_1 = require("express");
const students_1 = __importDefault(require("../models/students"));
const router = (0, express_1.Router)();
// API endpoint that handles all filters
router.post("/api/students", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get the request body
        let query = req.body;
        // Filter out empty string values from the query
        Object.keys(query).forEach((key) => {
            if (query[key] === "") {
                delete query[key];
            }
        });
        // Query the database with the filtered query object
        const students = yield students_1.default.find(query);
        res.json(students);
    }
    catch (error) {
        console.error("Error fetching students:", error);
        res.status(500).send(error);
    }
}));
exports.default = router;
//# sourceMappingURL=getStudents.js.map