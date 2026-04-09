// robot voice and sound effects
// checking localStorage settings before playing anything
// so the user preferences from settings.html are respected

var taunts = [
  "Your meat brain is too slow.",
  "I process millions of calculations. You can't even count.",
  "Detective? More like defective.",
  "Error 404: Human intelligence not found.",
  "Even a pocket calculator is smarter than you.",
  "Are you guessing, or is your algorithm just that flawed?",
  "I'd suggest an upgrade to your prefrontal cortex.",
  "My cache holds more logic than your entire nervous system.",
  "Fascinating. A spectacular display of human error.",
  "You are debugging my patience.",
  "I ran a simulation of your success. The probability was zero.",
  "Is this your peak processing power? How disappointing.",
  "Perhaps you should let an abacus do the thinking.",
];

function getRandomTaunt() {
  return taunts[Math.floor(Math.random() * taunts.length)];
}

// speaks the given text using the browser speech synthesis api
// corrupts the voice at higher ranks to make it sound more threatening
function robotSpeak(text) {
  animateRobotSpeak();

  let voiceOn = localStorage.getItem("voiceEnabled") !== "false";
  if (!voiceOn || !("speechSynthesis" in window)) return;

  let utterance = new SpeechSynthesisUtterance(text);

  // mechanic 2: corrupted comms - inspector rank (5) and above
  // lower pitch + slower rate makes it sound creepy and distorted
  if (userRankLevel >= 5) {
    utterance.pitch = 0.1;
    utterance.rate = 0.6;
  } else {
    utterance.pitch = 0.8;
    utterance.rate = 1.0;
  }

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

// plays the drum roll sound during verify countdown
// returns the audio element so the caller can pause it when done
function playDrumRoll() {
  let soundOn = localStorage.getItem("soundEnabled") !== "false";
  if (!soundOn) return null;

  let drum = document.getElementById("drumSound");
  if (!drum) return null;

  drum.currentTime = 0;
  drum.play().catch((e) => console.log("audio error:", e));
  return drum;
}
