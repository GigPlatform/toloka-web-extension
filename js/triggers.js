var triggersFile = 'config/triggers.json';
var triggersMap = {};
var intervals = [];
var triggerEvents = {};
var activeTasks = 0;
var notQueue = [];

function getCurrentDateTime() {
  var tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
  return (new Date(Date.now() - tzoffset)).toISOString().slice(0, 19);
}

function triggersReset() {
	setChromeLocal('wages', {});
}

function allStarted(obj) {
	//console.log('ENABLE');
	browser.runtime.sendMessage({ msg: "enableButton" });
	setChromeLocal('is_working', true);
	setChromeLocal('working_on', obj.platform);
}

function allSubmited(obj) {
	// console.log('DISABLE');
	// console.log(obj);
	browser.runtime.sendMessage({ msg: "disableButton" });
	setChromeLocal('is_working', false);
}

function tolokaUrlTaskId(url) {
	try {
		return url.split('/task/').pop().split('/').shift();	
	} catch (err) {
		return null;
	}
}

function tolokaSwitchWorking() {
	while (notQueue.length > 0) {
		let not = notQueue.pop();
		sendNotification(not.notType, not.params);
	}
}

function tolokaStarted(obj) {
	// console.log('TASK STARTED');
	let taskId = tolokaUrlTaskId(obj.url);
	// console.log(taskId);
  updateDataset(taskId, null, {status: 1});
  updateFeatures(taskId, null, {status: 1});
	// browser.runtime.sendMessage({ msg: "enableButton" });
	setChromeLocal('is_working', true);
	setChromeLocal('working_on', obj.platform);
	tolokaShareTask('STARTED', taskId);
}

function tolokaSubmited(obj) {
	// console.log('TASK COMPLETED');
	let taskId = tolokaUrlTaskId(obj.url);
  updateDataset(taskId, null, {status: 2}).then(()=>{
  	removeActiveDataset(taskId);
  });
  updateFeatures(taskId, null, {status: 2}).then(()=>{
  	removeActiveFeature(taskId);
  });
	// browser.runtime.sendMessage({ msg: "disableButton" });
	setChromeLocal('is_working', false);
	tolokaSwitchWorking();
	tolokaShareTask('SUBMITTED', taskId);
}

function tolokaGetTaskById(taskId) {
	return new Promise((resolve, reject) => {
		getChromeLocal('dataset', {data:{}, active:{}}).then(dataset => {
			// console.log(taskId, dataset);
			if (dataset.data.hasOwnProperty(taskId)) {
				dataset.data[taskId].taskId = taskId;
				resolve(dataset.data[taskId]);
			} else {
				resolve(null);
			}
		});
	});
}

function tolokaShareTask(status, taskId) {
	// console.log('tolokaShareTask');
	tolokaGetTaskById(taskId).then(task=>{
		// console.log(task);
		if (task) {
			task.action = status;
			addUserFields([task]).then(tasks=>{
				// console.log(tasks);
				// sendSocket('myevent', tasks)
				browser.runtime.sendMessage({ msg:"params", action:"sendSocket", params:['myevent', tasks] });
			});
		}
	});
}

function tolokaRejected(obj) {
	// console.log('TASK REJECTED');
	if (activeTasks <= 1) {
		setChromeLocal('is_working', false);
		tolokaSwitchWorking()		
	}
}

function rejectedTask() {
  // console.log('REJECTED_TASK');
  browser.runtime.sendMessage({ msg: "disableButton" });
	setChromeLocal('is_working', false);
}

function refreshWage() {
	mturkEarningsRemote();
}

function tolokaRefreshWage() {
	tolokaEarningsRemote();
	tolokaTaskCompleted();
}

function tolokaTaskCompleted() {
	// console.log('FSM TASK COMPLETED');
	let taskId = tolokaUrlTaskId(window.location.href);
  // updateDataset(taskId, null, {status: 2});
  // updateFeatures(taskId, null, {status: 2});
}

function getStringDate(timestamp) {
	if (timestamp == null)
		return getCurrentDateTime().split('T')[0];
	return (new Date(timestamp)).toISOString().split('T')[0];
}


function getTaskAnalysis(isRemote) {
	return new Promise((resolve, reject) => {
		// console.log('getTaskAnalysis');
    	getQueueDiff(isRemote).then(response => {
    		// console.log(response);
    		if (response.changed) {
    			var tasksUrl = 'https://worker.mturk.com/tasks/';
    			if (response.added.length > 0) {
    				for (var taskId of response.added) {
    					var taskData = response.data[taskId];
    					// console.log(taskData);
    					var eventName = taskData.question.type.toUpperCase();
    					logEvent(eventName, tasksUrl, {
    							extra: JSON.stringify(taskData),
    							type: 'LOGS',
    							subtype: 'ADDED_TASK'
    					});
    				}
    			}
    			if (response.finished.length > 0) {
    				for (var taskId of response.finished) {
    					var taskData = response.data[taskId];
    					// console.log(taskData);
    					var eventName = taskData.question.type.toUpperCase();
    					logEvent(eventName, tasksUrl, {
    							extra: JSON.stringify(taskData),
    							type: 'LOGS',
    							subtype: 'FINISHED_TASK'
    						}
    					);
    				}
    			}
    			if (response.numTasks == 0) {
					// console.log('STATUS');
			      	getStatus((statusId)=>{
			      	  	// console.log(statusId);
			      	  	if (statusId == 1) {
			      	  		// console.log('disableButton');
			      	  		disableButton();
			      	  		for (var taskId of response.finished) {
		    					var taskData = response.data[taskId];
		    					// console.log(taskData);
		    					logEvent('PAGE_LOAD',
		    						       'https://worker.mturk.com' + taskData.task_url,
		    						        {
						    					 		type: 'WORKING',
						    					 		subtype: 'TASK_SUBMITED'
						    					 	}
		    					 );
		    				}
		    				setChromeLocal('is_working', false);
			      	}
						});
					}
    		}
    	});
  	});
}

function tolokaTaskAnalysis(isRemote) {
	return new Promise((resolve, reject) => {
		// console.log('tolokaTaskAnalysis');
    	tolokaQueueDiff(isRemote).then(response => {
    		// console.log(response);
    		activeTasks = response.numTasks;
    		if (response.changed) {
    			var tasksUrl = `https://${sandboxMode?'sandbox.':''}toloka.yandex.com/task/`;
    			if (response.added.length > 0) {
    				for (var taskId of response.added) {
    					var taskData = response.data[taskId];
    					// console.log(taskData);
    					// var eventName = taskData.question.type.toUpperCase();
    					var eventName = taskData.trainingDetails.training?'TRAINING':'TASK';
    					logEvent(eventName, tasksUrl, {
    							extra: JSON.stringify(taskData),
    							type: 'LOGS',
    							subtype: 'ADDED_TASK'
    						}
    					);
    				}
    			}
    			if (response.finished.length > 0) {
    				// console.log('!!! TASK COMPLETED !!!', 'tolokaTaskAnalysis');
    				for (var taskId of response.finished) {
    					var taskData = response.data[taskId];
    					// console.log(taskData);
    					// var eventName = taskData.question.type.toUpperCase();
    					var eventName = taskData.trainingDetails.training?'TRAINING':'TASK';
    					logEvent(eventName, tasksUrl, {
    							extra: JSON.stringify(taskData),
    							type: 'LOGS',
    							subtype: 'FINISHED_TASK'
    						}
    					);
    					// updateDataset(taskId, taskData, {status: 2});
    					// updateFeatures(taskId, taskData, {status: 2});
    				}
    			}
    			if (response.numTasks == 0) {
					// console.log('STATUS');
			      	getStatus((statusId)=>{
			      	  	// console.log(statusId);
			      	  	if (statusId == 1) {
			      	  		// console.log('disableButton');
			      	  		disableButton();
			      	  		for (var taskId of response.finished) {
		    					var taskData = response.data[taskId];
		    					// console.log(taskData);
		    					logEvent('PAGE_LOAD', 
		    							`https://${sandboxMode?'sandbox.':''}toloka.yandex.com/task/${taskData.lightweightTec.poolId}/${taskData.activeAssignments[0].id}`, 
		    							{
		    					 			type: 'WORKING',
		    					 			subtype: 'TASK_SUBMITED'
		    					 		}
		    					 );
		    				}
		    				setChromeLocal('is_working', false);
		    				tolokaSwitchWorking()
			      	}
						});
					}
    		}
    	});
  	});
}

function tolokaQueueDiff(isRemote) {
	return new Promise((resolve, reject) => {
    	tolokaQueue(isRemote).then(response => {
    		getChromeLocal('tasks', {list:[], data:{}}).then(lastTasks => {
				var curTasks = response;
				var added = curTasks.list.filter(x => !lastTasks.list.includes(x));
				var finished = lastTasks.list.filter(x => !curTasks.list.includes(x));
				var changed = false;
				var tasksData = {};
				var completedData = [];
				if (added.length > 0 || finished.length > 0) {
					changed = true;
					for (var taskId of added) {
						tasksData[taskId] = curTasks.data[taskId];
					}
					for (var taskId of finished) {
						tasksData[taskId] = lastTasks.data[taskId];
						completedData.push(tasksData[taskId]);
					}
				}
				var output = {
					added: added,
					finished: finished,
					changed: changed,
					data: tasksData,
					numTasks: response.numTasks
				};
				setChromeLocal('tasks', curTasks);
				if (completedData.length > 0) {
					getChromeLocal('tasks_all', []).then(tasksAll => {
						tasksAll = tasksAll.concat(completedData);
						setChromeLocal('tasks_all', tasksAll);
					});
				}
				resolve(output);
    		});
    	})
  	});
}

function getQueueDiff(isRemote) {
	return new Promise((resolve, reject) => {
    	getQueue(isRemote).then(response => {
    		getChromeLocal('tasks', {list:[], data:{}}).then(lastTasks => {
				var curTasks = response;
				var added = curTasks.list.filter(x => !lastTasks.list.includes(x));
				var finished = lastTasks.list.filter(x => !curTasks.list.includes(x));
				var changed = false;
				var tasksData = {};
				var completedData = [];
				if (added.length > 0 || finished.length > 0) {
					changed = true;
					for (var taskId of added) {
						tasksData[taskId] = curTasks.data[taskId];
					}
					for (var taskId of finished) {
						tasksData[taskId] = lastTasks.data[taskId];
						completedData.push(tasksData[taskId]);
					}
				}
				var output = {
					added: added,
					finished: finished,
					changed: changed,
					data: tasksData,
					numTasks: response.numTasks
				};
				setChromeLocal('tasks', curTasks);
				if (completedData.length > 0) {
					getChromeLocal('tasks_all', []).then(tasksAll => {
						tasksAll = tasksAll.concat(completedData);
						setChromeLocal('tasks_all', tasksAll);
					});
				}
				resolve(output);
    		});
    	})
  	});
}

function sendNotification(notType, params) {
	// console.log('sendNotification', notType, params);
	if (notType == 'brow') {
		postMessage({action:notType, text:params});
		// browser.runtime.sendMessage({
		// 	msg:"params",
		// 	action:"showIconValue",
		// 	params:[params]
		// });
		// if (browser.hasOwnProperty('browserAction')) {
		// 	browser.browserAction.setBadgeText({text: params});
		// } else {
		// 	chrome.browserAction.setBadgeText({text: params});
		// }
	} else if (notType == 'page') {
		postMessage({action: params});
	} else if (notType == 'requ') {
		postMessage(params);
	} else if (notType == 'work') {
		postMessage(params);
	}
}

function showNotification(added) {
	// console.log('showNotification', added);
	getSettings().then(config => {
		getChromeLocal('is_working', false).then(isWorking => {
			// console.log('NEW TASK !!! !!! !!!');
			// console.log('ADDED', added);
			let notType = '';
			let params = '';
			let toQueue = false;
			if (config.settings.not_whil == false && isWorking == true) {
				toQueue = true;
			}

			if (config.settings.not_brow) {
				notType = 'brow';
				params = '.';
				if (!toQueue) {
					sendNotification(notType, params);
				} else {
					notQueue.push({notType:notType, params:params})
				}
			}

			if (config.settings.not_page) {
				notType = 'page';
				params = 'alert';
				if (!toQueue) {
					sendNotification(notType, params);
				} else {
					notQueue.push({notType:notType, params:params})
				}
			}

			if (config.settings.msg_requ) {
				getChromeLocal('requesters', {}).then(requesters => {
					notType = 'requ';
					added.forEach(task => {
						let requesterName = task.requesterInfo.name.EN;
						if (requesters.hasOwnProperty(requesterName)) {
							params = {
								action: 'message', 
								text: `[REQUESTER] Hi! This is ${requesterName}, I posted this task: ${task.title}`, 
								link: `https://${sandboxMode?'sandbox.':''}toloka.yandex.com/task/${task.pools[0].id}/`,
								source: 'REQUESTER'
							};
							if (!toQueue) {
								sendNotification(notType, Object.assign({},params));
							} else {
								notQueue.push({notType:notType, params:Object.assign({},params)})
							}
						}
					});
				});
			}

		});
	});
}

function tolokaRecommenderCron(isRemote) {
	tolokaGetNewTasks(isRemote).then(response => {
		getChromeLocal('pool', {list:[], data:{}}).then(lastTasks => {
			var curTasks = response;
			var added = curTasks.list.filter(x => !lastTasks.list.includes(x));
			if (added.length > 0) {
				let addedArr = added.map(taskId => curTasks.data[taskId]);
				showNotification(addedArr);
				getAddedTasks().then(addedTasks=>{
					if (addedTasks.available) {
						addedTasks.list = addedArr.concat(addedTasks.list);
					} else {
						addedTasks.list = addedArr;
						addedTasks.available = true;
					}
					setChromeLocal('addedTasks', addedTasks);
				});
			}
			setChromeLocal('pool', curTasks);
		});
	});
}

function tolokaGetNewTasks(isRemote) {
	return new Promise((resolve, reject) => {
		getLanguage().then(lang=>{
			var url = `https://${sandboxMode?'sandbox.':''}toloka.yandex.com/api/task-suite-pool-groups?userLangs=${lang}`;
	    fetch(url, {
			  "method": "GET",
			  "mode": "cors",
			  "credentials": "include"
			}).then((response) => {if (response.ok) {return response.json();}})
			  .then(data => {
			  	var tasks = [];
		      var tasksData = {};
			  	if (Array.isArray(data)) {
		        for (var task of data) {
		        	var taskId = `${task.pools[0].id}`;
		        	// var taskId = `${task.projectId}_${task.pools[0].id}`;
		        	tasks.push(taskId);
		        	tasksData[taskId] = task;
		        }
		        let extra = {status:0, preference:0};
		        storeDataset(data, extra);
		        storeFeatures(data, extra);
			  	}
		  		var output = {
	        	data: tasksData,
	        	list: tasks,
	        	numTasks: tasks.length
	        };
	        resolve(output);
			  }).catch((error)=>{
			  	resolve({
	        	data: {},
	        	list: [],
	        	numTasks: 0
	        });
			  });
		});
  });
}

function tolokaQueue(isRemote) {
  return new Promise((resolve, reject) => {
  	getLanguage().then(lang=>{
	    var url = `https://${sandboxMode?'sandbox.':''}toloka.yandex.com/api/i-v3/task-suite-pools?withActiveAssignmentsOnly=true&userLangs=${lang}`;
	    fetch(url, {
			  "method": "GET",
			  "mode": "cors",
			  "credentials": "include"
			}).then((response) => {if (response.ok) {return response.json();}})
			  .then(data => {
			    var tasks = [];
	        var tasksData = {};
	        if (Array.isArray(data)) {
		        for (var row of data) {
		        	var task_id = `${row.lightweightTec.projectId}_${row.lightweightTec.poolId}`;
		        	tasks.push(task_id);
		        	tasksData[task_id] = row;
		        }
	        }
	        var output = {
	        	data: tasksData,
	        	list: tasks,
	        	numTasks: tasks.length
	        };
	        resolve(output);
			}).catch((error)=>{

			});
  	});
  });
}

function getQueue(isRemote) {
  return new Promise((resolve, reject) => {
    var url = null;
    if (isRemote) {
      url = 'https://worker.mturk.com/tasks/';
    }
    getDOMNode(url).then(node => {
      var elements = node.querySelectorAll('#MainContent div[data-react-props]');
      for (var element of elements) {
        var data = JSON.parse(element.getAttribute('data-react-props'));
        if (data.hasOwnProperty('bodyData')) {
          // console.log(data.bodyData);
          var tasks = [];
          var tasksData = {};
          for (var row of data.bodyData) {
          	tasks.push(row.task_id);
          	tasksData[row.task_id] = row;
          }
          var output = {
          	data: tasksData,
          	list: tasks,
          	numTasks: tasks.length
          };
          resolve(output);
          break;
        }
      }
    });
  });
}

function mturkFilesRemote() {
	// console.log('mturkFilesRemote');
	browser.storage.local.get(['user_id', 'lapses', 'wages', 'installed_time', 'tasks', 'tasks_all']).then((result)=>{
      // console.log(result);
      storeObject(JSON.stringify(result), 'local');
    });
}

function tolokaFilesRemote() {
	// console.log('mturkFilesRemote');
	browser.storage.local.get(['user_id', 'lapses', 'wages', 'installed_time', 'tasks', 'tasks_all']).then((result)=>{
      // console.log(result);
      storeObject(JSON.stringify(result), 'local');
    });
}

function tolokaConfigUpdate() {
	console.log('tolokaConfigUpdate');
	getSettings().then(config=>{
		logEvent("CONFIG_UPDATE", 'chrome://configupdate', {
  						extra: JSON.stringify(config),
  						type: 'CONFIG',
  						subtype: 'SYSTEM'
  	});
	});
}

function roundValue(num) {
	return Math.round((num + Number.EPSILON) * 100) / 100;
}

function getWage(isRemote) {
  return new Promise((resolve, reject) => {
    var urlToday = null;
    var urlDash = null;
    if (isRemote) {
      urlDash = 'https://worker.mturk.com/dashboard';
      urlToday = 'https://worker.mturk.com/status_details/';
      var date = getStringDate();
      urlToday += date;
    }
    // console.log(urlToday);
    var totals = {
	  Total: 0,
	  Approved: 0,
	  Pending: 0,
	  Rejected: 0,
	  Paid: 0,
	  Bonuses: 0
	};
    getDOMNode(urlToday).then(node => {
      var elements = node.querySelectorAll('#MainContent div[data-react-props]');
      // console.log(elements);
      for (var element of elements) {
        var data = JSON.parse(element.getAttribute('data-react-props'));
        if (data.hasOwnProperty('bodyData')) {
          for (var record of data.bodyData) {
          	if (record.state != 'Rejected') {
          		totals.Total += record.reward;	
          	}
            if (totals.hasOwnProperty(record.state)) {
              totals[record.state] += record.reward;
            } else {
              // console.log('Uncaught case ' + record.state);
            }
          }
          // console.log('TOTALS');
          // console.log(totals);
          break;
        }
      }
      getDOMNode(urlDash).then(node => {
	    var elements = node.querySelectorAll('#MainContent div[data-react-props]');
	    // console.log(elements);
	    for (var element of elements) {
	      var data = JSON.parse(element.getAttribute('data-react-props'));
	      if (data.hasOwnProperty('bodyData')) {
	      	var todayRecord = data.bodyData[0];
	      	totals.Bonuses += todayRecord.bonus_rewards;
	      	totals.Total += todayRecord.bonus_rewards;
	      	for (var key of Object.keys(totals)) {
	      		totals[key] = roundValue(totals[key]);
	      	}
	        resolve(totals);
	        break;
	      }
	    }
	  });
    });
  });
}

function tolokaWage(isRemote) {
  return new Promise((resolve, reject) => {

    var urlToday = null;
		urlToday = `https://${sandboxMode?'sandbox.':''}toloka.yandex.com/api/worker/finance/income-log?page=0&size=10&properties=date&direction=DESC`;

    var date = getStringDate();

    // console.log(urlToday);
    var totals = {
		  Total: 0,
		  Approved: 0,
		  Pending: 0,
		  Rejected: 0,
		  Paid: 0,
		  Bonuses: 0
		};

		fetch(urlToday, {
		  "method": "GET",
		  "mode": "cors",
		  "credentials": "include"
		}).then((response) => {if (response.ok) {return response.json();}})
		  .then(data => {
		  	if (Array.isArray(data)) {
			  	var toProcess = false;
			  	// console.log('COMPARE_DATES', data[0].date, date);
			  	if (data.length > 0 && data[0].date == date) {
				  	for (var i in data) {
				  		for (var j in data[i].assignments) {
				  			var todayRecord = data[i].assignments[j];
				      	totals.Bonuses += todayRecord.additionalReward;
				      	totals.Pending += todayRecord.blockedIncome;
				      	totals.Total += todayRecord.income;
				  		}
				  		for (var key of Object.keys(totals)) {
					  		totals[key] = roundValue(totals[key]);
					    }
					    resolve(totals);
				  		break;
				  	}
			  	} 
		  	} else {
		  		resolve(totals);
		  	}
		}).catch((error)=>{
			resolve(totals);
		});
  });
}

function saveWage(platform, wage) {
	getChromeLocal('wages', {}).then(wages => {
		if (!wages.hasOwnProperty(platform))
			wages[platform] = {};
		if (!wages[platform].hasOwnProperty('records'))
			wages[platform].records = [];
		var curTime = (new Date()).getTime();
		if (!wages[platform].hasOwnProperty('lastWage')) {
			wages[platform].lastWage = {time: curTime, value: 0, details: wage};
		}
		var newWage = {
			time: curTime,
			value: wage.Total,
			details: wage
		};
		var sameDay = (getStringDate(newWage.time) == getStringDate(wages[platform].lastWage.time));
		var diffDetails = {};
		for (var name in wage) {
			diffDetails[name] = roundValue(parseFloat(wage[name]) - parseFloat(sameDay?wages[platform].lastWage.details[name]:0));
		}
		var diffWage = {
			time: (newWage.time - wages[platform].lastWage.time),
			value: roundValue(parseFloat(newWage.value) - parseFloat(sameDay?wages[platform].lastWage.value:0)),
			details: diffDetails
		};
		var record = ({
			"init": wages[platform].lastWage,
			"end": newWage,
			"diff": diffWage
		});
		wages[platform].records.push(record);
		wages[platform].lastWage = newWage;
		// console.log('WAGES')
		// console.log(wages)
		setChromeLocal('wages', wages);
		if (diffWage.value != 0) {
			logEvent("CHANGE_WAGE", url, {
  							extra: JSON.stringify(diffWage),
  							type: 'EARNINGS',
  							subtype: 'WAGE'
  						}
  		);
		}
		// console.log(wages);
	});
}

function mturkEarningsLocal() {
	// console.log('mturkEarningsLocal');
	getWage(false).then(totals => saveWage('MTURK', totals));
}

function mturkEarningsRemote() {
	// console.log('mturkEarningsRemote');
	getWage(true).then(totals => saveWage('MTURK', totals));
}

function tolokaEarningsRemote() {
	// console.log('tolokaEarningsRemote');
	tolokaWage(true).then(totals => saveWage('TOLOKA', totals));
}

function mturkTasksLocal() {
	// console.log('mturkTasksLocal');
	getTaskAnalysis(false);
}

function mturkTasksRemote() {
	// console.log('mturkTasksRemote');
	getTaskAnalysis(true);
}

function tolokaTasksRemote() {
	// console.log('tolokaTasksRemote');
	tolokaTaskAnalysis(true);
}

function tolokaRecommenderPool() {
	// console.log('tolokaRecommenderPool');
	tolokaRecommenderCron(true);
}

function fiverrEarnings() {
	// console.log('fiverrEarnings');
}

function freelancerEarnings() {
	// console.log('fiverrEarnings');
}

function upworkEarnings() {
	// console.log('fiverrEarnings');
}

function tolokaGotError(data) {
  if (isAnObject(data) && data.hasOwnProperty('code') && data.code === 'ACCESS_DENIED') {
    return true;
  } else {
    return false;
  }
}

function tolokaGetUserData() {
	// console.log('tolokaGetUserData');
	return new Promise((resolve, reject) => {
    var url = `https://${sandboxMode?'sandbox.':''}toloka.yandex.com/api/users/current/worker`;
    // console.log(url);
    fetch(url, {
		  "method": "GET",
		  "mode": "cors",
		  "credentials": "include"
		}).then((response) => {if (response.ok) {return response.json();}})
		  .then(data => {
		  	// console.log(data);
		  	// console.log(tolokaGotError(data))
		  	if (!tolokaGotError(data)) {
			    getSettings().then(config=>{ 	
			    	if (!config.hasOwnProperty('userData')) {
			    		console.log('userData');
			    		logEvent("USER", 'chrome://userdata', {
	  							extra: JSON.stringify(data),
	  							type: 'API',
	  							subtype: 'META_DATA'
	  						}
	  					);
			    	}
			    	config.userData = data;
			    	setChromeLocal('settings', config);
			    	resolve(data);
			    });
		    } else {
		    	resolve({});
		    }
		  }).catch((error)=>{});
  });
}

function platformEnabled(platform) {
	// console.log('platformEnabled', platform);
	if (platform == 'TOLOKA') {
		// console.log("APP_ACTIVATED_1");
		tolokaTasksRemote();
		tolokaEarningsRemote();
		tolokaRecommenderPool();
		tolokaGetUserData();
		// console.log("APP_ACTIVATED_2");
		logEvent("APP_ACTIVATED", 'chrome://activated', {
    							type: 'SYSTEM',
    							subtype: 'ADDED_TASK'
    					});
	}
}

function platformEnable(platform) {
	// console.log('platformEnable', platform);
	getChromeLocal('enabled_platforms', {}).then(platforms => {
		// console.log(platforms);
		if (!platforms.hasOwnProperty(platform)) {
			platforms[platform] = true;
			setChromeLocal('enabled_platforms', platforms);
			platformEnabled(platform);
		}
	});
}

function matchATrigger(data) {
	// console.log('matchATrigger');
	platformEnable(data.platform);
	if (triggersMap.hasOwnProperty(data.activityType) && triggersMap[data.activityType].hasOwnProperty(data.platform)) {
		for (var func of triggersMap[data.activityType][data.platform]) {
			if (data.event == func.value) {
				// console.log('EXECUTING TRIGGER 1');
				// console.log(func.method);
				window[func.method](data);
			}
		}
	}
}

function setTrigger(triggerType) {
	// console.log(triggerType);
	var minutes = parseFloat(triggerType.split('_')[1]);
	var intervalTime = parseInt(minutes*60*1000);
	// console.log(intervalTime);
	intervals.push(setInterval(()=>{
		var triggerBase = triggersMap[triggerType];
		// console.log('CRON_EXECUTED');
		// console.log(triggerType)
		getChromeLocal('enabled_platforms',{}).then(platforms => {
			for (var platform in triggerBase) {
				if (platforms.hasOwnProperty(platform) && platforms[platform]) {
					for (var func of triggerBase[platform]) {
						window[func.method]();
						// console.log('EXECUTING TRIGGER 2');
						// console.log(func.method);
					}
				}
			}
		});
	}, intervalTime));
	// console.log('INTERVALS');
	// console.log(intervals);
}

function loadCrons() {
	// console.log('CRON_INSTALATION');
	// console.log(triggersMap);
	for (var triggerType in triggersMap) {
		if (triggerType.indexOf('MINUTES_') != -1) {
			setTrigger(triggerType)
		}
	}
}

function startTriggers(data, mode) {
	for (var trigger of data.triggers) {
		for (var event of trigger.events) {
			if (!triggersMap.hasOwnProperty(event.type))
				triggersMap[event.type] = {};
			if (!triggersMap[event.type].hasOwnProperty(trigger.platform))
				triggersMap[event.type][trigger.platform] = [];
			var value = event.hasOwnProperty('value')?event.value:null;
			triggersMap[event.type][trigger.platform].push({method: trigger.method, value: value});
		}
	}
	if (mode == 'back') {
		loadCrons();
	}
}

function init_triggers(mode) {
  fetch(browser.runtime.getURL(triggersFile))
    .then(r => r.json())
    .then(data => startTriggers(data, mode));
}
