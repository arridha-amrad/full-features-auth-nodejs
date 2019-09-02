const mongoose = require('mongoose')
const UserSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  created: {
    type: Date,
    default: Date.now
  },
  resetPasswordLink: {
    data: String,
    default: ""
  },
  updated: Date,
})
module.exports = mongoose.model('users', UserSchema)