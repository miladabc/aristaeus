const mongoose = require('mongoose');

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      lowercase: true
    },
    lastName: {
      type: String,
      required: true,
      lowercase: true
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      index: true
    },
    avatar: {
      type: String
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    password: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
