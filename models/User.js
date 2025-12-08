const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: false,
    default: null,
  },
  phoneNumber: {
    type: String,
    required: false,
    default: null,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: "user",
  },
  isGuestAccount: {
    type: Boolean,
    default: false,
  },
});

// Create sparse unique indexes - these allow multiple null values
UserSchema.index({ email: 1 }, { unique: true, sparse: true });
UserSchema.index({ phoneNumber: 1 }, { unique: true, sparse: true });

// Disable auto index creation (we'll handle it manually in server.js)
UserSchema.set('autoIndex', false);

const User = mongoose.model("User", UserSchema);
module.exports = User;
