const mongoose = require("mongoose");

const idGenSchema = new mongoose.Schema(
  {
    studentLastId: {
      type: Number,
      default: 100,
    },
  },
  { versionKey: false },
);

const IdGen = mongoose.model("IdGen", idGenSchema);

module.exports = IdGen;
