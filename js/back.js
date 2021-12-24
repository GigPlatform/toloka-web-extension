var lastTabId = 0;
var status = 0;
var tabToUrl = {};
var notPort = null;

function init_process() {
  init_triggers('back');
  fsmReset();
  triggersReset();
  //getWage(true).then(totals => console.log(totals));
}

function getStatus(callback) {
  chrome.storage.local.get(['working_status'], function (result) {
    if (result.hasOwnProperty('working_status')) {
      status = result['working_status'];
    } else {
      chrome.storage.local.set({'working_status': status}, function(){});
    }
    callback(status);
  });
}

function toogleStatus(callback) {
  chrome.storage.local.get(['working_status'], (result)=>{
    if (result.hasOwnProperty('working_status')) {
      status = result['working_status'];
    }
    if (status == 1) {
      status = 0;
    } else {
      status = 1;
    }
    chrome.storage.local.set({'working_status': status}, ()=>{});
    callback(status);
  });
}

function getRandomToken() {
    // E.g. 8 * 32 = 256 bits token
    var randomPool = new Uint8Array(16);
    crypto.getRandomValues(randomPool);
    var hex = '';
    for (var i = 0; i < randomPool.length; ++i) {
        hex += randomPool[i].toString(16);
    }
    // E.g. db18458e2782b2b77e36769c569e263a53885a9944dd0a861e5064eac16f1a
    return hex;
}

function eventFired(data) {
  storeObject(JSON.stringify(data), 'store');
  trackEvent(data);
}

function logEvent(url, event, overwrite) {
  logURL(url, event, null, overwrite)
   .then(data => {
     for (record of data) {
       if (record.extra == null) {
         //console.log(record.data);
         eventFired(record.data);
       }
     }
   });
}

function getUserId() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['user_id'], (result) => {
      if (!result.hasOwnProperty('user_id')) {
        var userId = getRandomToken();
        chrome.storage.local.set({'user_id': userId}, () => {});
        chrome.storage.local.set({'installed_time': (new Date()).getTime()}, () => {});
        resolve(userId);
      } else {
        resolve(result.user_id);
      }
    });
  });
}

function enableButton() {
  chrome.storage.local.set({'working_status': 1}, ()=>{
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      //console.log('ENABLED_BACK');
      if (chrome.pageAction) {
        chrome.pageAction.setIcon({path: "icon1.jpg", tabId: tabs[0].id});
      }
    });
  });
}

function disableButton() {
  chrome.storage.local.set({'working_status': 0}, ()=>{
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      //console.log('DISABLED_BACK');
      if (chrome.pageAction) {
        chrome.pageAction.setIcon({path: "icon0.jpg", tabId: tabs[0].id});
      }
    });
  });
}

function genericOnClick(info, tab) {
  console.log("item " + info.menuItemId + " was clicked");
  console.log("info: " + JSON.stringify(info));
  console.log("tab: " + JSON.stringify(tab));
}

function enableContextMenu() {
  var contexts = ["page","selection","link","editable","image","video","audio"];
  for (var i = 0; i < contexts.length; i++) {
    var context = contexts[i];
    var title = "Test '" + context + "' menu item";
    var id = chrome.contextMenus.create({"title": title, "contexts":[context],
                                         "onclick": genericOnClick});
    //console.log("'" + context + "' item:" + id);
  }
}

function openTabUrl(params, sendResponse) {
  console.log("_LINK_", params.link);
  chrome.tabs.create({ url: params.link }, function(tab){
    console.log(tab);
    sendResponse({status: "OK_"});
  });
}

chrome.runtime.onConnect.addListener(function(port) {
  notPort = port;
  // console.log('SERVER CONNECTEEEEED');
  console.assert(notPort.name === "knockknock");
  notPort.onMessage.addListener(function(msg) {
    // console.log('SERVER MESSAGEEEEEEE');
    // if (msg.joke === "Knock knock")
    //    notPort.postMessage({question: "Who's there?"});
  });
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse){
    if (request.msg == 'custom') {
      console.log('request.action', request.action);
      if (request.action == 'waitAlert') {

      } else {
        window[request.action](request.params, sendResponse);
      }
    } else {
      window[request.msg]();
    }
  }
);

chrome.runtime.onInstalled.addListener(function (object) {
  getUserId().then(userId => {
    getConfiguration().then(config => {
      if (config.isUserStudy) {
        var url = config.initialSurveyUrl + userId;
        chrome.tabs.create({url: url}, function (tab) {
          console.log("New tab launched");
        });
      }
    });
  });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  // Note: this event is fired twice:
  // Once with `changeInfo.status` = "loading" and another time with "complete"
  tabToUrl[tabId] = tab.url;
  if (chrome.pageAction) {
    chrome.pageAction.show(tabId);
    getStatus((statusId)=>{
      chrome.pageAction.setIcon({path: "icon"+statusId+".jpg", tabId: lastTabId});
    });
  }
});

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  //console.log('LOADED');
  lastTabId = tabs[0].id;
  if (chrome.pageAction) {
    chrome.pageAction.show(lastTabId);
    getStatus((statusId)=>{
      chrome.pageAction.setIcon({path: "icon"+statusId+".jpg", tabId: lastTabId});
    });
  }
});

if (chrome.pageAction) {
  chrome.pageAction.onClicked.addListener(function(tab) {
    //console.log('CLICKED');
    lastTabId = tab.id;
    toogleStatus((statusId)=>{
      chrome.pageAction.setIcon({path: "icon"+statusId+".jpg", tabId: lastTabId});
      chrome.storage.local.get(['is_working', 'working_on'], (result) => {
        if (result.hasOwnProperty('is_working') && result.hasOwnProperty('working_on')) {
          var is_working = result['is_working'];
          var working_on = result['working_on'];
          if (is_working) {
            logEvent(tab.url, statusId==1?'SYSTEM_ENABLED_WORKING':'SYSTEM_DISABLED_WORKING',
              {platform: working_on, type: 'WORKING'});
          } else {
            logEvent(tab.url, statusId==1?'SYSTEM_ENABLED':'SYSTEM_DISABLED');
          }
        }
      });
    });
  });
}

chrome.tabs.onSelectionChanged.addListener(function(tabId, tabObj) {
  //console.log('CHANGED');
  lastTabId = tabId;
  if (chrome.pageAction) {
    chrome.pageAction.show(lastTabId);
    getStatus((statusId)=>{
      chrome.pageAction.setIcon({path: "icon"+statusId+".jpg", tabId: lastTabId});
    });
  }
  chrome.tabs.getSelected(null, (tab) => {
    if (tab) {
      logEvent(tab.url, 'TAB_CHANGE');
    }
  });
  // chrome.browserAction.setBadgeText({text: "."});
});

chrome.tabs.onRemoved.addListener(function(tabId, info) {
  logEvent(tabToUrl[tabId], 'TAB_CLOSED');
  delete tabToUrl[tabId];
});

/*
chrome.windows.onFocusChanged.addListener((window) => {
  chrome.windows.getCurrent({populate:true}, (windowObj) => {
    for (var tab of windowObj.tabs)
      if (tab.active)
        logEvent(tab.url, windowObj.focused?'WINDOW_FOCUS':'WINDOW_BLUR');
  });
});
*/

if(typeof chrome.app.isInstalled!=='undefined'){
}

init_process();
