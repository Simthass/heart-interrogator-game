//
// INTEROPERABILITY :
// this game consumes two completely separate third-party REST APIs:
//
// 1. Heart Game API (marcconrad.com)
//    - endpoint: https://marcconrad.com/uob/heart/api.php?out=json
//    - protocol: HTTP GET, response format: JSON
//    - this is a completely different system on different infrastructure
//
// 2. YesNo API (yesno.wtf)
//    - endpoint: https://yesno.wtf/api
//    - protocol: HTTP GET, response format: JSON
//    - returns: { answer: "yes"|"no", ... }
//    - I use this to decide randomly if the AI lies or tells truth
//    - using an external api here means the lie pattern is truly unpredictable
//
// this is a classic example of interoperability between independent systems

async function fetchRoundData() {
  // call both apis in parallel to save time
  // Promise.all throws if either fails so we catch in the caller
  let [heartRes, yesnoRes] = await Promise.all([
    fetch("https://marcconrad.com/uob/heart/api.php?out=json"),
    fetch("https://yesno.wtf/api"),
  ]);

  let heartData = await heartRes.json();
  let yesnoData = await yesnoRes.json();

  return { heartData, yesnoData };
}

// decides whether the ai lies and by how much based on yesno api result
// returns the number the ai will claim
function calculateAiAnswer(trueAnswer, yesnoAnswer) {
  if (yesnoAnswer === "yes") {
    // ai tells the truth
    return { lying: false, claimed: trueAnswer };
  } else {
    // ai lies - offset by 1 or 2 in either direction
    let offset = Math.floor(Math.random() * 2) + 1;
    let claimed =
      Math.random() > 0.5 ? trueAnswer + offset : trueAnswer - offset;
    if (claimed < 0) claimed = trueAnswer + 1;
    return { lying: true, claimed };
  }
}

// called if both apis are unavailable - better than crashing the game
function getFallbackAiAnswer(trueAnswer) {
  let lying = Math.random() > 0.5;
  if (!lying) return { lying: false, claimed: trueAnswer };
  let offset = Math.floor(Math.random() * 2) + 1;
  let claimed = Math.random() > 0.5 ? trueAnswer + offset : trueAnswer - offset;
  if (claimed < 0) claimed = trueAnswer + 1;
  return { lying, claimed };
}
