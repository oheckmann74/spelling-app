
const { CognitoIdentityClient } = require("@aws-sdk/client-cognito-identity");
const {
  fromCognitoIdentityPool,
} = require("@aws-sdk/credential-provider-cognito-identity");
const { Polly } = require("@aws-sdk/client-polly");
const { getSynthesizeSpeechUrl } = require("@aws-sdk/polly-request-presigner");

// Create the Polly service client, assigning your credentials
const client = new Polly({
  region: "us-west-1",
  credentials: fromCognitoIdentityPool({
    client: new CognitoIdentityClient({ region: "us-west-1" }),
    identityPoolId: "us-west-1:6efc86a3-4fda-40f5-80a5-427cb0a1457a" // IDENTITY_POOL_ID
  }),
});

// Set the parameters
const speechParams = {
  OutputFormat: "mp3", // For example, 'mp3'
  SampleRate: "16000", // For example, '16000
  Text: "", // The 'speakText' function supplies this value
  TextType: "text", // For example, "text"
  VoiceId: "Kevin" // For example, "Matthew"
};

const speakText = async () => {
    // Update the Text parameter with the text entered by the user
    speechParams.Text = document.getElementById("textEntry").value;
    try{
      let url = await getSynthesizeSpeechUrl({
        client, params: speechParams
      });
    console.log(url);
    // Load the URL of the voice recording into the browser
    document.getElementById('audioSource').src = url;
    document.getElementById('audioPlayback').load();
    document.getElementById('result').innerHTML = "Speech ready to play.";
  } catch (err) {
    console.log("Error", err);
    document.getElementById('result').innerHTML = err;
  }
};
// Expose the function to the browser
//window.speakText = speakText;


export default speakText;