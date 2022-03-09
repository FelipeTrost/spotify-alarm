const mongoose = require("mongoose");

const alarmSchema = new mongoose.Schema({
  userIdentifier: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: [true, "Date is required"],
  },
  // Alarm repeats daily
  repeats: {
    type: Boolean,
    default: false,
  },
  // For now we are just gonna do playlists, but these can be almost any spotify uri
  spotifyContext: {
    uri: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
  device: {
    deviceId: {
      type: String,
      default: "",
    },
    name: {
      type: String,
      default: "",
    },
  },
  // Here we could use another collection, but time is of the essence
  tokens: {
    type: {
      access_token: { type: String, required: true },
      refresh_token: { type: String, required: true },
      expires: { type: Date, required: true },
    },
    required: true,
  },
});

alarmSchema.methods.toJson = function () {
  const obj = this.toObject();
  delete obj.tokens;
  return obj;
};

const Alarm = mongoose.model("Alarm", alarmSchema);

module.exports = Alarm;
