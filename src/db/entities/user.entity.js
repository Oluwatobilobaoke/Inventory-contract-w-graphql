const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  username: {
    type: String,
    required: true,
  },
  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", userSchema);
