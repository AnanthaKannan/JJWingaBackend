const mongoose = require('mongoose');

const idGenSchema = new mongoose.Schema(
  {
    studentLastId: {
      type: Number,
      default: 100,
    },
  },
  {
    timestamps: true, // auto adds createdAt and updatedAt
  }
);

const IdGen = mongoose.model('IdGen', idGenSchema);

module.exports = IdGen;


// const idGen = await IdGen.findOneAndUpdate(
//   {},
//   { $inc: { studentLastId: 1 } },
//   { new: true, upsert: true }
// );
