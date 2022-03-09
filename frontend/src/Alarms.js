import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Add,
  AddCircle,
  Close,
  Share,
  ShareRounded,
  Trash,
} from "grommet-icons";
import {
  Anchor,
  Box,
  Button,
  Footer,
  Grommet,
  Heading,
  Main,
  Nav,
  Paragraph,
  Sidebar,
  Layer,
  FormField,
  TextInput,
  TextArea,
  CheckBox,
  MaskedInput,
  DateInput,
  List,
  Text,
} from "grommet";

async function deleteAlarm(id) {
  try {
    const r = await fetch(`${process.env.REACT_APP_SERVER_URL}/alarm/${id}`, {
      credentials: "include",
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const { success, message } = await r.json();

    if (!success) throw new Error(message);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export default function Alarms() {
  const [alarms, setAlarms] = useState([]);
  const [addPopup, setAddPopup] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${process.env.REACT_APP_SERVER_URL}/alarm`, {
          credentials: "include",
        });
        const { success, message } = await r.json();

        if (!success) throw new Error("Sign in");

        setAlarms(message.alarms);
      } catch (error) {
        console.error(error);
        navigate("/");
      }
    })();
  }, []);

  return (
    <>
      <Box
        height="100%"
        justify="center"
        style={{ position: "fixed", left: "8%" }}
      >
        <Sidebar background="brand" round="small" colorIndex="ok" height="">
          <Nav gap="small">
            <Button icon={<AddCircle />} onClick={() => setAddPopup(true)} />
            {navigator.share && (
              <Button
                icon={<Share />}
                onClick={() =>
                  navigator.share({
                    title: "Spotify Alarm",
                    text: "Set alarms that play music on spotify",
                    url: document.location.href,
                  })
                }
              />
            )}
          </Nav>
        </Sidebar>
      </Box>

      <Box
        pad="large"
        animation="fadeIn"
        width="large"
        justify="center"
        align="center"
        fill
      >
        {alarms.length === 0 && (
          <>
            <Heading>No alarms set</Heading>
            <Anchor
              onClick={() => setAddPopup(true)}
              label="Create your first alarm"
            />
          </>
        )}

        {alarms.length !== 0 && (
          <>
            <Heading>Your Alarms</Heading>
            <List
              data={alarms}
              primaryKey={(item) => (
                <Text key={item._id} size="large" weight="bold">
                  {item.spotifyContext.name}
                </Text>
              )}
              secondaryKey={(item) => (
                <Box direction="row" align="center" gap="10px">
                  <Text>{new Date(item.date).toLocaleString()}</Text>

                  <Box round="full" overflow="hidden">
                    <Button
                      icon={<Trash />}
                      hoverIndicator
                      onClick={() =>
                        (async () => {
                          try {
                            await deleteAlarm(item._id);
                            setAlarms((al) =>
                              al.filter((a) => a._id != item._id)
                            );
                          } catch (error) {
                            alert(error.message);
                          }
                        })()
                      }
                    />
                  </Box>
                </Box>
              )}
            />
          </>
        )}
      </Box>

      {addPopup && (
        <Layer
          label="add alarm"
          onEsc={() => setAddPopup(false)}
          onClickOutside={() => setAddPopup(false)}
          position="right"
          full="vertical"
          animation="slide"
        >
          <AddPopup
            onClose={() => setAddPopup(false)}
            addToAlarms={(n) => setAlarms((a) => [...a, n])}
          />
        </Layer>
      )}
    </>
  );
}

function AddPopup({ onClose, addToAlarms }) {
  const [repeats, setRepeats] = useState(false);
  const [time, setTime] = useState("");
  const [date, setDate] = useState(new Date().toISOString());
  const [spotifyContext, setSpotifyContext] = useState("");

  async function submit() {
    try {
      const submitDate = new Date(date);
      console.log("", submitDate);
      const [hours, minutes] = time.split(":");
      submitDate.setHours(hours || 0);
      submitDate.setMinutes(minutes || 0);
      submitDate.setSeconds(0);

      if (submitDate < new Date()) {
        // if its a repeating alarm, the first ring will be tomorrow
        if (repeats) submitDate.setDate(submitDate.getDate() + 1);
        //   if it's a one time alarm and it's in the past we have a problem
        else throw new Error("Alarm in the past");
      }
      console.log(submitDate);

      const r = await fetch(`${process.env.REACT_APP_SERVER_URL}/alarm`, {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // 'Content-Type': 'application/x-www-form-urlencoded',
        },

        body: JSON.stringify({
          date: submitDate,
          repeats,
          spotifyContext,
        }),
      });

      const { success, message } = await r.json();

      if (!success) throw new Error(message);

      addToAlarms(message.alarm);
      onClose();
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <Box
      as="form"
      fill="vertical"
      overflow="auto"
      width="medium"
      pad="medium"
      onSubmit={onClose}
    >
      <Box flex={false} direction="row" justify="between">
        <Heading level={2} margin="none">
          Create alarm
        </Heading>
        <Button icon={<Close />} onClick={onClose} />
      </Box>

      <Box overflow="auto" pad={{ vertical: "medium" }}>
        <FormField>
          <CheckBox
            label="Repeats (daily)"
            toggle
            value={repeats}
            onChange={(e) => setRepeats(e.target.checked)}
          />
        </FormField>

        {!repeats && (
          <FormField label="Date">
            <DateInput
              format="dd/mm/yyyy"
              value={date}
              onChange={({ value }) => setDate(value)}
            />
          </FormField>
        )}

        <FormField label="Time">
          <MaskedInput
            mask={[
              {
                length: 2,
                options: Array.from({ length: 24 }, (v, k) =>
                  k < 10 ? "0" + k : k
                ),
                regexp: /^[0-1]{0,1}[0-9]$|^[2][0-3]$/,
                placeholder: "hh",
              },
              { fixed: ":" },
              {
                length: 2,
                options: Array.from({ length: 60 }, (v, k) =>
                  k < 10 ? "0" + k : k
                ),
                regexp: /^[0-5][0-9]$|^[0-9]$/,
                placeholder: "mm",
              },
            ]}
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </FormField>

        <FormField label="Spotify uri">
          <TextInput
            value={spotifyContext}
            onChange={(e) => setSpotifyContext(e.target.value)}
          />
        </FormField>
      </Box>
      <Box flex={false} as="footer" align="start">
        <Button label="Add" onClick={submit} primary />
      </Box>
    </Box>
  );
}
