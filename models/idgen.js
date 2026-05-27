const mongoose = require("mongoose");

const idGenSchema = new mongoose.Schema({
  studentLastId: {
    type: Number,
    default: 100,
  },
});

const IdGen = mongoose.model("IdGen", idGenSchema);

module.exports = IdGen;

// const idGen = await IdGen.findOneAndUpdate(
//   {},
//   { $inc: { studentLastId: 1 } },
//   { new: true, upsert: true }
// );
