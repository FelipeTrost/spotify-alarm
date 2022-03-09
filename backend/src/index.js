// First thing we do is setup the env variables
require("dotenv").config();

const app = require("./app");
const mongoose = require("mongoose");

const port = process.env.PORT || 5000;

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to mongodb");

    // TODO: index key to speedup lookups
    // require("./alarmSchema").createIndex({ date: 1 });
    const Alarm = require("./alarmSchema");

    if (false) {
      const tokens = {
        access_token:
          "BQBlC_sBKapvV-ekyhi8vd6QOtrDNCA3bXWQwmXuIOcQ1MMd-t2LR8vDbrindGOKGW5feUXg3Dia9-Uy1b9zzZFhjhqWxoDXiZkS1fvwEFpTMiTCWQ9Fx_Xn7YDfcIogWISZ_AMgKXL8c5_E-xUyJ7RKEWIsIA",
        refresh_token:
          "AQBR8nfIhEcFMQX5fLUfjTGpdvLVB0jNjJj-b9qQKZyE2R9ppSIqnOdu02usOw8ieh0ftD8ncmZ49plU62ERodwQL9VLyIyw4kVXXL9FjYRIkoCq7-mzcMRRDaVrLT2C4WQ",
        expires: Date.now(),
      };
      const alarm = new Alarm({
        date: Date.now() + 20_000,
        spotifyContext: "spotify:playlist:3cEYpjA9oz9GiPac4AsH4n",
        tokens,
      });
      await alarm.save();
    }

    app.listen(port, () => {
      /* eslint-disable no-console */
      console.log(`Listening: http://localhost:${port}`);
      /* eslint-enable no-console */
    });
  } catch (error) {
    console.error(error);
  }
})();
