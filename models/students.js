const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const stageSchema = new Schema(
  {
    nom_d_entreprise: String,
    annee_du_stage: Date,
    duree_du_stage: String,
    poste: String,
  },
  { _id: false }
);

const diplomeSchema = new Schema(
  {
    nom: String,
    annee_d_obtention: Date,
  },
  { _id: false }
);

const electifSchema = new Schema(
  {
    type_electif: String,
    etablissement_electif: String,
    semestre_d_electif: String,
  },
  { _id: false }
);

const parcoursSchema = new Schema({
  type_de_bac: String,
  filiere_d_origine: String,
  prepa_d_origine: String,
  mode_d_admission: {
    type: String,
    enum: ["AST", "Mines-Pont", "EM", "FAC"],
  },
  est_fusion: Boolean,
  autre_parcours_diplomant: {
    type: {
      type: String,
    },
    aPartenariat: Boolean,
    etablissement: String,
    duree: String,
    pays: String,
  },
  stages: [stageSchema],
  diplomes: [diplomeSchema],
  electifs: [electifSchema],
});

const identiteSchema = new Schema({
  Date_de_naissance: Date,
  annee_d_entree: Date,
  nom: String,
  prenom: String,
  mail: {
    type: String,
    match: /.+\@.+\..+/,
  },
  Genre: Boolean,
  Parcours: parcoursSchema,
});

const Etudiant = mongoose.model("Etudiant", identiteSchema);

module.exports = Etudiant;
