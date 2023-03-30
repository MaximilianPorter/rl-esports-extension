const pre = document.querySelector(`pre`);
const eventListEls = document.querySelectorAll(`.event-list`);
const eventMoreInfoEl = document.querySelector(`.event-more-info`);

// chrome.alarms.create(
//   "NAME OF EVENT STAGE",
//   {
//     when: Date.now() + 5000,
//   },
//   (alarm) => {
//     console.log("alarm is set");
//   }
// );

eventListEls.forEach((eventListEl) =>
  eventListEl.addEventListener(`click`, (event) => {
    eventMoreInfoEl.classList.add(`event-more-info--active`);
  })
);

// if there's a click on the pseudo element of the event-more-info element, then close the element
eventMoreInfoEl.addEventListener(`click`, (event) => {
  if (event.target === eventMoreInfoEl) {
    eventMoreInfoEl.classList.remove(`event-more-info--active`);
  }

  const remindMeButton = event.target.closest(`.remind-me-button`);
  if (remindMeButton) {
    remindMeButton.insertAdjacentHTML("afterend", "<p>Reminder set!</p>");
  }
});

document.addEventListener(`click`, (event) => {});

async function getEvents() {
  const response = await fetch(
    `http://localhost:3000/api/events/upcoming?locale=${navigator.language}`
  );
  const data = await response.json();
  return data;
}
