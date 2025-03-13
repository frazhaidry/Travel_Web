const mongoose = require("mongoose")
const Schema = mongoose.Schema;

const userScheme = new Schema({
   fullName: {
      type: String,
      required: true
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
   createdOn: {
      type: Date,
      default: Date.now
   }
})

module.exports = mongoose.model("User", userScheme);