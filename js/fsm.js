var states = {};

var fsmFile = 'config/fsm.json';

function init_fsm() {
	getFileContentOnce(fsmFile).then(fsmObj => {
		states = fsmObj;
	});
}

function fsmInput(obj) {
	// console.log('fsmInput');
	for (var state in states) {
		processState(state, obj);
	}
}

function evaluateState(stage, state, obj) {
	var result = false;
	var parameters = states[state][stage];
	if (states[state].hasOwnProperty("filter")) {
		for (var filter in states[state].filter) {
			if (states[state].filter[filter].indexOf(obj[filter]) != -1) {
				return false;
			}
		}
	}
	for (var i in parameters) {
		var count = 0;
		var params = parameters[i];
		for (var param in params) {
			if (states[state][stage][i][param].indexOf(obj[param]) != -1) {
				count++;
			}
		}
		if (count == Object.keys(params).length)
			return true;
	}
	return false;
}

function processState(state, obj) {
	//return new Promise((resolve, reject) => {
		getChromeLocal(state, {}).then(queue => {
			// console.log(obj.activityType, obj.event);
			// console.log(state);
			if (evaluateState('init', state, obj)) {
				// console.log('INIT', obj);
				setElementToQueue(state, queue, obj, updatedQueue => {
					// console.log(clone(updatedQueue));
					setChromeLocal(state, updatedQueue);
					// reject();
				});
			} else if (evaluateState('end', state, obj)) {
				// console.log('END', obj);
				getElementToQueue(state, queue, obj, (lastObj, updatedQueue) => {
					// console.log(clone(updatedQueue));
					if (lastObj != null) {
						// console.log('lastObj');
						// console.log(lastObj);
						setChromeLocal(state, updatedQueue);
						saveLapse(state, lastObj, obj);
						if (states[state].hasOwnProperty('execute')) {
							// console.log(state, states[state]);
							window[states[state].execute](lastObj, obj);
						}
						// resolve(lastObj);
					}
				});
			} else {
				// reject();
			}
		});
	//});
}

function setElementToQueue(state, queue, obj, callback, traverse, objToAdd) {
	if (traverse == null) {
		traverse = {
			items: clone(states[state].group),
			trav: queue
		};
		return setElementToQueue(state, queue, obj, callback, traverse, objToAdd);
	} else if (traverse.items.length > 0) {
		var index = traverse.items.shift();
		if (obj.hasOwnProperty(index))
			index = obj[index];
		if (!traverse.trav.hasOwnProperty(index)) {
			if (traverse.items.length > 0) {
				traverse.trav[index] = {};
				traverse.trav = traverse.trav[index];
				return setElementToQueue(state, queue, obj, callback, traverse, objToAdd);
			} else {
				traverse.trav[index] = [objToAdd==null?obj:objToAdd];
				callback(queue);
			}
		} else {
			if (traverse.items.length > 0) {
				traverse.trav = traverse.trav[index];
				return setElementToQueue(state, queue, obj, callback, traverse, objToAdd);
			} else {
				traverse.trav[index].push(objToAdd==null?obj:objToAdd);
				callback(queue);
			}
		}
	}
}

function getElementToQueue(state, queue, obj, callback, traverse) {
	if (traverse == null) {
		traverse = {
			items: clone(states[state].group),
			trav: queue
		};
		return getElementToQueue(state, queue, obj, callback, traverse);
	} else if (traverse.items.length > 0) {
		var index = traverse.items.shift();
		if (obj.hasOwnProperty(index))
			index = obj[index];
		if (!traverse.trav.hasOwnProperty(index)) {
			callback(null,queue);
		} else {
			if (traverse.items.length > 0) {
				traverse.trav = traverse.trav[index];
				return getElementToQueue(state, queue, obj, callback, traverse);
			} else {
				if (traverse.trav[index].length > 0) {
					var lastObj = traverse.trav[index].pop();
					callback(lastObj, queue);
				} else {
					callback(null,queue);
				}
			}
		}
	}
}

function fsmReset() {
	var newStatus = {lapses:{}};
	for (var state in states) {
		newStatus[state] = {};
	}
	browser.storage.local.set(newStatus);
}

function saveLapse(state, lastObj, obj) {
	getChromeLocal('lapses', {}).then(lapses => {
		// console.log('saveLapse');
		// console.log(clone(lapses));
		var lapse = ({
			"init": lastObj.time,
			"end": obj.time,
			"diff": (obj.time - lastObj.time)
		});
		var traverse = {
			"items": [state, "platform", "activity", "activityType"],
			"trav": lapses
		};
		// console.log(clone(traverse));
		setElementToQueue(state, lapses, obj, (lapsesUpdated) => {
			// console.log(clone(lapsesUpdated));
			setChromeLocal('lapses', lapsesUpdated);
		}, traverse, lapse);
	});
}

init_fsm();
