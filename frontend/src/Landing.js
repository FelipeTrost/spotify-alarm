import React from "react";
import { Button, Heading, Main, Paragraph } from "grommet";

const spotifyAuthUrl = `https://accounts.spotify.com/authorize?client_id=${process.env.REACT_APP_CLIENT_ID}&response_type=code&redirect_uri=${process.env.REACT_APP_SERVER_URL}/spotify&scope=user-modify-playback-state%20user-read-playback-state`;

export default function Landing() {
  return (
    <Main
      pad="large"
      align="center"
      animation="fadeIn"
      margin={{ top: "10vh" }}
    >
      <Heading>Spotify Alarm</Heading>
      <Paragraph textAlign="center">
        To wake up dancing (or some other pretty sounding thing)
      </Paragraph>
      <Button
        href={spotifyAuthUrl}
        label="Login with spotify"
        size="large"
        margin={{ top: "60px" }}
        primary
      />
    </Main>
  );
}
