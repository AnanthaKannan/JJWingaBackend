const mongoose = require("mongoose");

const patientRecordSchema = new mongoose.Schema({
  _patientId:{
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    require: true
  },
  temperature:{
    type:Number
  },
  heartRate:{
    type:Number
  },
  disease: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  insertDate:{
    type: String,
    default: Date
  },
  updateDate:{
    type: String
  },
  slot:{
    type: Object,
    fields: {
      id: Number,
      time: String
    }
  }
});

const PatientRecord = mongoose.model("PatientRecord", patientRecordSchema);
exports.PatientRecord = PatientRecord;