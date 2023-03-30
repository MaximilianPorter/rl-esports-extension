const pre = document.querySelector(`pre`);
const eventListEls = document.querySelectorAll(`.event-list`);
const upcomingEventList = document.querySelector(`.events-list-next`);
const currentEventList = document.querySelector(`.events-list-current`);
const pastEventList = document.querySelector(`.events-list-past`);

const eventMoreInfoEl = document.querySelector(`.event-more-info`);
const moreInfo_title = eventMoreInfoEl.querySelector(`.event-title`);
const moreInfo_image = eventMoreInfoEl
  .querySelector(`.event-image`)
  .querySelector("img");
const moreInfo_stagesList = eventMoreInfoEl.querySelector(`.event-stages`);

const reminderTimeButtons = document.querySelectorAll(`.reminder-time-button`);

// chrome.alarms.create(
//   "NAME OF EVENT STAGE",
//   {
//     when: Date.now() + 5000,
//   },
//   (alarm) => {
//     console.log("alarm is set");
//   }
// );

const allEvents = await getEvents();
fillData();

// click on event (for more info)
eventListEls.forEach((eventListEl) => {
  eventListEl.addEventListener(`click`, (event) => {
    const leagueEvent = event.target.closest(`.event`);
    if (!leagueEvent) return;

    console.log(event.target);
    eventMoreInfoEl.classList.add(`event-more-info--active`);
    addInfoForEvent(leagueEvent.dataset.id);
  });
});

eventMoreInfoEl.addEventListener(`click`, (event) => {
  // close the event-more-info element if the click is on the pseudo element
  if (event.target === eventMoreInfoEl) {
    eventMoreInfoEl.classList.remove(`event-more-info--active`);
    document
      .querySelectorAll(`.reminder-section`)
      .forEach((reminderSection) =>
        reminderSection.classList.remove(`reminder-section--active`)
      );
  }

  // if the click is on the remind-me-button, open the reminder-time-buttons
  const remindMeButton = event.target.closest(`.remind-me-button`);
  if (remindMeButton) {
    const stage = remindMeButton.closest(`.event-stage`);
    if (!stage) return;

    const reminderSection = stage.querySelector(`.reminder-section`);
    reminderSection.classList.toggle(`reminder-section--active`);
  }
});

reminderTimeButtons.forEach((reminderTimeButton) =>
  reminderTimeButton.addEventListener(`click`, (event) => {
    console.log(reminderTimeButton.ariaPressed);
    reminderTimeButton.ariaPressed =
      reminderTimeButton.ariaPressed === "true" ? "false" : "true";
  })
);

document.addEventListener(`click`, (event) => {});

async function getEvents(mode = undefined, tier = undefined) {
  const response = await fetch(
    `http://localhost:3000/api/events?mode=${mode}&tier=${tier}`
  );
  const data = await response.json();
  return data.data;
}

async function fillData() {
  const relevantEvents = await getEvents(3, ["S", "A"]);
  console.log(relevantEvents);

  const upcomingEvents = relevantEvents
    .filter((event) => Date.now() < new Date(event.startDate))
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  addEventToDOM(upcomingEvents[0], upcomingEventList);
  addEventToDOM(upcomingEvents[1], upcomingEventList);
  addEventToDOM(upcomingEvents[2], upcomingEventList);

  const pastEvents = relevantEvents
    .filter((event) => Date.now() > new Date(event.endDate))
    .sort((a, b) => new Date(b.endDate) - new Date(a.endDate));

  addEventToDOM(pastEvents[0], pastEventList);
  addEventToDOM(pastEvents[1], pastEventList);
  addEventToDOM(pastEvents[2], pastEventList);

  const currentEvents = relevantEvents
    .filter(
      (event) =>
        Date.now() > new Date(event.startDate) &&
        Date.now() < new Date(event.endDate)
    )
    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

  addEventToDOM(currentEvents[0], currentEventList);
  addEventToDOM(currentEvents[1], currentEventList);
  addEventToDOM(currentEvents[2], currentEventList);

  // events.forEach((event) => {
  //   const { name, startDate, image, stages } = event;
  //   stages.forEach((stage) => {
  //     const {
  //       startDate: stageStartDate,
  //       endDate: stageEndDate,
  //       name: stageName,
  //       liquipedia: stageLiquipediaLink,
  //     } = stage;
  //   });
  // });
}

// ex. 2023-02-30T00:00:00.000Z -> 1 month ago
function convertDateToSimplified(date) {
  const dateObj = new Date(date);
  const now = new Date();
  const day = Math.abs(dateObj - now) / (1000 * 60 * 60 * 24);
  const month = day / 30;
  const hours = day * 24;
  const minutes = hours * 60;

  let timeUnit = ["", month];
  if (month >= 1) {
    timeUnit[0] = `month`;
    timeUnit[1] = month;
  } else if (day >= 1) {
    timeUnit[0] = `day`;
    timeUnit[1] = day;
  } else if (hours >= 1) {
    timeUnit[0] = `hour`;
    timeUnit[1] = hours;
  } else if (minutes >= 1) {
    timeUnit[0] = `minute`;
    timeUnit[1] = minutes;
  } else {
    return `now`;
  }

  const value = Math.round(timeUnit[1]);

  if (now < dateObj) {
    return `in ${value} ${timeUnit[0]}${value > 1 ? `s` : ``}`;
  } else return `${value} ${timeUnit[0]}${value > 1 ? `s` : ``} ago`;
}
// console.log(simplifyDate(new Date(`2023-04-06T18:00:00Z`)));
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

function addEventToDOM(leagueEvent, eventList) {
  if (!leagueEvent) return;
  const { _id, name, startDate, image, stages } = leagueEvent;
  const markupListItem = `
      <li class="event" data-id="${_id}">
        <div class="event-image">
          <img
            src="${image}"
            alt="event image"
          />
        </div>
        <div class="event-date-info">
          <p class="event-date">${simplifyDate(
            new Date(startDate),
            navigator.location
          )}</p>
          <p class="event-date--simplified">(${convertDateToSimplified(
            startDate
          )})</p>
        </div>
        <h3 class="event-title">${name}</h3>
      </li>
      `;

  eventList.insertAdjacentHTML(`beforeend`, markupListItem);
}

function addInfoForEvent(eventId) {
  const leagueEvent = allEvents.find((event) => event._id === eventId);
  const { _id, name, startDate, image, stages } = leagueEvent;
  moreInfo_title.textContent = name;
  moreInfo_image.src = image;
  moreInfo_stagesList.innerHTML = ``;

  stages.forEach((stage) => {
    const {
      startDate: stageStartDate,
      endDate: stageEndDate,
      name: stageName,
      liquipedia: stageLiquipediaLink,
    } = stage;

    const stageMarkup = `
  <div class="event-stage">
    <h4 class="event-stage-title">
      ${stageName}
      <a
        class="liquipedia-link"
        href="${stageLiquipediaLink}"
        target="_blank"
        rel="noopener noreferrer"
      >
        Liquipedia Page</a
      >
    </h4>
    <p class="event-stage-date">&mdash; Start: ${simplifyDate(
      new Date(stageStartDate),
      navigator.location
    )}</p>
    <p class="event-stage-date">&mdash; End: ${simplifyDate(
      new Date(stageEndDate),
      navigator.location
    )}</p>
    <button class="remind-button remind-me-button">REMIND ME</button>
    <div class="reminder-section">
      <!--  reminder-section--active -->
      <form action="" class="remind-me-form">
        <div class="reminder-time-buttons">
          <button
            type="button"
            class="reminder-time-button"
            aria-pressed="false"
          >
            1 Hour Before
          </button>
          <button
            type="button"
            class="reminder-time-button"
            aria-pressed="false"
          >
            1 Day Before
          </button>
          <button
            type="button"
            class="reminder-time-button"
            aria-pressed="false"
          >
            1 Week Before
          </button>
        </div>
        <button class="remind-button remind-me-confirm" type="submit">
          CONFIRM
        </button>
      </form>
    </div>
  </div>
  `;

    moreInfo_stagesList.insertAdjacentHTML(`beforeend`, stageMarkup);
  });
}
