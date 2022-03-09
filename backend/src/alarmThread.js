const Alarm = require("./alarmSchema");
const spotify = require("./spotify");

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// Use of awiat in some places is debatable, since we want to be done quicly

async function check() {
  while (true) {
    try {
      await sleep(1_000);
      const cursor = await Alarm.find({
        date: { $lte: Date.now() },
        processed: false,
      });

      for (const alarm of cursor) {
        // Send play command
        console.log(alarm);

        // Try sending play command
        let errorPlay;
        try {
          // This also modifies the tokens inside alarm
          const access_token = await spotify.getToken(alarm.tokens);

          await spotify.play(
            access_token,
            alarm.spotifyContext.uri,
            alarm.deviceId
          );
        } catch (error) {
          console.error(error);
          errorPlay = error.data && error.data.error.status;
        }

        if (!alarm.repeats) {
          await alarm.delete();
        } else {
          const newDate = new Date(alarm.date);
          newDate.setDate(newDate.getDate() + 1);
          alarm.date = newDate;

          await alarm.save();
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
}

module.exports = check;
