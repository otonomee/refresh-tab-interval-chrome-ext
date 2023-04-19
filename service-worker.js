  let minInterval;
  let maxInterval;
  let urlList;
  let timeoutIds = [];
  let activeTabIds = [];

  // Load the settings
  chrome.storage.sync.get(['minInterval', 'maxInterval', 'urlList'], (data) => {
    minInterval = parseInt(data.minInterval, 10);
    maxInterval = parseInt(data.maxInterval, 10);
    urlList = processUrlList(data.urlList.split('\n'));

    // Refresh function
    function refresh(tabId) {
      let nextUrl = urlList.length > 0 ? urlList[Math.floor(Math.random() * urlList.length)] : '';
      chrome.tabs.get(tabId, (tab) => {
        if (tab) {
          const currentTabId = tab.id;
          if (nextUrl.length == 1) {
            nextUrl = tab.url; // Set current tab URL if no URL is available in urlList
          }
          chrome.storage.sync.set({
            'nextUrl': nextUrl
          });
          chrome.tabs.update(currentTabId, {
            url: nextUrl
          });
        }
        scheduleRefresh(tabId);
      });
    }

    // Schedule the next refresh
    function scheduleRefresh(tabId) {
      if (!activeTabIds.includes(tabId)) {
        return;
      }

      const interval = Math.floor(Math.random() * (maxInterval - minInterval + 1) + minInterval) * 1000;
      const timeoutId = setTimeout(() => refresh(tabId), interval);
      timeoutIds[tabId] = timeoutId;

      // Send a countdown update to the popup
      chrome.runtime.sendMessage({
        action: 'updateCountdown',
        timeLeft: interval / 1000,
        nextUrl: urlList[Math.floor(Math.random() * urlList.length)],
      });
    }

    // Handle messages from the popup
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'startRefreshing') {
        console.log(urlList[Math.floor(Math.random() * urlList.length)])
        chrome.tabs.query({
          active: true,
          currentWindow: true
        }, (tabs) => {
          tabs.forEach((tab) => {
            const tabId = tab.id;
            activeTabIds.push(tabId);
            scheduleRefresh(tabId);
          });
        });
      } else if (message.action === 'stopRefreshing') {
        activeTabIds.forEach((tabId) => {
          clearTimeout(timeoutIds[tabId]);
        });
        activeTabIds = [];
        timeoutIds = [];
      }
    });

    // Update the settings when they are changed
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.minInterval) {
        minInterval = parseInt(changes.minInterval.newValue, 10);
      }
      if (changes.maxInterval) {
        maxInterval = parseInt(changes.maxInterval.newValue, 10);
      }
      if (changes.urlList) {
        urlList = processUrlList(changes.urlList.newValue.split('\n'));
      }
    });

    function processUrlList(urlList) {
      return urlList.map((url) => {
        if (!/^https?:\/\//i.test(url)) {
          return 'http://' + url;
        }
        return url;
      });
    }

  });