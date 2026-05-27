const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  adminName: {
    type: String,
    required: true,
    minlength: 0,
    maxlength: 50,
    default: ""
  },
  age:{
    type:Number,
    required:true,
    min: 18,
    max: 60
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
    required:[true, 'Admin phone number required']
  }
});

const Admin = mongoose.model("Admin", adminSchema);
exports.Admin = Admin;