document.addEventListener('DOMContentLoaded', () => {
  const minIntervalInput = document.getElementById('minInterval');
  const maxIntervalInput = document.getElementById('maxInterval');
  const urlListTextarea = document.getElementById('urlList');
  const saveBtn = document.getElementById('saveBtn');
  const saveNotification = document.getElementById('saveNotification');
  const countdown = document.getElementById('countdown');
  const nextUrl = document.getElementById('nextUrl');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');

  // Load and display the saved settings
  chrome.storage.sync.get(['minInterval', 'maxInterval', 'urlList'], (data) => {
    minIntervalInput.value = data.minInterval || '';
    maxIntervalInput.value = data.maxInterval || '';
    urlListTextarea.value = data.urlList || '';
  });

  // Save the settings
  saveBtn.addEventListener('click', () => {
    chrome.storage.sync.set({
      minInterval: minIntervalInput.value,
      maxInterval: maxIntervalInput.value,
      urlList: urlListTextarea.value,
    }, () => {
      saveNotification.style.display = 'block';
      setTimeout(() => {
        saveNotification.style.display = 'none';
      }, 2000);
    });
  });

  let countdownTimeout;

  // Start refreshing
  startBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({
      action: 'startRefreshing'
    });
    // updateCountdown();
  });

  // Stop refreshing
  stopBtn.addEventListener('click', () => {
    clearTimeout(countdownTimeout);
    countdown.textContent = 'Refreshing stopped';
    nextUrl.textContent = '';
    chrome.runtime.sendMessage({
      action: 'stopRefreshing'
    });
  });
  // Listen for countdown updates from background.js
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateCountdown') {
      let remainingSeconds = Math.round(message.timeLeft);
      countdown.textContent = `Next refresh in ${remainingSeconds} seconds`;
      nextUrl.textContent = `Next URL: ${message.nextUrl}`;

      // Clear any existing countdown interval
      if (typeof countdownInterval !== 'undefined') {
        clearInterval(countdownInterval)
      }
      //clearInterval(countdownInterval);

      // Start a new countdown interval
      countdownInterval = setInterval(() => {
        if (remainingSeconds > 0) {
          countdown.textContent = `Next refresh in ${remainingSeconds} seconds`;
          remainingSeconds--;
        } else {
          countdown.textContent = 'Refreshing...';
          clearInterval(countdownInterval);
        }
      }, 1000);
    }
    sendResponse()
  });

});