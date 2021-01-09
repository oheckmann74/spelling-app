import "./App.css";
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
      TextType: "ssml", // For example, "text"
      VoiceId: "Matthew", // For example, "Matthew"
    };
    console.log("TTS constructed");
  }

  setVoice(voice) {
    this.speechParams.VoiceId = voice;
  }

  getVoices(language) {
    // todo replace with this.client.describeVoices() call, and filter for right language
    return [
      "Ivy",
      "Joanna",
      "Kendra",
      "Kimberly",
      "Salli",
      "Joey",
      "Justin",
      "Kevin",
      "Matthew",
    ];
  }

  async speakText(text, newURLHandler) {
    console.log("speaking: " + text);
    this.speechParams.Text =
      '<speak><prosody rate="slow">' + text + "</prosody></speak>";
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

var LISTS = {
  en: {
    Short: "./google-10000-english-usa-no-swears-short.txt",
    Medium: "./google-10000-english-usa-no-swears-medium.txt",
    Long: "./google-10000-english-usa-no-swears-long.txt",
  },
};

export class WordGenerator {
  constructor() {
    console.log("word generator constructor");
    this.words = [];
  }

  load(language, list, callWhenReady) {
    console.log("word generator loading list started");
    
    fetch(LISTS[list])
      .then((response) => response.text())
      .then((data) => {
        this.words = data.split("\n");
        console.log("word generator done loading list");
        callWhenReady();
      })
      .catch((error) => {
        console.error(
          "There has been a problem with your fetch operation:",
          error
        );
        alert("Could not load word list, sorry!");
      });
  }

  getLists(language) {
    //alert(LISTS[language]);
    return Object.keys(LISTS[language]);
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
      language: "en",
      wordList: "Medium",
      voice: "Matthew",
      generator: new WordGenerator(),
      tts: new TTS(),
    };
  });
  settings.generator.load(settings.language, settings.wordList, () => {});
  const [word, setWord] = React.useState("");
  const [userInput, setUserInput] = React.useState("");
  const [feedback, setFeedback] = React.useState(
    <Alert severity="info">Click New Word to start!</Alert>
  );

  const handleNewWordClick = () => {
    setFeedback(
      <Alert severity="warning">
        You have given up. Let's try a new word...
      </Alert>
    );
    setTimeout(
      () => setFeedback(<Alert severity="info">Guess the new word</Alert>),
      800
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
      setFeedback(<Alert severity="info">Correct! The word is {word}.</Alert>);
      setTimeout(nextWord(), 200);
      setTimeout(
        () => setFeedback(<Alert severity="info">Guess the new word</Alert>),
        1000
      );
    } else {
      setFeedback(<Alert severity="info">Wrong, try again...</Alert>);
      audio.play();
    }
  };

  const handleVoiceChange = ({ target }) => {
    console.log("voice changed to " + target.value);
    settings.tts.setVoice(target.value);
    setSettings({...settings, voice: target.value});
    nextWord();
  };

  const handleHintClick = () => {
    let hint = "";
    [...word].forEach((letter) => {
      if (Math.random() < 0.5) {
        hint += "_";
      } else {
        hint += letter;
      }
    });
    setFeedback(<Alert severity="error">Here are some letters: "{hint}"</Alert>);
  };

  const handleWordListChange = ({ target }) => {
    setFeedback(
      <Alert severity="info">Let me load new word list, one second...</Alert>
    );
    settings.generator.load(settings.language, target.value, () => {
      setFeedback(<Alert severity="info">Finished loading new words</Alert>);
      setTimeout(() => setFeedback(""), 500);
    });
    setSettings({...settings, wordList: target.value});
  };

  const handleLanguageChange = ({ target }) => {
    console.log("language changed to " + target.value);
    //todo
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
              value={settings.language}
              onChange={handleLanguageChange}
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="de">German</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={4}>
          <FormControl className={classes.formControl}>
            <InputLabel id="word-list">Word List</InputLabel>
            <Select
              labelId="word-list"
              id="word-list-select"
              value={settings.wordList}
              onChange={handleWordListChange}
            >
              {settings.generator.getLists(settings.language).map((list) => (
                <MenuItem value={list}>{list}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={4}>
          <FormControl className={classes.formControl}>
            <InputLabel id="voice">Voice</InputLabel>
            <Select
              labelId="voice"
              id="voice-select"
              value={settings.voice}
              onChange={handleVoiceChange}
            >
              {settings.tts.getVoices(settings.language).map((voice) => (
                <MenuItem value={voice}>{voice}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={4}>
          <div>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                audio.play();
              }}
              disabled={url === "" ? true : false}
              fullWidth
            >
              Say Again
            </Button>
          </div>
        </Grid>

        <Grid item xs={4}>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleHintClick}
            fullWidth
            disabled={word === "" ? true : false}
          >
            Hint
          </Button>
        </Grid>

        <Grid item xs={4}>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleNewWordClick}
            fullWidth
          >
            New Word
          </Button>
        </Grid>

        <Grid item xs={8}>
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
        <Grid item xs={4}>
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

        <Grid item xs={12}>
          {feedback}
        </Grid>
      </Grid>
    </div>
  );
}

export default App;
