var calendarItems = document.getElementById("items");
var calendarTitle = document.getElementById("calendar_title");
var forwardBtn = document.getElementById("forward_btn");
var backwardBtn = document.getElementById("backward_btn");
var overallGraphCanvas = document.getElementById("overall_graph");
var resetZoomBtn = document.getElementById("reset_zoom")
var dayChartCanvar = document.getElementById("day_chart")

var calendar = null;
var database = null;
var overallGraph = null;
var overallChart = null;
var subj = [
  "Art",
  "Math",
  "English",
  "Programming",
  "Social Engineering",
  "Finacial Grammar",
  "Literature",
];

const indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;

function intiCalendar() {
  calendar = new Calendar();
  updateCalendar();
  initHandlers();
}

function initOverallGraph(result) {
  overallGraph = new OverallGraph();
  var dataSets = [];
  Object.keys(result.data.task).forEach((element, idx, arr) => {
    var data = {
      label: element,
      data: Object.values(result.data.task)[idx],
      fill: false,
      tension: 0.1,
    };
    dataSets.push(data);
  });
  console.log(dataSets);
  Chart.defaults.color = "blanchedalmond";
  Chart.defaults.font.family = "pixel_font";
  overallChart = new Chart(overallGraphCanvas, overallGraph.getConfig(dataSets));
}

function initDataBase() {
  if (!indexedDB) {
    window.alert(
      "Database could not be found in this browser!\nYou cannot use thi feature!"
    );
    window.close();
  }
  database = new DataBase();
  database.openDataBase((store) => {
    // for (let d = 0; d < 3; d++) {
    //   for (let i = 0; i < subj.length; i++) {
    //     for (let j = 0; j < 8; j++) {
    //       store.put({
    //         day: i,
    //         amount: {
    //           start: i + Math.random() * j,
    //           end: i + Math.random() * Math.random() * j + 1,
    //           dist: i + Math.random() * Math.random() * j + 1,
    //         },
    //         type: ["task", "divert", "rest"][Math.floor(Math.random() * 3)],
    //         subject: subj[Math.floor(Math.random() * subj.length)],
    //       });
    //     }
    //   }
    // }
    var allRecords = store.getAll();
    allRecords.onsuccess = function (event) {
      var result = event.target.result;
      initOverallGraph(database.loadData(result));
    };
  });
}

function updateCalendar() {
  calendarItems.innerHTML = "";
  calendarTitle.innerHTML = calendar.getTitle();
  calendar.getDays().forEach((day) => {
    calendarItems.appendChild(createDay(day, calendar.selected));
  });
}

window.onload = () => {
  initDataBase();
  intiCalendar();
};

function initHandlers() {
  forwardBtn.onclick = () => {
    calendar.forward();
    updateCalendar();
  };
  backwardBtn.onclick = () => {
    calendar.backward();
    updateCalendar();
  };
  resetZoomBtn.onclick = () => {
    overallChart.resetZoom();
  }
  calendar.onSelected = (idx) => {
    database.openDataBase((store) => {
      var query = store.index(['Days']).getAll([idx.getDate()]);
      query.onsuccess = (event) => {
        var result = event.target.result;
        console.log(result);
      }
    });
  }
}

function createDay(day, selected) {
  var label = document.createElement("label");
  if (typeof day !== "string") {
    if (selected)
      label.id = selected.getTime() !== day.getTime() ? "day" : "day-selected";
    else label.id = "day";
    label.innerHTML = day.getDate();
    label.addEventListener("click", function (event) {
      calendar.select(event.target.innerHTML - 1);
      updateCalendar();
    });
  }
  return label;
}
