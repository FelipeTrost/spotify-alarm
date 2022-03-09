const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const session = require("express-session");

const middlewares = require("./middlewares");
const spotify = require("./spotify");
const Alarm = require("./alarmSchema");

const app = express();

app.use(morgan("dev"));
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());

// sessions
const sess = {
  secret: process.env.SESSION_SECRET,
  saveUninitialized: false,
  name: "funcookie",
  cookie: {
    // path: "/",
    // domain: process.env.FRONTEND_URL,
  },
};

if (app.get("env") === "production") {
  app.set("trust proxy", 1); // trust first proxy
  sess.cookie.secure = true; // serve secure cookies
}

app.use(session(sess));

// Ensure tokens saved are valid, and if so renew them
// Since we check with the expire date of the token
// we make a request to spotify once an hour per use,
// which seems pretty accteptable to me
app.use(async (req, res, next) => {
  try {
    if (req.session.tokens) await spotify.getToken(req.session.tokens);

    next();
  } catch (error) {
    console.error("Invalid token stored in session", error);
    // if (req.session) req.session.destroy();
    next();
  }
});

app.get("/", (req, res) => {
  res.json({
    message: "Wakey Wakey 🦄🌈✨👋🌎🌍🌏✨🌈🦄",
  });
});

const spotifyAuthUrl = `https://accounts.spotify.com/authorize?client_id=${process.env.CLIENT_ID}&response_type=code&redirect_uri=http://localhost:5000/spotify&scope=user-modify-playback-state%20user-read-playback-state`;
console.log(spotifyAuthUrl);

// const tokens = {
//   access_token:
//     "BQAVlkWOfg1nRQ7-drWS4AJHIFVjEQSV8QS6j0NlxM_md2MIT2UTool5CUR4Fk_r3DQUepa26YJGqxq9Q_5FRY5DghasEK-5ShLj4CP4-P-TtpKR8IRWpeXezb84W5o58L6-nwHdrUjWMjHZY1ya-eY8tDAmUQ",
//   refresh_token:
//     "AQA_6t8jYll-6erYXalHJqDf2Rs_7y6xOk_lBWBsYMroQFNid7gRiWsOhzdWoYUO2194w0SuhkQ9P_8vVSdkOcSrNUjFkzAajgeLguKL3A1FGuZQpLwk2cvfmJau8CbuGbQ",
// };

// const spotifyContext = "spotify:album:6vBJJJEUCqmzaBnzwtRgPK";
// spotify.uriToName(tokens.access_token, spotifyContext).then(console.log);

require("./alarmThread")();

app.get("/spotify", async (req, res, next) => {
  try {
    const { code } = req.query;

    const tokens = await spotify.codeToToken(code);
    if (!tokens) throw new Error("Invalid code");

    const identifier = await spotify.getIdentifier(tokens.access_token);

    // Store data in sessions
    req.session.tokens = tokens;
    req.session.userIdentifier = identifier;

    res.redirect(`${process.env.FRONTEND_URL}/alarms`);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// Starting here we need to have a session
app.use((req, res, next) => {
  try {
    console.log("middleware", req.session);
    if (!req.session.tokens) throw new Error("Not logged in");

    spotify.getToken(req.session.tokens);

    next();
  } catch (error) {
    console.error("Invalid token stored in session", error);
    req.session.destroy();
    res.statusCode = 401;
    next(error);
  }
});

app.post("/alarm", async (req, res, next) => {
  try {
    const { date, repeats, spotifyContext, deviceId } = req.body;

    const alarm = new Alarm({
      userIdentifier: req.session.userIdentifier,
      date: date,
      repeats,
      spotifyContext: {
        uri: spotifyContext,
        name: await spotify.uriToName(
          req.session.tokens.access_token,
          spotifyContext
        ),
      },
      deviceId,
      tokens: req.session.tokens,
    });

    await alarm.save();

    res.json({ success: true, message: { alarm: alarm.toJson() } });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

app.get("/alarm", async (req, res, next) => {
  console.log("getting alarm");
  try {
    const alarms = await Alarm.find({
      userIdentifier: req.session.userIdentifier,
    });

    const alarmsFiltered = [];
    for (const alarm of alarms) alarmsFiltered.push(alarm.toJson());

    res.json({ success: true, message: { alarms: alarmsFiltered } });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

app.delete("/alarm/:id", async (req, res, next) => {
  try {
    // TODO: Error handling here needs to be checked
    const alarm = await Alarm.findOneAndDelete({ _id: req.params.id });

    delete alarm.tokens;
    res.json({ success: true, message: { alarm: alarm.toJson() } });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

module.exports = app;
