var websites = {
    "toloka.yandex.com": "processToloka"
}
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
    waitForEl("#header > header > div > div:nth-child(3) , #content > div > div.new-task-page > div.new-task-page__header > div.new-task-page-header-right-actions", function() {
        drawInterface().then(() => initMessageServer());
    });
}

processWebsite();

// setTimeout(() => {
//     drawInterface();
// }, 6000);