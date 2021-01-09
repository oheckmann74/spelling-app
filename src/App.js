import "./App.css";
import WordsFile from "./google-10000-english-usa-no-swears-medium.txt";
import React from "react";
import Grid from "@material-ui/core/Grid";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import { makeStyles } from "@material-ui/core/styles";
import { useState } from "react";
import Button from "@material-ui/core/Button";
import Alert from "@material-ui/lab/Alert";
import TextField from "@material-ui/core/TextField";

export class TTS {
  constructor() {
    const {
      CognitoIdentityClient,
    } = require("@aws-sdk/client-cognito-identity");
    const {
      fromCognitoIdentityPool,
    } = require("@aws-sdk/credential-provider-cognito-identity");
    const {
      Polly,
      paginateListSpeechSynthesisTasks,
    } = require("@aws-sdk/client-polly");

    // Create the Polly service client, assigning your credentials
    this.client = new Polly({
      region: "us-west-1",
      credentials: fromCognitoIdentityPool({
        client: new CognitoIdentityClient({ region: "us-west-1" }),
        identityPoolId: "us-west-1:6efc86a3-4fda-40f5-80a5-427cb0a1457a", // IDENTITY_POOL_ID
      }),
    });

    // Set the parameters
    this.speechParams = {
      OutputFormat: "mp3", // For example, 'mp3'
      SampleRate: "16000", // For example, '16000
      Text: "hello world", // The 'speakText' function supplies this value
      TextType: "text", // For example, "text"
      VoiceId: "Matthew", // For example, "Matthew"
    };
    console.log("TTS constructed");
  }

  async speakText(text, newURLHandler) {
    console.log("speaking: " + text);
    this.speechParams.Text = text;
    const {
      getSynthesizeSpeechUrl,
    } = require("@aws-sdk/polly-request-presigner");
    let client = this.client;
    try {
      let url = await getSynthesizeSpeechUrl({
        client,
        params: this.speechParams,
      });
      console.log(url);
      newURLHandler(url);
    } catch (err) {
      console.log("Error", err);
    }
  }
}

//-------------

export class WordGenerator {
  constructor(language, list, callWhenReady) {
    console.log("constructor word generator " + language + " " + list);
    this.words = [];
    fetch(WordsFile)
      .then((response) => response.text())
      .then((data) => {
        this.words = data.split("\n");
        callWhenReady();
      })
      .catch((error) => {
        console.error(
          "There has been a problem with your fetch operation:",
          error
        );
        alert("Could not load word list");
      });
  }
  nextWord() {
    //console.log(this.words);
    //console.log(this.words.length);
    return this.words[Math.floor(Math.random() * this.words.length)];
  }
}

//---------

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    width: 500,
    align: "center",
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: "center",
    color: theme.palette.text.secondary,
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
  selectEmpty: {
    marginTop: theme.spacing(2),
  },
}));

// -----------

function App() {
  const classes = useStyles();
  const [settings, setSettings] = React.useState(() => {
    return {
      language: "english",
      wordList: "medium",
      voice: "Kevin",
      generator: new WordGenerator("english", "medium", () => {
        console.log("word list loaded");
      }),
      tts: new TTS(),
    };
  });
  const [word, setWord] = React.useState("");
  const [userInput, setUserInput] = React.useState("");
  const [feedback, setFeedback] = React.useState(
    <Alert severity="info">Click New Word to start!</Alert>
  );

  const handleNewWordClick = () => {
    setFeedback(
      <Alert severity="info">You have given up. Let's try a new word...</Alert>
    );
    nextWord();
  };

  const [url, setURL] = useState("");
  const [audio, setAudio] = useState(() => {
    console.log("New HTML Audio object created");
    return new Audio(url);
  });

  const nextWord = () => {
    const newWord = settings.generator.nextWord();
    settings.tts.speakText(newWord, (newURL) => {
      setURL(newURL);
      console.log("new URL received");
      audio.autoplay = true;
      audio.src = newURL;
    });
    setUserInput("");
    setWord(newWord);
  };

  const handleUserInput = ({ target }) => {
    setUserInput(target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (userInput === "") {
      return;
    }
    console.log("submit: " + userInput);
    if (
      userInput.trim().toLocaleUpperCase().localeCompare(word.toUpperCase()) ===
      0
    ) {
      setFeedback(
        <Alert severity="info">Correct! Let's try the next one...</Alert>
      );
      nextWord();
    } else {
      setFeedback(<Alert severity="info">Wrong, try again...</Alert>);
      audio.play();
    }
  };

  return (
    <div className="App">
      <Grid container spacing={1} className={classes.root}>
        <Grid item xs={4}>
          <FormControl className={classes.formControl}>
            <InputLabel id="language">Language</InputLabel>
            <Select
              labelId="language"
              id="language-select"
              value={10}
              onChange=""
            >
              <MenuItem value={10}>Ten</MenuItem>
              <MenuItem value={20}>Twenty</MenuItem>
              <MenuItem value={30}>Thirty</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={4}>
          <FormControl className={classes.formControl}>
            <InputLabel id="word-list">Word List</InputLabel>
            <Select
              labelId="word-list"
              id="word-list-select"
              value={10}
              onChange=""
            >
              <MenuItem value={10}>Ten</MenuItem>
              <MenuItem value={20}>Twenty</MenuItem>
              <MenuItem value={30}>Thirty</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={4}>
          <FormControl className={classes.formControl}>
            <InputLabel id="voice">Voice</InputLabel>
            <Select labelId="voice" id="voice-select" value={10} onChange="">
              <MenuItem value={10}>Ten</MenuItem>
              <MenuItem value={20}>Twenty</MenuItem>
              <MenuItem value={30}>Thirty</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <div>
            <Button
              onClick={() => {
                audio.play();
              }}
              disabled={url === "" ? true : false}
              fullWidth
            >
              Play Again
            </Button>
          </div>
        </Grid>

        <Grid item xs={6}>
          <TextField
            id="word-input"
            value={userInput}
            onInput={handleUserInput}
            onKeyDown={(e) => {
              if (e.keyCode === 13) {
                handleSubmit(e);
              }
            }}
            id="standard-basic"
            label="Spell the word"
            size="large"
            fullWidth
          />
        </Grid>
        <Grid item xs={3}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            fullWidth
          >
            Submit
          </Button>
        </Grid>
        <Grid item xs={3}>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleNewWordClick}
            fullWidth
          >
            New Word
          </Button>
        </Grid>


        <Grid item xs={12}>
          {feedback}
        </Grid>

      </Grid>
    </div>
  );
}

export default App;
