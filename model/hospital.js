const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 0,
    maxlength: 50,
    default: ""
  },
  logUrl: {
    type: String,
    default: ""
  },
  address: {
    type: String,
    require: true
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
    required:[true, 'Hospital phone number required']
  }
});

const Hospital = mongoose.model("Hospital", hospitalSchema);
exports.Hospital = Hospital;