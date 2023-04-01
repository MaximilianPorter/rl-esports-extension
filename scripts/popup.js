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

const menuButtonEl = document.querySelector(`.menu-button`);
const menuDropdownEl = document.querySelector(`.menu-dropdown`);
const menuAlarmsListEl = document.querySelector(`.menu-list`);

const alarmsCreated = JSON.parse(localStorage.getItem(`alarmsCreated`)) || [];
addItemsToMenuAlarmList();

let allEvents = null;
getEvents().then((data) => {
  allEvents = data;
  console.log(allEvents);
});
fillData();

menuButtonEl.addEventListener(`click`, () => {
  menuDropdownEl.classList.toggle(`menu-dropdown--active`);
});

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

moreInfo_stagesList.addEventListener(`click`, (event) => {
  const reminderTimeButton = event.target.closest(`.reminder-time-button`);
  if (reminderTimeButton) {
    reminderTimeButton.ariaPressed =
      reminderTimeButton.ariaPressed === "true" ? "false" : "true";

    const confirmButton = reminderTimeButton
      .closest(`.reminder-section`)
      .querySelector(`.remind-me-confirm`);
    confirmButton.classList.remove(`remind-me-confirm--clicked`);
  }

  const confirmReminderButton = event.target.closest(".remind-me-confirm");
  if (confirmReminderButton) {
    event.preventDefault();
    const form = confirmReminderButton.closest(`form`);
    const selectedTimes = form.querySelectorAll(
      `.reminder-time-button[aria-pressed="true"]`
    );

    if (selectedTimes.length === 0) return;

    confirmReminderButton.classList.add(`remind-me-confirm--clicked`);
    selectedTimes.forEach((selectedTime) => {
      const date = selectedTime.dataset.date;
      const title = `Reminder for ${moreInfo_title.textContent}`;
      const stageTitle = selectedTime
        .closest(`.event-stage`)
        .querySelector(`.event-stage-title`)
        .querySelector("p").textContent;
      console.log(`date: ${date}`);
      createAlarm(
        `${title} : ${stageTitle} - ${simplifyDate(
          new Date(date),
          navigator.location
        )}`,
        new Date(date)
      );
    });
  }
});

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
  if (!allEvents) return;
  const leagueEvent = allEvents.find((event) => event._id === eventId);
  const { _id, name: eventName, startDate, image, stages } = leagueEvent;
  moreInfo_title.textContent = eventName;
  moreInfo_image.src = image;
  moreInfo_stagesList.innerHTML = ``;

  stages.forEach((stage) => {
    const {
      startDate: stageStartDate,
      endDate: stageEndDate,
      name: stageName,
      liquipedia: stageLiquipediaLink,
    } = stage;

    const remindMeButtonDisabled = new Date() - new Date(stageStartDate) >= 0;
    console.log(remindMeButtonDisabled);

    const stageMarkup = `
  <div class="event-stage">
    <h4 class="event-stage-title">
      <p>${stageName}</p>
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
    <button class="remind-button remind-me-button ${
      remindMeButtonDisabled ? `remind-me-button--disabled` : ``
    }">REMIND ME</button>
    <div class="reminder-section">
      <!--  reminder-section--active -->
      <form action="" class="remind-me-form">
        <div class="reminder-time-buttons">
          <button
            type="button"
            class="reminder-time-button"
            aria-pressed="${containsAlarm(
              `Reminder for ${eventName} : ${stageName} - ${simplifyDate(
                HourBefore(new Date(stageStartDate)),
                navigator.location
              )}`
            )}"
            data-date="${HourBefore(new Date(stageStartDate))}"
          >
            1 Hour Before
          </button>
          <button
            type="button"
            class="reminder-time-button"
            aria-pressed="${containsAlarm(
              `Reminder for ${eventName} : ${stageName} - ${simplifyDate(
                DayBefore(new Date(stageStartDate)),
                navigator.location
              )}`
            )}"
            data-date="${DayBefore(new Date(stageStartDate))}"
          >
            1 Day Before
          </button>
          <button
            type="button"
            class="reminder-time-button"
            aria-pressed="${containsAlarm(
              `Reminder for ${eventName} : ${stageName} - ${simplifyDate(
                WeekBefore(new Date(stageStartDate)),
                navigator.location
              )}`
            )}"
            data-date="${WeekBefore(new Date(stageStartDate))}"
          >
            1 Week Before
          </button>
        </div>
        <button class="remind-button remind-me-confirm" type="submit">
          <p>CONFIRM</p>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g id="Interface / Check"> <path id="Vector" d="M6 12L10.2426 16.2426L18.727 7.75732" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g> </g></svg>
        </button>
      </form>
    </div>
  </div>
  `;

    moreInfo_stagesList.insertAdjacentHTML(`beforeend`, stageMarkup);
  });
}

function addItemsToMenuAlarmList() {
  alarmsCreated.forEach((alarm) => {
    const listItemMarkup = `
        <li class="menu-list-item">
          <button class="cancel-reminder-button" title="Cancel Reminder">
            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
              <g
                id="SVGRepo_tracerCarrier"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></g>
              <g id="SVGRepo_iconCarrier">
                <path
                  d="M18.8,16l5.5-5.5c0.8-0.8,0.8-2,0-2.8l0,0C24,7.3,23.5,7,23,7c-0.5,0-1,0.2-1.4,0.6L16,13.2l-5.5-5.5 c-0.8-0.8-2.1-0.8-2.8,0C7.3,8,7,8.5,7,9.1s0.2,1,0.6,1.4l5.5,5.5l-5.5,5.5C7.3,21.9,7,22.4,7,23c0,0.5,0.2,1,0.6,1.4 C8,24.8,8.5,25,9,25c0.5,0,1-0.2,1.4-0.6l5.5-5.5l5.5,5.5c0.8,0.8,2.1,0.8,2.8,0c0.8-0.8,0.8-2.1,0-2.8L18.8,16z"
                ></path>
              </g>
            </svg>
          </button>
          <p>
            ${alarm.name}
          </p>
        </li>
  `;
    menuAlarmsListEl.insertAdjacentHTML(`beforeend`, listItemMarkup);
  });
}

function HourBefore(date) {
  return new Date(date - 1000 * 60 * 60);
}

function DayBefore(date) {
  return new Date(date - 1000 * 60 * 60 * 24);
}

function WeekBefore(date) {
  return new Date(date - 1000 * 60 * 60 * 24 * 7);
}

function createAlarm(name, date) {
  if (containsAlarm(name)) return;

  alarmsCreated.push({
    name,
    date,
  });
  localStorage.setItem(`alarmsCreated`, JSON.stringify(alarmsCreated));

  // if we're not in the extension, don't create an alarm
  if (!chrome.alarms) return;

  const alarmInfo = {
    when: date,
  };
  chrome.alarms.create(name, alarmInfo, (alarm) => {
    console.log(`alarm created: ${alarm.name}`);
  });
}

function containsAlarm(name) {
  return alarmsCreated.some((alarm) => alarm.name === name);
}
