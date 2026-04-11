// central store for all game letiables
// pulled out of game.js so the other modules dont
// need to declare globals themselves
//
// all other game files read/write through these letiables
// keeps everything in sync without passing state around everywhere

let currentRound = 1;
let lives = 3;
let score = 0;
let streak = 0;
let timeRemaining = 10;
let timerInterval = null;
let gameIsActive = false;

// the real answer from the heart api and what the ai claimed
let actualTrueAnswer = 0;
let aiClaimedAnswer = 0;
let isAiLying = false;

// full history of each round - used for results page + db save
let gameHistoryArray = [];

// dynamic difficulty - set from db based on how many wins the user has
let userRankLevel = 0;

// mechanic flags - reset each round in fetchNewCase
let isSwitchedNow = false;
let isBlackoutDone = false;

// mistake memory - persisted to localstorage between sessions
let robotMistakeMemory = JSON.parse(
  localStorage.getItem("robotMistakeMemory") || "{}",
);
