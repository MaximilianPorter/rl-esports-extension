const express = require("express");
const app = express();
const server = require("http").Server(app);
const cors = require("cors");
const fs = require("fs");

const testData = require("./testData.json");

app.use(cors());

// mode = integer, (1 = 1v1, 2 = 2v2...)
// tier = string or array of strings (S, A, B, C...)
app.get("/api/events?:mode?:tier", (req, res) => {
  let { mode, tier } = req.query;
  if (mode === "undefined") mode = undefined;
  if (tier === "undefined") tier = undefined;

  if (tier?.includes(",")) {
    tier = tier.split(",");
  }

  const events = getEventsSortedByDate(testData.events)
    .filter((event) => (!mode ? true : event.mode == mode))
    .filter((event) =>
      !tier ? true : event.tier === tier || tier.includes(event.tier)
    );
  res.send({
    success: true,
    data: events,
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("Server listening on port 3000");
});

async function fetchEvents() {
  const intlFormat = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  let [month, day, year] = intlFormat.format(Date.now()).split("/");
  month = parseInt(month);
  day = parseInt(day);
  year = parseInt(year);
  const today = `${year}-${month}-${day}`;
  const month2Before = `${year}-${(month + 2).toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}`;
  const month2After = `${year}-${(month - 2).toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}`;

  const response = await fetch(
    `https://zsr.octane.gg/events?sort=date%3Aasc&after=${month2After}&before=${month2Before}`
  );
  const data = await response.json();
  // const data = testData;

  await addMatchesToData(data);

  return data;
}

// fetchEvents().then((data) => {
//   console.log("data fetched");
//   fs.writeFile("testData.json", JSON.stringify(data), (err) => {
//     if (err) throw err;
//     console.log("Data written to file");
//   });
// });

function getEventsSortedByDate(events) {
  return events.sort((a, b) => {
    const aDate = new Date(a.startDate);
    const bDate = new Date(b.startDate);
    return aDate - bDate;
  });
}

async function addMatchesToData(data) {
  for (const event of data.events) {
    console.log("fetching matches for event: " + event._id);
    const matchesResponse = await fetch(
      `https://zsr.octane.gg/matches?event=${event._id}`
    );
    const matchesData = await matchesResponse.json();
    event.stages.forEach((stage) => {
      stage.matches = matchesData.matches.filter(
        (match) => match.stage._id === stage._id
      );
    });
  }
}
