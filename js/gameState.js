// central store for all game variables
// pulled out of game.js so the other modules dont
// need to declare globals themselves
//
// all other game files read/write through these variables
// keeps everything in sync without passing state around everywhere

var currentRound = 1;
var lives = 3;
var score = 0;
var streak = 0;
var timeRemaining = 10;
var timerInterval = null;
var gameIsActive = false;

// the real answer from the heart api and what the ai claimed
var actualTrueAnswer = 0;
var aiClaimedAnswer = 0;
var isAiLying = false;

// full history of each round - used for results page + db save
var gameHistoryArray = [];

// dynamic difficulty - set from db based on how many wins the user has
var userRankLevel = 0;

// mechanic flags - reset each round in fetchNewCase
var isSwitchedNow = false;
var isBlackoutDone = false;

// mistake memory - persisted to localstorage between sessions
var robotMistakeMemory = JSON.parse(
  localStorage.getItem("robotMistakeMemory") || "{}",
);
