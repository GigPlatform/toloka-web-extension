var websites = {
    "toloka.yandex.com": "processToloka"
}
var lastUrl = window.location.href;
var injectedScript = false;
var verified = false;
interfaceSource = 'inpage';

function processWebsite() {
    var url = window.location.href;
    for (var website in websites) {
        if (url.indexOf(website) != -1) {
            window[websites[website]]();
        }
    }
}

function processToloka() {
    if (!injectedScript) {
        initMessageEvent();
        injectFile('js/inject.js').then(() => startClientServer());
        injectedScript = true;
    }
    verifyInterface();
}

function verifyInterface() {
    injectText(`window.postMessage({action: "verification", value:{empty:$('#alertIcon').length==0}});`, "*");
}

function loadInterface() {
    waitForEl("#header > header > div > div:nth-child(3) , #content > div > div.new-task-page > div.new-task-page__header > div.new-task-page-header-right-actions", initInterface);
    waitForEl("#content > div > div.new-task-page > div.new-task-page__header > div.new-task-page-header-right-actions", initInterface);
}

function initInterface() {
    if (!verified) {
        addAlertIcon();
        drawInterface().then(() => initMessageServer());
        verified = true;
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
                logEvent('PAGE_CLOSE', 'OUT', null, lastUrl);
                logEvent('PAGE_LOAD', 'IN', null, window.location.href);
                lastUrl = window.location.href;
                processWebsite();
            } else if(event.data.action == 'verification') {
                if (event.data.value.empty) {
                    loadInterface();
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