const START = "START";
const STOPWATCH = "STOPWATCH";
const COUNTDOWN = "COUNTDOWN";

const PLAY = "⏰";
const PAUSE = "||";
const REST = "☕";
const NONE = "";

const PAUSEWIN = "PAUSEWIN";

var state = START;
chrome.storage.sync.get(["state"]).then((result) => {
  if (result.state != undefined) {
    state = result.state;
  } else {
    state = START;
    chrome.storage.sync.set({ state: START });
  }
});

// notificaton
function popup() {
  chrome.windows.create({
    url: "Views/congratulations.html",
    type: "popup",
    width: 400,
    height: 250,
    focused: true,
  });
}

// stopwatch
var restTime = 0;

function stopwatchStart() {
  chrome.storage.sync.set({
    divertSummTime: 0,
    scheduledTime: Date.now(),
    divert: false,
    divertStartTime: 0,
    divertSummTime: 0,
  });
  chrome.notifications.clear(PAUSEWIN);
  setBadge(PLAY, [120, 39, 179, 1]);
}

function stopwatchEnd() {
  chrome.notifications.clear(PAUSEWIN);
  chrome.storage.sync.set({ divert: false });
  chrome.storage.sync.set({ countdownStart: Date.now() });
}

function getDistance(scheduledTime, divertSummTime) {
  var distance =
    Date.now() -
    (typeof divertSummTime === "number" ? divertSummTime : 0) -
    scheduledTime;
  return distance;
}

// countdown
var ringed = false;
const ALARM = "countdown";
function countdownInit() {
  chrome.alarms.get(ALARM, (alarm) => {
    if (alarm !== undefined) {
      var distance = alarm.scheduledTime - Date.now();
      var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      var seconds = Math.floor((distance % (1000 * 60)) / 1000);
      var result = { hours: hours, minutes: minutes, seconds: seconds };
      chrome.runtime.sendMessage({ msg: "tick", value: result });
    }
  });
}

function countdownEnd() {
  restTime = 0;
  state = START;
  chrome.storage.sync.set({ state: START });
  chrome.runtime.sendMessage({ msg: "countdownEnd" });
  chrome.alarms.clearAll();
  setBadge(NONE, [227, 181, 73, 1]);
  popup();
}

// message handler
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  switch (request.msg) {
    case "setState":
      state = request.value;
      chrome.storage.sync.set({ state: state });
      break;
    case "stopwatchStart":
      ringed = false;
      stopwatchStart();
      break;
    case "stopwatchEnd":
      stopwatchEnd();
      chrome.storage.sync
        .get(["divertSummTime", "scheduledTime"])
        .then((result) => {
          var distance = getDistance(
            result.scheduledTime,
            result.divertSummTime
          );
          restTime = distance / 1000 / 3 / 60;
          addDataObject(
            "task",
            result.scheduledTime,
            result.scheduledTime + distance
          );
          chrome.alarms.get(ALARM, (alarm) => {
            if (alarm == undefined) {
              if (ringed == false) {
                chrome.alarms.create(ALARM, { delayInMinutes: restTime });
                setBadge(REST, [227, 181, 73, 1]);
              }
            }
          });
        });
      break;
    case "countdownInit":
      countdownInit();
      break;
    case "divert":
      if (request.value) divert();
      break;
    case "skipCountdown":
      chrome.storage.sync.get(["countdownStart"]).then((result) => {
        if (result.countdownStart !== null)
          addDataObject("rest", result.countdownStart, Date.now());
        chrome.storage.sync.set({ countdownStart: null });
      });
      countdownEnd();
      break;
  }
});

// alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  chrome.storage.sync.get(["countdownStart"]).then((result) => {
    if (result.countdownStart !== null)
      addDataObject("rest", result.countdownStart, alarm.scheduledTime);
    chrome.storage.sync.set({ countdownStart: null });
  });
  countdownEnd();
  ringed = true;
});

// divert
function divert() {
  chrome.storage.sync
    .get(["divertStartTime", "divertSummTime", "divert"])
    .then((result) => {
      var is_divert = result.divert ? false : true;
      if (is_divert) {
        chrome.storage.sync.set({ divertStartTime: Date.now() });
        setBadge(PAUSE, [120, 39, 179, 1]);
        pauseWindow();
      } else {
        setBadge(PLAY, [120, 39, 179, 1]);
        var divertEndTime = Date.now() - result.divertStartTime;
        addDataObject("divert", result.divertStartTime, Date.now());
        chrome.storage.sync.set({
          divertSummTime: result.divertSummTime + divertEndTime,
        });
        chrome.notifications.clear(PAUSEWIN);
      }
      chrome.storage.sync.set({ divert: is_divert });
      chrome.runtime.sendMessage({ msg: "divertSwitched", value: is_divert });
    });
}

function pauseWindow() {
  chrome.notifications.create(PAUSEWIN, {
    iconUrl: "Resources/Icon/clock.png",
    title: "Warptimer",
    type: "basic",
    message: "Stopwatch paused!",
    priority: 2,
    requireInteraction: true,
  });
}

chrome.notifications.onClosed.addListener((id, byUser) => {
  if (id === PAUSEWIN && byUser) pauseWindow();
});

//badge
function setBadge(text, color) {
  chrome.action.setBadgeText({ text: text });
  chrome.action.setBadgeBackgroundColor({ color: color });
}

function addDataObject(type, start, end) {
  chrome.storage.local.get(["subject"]).then((result) => {
    if (result.subject !== "") {
      var obj = {
        day: new Date().toLocaleDateString(),
        subject: result.subject,
        amount: {
          start: start,
          end: end,
          dist: end - start,
        },
        type: type,
      };
      chrome.storage.local.get(["dayTasks"]).then((result) => {
        var tasks = typeof result.dayTasks !== "object" ? [] : result.dayTasks;
        tasks.push(obj);
        chrome.storage.local.set({ dayTasks: tasks });
      });
    }
  });
}
