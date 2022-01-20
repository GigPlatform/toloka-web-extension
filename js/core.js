// console.log('YEIII');

var backLevel = true;
var configFile = 'config/general.json';
var platformsFile = 'config/platforms.json';
var blakclistFile = 'config/blacklist.json';
var languagesFile = 'config/languages.json';
var notPort = null;
var notPorts = [];
var sandboxMode = false;

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

function getChromeValue(varName, defaultValue) {
  return new Promise((resolve, reject) => {
    browser.storage.local.get([varName]).then((result)=>{
      if (result.hasOwnProperty(varName)) {
        resolve(result[varName]);
      } else {
        resolve(defaultValue);
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

function getSettings() {
  return new Promise((resolve, reject) => {
    getChromeValue('settings', false).then(config=>{
      if(!config) {
        getConfiguration().then(config=>{
          setChromeLocal('settings', config).then(()=>{
            resolve(config);
          });
          logEvent("CONFIG_FILE", 'chrome://general', {
              extra: JSON.stringify(config),
              type: 'API',
              subtype: 'GENERAL'
            }
          );
        })
      } else {
        resolve(config);
      }
    })
  });
}

function getAddedTasks() {
  return new Promise((resolve, reject) => {
    getChromeValue('addedTasks', {available:false, list:[]}).then(addedTasks=>{
      resolve(addedTasks);
    });
  });
}

var fileContent = {};
function getFileContentOnce(filePath) {
  return new Promise((resolve, reject) => {
    if (!fileContent.hasOwnProperty(filePath)) {
      fetch(browser.runtime.getURL(filePath)).then(r => r.json())
        .then(content => {
          fileContent[filePath] = content;
          resolve(fileContent[filePath]);
        })
    } else {
      resolve(fileContent[filePath]);
    }
  });
}

function eventFired(data) {
  // console.log('eventFired');
  return new Promise((resolve, reject) => {
    trackEvent(data);
    storeObject(JSON.stringify(data), 'store').then(()=>{
      resolve();
    });
  });
}

function trackEvent(data) {
  var obj = mapObject(data);
  fsmInput(obj);
  // console.log(data, obj);
  matchATrigger(obj);
}

function getConfiguration() {
  return new Promise((resolve, reject) => {
    getFileContentOnce(configFile)
      .then(config => resolve(config))
  });
}

function getLanguage() {
  return new Promise((resolve, reject) => {
    getSettings().then(config=>{
      getLanguages().then(languages=>{
            if (config.hasOwnProperty('userData') && config.userData.hasOwnProperty('userLang')) {
              if (config.userData.userLang in languages.texts) {
                resolve(config.userData.userLang);
              } else {
                resolve('EN');
              }
            } else {
              resolve('EN');
            }
          });
      });
  });
}

function getLanguages() {
  return getConfigOnce('languages', languagesFile);
}

function getConfigOnce(configType, configurationFile) {
  return new Promise((resolve, reject) => {
    getChromeValue(configType, false).then(config=>{
      if(!config) {
        getFileOnce(configurationFile).then(config=>{
          setChromeLocal(configType, config).then(()=>{
            resolve(config);
          })
        })
      } else {
        resolve(config);
      }
    })
  });
}

function getFileOnce(configurationFile) {
  return new Promise((resolve, reject) => {
    getFileContentOnce(configurationFile)
      .then(config => resolve(config));
  });
}

function isNotBlacklisted(localUrl) {
  return new Promise((resolve, reject) => {
    getFileContentOnce(blakclistFile)
      .then(urls => {
        found = false;
        for (url of urls) {
          // console.log(localUrl);
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
      // console.log(platforms);
      platforms.forEach(platformData => {
          // console.log(platformData);
          platformData.urls.forEach(urlObj => {
            var hostname = getHostname(urlObj.url);
            // var hostname = (new URL(urlObj.url)).hostname;
            // var hostname = getUrlParts(urlObj.url).hostname;
            // console.log(hostname);
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

function logSite(obj, globalUrl, event, extra, overwrite) {
  return new Promise((resolve, reject) => {
    try {
      // console.log('logSite');
      browser.storage.local.get(['working_status','user_id']).then((result) => {
        // var extra = null;
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
        // runCode("storeObject('" + JSON.stringify(data) + "')");
        // storeObject(obj).then(docRef => resolve(docRef)).catch(error => reject(error));
      });
    } catch(e) {
      // console.log(e);
    }
  });
}

function urlToRegex(url) {
  // console.log('urlToRegex');
  // console.log(url);
  url = decodeURI(url);
  url = url.replaceAll(/\(\.\*\)/g, "___");
  url = RegExp.escape(url);
  url = url.replaceAll(/___/g, "(.*)") + '$';
  // console.log(url);
  return url;
}

function valuesMatch(pattern, value) {
  var urlReg = urlToRegex(pattern);
  var regex = new RegExp(urlReg);
  var matches = value.match(regex);
  // console.log(urlReg, value, matches);
  return matches;
}

function logURL(globalUrl, event, extra, overwrite) {
  return new Promise((resolve, reject) => {
    // console.log('logURL');
    if (globalUrl) {
      isNotBlacklisted(globalUrl)
        .then(() => {
          // console.log('NOT BLACKLISTED');
          if(!extra) {
            extra = null;
          }
          // console.log('LOAD_1');
          loadConfiguration(platformsFile).then(configData => {
            // console.log('LOAD_2');
            var hostname = getHostname(globalUrl);
            // var hostname = (new URL(globalUrl)).hostname;
            // var hostname = getUrlParts(globalUrl).hostname;
            // console.log(hostname);
            var hostFound = false;
            var urlsFound = [];
            for (var key of Object.keys(configData)) {
              if (valuesMatch(key, hostname)) {
                // console.log("MATCH_1");
                hostFound = true;
                // console.log('Hostname found');
                var lastSite = null;
                for (var configObj of configData[key]) {
                  var matches = valuesMatch(configObj.url, globalUrl);
                  lastSite = configObj;
                  if (matches) {
                    // console.log("MATCH_2");
                    // console.log(configObj.url, globalUrl, matches);
                    urlsFound.push(configObj);
                  }
                }
              }
            }
            // console.log(hostFound);
            if (hostFound) {
              // console.log(urlsFound);
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
                // console.log('!urlFound');
                var obj = clone(lastSite);
                obj.type = 'UNKNOWN';
                obj.subtype = 'UNKNOWN';
                logSite(obj, globalUrl, event, extra, overwrite).
                  then(data => {
                    resolve([data])
                  });
              }
            } else {
              // console.log('!hostFound');
              var obj = clone(defaultSite);
              logSite(obj, globalUrl, event, extra, overwrite).
                then(data => {
                  resolve([data]);
                });
            }
        });
      })
      .catch(() => {
        // console.log('BLACKLISTED');
        // console.log(globalUrl);
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
          // node.setAttribute("id", "tempContent");
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

function postMessage(msg) {
  notPorts.forEach(port=>{
    if (port) {
      try {
        port.postMessage(msg);
      } catch(e) {

      }     
    }
  });
}

function isAnObject(obj) {
  if (typeof obj === 'object' && !Array.isArray(obj) && obj !== null) {
    return true;
  } else {
    return false;
  }
}

function setSandboxMode() {
  getSettings().then(config=>{
    sandboxMode = config.sandbox;
  });
}

function getHostname(href) {
  try {
    return (new URL(href)).hostname;
  } catch(e) {
    let host = getUrlParts(href);
    return host?host.hostname:'none';
  }
}

function getUrlParts(href) {
  // var match = href.match(/^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)([\/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/);
  var match = href.match(/^(?:(https?\:)\/\/)?(([^:\/?#]*)(?:\:([0-9]+))?)([\/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/);
  return match && {
    href: href,
    protocol: match[1],
    host: match[2],
    hostname: match[3],
    port: match[4],
    pathname: match[5],
    search: match[6],
    hash: match[7]
  }
}