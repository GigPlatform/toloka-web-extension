var lastTabId = 0;
var status = 0;
var tabToUrl = {};
var modeObj = null;
var socket = null;

function init_process() {
  init_triggers('back');
  fsmReset();
  triggersReset();
  connReset();
  //getWage(true).then(totals => console.log(totals));
}

function connReset() {
  // console.log('connReset');
  getSettings().then(config=>{
    // console.log(config.socketUrl);
    socket = io(config.socketUrl);

    socket.on('connect', ()=>{
      // console.log('CONNECTED');
    });

    socket.on('myresponse', (data)=>{
      // console.log('connReset');
      if (Array.isArray(data)) {
        for (let record of data) {
          recordStream(record);
        }
      }
    });
  });
}

function sendSocket(channel, data) {
  socket.emit(channel, data);
}

function recordStream(data) {
  // console.log('recordStream');
  // console.log(data);
  if (data.hasOwnProperty('taskId')) {
    getChromeLocal('stream', {all:{}, users:{}, groups:{}}).then(stream=>{
        stream.all[data.taskId] = data;
        if (data.hasOwnProperty('userId')) {
          if (!stream.users.hasOwnProperty(data.userId)) {
            stream.users[data.userId] = [];
          }
          stream.users[data.userId].push(stream.all[data.taskId]);
        }
        if (data.hasOwnProperty('groupId')) {
          if (!stream.groups.hasOwnProperty(data.groupId)) {
            stream.groups[data.groupId] = [];
          }
          stream.groups[data.groupId].push(stream.all[data.taskId]);
        }
        setChromeLocal('stream', stream);
        console.log('myresponse', stream);
        processStream(data);
    });
  }
}

function processStream(task) {
  // console.log('processStream');
  if (task.hasOwnProperty('action')) {
    // console.log(task);
    if (task.action == 'STARTED' || task.action == 'SUBMITTED') {
      getSettings().then(config => {
        getChromeLocal('is_working', false).then(isWorking => {
          if (task.userId != config.userId) {
            let notType = '';
            let params = '';
            let toQueue = false;
            if (config.settings.not_whil == false && isWorking == true) {
              toQueue = true;
            }

            if (config.settings.msg_work) {
              notType = 'work';
              params = {
                action: 'message', 
                text: `[WORKER] Hi, this is ${task.firstName}, I completed this task: ${task.title}`, 
                link: `https://${sandboxMode?'sandbox.':''}toloka.yandex.com/task/${task.taskId}/${task.refUuid}`
              };
              // console.log(params);
              if (!toQueue) {
                sendNotification(notType, Object.assign({},params));
              } else {
                notQueue.push({notType:notType, params:Object.assign({},params)})
              }
            }
          }
        });
      });
    }
  }
}

function getStatus(callback) {
  browser.storage.local.get(['working_status']).then((result) => {
    if (result.hasOwnProperty('working_status')) {
      status = result['working_status'];
    } else {
      setChromeLocal('working_status', status);
    }
    callback(status);
  });
}

function toogleStatus(callback) {
  browser.storage.local.get(['working_status']).then((result)=>{
    if (result.hasOwnProperty('working_status')) {
      status = result['working_status'];
    }
    if (status == 1) {
      status = 0;
    } else {
      status = 1;
    }
    setChromeLocal('working_status', status);
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
  trackEvent(data);
  storeObject(JSON.stringify(data), 'store');
}

function logEvent(url, event, overwrite) {
  logURL(url, event, null, overwrite)
   .then(data => {
     for (record of data) {
       if (record.extra == null) {
         // console.log(record.data);
         eventFired(record.data);
       }
     }
   });
}

function getUserId() {
  return new Promise((resolve, reject) => {
    getChromeLocal('user_id', null).then(userId => {
      if (!userId) {
        userId = getRandomToken();
        setChromeLocal('user_id', userId);
        setChromeLocal('installed_time', (new Date()).getTime());
        resolve(userId);
      } else {
        resolve(userId);
      }
    });
  });
}

function enableButton() {
  setChromeLocal('working_status', 1).then(()=>{
    browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
      // console.log('ENABLED_BACK');
      if (browser.pageAction) {
        browser.pageAction.setIcon({path: "img/icon1.jpg", tabId: tabs[0].id});
      }
    });
  });
}

function disableButton() {
  setChromeLocal('working_status', 0).then(()=>{
    browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
      // console.log('DISABLED_BACK');
      if (browser.pageAction) {
        browser.pageAction.setIcon({path: "img/icon0.jpg", tabId: tabs[0].id});
      }
    });
  });
}

function genericOnClick(info, tab) {
  // console.log("item " + info.menuItemId + " was clicked");
  // console.log("info: " + JSON.stringify(info));
  // console.log("tab: " + JSON.stringify(tab));
}

function enableContextMenu() {
  var contexts = ["page","selection","link","editable","image","video","audio"];
  for (var i = 0; i < contexts.length; i++) {
    var context = contexts[i];
    var title = "Test '" + context + "' menu item";
    var id = browser.contextMenus.create({"title": title, "contexts":[context],
                                         "onclick": genericOnClick});
    // console.log("'" + context + "' item:" + id);
  }
}

function openTabUrl(params, sendResponse) {
  // console.log("_LINK_", params.link);
  browser.tabs.create({ url: params.link }).then((tab) => {
    // console.log(tab);
    sendResponse({status: "OK_"});
  });
}

function initialSetup(userId, config) {
  // console.log('USER_STUDY', config.isUserStudy);
  config.userId = userId;
  sandboxMode = config.sandbox;
  if (config.isUserStudy) {
    var url = config.initialSurveyUrl + userId;
    browser.tabs.create({url: url}).then((tab) => {
      // console.log("New tab launched");
    });
  }
  if (config.mode != 'PROTOCOL') {
    config.currentMode = config.mode;
  } else {
    if (config.hasOwnProperty('protocol') && config.protocol.length > 0) {
      config.currentMode = config.protocol[0].mode;
    } else {
      config.currentMode = 'ACTIVE';
    }
  }
  let nextDue = config.mode=='PROTOCOL'?config.protocol[0].durationMins:config.studyDurationMins;
  let modeData = {
    mode: config.mode,
    initDate: (new Date()).getTime(),
    curState: 0,
    totalStates: config.mode=='PROTOCOL'?config.protocol.length:1,
    nextDue: (new Date()).getTime() + nextDue*60*1000
  };
  config.currentState = 0;
  config.nextDue = modeData.nextDue;
  setChromeLocal('mode', modeData);
  setChromeLocal('settings', config);
  getLanguageLabels();
  startModeProcess();
}

function getLanguageLabels() {
  getLanguages().then(languages=>{
    setChromeLocal('languages', languages);
  });
}

function startModeProcess() {
  modeObj = setInterval(()=>{
    getChromeLocal('mode',{}).then(modeData => {
      if (modeData.curState < modeData.totalStates) {
        let curTime = (new Date()).getTime();
        if (curTime >= modeData.nextDue) {
          modeData.curState += 1;
          if (modeData.mode == 'PROTOCOL') {
            if (modeData.curState < modeData.totalStates) {
              getSettings().then(config => {
                config.currentMode = config.protocol[modeData.curState].mode;
                config.currentState = modeData.curState;
                modeData.nextDue = (new Date()).getTime() + config.protocol[modeData.curState].durationMins*60*1000;
                config.nextDue = modeData.nextDue;
                setChromeLocal('settings', config);
                setChromeLocal('mode', modeData);
                // console.log('TIMER_TICK', modeData);
              });
            } else {
              setChromeLocal('mode', modeData);
            }
          } else {
            setChromeLocal('mode', modeData);
          }
        }
        // console.log('TIMER', modeData);
      }
    });
  }, 30*1000);
}

function showIconValue(value) {
  browser.browserAction.setBadgeText({text: value});
}

function hideIconValue() {
  browser.browserAction.setBadgeText({text: ''}); 
}

browser.runtime.onConnect.addListener(function(port) {
  notPort = port;
  // console.log('SERVER CONNECTEEEEED');
  // console.assert(notPort.name === "knockknock");
  notPort.onMessage.addListener(function(msg) {
    // console.log('SERVER MESSAGEEEEEEE');
    // console.log(msg);
    if (msg.hasOwnProperty('action')) {
      // console.log('StoreObj_3');
      window[msg.action](...msg.params);
    }
    notPort.postMessage({action: "none"});
    // if (msg.joke === "Knock knock")
    //    notPort.postMessage({question: "Who's there?"});
  });
});

browser.runtime.onMessage.addListener(
  function(request, sender, sendResponse){
    // console.log('HAVE A MESSAGGEEEE')
    if (request.msg == 'custom') {
      window[request.action](request.params, sendResponse);
    } else if (request.msg == 'params') {
      // console.log('StoreObj_2');
      window[request.action](...request.params);
    } else {
      window[request.msg]();
    }
  }
);

browser.runtime.onInstalled.addListener(function (object) {
  getUserId().then(userId => {
    // getConfiguration().then(config => {
    getSettings().then(config => {
      // console.log('INIT_CONF', config);
      // setChromeLocal('settings', config).then(() => {
        // console.log('SETTINGS', config)
        initialSetup(userId, config);
      // });
    });
  });
});

browser.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  // Note: this event is fired twice:
  // Once with `changeInfo.status` = "loading" and another time with "complete"
  tabToUrl[tabId] = tab.url;
  if (browser.pageAction) {
    browser.pageAction.show(tabId);
    getStatus((statusId)=>{
      browser.pageAction.setIcon({path: "img/icon"+statusId+".jpg", tabId: lastTabId});
    });
  }
});

browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
  // console.log('LOADED');
  if (tabs[0] !== undefined) {
    lastTabId = tabs[0].id;
    if (browser.pageAction) {
      browser.pageAction.show(lastTabId);
      getStatus((statusId)=>{
        browser.pageAction.setIcon({path: "img/icon"+statusId+".jpg", tabId: lastTabId});
      });
    }
  }
});

if (browser.pageAction) {
  browser.pageAction.onClicked.addListener(function(tab) {
    // console.log('CLICKED');
    lastTabId = tab.id;
    toogleStatus((statusId)=>{
      browser.pageAction.setIcon({path: "img/icon"+statusId+".jpg", tabId: lastTabId});
      browser.storage.local.get(['is_working', 'working_on']).then((result) => {
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

// browser.tabs.onSelectionChanged.addListener(function(tabId, tabObj) {
browser.tabs.onActivated.addListener(function(tabId, tabObj) {
  // console.log('CHANGED');
  lastTabId = tabId;
  if (browser.pageAction) {
    browser.pageAction.show(lastTabId);
    getStatus((statusId)=>{
      browser.pageAction.setIcon({path: "img/icon"+statusId+".jpg", tabId: lastTabId});
    });
  }
  browser.tabs.query({active: true}).then((tab) => {
    if (tab) {
      logEvent(tab.url, 'TAB_CHANGE');
    }
  });
  // browser.browserAction.setBadgeText({text: "."});
});

browser.tabs.onRemoved.addListener(function(tabId, info) {
  logEvent(tabToUrl[tabId], 'TAB_CLOSED');
  delete tabToUrl[tabId];
});

/*
browser.windows.onFocusChanged.addListener((window) => {
  browser.windows.getCurrent({populate:true}, (windowObj) => {
    for (var tab of windowObj.tabs)
      if (tab.active)
        logEvent(tab.url, windowObj.focused?'WINDOW_FOCUS':'WINDOW_BLUR');
  });
});
*/

// if(typeof browser.app.isInstalled!=='undefined'){
// }

init_process();
