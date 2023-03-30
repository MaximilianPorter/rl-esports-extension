const express = require("express");
const app = express();
const server = require("http").Server(app);
const cors = require("cors");

app.use(cors());

app.get("/api/events/upcoming?:locale", (req, res) => {
  res.send({
    success: true,
    data: simplifyDate(new Date(`2023-01-29T06:00:00Z`)),
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("Server listening on port 3000");
});

async function getEvents() {
  const intlFormat = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [month, day, year] = intlFormat.format(Date.now()).split("/");
  const today = `${year}-${month}-${day}`;
  const month2Before = `${year}-${month + 2}-${day}`;
  const month2After = `${year}-${month - 2}-${day}`;

  const response = await fetch(
    `https://zsr.octane.gg/events?sort=date%3Aasc&after=${month2After}&before=${month2Before}`
  );
  const data = await response.json();
  return data;
}

console.log(simplifyDate(new Date(`2023-01-29T06:00:00Z`)));

function simplifyDate(date, region = "en-US") {
  const intlFormat = new Intl.DateTimeFormat(region, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  return intlFormat.format(date);
}
