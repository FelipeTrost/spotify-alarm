const axios = require("axios");

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const server_url = process.env.SERVER_URL;
const auth_string =
  "Basic " + Buffer.from(`${client_id}:${client_secret}`).toString("base64");

// returns access token, and refreshes tokens if needed
async function getToken(tokens) {
  const now = new Date();
  if (now < tokens.expires) return tokens.access_token;

  // need to refresh
  try {
    // We do this before, cause it's better to be safe than sorry
    const expires = new Date();

    const { data } = await axios({
      method: "post",
      url: "https://accounts.spotify.com/api/token",
      params: {
        grant_type: "refresh_token",
        refresh_token: tokens.refresh_token,
      },
      headers: {
        Authorization: auth_string,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    expires.setSeconds(expires.getSeconds() + data.expires_in);

    tokens.access_token = data.access_token;
    tokens.expires = expires;

    return tokens.access_token;
  } catch (error) {
    console.log(error.response || error);
    throw new Error("Couldn't refresh tokens, log in again");
  }
}

async function getIdentifier(token) {
  try {
    const { data } = await axios.get("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer  ${token}`,
      },
    });

    return data.id;
  } catch (err) {
    console.log(err.response || err);
    return null;
  }
}

async function codeToToken(code) {
  try {
    // We do this before, cause it's better to be safe than sorry
    const expires = new Date();

    const { data } = await axios({
      method: "post",
      url: "https://accounts.spotify.com/api/token",
      params: {
        grant_type: "authorization_code",
        redirect_uri: `${server_url}/spotify`,
        code,
      },
      headers: {
        Authorization: auth_string,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    expires.setSeconds(expires.getSeconds() + data.expires_in);

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires,
    };
  } catch (error) {
    console.log(error.response || error);
    return false;
  }
}

async function clientCredentials(callback) {
  let expires;
  try {
    const { data } = await axios({
      method: "post",
      url: "https://accounts.spotify.com/api/token",
      params: {
        grant_type: "client_credentials",
      },
      headers: {
        Authorization: auth_string,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const { access_token, expires_in } = data;
    expires = expires_in;
    console.log("refresh got:", access_token);

    callback(access_token);
  } catch (error) {
    console.log(error.response || error);
  } finally {
    // call function again when the token expires
    setTimeout(() => clientCredentials(callback), expires * 1000);
  }
}

async function getTrack(token, track_id) {
  try {
    const { data } = await axios.get(
      `https://api.spotify.com/v1/tracks/${track_id.split(":")[2]}`,
      {
        headers: {
          Authorization: `Bearer  ${token}`,
        },
      }
    );

    return data;
  } catch (err) {
    console.log(err.response);
    throw new Error("Invalid token");
  }
}

async function putInQueue(token, track_id, device_id) {
  console.log("putting in queue");
  const deviceString = device_id ? `&device_id=${device_id}` : "";
  try {
    const response = await axios.post(
      `https://api.spotify.com/v1/me/player/queue?uri=${track_id}${deviceString}`,
      {},
      {
        headers: {
          Authorization: `Bearer  ${token}`,
        },
      }
    );

    return true;
  } catch (err) {
    console.log(err.response.data);
    throw new Error(err.response.data.error.message || "An error ocurred");
  }
}

async function getPlaylists(token) {
  try {
    const { data } = await axios.get(
      `https://api.spotify.com/v1/me/playlists`,
      {
        headers: {
          Authorization: `Bearer  ${token}`,
        },
      }
    );

    return data;
  } catch (err) {
    console.log(err.response);
    throw new Error("Invalid token");
  }
}

async function getDevices(token) {
  try {
    const { data } = await axios.get(
      `https://api.spotify.com/v1/me/player/devices`,
      {
        headers: {
          Authorization: `Bearer  ${token}`,
        },
      }
    );

    return data.devices;
  } catch (err) {
    console.log(err.response);
    throw new Error("Invalid token");
  }
}

async function play(token, context_uri, device_id) {
  try {
    const { data } = await axios.default.put(
      `https://api.spotify.com/v1/me/player/play?player_id=${device_id || ""}`,
      { context_uri },
      {
        headers: {
          Authorization: `Bearer  ${token}`,
        },
      }
    );

    return data.devices;
  } catch (err) {
    console.log(err.response);
    throw new Error("Invalid token");
  }
}

async function uriToName(token, uri) {
  try {
    const [_, type, id] = uri.split(":");
    console.log(_, type, id);

    const { data } = await axios.get(
      `https://api.spotify.com/v1/${type}s/${id}`,
      {
        headers: {
          Authorization: `Bearer  ${token}`,
        },
      }
    );

    return data.name;
  } catch (err) {
    console.log(err.response.data);
    throw new Error("Invalid token or uri");
  }
}

module.exports = {
  getTrack,
  putInQueue,
  clientCredentials,
  codeToToken,
  getIdentifier,
  getToken,
  getPlaylists,
  getDevices,
  play,
  uriToName,
};
