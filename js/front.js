// console.log('YEIII');
var globalUrl = window.location.href;
var inactivityMinutes = 1;
var wasInactive = false;
backLevel = false;

var libraries = [];
// var libraries = [browser.runtime.getURL("js/store.js")];

function init_process() {
  initConfig();
  init_triggers('front');
}

function initConfig() {
  setSandboxMode();
}

var inactivityInterval = null;
function inactivity_start() {
  if (inactivityInterval == null) {
    inactivityInterval = setTimeout(() => {
      wasInactive = true;
      logEvent('PAGE_INACTIVITY')
    }, inactivityMinutes*60*1000);
  }
}

function inactivity_restart() {
  inactivity_stop();
  inactivity_start();
}

function inactivity_stop() {
  clearTimeout(inactivityInterval);
  inactivityInterval = null;
}

function runCode(code) {
    var script = document.createElement( "script" );
    script.text = code;
    document.head.appendChild( script ).parentNode.removeChild( script );
}

function loadLibraries(libraries, callback) {
  if (libraries.length > 0) {
    var library = libraries.shift();
    // console.log(library);
    var script = document.createElement('script');
    script.src = library;
    script.onload = function(){
      loadLibraries(libraries, callback);
    }
    document.getElementsByTagName('head')[0].appendChild(script);
  } else {
    callback();
  }
}

function storeObjectLocal(data) {
  storeObject(JSON.stringify(data), 'store');
  // runCode("storeObject('" + JSON.stringify(data) + "', 'store')");
  // console.log(data);
  // browser.runtime.sendMessage(browser.runtime.id, {
  //     msg: "params",
  //     action: "storeObject",
  //     params: [data, 'store', true]
  // });
  // var port = browser.runtime.connect(browser.runtime.id, {name: "knockknock"});
  // port.postMessage({action: "storeObject", params:[data, 'store', true]});
}

var validated = false;
function conditionExecution(e) {
  if (e == null) {
    return document;
  } else {
    for (var event of e) {
      for (var node of event.addedNodes) {
        if (node.tagName == "SCRIPT" || node.nodeName == "#text")
          return null;
        return node;
      }
    }
  }
  return null;
}

var observers = [];
function executeValidation(settings, data) {
  var func = null;
  if (settings.hasOwnProperty('action')) {
    if (settings.action == 'equal' || settings.action == 'notequal') {
      func = function(e){
        var target = conditionExecution(e);
        if (target != null && settings.selector) {
          var elements = target.querySelectorAll(settings.selector);
          for (var element of elements) {
            if (settings.action == 'equal' && element.innerText == settings.value) {
              validated = true;
            } else if (settings.action == 'notequal' && element.innerText != settings.value) {
              validated = true;
            }
            if (validated) {
              // console.log('EVENT');
              data[0] = (new Date()).getTime();
              eventFired(data);
              return true;
            }
          }
        }
        return false;
      };
    } else if (settings.action == 'display') {
      func = function(e){
        var target = conditionExecution(e);
        if (target != null && settings.selector) {
          var elements = target.querySelector(settings.selector);
          if (elements) {
            validated = true;
            // console.log('EVENT');
            data[0] = (new Date()).getTime();
            eventFired(data);
            return true;
          }
        }
        return false;
      };
    } else if (settings.action == 'event') {
      func = function(e){
        var target = conditionExecution(e);
        if (target != null && settings.selector) {
          var elements = target.querySelectorAll(settings.selector);
          for (var element of elements) {
            element.addEventListener(settings.value, () => {
              validated = true;
              // console.log('EVENT');
              data[0] = (new Date()).getTime();
              eventFired(data);
              return true;
            });
          }
        }
        return false;
      };
    }
  } else {
    func = function(e){
      var target = conditionExecution(e);
      if (target != null && settings.selector) {
        var elements = target.querySelectorAll(settings.selector);
        if (elements.length > 0) {
          validated = true;
          data[0] = (new Date()).getTime();
          eventFired(data);
          return true;
        }
      }
      return false;
    };
  }
  if (settings.hasOwnProperty('wait') && settings.wait) {
    if (func && !func(null)) {
      observers.push(new MutationObserver(func));
      var observer = observers.slice(-1)[0];
      observer.observe(document, {attributes: false, childList: true, subtree: true});
    }
  } else {
    if (func) {
      func(null);
    }
  }
}

var stats = {};
var lastEvents = {};
function logEvent(event, otherUrl, overwrite, action) {
  // console.log('logEvent');
  return new Promise((resolve, reject) => {
    var log = true;
    if (action) {
      if (action == 'OUT') {
        checkLastInteraction();
        inactivity_stop();
        for (var i in stats) {
          stats[i] = false;
        }
        lastEvents = {};
        wasInactive = false;
      } else if (action == 'ONCE') {
        // console.log(stats);
        if (wasInactive === true) {
          wasInactive = false;
          logEvent('PAGE_REACTIVATE')
        }
        inactivity_restart();
        var lastTime = (new Date()).getTime();
        lastEvents.final = lastTime;
        lastEvents[event] = lastTime;
        if (!stats.hasOwnProperty(event))
          stats[event] = false;
        if (!stats[event]) {
          stats[event] = true;
        } else {
          log = false;
        }
      } else if (action == 'IN') {
        inactivity_start();
      }
    }
    if (log) {
      logURL(otherUrl?otherUrl:globalUrl, event, null, overwrite)
        .then(data => {
          // console.log(data);
          for (let record of data) {
            if (record.extra == null) {
              // console.log(record.data);
              eventFired(record.data);
            } else {
              executeValidation(record.extra, record.data);
            }
          }
          resolve();
        });
    }
  });
}

function checkLastInteraction() {
  if (Object.keys(lastEvents).length > 0) {
    logEvent('PAGE_LAST', null, {time: lastEvents.final});
  }
}

loadLibraries(libraries, () => logEvent('PAGE_LOAD', null, null, 'IN'));

window.addEventListener('blur', () => logEvent('PAGE_BLUR', null, null, 'OUT'));

window.addEventListener('focus', () => logEvent('PAGE_FOCUS', null, null, 'IN'));

window.addEventListener("beforeunload", () => logEvent('PAGE_CLOSE', null, null, 'OUT'));

// window.addEventListener("unload", () => logEvent('PAGE_UNLOAD'));

window.addEventListener("keypress", () => logEvent('PAGE_KEY', null, null, 'ONCE'));

window.addEventListener("click", () => logEvent('PAGE_CLICK', null, null, 'ONCE'));

window.addEventListener('scroll', () => logEvent('PAGE_SCROLL', null, null, 'ONCE'));

init_process();
