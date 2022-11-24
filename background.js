const START = "START";
const STOPWATCH = "STOPWATCH";
const COUNTDOWN = "COUNTDOWN";

var stopwatch_date = Date();
var countdown_date = Date();

var state = START;

// notificaton
function notification() {
  chrome.notifications.create("countdownEnd", {
    iconUrl: "Resources/Icon/pixil-frame-0 (3).png",
    title: "⏰ Cucumbro!",
    message: "Return to your job",
    type: "basic",
  });
}

// stopwatch
var stopwatchDelay = 30;
var interval = null;
var delay = 1000;
var restTime = 0;
var is_divert = false;

function stopwatchTick() {
  if (interval === null) {
    interval = setInterval(() => {
      stopwatchDelay++;
    }, delay);
  }
}

function pauseStopwatch() {
  clearInterval(interval);
  interval = null;
}

function stopwatchEnd() {
  if (interval !== null) clearInterval(interval);
  interval = null;
  restTime = stopwatchDelay / 3;
  console.log(restTime);
  console.log(stopwatchDelay);
  stopwatchDelay = 0;
}

// countdown
const ALARM = "countdown";
function countdownInit() {
  chrome.alarms.get(ALARM, (alarm) => {
    if (!alarm) {
      chrome.alarms.create(ALARM, { delayInMinutes: restTime / 60 });
    } else {
      var distance = alarm.scheduledTime - new Date().getTime();
      var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      var seconds = Math.floor((distance % (1000 * 60)) / 1000);
      result = { minutes: minutes, seconds: seconds };
      chrome.runtime.sendMessage(
        { msg: "tick", value: result },
        (response) => {}
      );
    }
  });
}

// message handler
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  switch (request.msg) {
    case "getState":
      sendResponse(state);
      break;
    case "setState":
      state = request.value;
      break;
    case "stopwatchTick":
      stopwatchTick();
      sendResponse(stopwatchDelay);
      break;
    case "stopwatchEnd":
      stopwatchEnd();
      break;
    case "countdownInit":
      countdownInit(request.value);
      break;
    case "divert":
      is_divert = !is_divert;
      divert();
      break;
  }
});

// alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  restTime = 0;
  chrome.runtime.sendMessage({ msg: "countdownEnd" }, (response) => {});
  chrome.alarms.clearAll();
  notification();
});

// divert
function devirt() {
  if (interval) {
    if (!is_divert) {
    }
  }
}
