import { Anchor, Footer } from "grommet";
import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Alarms from "./Alarms";
import Landing from "./Landing";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/alarms" element={<Alarms />} />
      </Routes>
      <Footer justify="center">
        <Anchor label="github" color="neutral-2" />
        <span>&middot;</span>
        <Anchor label="legal" color="neutral-2" />
        <span>&middot;</span>
        <Anchor label="buy me a coffe" color="neutral-2" />
      </Footer>
    </>
  );
}

export default App;
