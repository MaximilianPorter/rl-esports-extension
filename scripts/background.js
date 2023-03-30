chrome.alarms.onAlarm.addListener((alarm) => {
  chrome.windows.create({
    url: `alertPopup.html`,
    type: `popup`,
    width: 400,
    height: 400,

    // This is the important part
    focused: true,
  });
});
