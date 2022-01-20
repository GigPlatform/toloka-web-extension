var websites = {
    "toloka.yandex.com": processToloka
}
var lastUrl = window.location.href;
var injectedScript = false;
var counter = 0;
var prevUrl = null;
interfaceSource = 'inpage';

function processWebsite() {
    var url = window.location.href;
    for (var website in websites) {
        if (url.indexOf(website) != -1) {
            websites[website]();
        }
    }
}

function processToloka() {
    // console.log('INJECTING');
    if (!injectedScript) {
        initMessageEvent();
        injectFile('js/inject.js').then(() => startClientServer());
        injectedScript = true;
    }
    verifyInterface();
}

function verifyInterface() {
    // console.log('verifyInterface');
    injectText(`window.postMessage({action: "verification", value:{empty:$('#alertIcon').length==0}});`, "*");
}

function loadInterface() {
    waitForEl("#header > header > div > div:nth-child(3) , #content > div > div.new-task-page > div.new-task-page__header > div.new-task-page-header-right-actions", initInterface);
    waitForEl("#content > div > div.new-task-page > div.new-task-page__header > div.new-task-page-header-right-actions", initInterface);
}

function initInterface() {
    // console.log('initInterface');
    if (prevUrl != window.location.href) {
        addAlertIcon();
        drawInterface().then(() => initMessageServer());
        prevUrl = window.location.href;
    }
}

function initMessageEvent() {
    window.addEventListener("message", function(event) {
        // We only accept messages from ourselves
        // if (event.source != window)
        //     return;

        if (event.data.hasOwnProperty('action')) {
            if (event.data.action == 'changeUrl') {
                // console.log(event.data.value.url);
                logEvent('PAGE_CLOSE', lastUrl, null, 'OUT');
                logEvent('PAGE_LOAD', window.location.href, null, 'IN');
                lastUrl = window.location.href;
                processWebsite();
            } else if(event.data.action == 'verification') {
                // console.log('verification', event.data);
                if (event.data.value.empty) {
                    loadInterface();
                } else {
                    counter = 0;
                }
            }
        }
    });
}

function injectFile(fileName) {
    return new Promise((resolve, reject) => {
        var s = document.createElement('script');
        s.src = browser.runtime.getURL(fileName);
        s.onload = function() {
            resolve();
            // this.remove();
        };
        (document.head || document.documentElement).appendChild(s);
    });
}

function injectText(text) {
    var script = document.createElement('script');
    script.textContent = text;
    (document.head||document.documentElement).appendChild(script);
    script.remove();
}

function startClientServer() {
    let text = `initClientServer("${browser.runtime.id}");`;
    injectText(text);
}

processWebsite();

// setTimeout(() => {
//     drawInterface();
// }, 6000);