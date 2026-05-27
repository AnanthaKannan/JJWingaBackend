const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  _hospitalId: {
    type: Schema.Types.ObjectId,
    ref: 'Hospital',
    require: true
  },
  name: {
    type: String,
    required: true,
    minlength: 0,
    maxlength: 50
  },
  specialist: {
    type: String,
    required: true,
    minlength: 0,
    maxlength: 50
  },
  availableTime:{
    type:Array,
    required:true,
    fields:[{
      from: String,
      to: String
    }]
  },
  availableDay:{
    type: Object,
    required:true,
    fields:{
      sunday: Boolean,
      monday: Boolean,
      tuesday: Boolean,
      wednesday: Boolean,
      thursday: Boolean,
      friday: Boolean,
      saturday: Boolean
    }
  },
  timePerPatient:{
    type:Number,
    required:true
  },
});

const Doctor = mongoose.model("Doctor", doctorSchema);
exports.Doctor = Doctor;