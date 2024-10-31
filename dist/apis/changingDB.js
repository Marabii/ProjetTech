var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const router = require("express").Router();
const Etudiant = require("../models/students.js");
// Create a new studen
app.post("/api/students/create", (req, res) => __awaiter(this, void 0, void 0, function* () {
    try {
        const etudiantData = req.body;
        const newEtudiant = new Etudiant(etudiantData);
        yield newEtudiant.save();
        res.status(201).json(newEtudiant);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
module.exports = router;
//# sourceMappingURL=changingDB.js.map