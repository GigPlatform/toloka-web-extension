//console.log('YEIII');

var backLevel = true;
var configFile = 'config/general.json';
var platformsFile = 'config/platforms.json';
var blakclistFile = 'config/blacklist.json';

var defaultSite = {
  "url": "",
  "type": "OTHER",
  "subtype": "OTHER",
  "platform": "OTHER",
  "time": null
}

RegExp.escape = function(string) {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
};

function getChromeLocal(varName, defaultValue) {
  return new Promise((resolve, reject) => {
    browser.storage.local.get([varName]).then((result)=>{
      if (result.hasOwnProperty(varName)) {
        resolve(result[varName]);
      } else {
        var value = {};
        value[varName] = defaultValue;
        browser.storage.local.set(value).then(()=>{
          resolve(defaultValue);
        });
      }
    });
  });
}

function setChromeLocal(varName, value) {
  return new Promise((resolve, reject) => {
    var record = {};
    record[varName] = value;
    browser.storage.local.set(record).then(()=>{
      resolve(record);
    });
  });
}

var fileContent = {};
function getFileContentOnce(filePath) {
  return new Promise((resolve, reject) => {
    if (!fileContent.hasOwnProperty(filePath)) {
      fetch(browser.extension.getURL(filePath)).then(r => r.json())
        .then(content => {
          fileContent[filePath] = content;
          resolve(fileContent[filePath]);
        })
    } else {
      resolve(fileContent[filePath]);
    }
  });
}

function trackEvent(data) {
  var obj = mapObject(data);
  fsmInput(obj);
  matchATrigger(obj);
}

function trackTelemetry(eventName, eventData) {
    console.log('TRACK_EVENT', eventName, eventData);
}

function getConfiguration() {
  return new Promise((resolve, reject) => {
    getFileContentOnce(configFile)
      .then(config => resolve(config))
  });
}

function isNotBlacklisted(localUrl) {
  return new Promise((resolve, reject) => {
    getFileContentOnce(blakclistFile)
      .then(urls => {
        found = false;
        for (url of urls) {
          //console.log(localUrl);
          if (localUrl.indexOf(url) != -1) {
            found = true;
            reject();
            break;
          }
        }
        if (!found) {
          resolve();
        }
      })
  });
}

function loadConfiguration(platformsFile) {
  return new Promise((resolve, reject) => {
    var platformCount = 0;
    var platformsData = {};
    getFileContentOnce(platformsFile)
    .then(platforms => {
      //console.log(platforms);
      platforms.forEach(platformData => {
          //console.log(platformData);
          platformData.urls.forEach(urlObj => {
            var hostname = (new URL(urlObj.url)).hostname;
            if (!platformsData.hasOwnProperty(hostname)) {
              platformsData[hostname] = [];
            }
            urlObj.platform = platformData.name;
            platformsData[hostname].push(urlObj);
          });
          platformCount++;
          if (platformCount == platforms.length) {
            resolve(platformsData);
          }
      });
    });
  });
}

function mapObject(data) {
  var obj = {};
  obj.time = data[0];
  obj.user = data[1];
  obj.platform = data[2];
  obj.activity = data[3];
  obj.activityType = data[4];
  obj.status = data[5];
  obj.url = data[6];
  obj.event = data[7];
  obj.extra = data[8];
  return obj;
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function urlToRegex(url) {
  url = url.replace(/\(\.\*\)/g, "___");
  url = RegExp.escape(url);
  url = url.replace(/___/g, "(.*)") + '$';
  return new RegExp(url);
}

function logSite(obj, globalUrl, event, extra, overwrite) {
  return new Promise((resolve, reject) => {
    try {
      //console.log(chrome);
      browser.storage.local.get(['working_status','user_id']).then((result) => {
        var extra = null;
        obj.current = globalUrl;
        obj.time = (new Date()).getTime();
        obj.status = result['working_status'];
        obj.user = result['user_id'];
        if (overwrite) {
          for (var field in overwrite) {
            obj[field] = overwrite[field];
          }
        }
        var data = [obj.time, obj.user, obj.platform, obj.type, obj.subtype, obj.status, obj.current, event, obj.hasOwnProperty('extra')?obj.extra:extra];
        if (obj.hasOwnProperty('js')) {
          extra = obj.js;
        }
        resolve({data:data,extra:extra});
        //runCode("storeObject('" + JSON.stringify(data) + "')");
        //storeObject(obj).then(docRef => resolve(docRef)).catch(error => reject(error));
      });
    } catch(e) {
      //console.log(e);
    }
  });
}

function logURL(globalUrl, event, extra, overwrite) {
  return new Promise((resolve, reject) => {
    //console.log('logURL');
    if (globalUrl) {
      isNotBlacklisted(globalUrl)
        .then(() => {
          //console.log('NOT BLACKLISTED');
          if(!extra) {
            extra = "";
          }
          loadConfiguration(platformsFile).then(configData => {
            //console.log('Loading complete');
            var hostname = (new URL(globalUrl)).hostname;
            //console.log(hostname);
            var hostFound = false;
            var urlsFound = [];
            for (var key of Object.keys(configData)) {
              if (key == hostname) {
                hostFound = true;
                //console.log('Hostname found');
                var lastSite = null;
                for (var configObj of configData[key]) {
                  var regex = urlToRegex(configObj.url);
                  var matches = globalUrl.match(regex);
                  lastSite = configObj;
                  if (matches) {
                    urlsFound.push(configObj);
                  }
                }
              }
            }
            if (hostFound) {
              //console.log(urlsFound);
              if (urlsFound.length > 0) {
                var retrieved = 0;
                var result = [];
                for (var configObj of urlsFound) {
                  logSite(configObj, globalUrl, event, extra, overwrite).
                    then(data => {
                      result.push(data);
                      if (result.length == urlsFound.length) {
                        resolve(result);
                      }
                    });
                }
              } else {
                //console.log('!urlFound');
                var obj = clone(lastSite);
                obj.type = 'UNKNOWN';
                obj.subtype = 'UNKNOWN';
                logSite(obj, globalUrl, event, extra, overwrite).
                  then(data => {
                    resolve([data])
                  });
              }
            } else {
              //console.log('!hostFound');
              var obj = clone(defaultSite);
              logSite(obj, globalUrl, event, extra, overwrite).
                then(data => {
                  resolve([data]);
                });
            }
        });
      })
      .catch(() => {
        //console.log('BLACKLISTED');
        //console.log(globalUrl);
      });
    }
  });
}

function getDOMNode(urlRemote) {
  return new Promise((resolve, reject) => {
    if (urlRemote == null) {
      resolve(document);
    } else {
      fetch(urlRemote).then((response) => response.text()).then(function(text) {
          var node = document.createElement("div");
          //node.setAttribute("id", "tempContent");
          node.innerHTML = text;
          resolve(node);
        });
      }
  });
}

function waitForEl(selector, callback) {
  if ($(selector).length) {
    callback();
  } else {
    setTimeout(function() {
      waitForEl(selector, callback);
    }, 100);
  }
}