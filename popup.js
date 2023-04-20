document.addEventListener("DOMContentLoaded", () => {
  try {
    let startButton = document.getElementById('start');
    let stopButton = document.getElementById('stop');
    let urlsTextarea = document.getElementById('urls');
    let minTimeInput = document.getElementById('minTime');
    let maxTimeInput = document.getElementById('maxTime');
    let intervalDuration = document.getElementById('interval-duration');
    let isRefreshing = false;

    startButton.addEventListener('click', () => {
      let urls = urlsTextarea.value.trim().split('\n');
      let minTime = parseInt(minTimeInput.value);
      let maxTime = parseInt(maxTimeInput.value);

      chrome.runtime.sendMessage({
        command: 'start',
        urls: urls,
        minTime: minTime,
        maxTime: maxTime
      });

      isRefreshing = true;
    });

    stopButton.addEventListener('click', () => {
      chrome.runtime.sendMessage({
        command: 'stop'
      });

      isRefreshing = false;
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.command === 'refreshed') {
        if (isRefreshing) {
          chrome.runtime.sendMessage({
            command: 'refresh'
          });
        }
      } else if (message.msg == 'sendInterval') {
        intervalDuration.textContent = message.duration;
      }
    });
  } catch (e) {
    console.log(e)
  }
})