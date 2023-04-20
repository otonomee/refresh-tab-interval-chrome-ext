let intervalId;
let urls = [];
let currentTabId;
let previousUrl = '';
let lastUrlIndex = -1;
let currentUrlIndex = -1;
let newerIntervalDuration;

chrome.action.onClicked.addListener(() => {
    chrome.windows.create({
        url: 'popup.html',
        width: 325,
        height: 375,
        left: 1250,
        top: 150,
        type: 'popup'
    })
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.command) {
        case 'start':
            startRefresh(message.urls, message.minTime, message.maxTime);
            break;
        case 'stop':
            stopRefresh();
            break;
        case 'refresh':
            refreshTab();
            break;
        default:
            console.error('Invalid command: ' + message.command);
            break;
    }
});

function startRefresh(newUrls, minTime, maxTime) {
    urls = newUrls;
    currentTabId = null;

    chrome.tabs.query({
        active: true
    }, (tabs) => {
        if (tabs.length > 0) {
            currentTabId = tabs[0].id;
            activeTabIds.push(tabs[0].id);
            tabs.array.forEach(element => {
                refreshTab(currentTabId)
            });
            refreshTab();
        }
    });

    const intervalDuration = getRandomInt(minTime * 1000, maxTime * 1000) / 1000;
    chrome.runtime.sendMessage({
        msg: 'sendInterval',
        duration: intervalDuration
    })
    intervalId = setInterval(() => {
        const newerIntervalDuration = getRandomInt(minTime * 1000, maxTime * 1000) / 1000;
        chrome.runtime.sendMessage({
            msg: 'sendInterval',
            duration: newerIntervalDuration
        });
        refreshTab();
    }, intervalDuration * 1000);
}

function stopRefresh() {
    clearInterval(intervalId);
}

function refreshTab() {
    if (currentTabId !== null) {
        getCurrentTabUrl((currentUrl) => {
            currentUrlIndex = urls.indexOf(currentUrl);
            let newUrlIndex = getNextUrlIndex();
            let newUrl = urls[newUrlIndex];
            while (newUrl === previousUrl) {
                newUrlIndex = getNextUrlIndex();
                newUrl = urls[newUrlIndex];
            }
            previousUrl = newUrl;
            chrome.tabs.update(currentTabId, {
                url: newUrl
            });
            newerIntervalDuration = getRandomInt(minTimeInput.value * 1000, maxTimeInput.value * 1000) / 1000;
            chrome.runtime.sendMessage({
                msg: 'sendInterval',
                duration: newerIntervalDuration
            });
        });
    }
}

function getNextUrlIndex() {
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * urls.length);
    } while (newIndex === currentUrlIndex);

    lastUrlIndex = currentUrlIndex;
    currentUrlIndex = newIndex;

    return newIndex;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getCurrentTabUrl(callback) {
    if (currentTabId !== null) {
        chrome.tabs.get(currentTabId, (tab) => {
            callback(tab.url || '');
        });
    } else {
        callback('');
    }
}