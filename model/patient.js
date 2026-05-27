const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
  _hospitalId:{
    type: Schema.Types.ObjectId,
    ref: 'Hospital',
    require: true
  },
  name: {
    type: String,
    required: true,
    minlength: 0,
    maxlength: 50,
    default: ""
  },
  age:{
    type:Number,
    required:true
  },
  dob:{
    type: String,
    require: true
  },
  recentVisitedDate:{
    type: String
  },
  email:{
    required:true,
    type: String,
  },
  phone:{
    type: String,
    validate: {
      validator: function(v) {
        return /\w/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    },
    required:[true, 'Patient phone number required']
  }
});

const Patient = mongoose.model("Patient", patientSchema);
exports.Patient = Patient;