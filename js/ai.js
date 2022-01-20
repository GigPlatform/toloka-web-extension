var taskTypes = ['NON', 'UNK', 'CLS', 'MOD', 'FLD', 'REL', 'USR', 'WEB'];
var reqs = {};
var featuresSchema = {
  'status': {type:'INT'},
  'preference': {type:'INT'},
  'money': {type:'FLOAT'},
  'moneyMax': {type:'FLOAT'},
  'time': {type:'INT', proc:(x)=>x/10},
  'avgTime': {type:'INT', proc:(x)=>x/10},
  'accRate': {type:'FLOAT'},
  'avgHourly': {type:'FLOAT'},
  'reqFreq': {type:'CAT', proc:(x)=>reqs.hasOwnProperty(x)?reqs[x]:0},
  'issType': {type:'CAT', proc:(x)=>['','AUTOMATIC'].indexOf(x)},
  'training': {type:'BOOL'},
  'hasInst': {type:'BOOL'},
  'reqTrusted': {type:'BOOL'},
  'postAcc': {type:'BOOL'},
  'taskType': {type:'CAT', proc:(x)=>taskTypes.indexOf(x)}
};
var fieldNames = Object.keys(featuresSchema);
var modelGlobal = null;
var xTrain = [];
var yTrain = [];
var lastWeights = {};
var recomMode = 'AI';

function extractFeatures(task) {
  let features = {
    'status': task.status,
    'preference': task.preference,
    'money': task.pools[0].reward,
    'moneyMax': task.projectStats.moneyMax3,
    'time': task.pools[0].assignmentMaxDurationSeconds,
    'avgTime': task.projectStats.averageSubmitTimeSec,
    'accRate': task.projectStats.acceptanceRate,
    'avgHourly': task.projectStats.moneyAvgHourly,
    'reqFreq': task.requesterInfo.name.EN,
    'issType': task.assignmentIssuingType,
    'training': task.trainingDetails.training,
    'hasInst': task.hasInstructions,
    'reqTrusted': task.requesterInfo,
    'postAcc': task.postAccept,
    'taskType': getTaskType(task)
  };
  return validateFeatures(features);
}

function validateFeatures(features) {
  let feature = [];
  for (let field in featuresSchema) {
    if (featuresSchema[field].type=='INT') {
      if (!features[field]) {
        features[field] = 0;
      }
    } else if (featuresSchema[field].type=='FLOAT') {
      if (!features[field]) {
        features[field] = 0.0;
      }
    } else if (featuresSchema[field].type=='BOOL') {
      features[field] = features[field]?1:0;
    }
    if (featuresSchema[field].hasOwnProperty('proc')) {
      features[field] = featuresSchema[field].proc(features[field])
    }
    feature.push(features[field]);
  }
  return feature;
}

function setField(obj, field, value, dict) {
  if (typeof value == 'function') {
      if (dict) {
        value = value(obj[field]);
      } else {
        value = value(obj[fieldNames.indexOf(field)]);
      }
  }
  if (dict) {
    obj[field] = value;
  } else {
    obj[fieldNames.indexOf(field)] = value;
  }
  return obj;
}

function getPrice(obj) {
  if (obj.trainingDetails.training) {
    return obj.trainingDetails.regularPoolReward;
  } else {
    return obj.pools[0].reward;
  }
}

function getRankedResults(tasks, rankMethod) {
    if (rankMethod != 'NO') {
      if (rankMethod == 'AI') {
        // console.log('AI_1')
        if (tasks.length > 0) {
          // console.log('AI_2')
          if (tasks[0].hasOwnProperty('weight')) {
            // console.log('AI_3')
            tasks.sort((a, b) => (a.weight < b.weight) ? 
              1 : (a.weight === b.weight) ? 
              ((getPrice(a) > getPrice(b)) ? 
              1 : -1) : -1 );
            return tasks;
          } else {
            return getRankedResults(tasks, 'REWARD');
          }
        }
      } else if (rankMethod == 'REWARD') {
        tasks.sort((a, b) => (getPrice(a) < getPrice(b)) ? 
          1 : (getPrice(a) === getPrice(b)) ? 
          ((a.projectStats.averageSubmitTimeSec > b.projectStats.averageSubmitTimeSec) ? 
          1 : -1) : -1 );
        return tasks;
      } else if (rankMethod == 'TIME') {
        tasks.sort((a, b) => (a.pools[0].startedAt < b.pools[0].startedAt) ? 
          1 : -1 );
        return tasks;
      }
    }
    return tasks;
}

function processExtra(obj, extra, dict) {
  if (extra) {
    for (let field in extra) {
      obj = setField(obj, field, extra[field], dict)
    }
  }
  return obj;
}

function getCurrentTasks() {
    return new Promise((resolve, reject) => {
        // console.log('sandboxMode', sandboxMode);
        getLanguage().then(lang=>{
          fetch(`https://${sandboxMode?'sandbox.':''}toloka.yandex.com/api/task-suite-pool-groups?userLangs=${lang}`, {
              "method": "GET",
              "mode": "cors",
              "credentials": "include"
          }).then(response => response.json())
            .then(data => {
              if (Array.isArray(data)) {
                resolve(data);
              } else {
                resolve([]);
              }
          });
        });
    });  
}

function getActiveTasks() {
    return new Promise((resolve, reject) => {
        getChromeLocal('dataset', {data:{}, active:{}}).then(dataset => {
          getCurrentTasks().then(tasks=>{
            let taskKeys = tasks.map(x=>x.pools[0].id);
            let result = [];
            for (var i in taskKeys) {
              let taskId = taskKeys[i];
              if (taskId in dataset.data) {
                result.push(Object.assign(dataset.data[taskId], {newRow: false}));
              } else {
                result.push(Object.assign(tasks[i], {weight:0, newRow: true}));
              }
            }
            resolve(result);
          });
          // console.log('AI_0_0');
          // if (Object.keys(dataset.active).length > 0) {
            // console.log('AI_0_1');
            // resolve(Object.values(dataset.active));
          // } else {
            // console.log('AI_0_2');
            // getCurrentTasks().then(tasks=>resolve(tasks));
          // }
        });
    });
}

function removeActiveDataset(taskId) {
  getChromeLocal('dataset', {data:{}, active:{}}).then(dataset => {
    if (dataset.active.hasOwnProperty(taskId)) {
      delete dataset.active[taskId];
      setChromeLocal('dataset', dataset);
    }
  });
}

function removeActiveFeature(taskId) {
  getChromeLocal('features', {schema:fieldNames, data:{}}).then(features => {
    if (features.active.hasOwnProperty(taskId)) {
      delete features.active[taskId];
      setChromeLocal('features', features);
    }
  });
}

function updateDataset(taskId, task, extra) {
  return new Promise((resolve, reject) => {
    getChromeLocal('dataset', {data:{}, active:{}}).then(dataset => {
      if (dataset.data.hasOwnProperty(taskId)) {
        dataset.data[taskId] = processExtra(dataset.data[taskId], extra, true);
        setChromeLocal('dataset', dataset).then(()=>{
          resolve();
        });
      } else {
        if (task) {
          storeDataset([task], {preference: 1, status: 1}).then(()=>{
            resolve();
          });
        } else {
          resolve();
        }
      }
      // console.log('DATASET', dataset);
    });
  });
}

function storeDataset(tasks, extra) {
  return new Promise((resolve, reject) => {
    getChromeLocal('dataset', {data:{}, active:{}}).then(dataset => {
      let count = 0;
      dataset.active = {};
      tasks.forEach(task => {
        let taskId = `${task.pools[0].id}`;
        // let taskId = `${task.projectId}_${task.pools[0].id}`;

        if (!dataset.data.hasOwnProperty(taskId)) {
          count++;
          dataset.data[taskId] = task;
          dataset.data[taskId].taskId = taskId;
          dataset.data[taskId].requester = task.requesterInfo.name.EN;
          dataset.data[taskId].preference = 0;
          dataset.data[taskId].status = 0;
          if (extra) {
            dataset.data[taskId] = Object.assign(dataset.data[taskId], extra);
          }
        }
        dataset.active[taskId] = dataset.data[taskId];
      });
      if (count > 0) {
        setChromeLocal('dataset', dataset).then(() => resolve(dataset));
        // console.log('DATASET', dataset);
      } else {
        resolve(dataset);
      }
    });
  });
}

function updateFeatures(taskId, task, extra) {
  return new Promise((resolve, reject) => {
    getChromeLocal('features', {schema:fieldNames, data:{}}).then(features => {
      if (features.data.hasOwnProperty(taskId)) {
        features.data[taskId] = processExtra(features.data[taskId], extra, false);
        setChromeLocal('features', features).then(()=>{
          trainModel().then(()=>{
            // console.log('MODEL_TRAINED');
            predictDataset();
          });
          resolve();
        });
      } else {
        if (task) {
          storeFeatures([task], {preference: 1, status: 1}).then(()=>{
            resolve();
          });
        } else {
          resolve();
        }
      }
      // console.log('FEATURES', features);
    });
  });
}

function storeFeatures(tasks, extra) {
  return new Promise((resolve, reject) => {
    getChromeLocal('features', {schema:fieldNames, data:{}, active:{}}).then(features => {
      getChromeLocal('requesters', {}).then(requesters => {
        reqs = requesters;
        let count = 0;
        features.active = {};
        tasks.forEach(task => {
          let taskId = `${task.pools[0].id}`;
          // let taskId = `${task.projectId}_${task.pools[0].id}`;
          if (!features.data.hasOwnProperty(taskId)) {
            count++;
            if (extra) {
              task = Object.assign(task, extra);
            }
            features.data[taskId] = extractFeatures(task);
          }
          features.active[taskId] = features.data[taskId];
        });
        setChromeLocal('features', features).then(result => resolve(result));
        if (count > 0) {
          // console.log('FEATURES', features);
          if (!modelGlobal) {
            // console.log('FEATURES_TRAIN_1');
            trainModel().then(()=>{
              predictDataset();  
            })
          } else {
            // console.log('FEATURES_TRAIN_2');
            predictDataset();
          }
        }
      });
    });
  });
}

function getTaskType(task) {
    var types = {
        "yt_project_class__snippet__unknown": "UNK",
        "yt_project_class__snippet__classification": "CLS",
        "yt_project_class__snippet__moderation": "MOD",
        "yt_project_class__snippet__field_task": "FLD",
        "yt_project_class__snippet__relevance": "REL",
        "yt_project_class__snippet__user_content": "USR",
        "yt_project_class__snippet__web_searching": "WEB"
    };
    var taskType = "NON";
    if (task.hasOwnProperty('projectMetaInfo') && task.projectMetaInfo.hasOwnProperty('experimentMeta')) {
      var meta = task.projectMetaInfo.experimentMeta;
      for (var typeTask in types) {
          if (meta.hasOwnProperty(typeTask)) {
              taskType = types[typeTask];
              break;
          }
      }
    }
    return taskType;
}

function trainModel() {
  return new Promise((resolve, reject) => {
    if (backLevel) {
      getChromeLocal('features', {schema:fieldNames, data:{}, active:{}}).then(features => {
        // console.log('START_TRAINING');
        let data = Object.values(features.data);
        if (data.length > 0) {
          xTrain = data.map(val=>val.slice(1));
          yTrain = data.map(val=>val[0]);

          modelGlobal = tf.sequential();
          modelGlobal.add(tf.layers.dense({units: 20, inputShape: [fieldNames.length-1]}));
          modelGlobal.add(tf.layers.dense({units: 10}));
          modelGlobal.add(tf.layers.dense({units: 1}));
          modelGlobal.summary();

          modelGlobal.compile({
            optimizer: 'adam',
            loss: tf.losses.meanSquaredError,
            metrics: ['accuracy'],
          });

          // console.log('TRAINING');
          modelGlobal.fit(tf.tensor2d(xTrain), tf.tensor1d(yTrain), {
            epochs: 100,
            verbose: 0,
            callbacks: {
              onTrainEnd: async (logs) => {
                // console.log('TRAIN_END_1');
                resolve();    
              }
            }
          }).then(history => {
            // console.log('TRAIN_END_2');
            resolve();
          });
          // console.log('TRAIN_END_3');
          setTimeout(()=>{
            // console.log('TRAIN_END_4');
            resolve();
          }, 200);
        }
      });      
    } else {
      browser.runtime.sendMessage({msg: "trainModel"});
    }
  });
}

function predictDataset() {
  return new Promise((resolve, reject) => {
    // console.log('PREDICT_DATASET')
    getChromeLocal('features', {schema:fieldNames, data:{}, active:{}}).then(features => {
      // console.log(features);
      let keys = Object.keys(features.active);
      let data = Object.values(features.active);
      if (data.length > 0) {
        xTrain = data.map(val=>val.slice(1));
        if (modelGlobal) {
          modelGlobal.predict(tf.tensor2d(xTrain)).data().then(results=>{
            let weights = {};
            for (let i = 0; i <= results.length; i++) {
              weights[keys[i]] = results[i];
            }
            lastWeights = weights;
            setChromeLocal('weights', weights);
            getChromeLocal('dataset', {data:{}, active:{}}).then(dataset => {
              for (let taskId in weights) {
                if (dataset.active.hasOwnProperty(taskId)) {
                  dataset.active[taskId].weight = weights[taskId];
                }
              }
              // console.log('WEIGHTS_UPDATED', dataset);
              setChromeLocal('dataset', dataset).then(()=>resolve(weights));
            });
          });
        }
      }
    });
  });
}

function predictRows(rows) {
  if (modelGlobal) {
    modelGlobal.predict(tf.tensor2d(rows)).print();
  }
}

function predictRow(row) {
  if (modelGlobal) {
    modelGlobal.predict(tf.tensor2d([row])).print();
  }
}

function getTaskType(task) {
    var types = {
        "yt_project_class__snippet__classification": "CLS",
        "yt_project_class__snippet__user_content": "USR",
        "yt_project_class__snippet__web_searching": "WEB",
        "yt_project_class__snippet__field_task": "FLD",
        "yt_project_class__snippet__moderation": "MOD",
        "yt_project_class__snippet__unknown": "UNK",
        "yt_project_class__snippet__relevance": "REL"
    };
    var meta = task.projectMetaInfo.experimentMeta;
    var taskType = "NON";
    for (var typeTask in types) {
        if (meta.hasOwnProperty(typeTask)) {
            taskType = types[typeTask];
            break;
        }
    }
    return taskType;
}

function addUserFields(tasks) {
  return new Promise((resolve, reject) => {
    getSettings().then(config=>{
      const calAge = (date) => new Date(Date.now() - new Date(date).getTime()).getFullYear() - 1970;
      const monthDiff = (dateFrom, dateTo) => dateTo.getMonth() - dateFrom.getMonth() + (12 * (dateTo.getFullYear() - dateFrom.getFullYear()));
      for (let i in tasks) {
        tasks[i].userId = config.userId;
        tasks[i].groupId = config.groupId;
        tasks[i].timestamp = (new Date()).getTime();
        if (config.hasOwnProperty('userData')) {
          tasks[i].citizenship = config.userData.citizenship;
          tasks[i].country = config.userData.country;
          tasks[i].userLang = config.userData.userLang;
          tasks[i].firstName = config.userData.firstName;
          tasks[i].gender = config.userData.gender;
          tasks[i].education = config.userData.education;
          tasks[i].languages = config.userData.languages;
          tasks[i].age = calAge(config.userData.birthDay);
          tasks[i].experience = monthDiff(new Date(config.userData.createdDate), new Date());
        }
      }
      resolve(tasks);
    })
  });
}

function augmentData(tasks) {
    for (var task of tasks) {
        task.taskType = getTaskType(task);
    }
}

function updateRequesters(requesterName) {
    return new Promise((resolve, reject) => {
        getChromeLocal('requesters', {}).then(requesters => {
            // console.log('REQUESTER NAME', requesterName);
            if (requesters.hasOwnProperty(requesterName)) {
                requesters[requesterName] += 1;
            } else {
                requesters[requesterName] = 1;
            }
            setChromeLocal('requesters', requesters).then(() => {
                resolve(requesters);
            });
            // console.log('REQUESTERS', requesters);
        });
    });
}