const mongoose = require("mongoose");

const hostSchema = new mongoose.Schema(
  {
    name: String,
    isActive: Boolean,
    deleted_at: Date
  },
  { collection: "hosts", versionKey: false }
);

module.exports = mongoose.models.Host || mongoose.model("Host", hostSchema);
