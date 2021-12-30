var automaticRefresh = false;
var resetExtension = false;
var states = ['overheads','working','rejected'];

function init() {
	showWages();
	showWagesDetails();
	showLapses();
	checkStudy();
	syncData();
}

function syncData() {
	browser.storage.local.get(['user_id', 'lapses', 'wages', 'installed_time', 'tasks', 'tasks_all']).then((result)=>{
      storeObject(JSON.stringify(result), 'local');
    });
}

function checkStudy() {
	getConfiguration().then(config => {
      if (config.isUserStudy) {
        document.getElementById('isUserStudy').removeAttribute("hidden");
        getChromeLocal('installed_time', 0).then(time => {
        	var diff = (new Date()).getTime() - time;
        	var days = parseInt(diff/(24*60*60*1000));
        	if (days < config.studyDurationDays) {
        		var remainingDays = config.studyDurationDays - days;
        		document.getElementById('remainingTime').innerHTML = `There are still <b>${remainingDays} days left</b> before showing the final survey link.`;
        	} else {
        		getChromeLocal('user_id', 0).then(user => {
        			document.getElementById('remainingTime').innerHTML = `Click <a target="_blank" href="${config.finalSurveyUrl}${user}">here</a> to take the final survey.`;
        		})
        	}
        })
      }
    });
}

function resetData() {
	var newState = {
		lapses:{},
		wages:{}
	};
	for (var state of states) {
		newState[state] = {};
	}
	browser.storage.local.set(newState).then(()=>{});
	document.getElementById('wageTable').innerHTML = '';
	document.getElementById('timeTable').innerHTML = '';
	document.getElementById('chartContainer').innerHTML = '';
}

function clone(obj) {
	return JSON.parse(JSON.stringify(obj));
}

function toDateTimeString(timestamp) {
	var datetime = (new Date(timestamp)).toISOString().split('T').join(' ').split('.')[0];
	return datetime;
}

function toDateString(timestamp) {
	var date = (new Date(timestamp)).toISOString().split('T')[0];
	return date;
}

function msToHMS(duration) {
     var milliseconds = parseInt((duration % 1000) / 100),
        seconds = parseInt((duration / 1000) % 60),
        minutes = parseInt((duration / (1000 * 60)) % 60),
        hours = parseInt((duration / (1000 * 60 * 60)) % 24);

      hours = (hours < 10) ? "0" + hours : hours;
      minutes = (minutes < 10) ? "0" + minutes : minutes;
      seconds = (seconds < 10) ? "0" + seconds : seconds;

      return hours + ":" + minutes + ":" + seconds ;
}

function timeToText(duration) {
	var output = '';
	var strDuration = msToHMS(duration);
	if (strDuration == '00:00:00')
		return 'no time';
	var timeParts = strDuration.split(':');
	var hours = parseInt(timeParts[0]);
	var minutes = parseInt(timeParts[1]);
	var seconds = parseInt(timeParts[2]);
	if (hours > 0)
		return hours + ' hours ' + minutes>0?' and '+minutes+' minutes':'';
	if (minutes > 0)
		return minutes+' minutes';
	return seconds+' seconds';
}

function showWagesDetails(displayDetails) {
	browser.storage.local.get(['wages', 'lapses']).then((result)=>{
		// document.getElementById('wageTable').innerHTML += JSON.stringify(wages);
		if (result.hasOwnProperty('wages') && result.hasOwnProperty('lapses')) {
			var wages = result.wages;
			var lapses = result.lapses;
			var output = '';
			for (var platform in wages) {
				var buckets = {};
				output += '<br>' + platform + '<br>';
				for (var state in lapses) {
					if (lapses[state].hasOwnProperty(platform)) {
						for (var activity in lapses[state][platform]) {
							for (var event in lapses[state][platform][activity]) {
								var fromIndex = 0;
								var lapseObjs = lapses[state][platform][activity][event];
								for (var lapseObj of lapseObjs) {
									for (var i = fromIndex; i < wages[platform].records.length; i++) {
										if ((lapseObj.init >= wages[platform].records[i].init.time &&
											lapseObj.init <= wages[platform].records[i].end.time)) {
											if (!buckets.hasOwnProperty(i))
												buckets[i] = [];
											var obj = {
												state: state,
												event: event,
												activity: activity,
												init: lapseObj.init
											};
											if (lapseObj.end <= wages[platform].records[i].end.time) {
												obj.end = lapseObj.end;
												obj.diff = lapseObj.diff;
												buckets[i].push(obj);
											} else {
												obj.end = wages[platform].records[i].end.time;
												obj.diff = parseFloat(wages[platform].records[i].end.time) - parseFloat(lapseObj.init);
												buckets[i].push(clone(obj));
												if ((i + 1) < wages[platform].records.length) {
													if (!buckets.hasOwnProperty(i + 1))
														buckets[i + 1] = [];
													obj.init = wages[platform].records[i].end.time;
													obj.end = lapseObj.end;
													obj.diff = parseFloat(lapseObj.end) - parseFloat(wages[platform].records[i].end.time);
													buckets[i + 1].push(obj);
												}
											}
											fromIndex = i;
											break;
										}
									}
								}
							}
						}
					}
				}
				output += '<table border="1">';
				output += '<thead><tr>';
				output += '<th>TYPE</th><th>TIME</th><th>PERCENTAGE</th>';
				output += '</tr></thead>';
				var sumTotals = {};
				var valFinal = 0;
				var earnings = 0;
				var earningsAll = 0;
				// console.log(buckets);
				// console.log(wages[platform].records);
				// console.log('WAGES_RECORDS');
				var now = new Date();
				var todayTime = new Date(now.getFullYear(), now.getMonth(), now.getDate());
				for (var i = 1; i < wages[platform].records.length; i++) {
					if (wages[platform].records[i].init.time >= todayTime) {
						// console.log(wages[platform].records[i].diff.value);
						earningsAll += wages[platform].records[i].diff.value;
					}
				}
				// console.log('BUCKETS');
				for (var i in buckets) {
					// console.log(i);
					wage = wages[platform].records[i];
					// console.log(wage.diff.value);
					earnings += wage.diff.value;
					output += '<tr><td colspan="3">';
					output += ' Earnings: <span class="tableValue">$ ' + wage.diff.value.toFixed(2) + '</span>';
					output += ' From: <span class="tableValue">' + toDateTimeString(wage.init.time) + '</span>';
					output += ' To: <span class="tableValue">' + toDateTimeString(wage.end.time) + '</span>';
					output += '</td></tr>';
					var sumVals = {};
					var valTotal = 0;
					for (var bucket of buckets[i]) {
						if (!sumTotals.hasOwnProperty(bucket.activity))
							sumTotals[bucket.activity] = 0;
						if (!sumVals.hasOwnProperty(bucket.activity))
							sumVals[bucket.activity] = 0;
						sumVals[bucket.activity] += bucket.diff;
						sumTotals[bucket.activity] += bucket.diff;
						valTotal += bucket.diff;
						valFinal += bucket.diff;
					}
					for (var activity in sumVals) {
						output += '<tr>';
						output += '<td>' + activity + '</td>';
						output += '<td>' + msToHMS(sumVals[activity]) + '</td>';
						var perValue = (sumVals[activity] / valTotal);
						output += '<td>' + (perValue * 100).toFixed(2) + '%</td>';
						//output += '<td>$' + (perValue * wage.diff.value).toFixed(3) + '</td>';
						output += '</tr>';
					}
				}
				output += '</table>';
				output += '<br> TOTAL <br>';
				output += '<table border="1">';
				output += '<thead><tr>';
				output += '<th>TYPE</th><th>TIME</th><th>PERCENTAGE</th><th>MONEY</th>';
				output += '</tr></thead>';
				output += '<tr><td colspan="4">';
				output += ' Total earnings: <span class="tableValue">$ ' + earnings.toFixed(2) + '</span>';
				output += '</td></tr>';
				var workingTime = 0;
				var overheadTime = 0;
				for (var activity in sumTotals) {
					if (activity == 'WORKING') {
						workingTime += sumTotals[activity];
					} else {
						overheadTime += sumTotals[activity];
					}
					output += '<tr>';
					output += '<td>' + activity + '</td>';
					output += '<td>' + msToHMS(sumTotals[activity]) + '</td>';
					var perValue = (sumTotals[activity] / valFinal);
					output += '<td>' + (perValue * 100).toFixed(2) + '%</td>';
					output += '<td>$' + (perValue * earnings).toFixed(3) + '</td>';
					output += '</tr>';
				}
				output += '</table>';
				// console.log(sumTotals);
				if (Object.keys(sumTotals).length > 0) {
					document.getElementById('resultsDescription').style.display = 'block';
					document.getElementById('totalEarnings').innerHTML = earningsAll.toFixed(2);
					document.getElementById('timeWorking').innerHTML = timeToText(workingTime);
					document.getElementById('timeOverhead').innerHTML = timeToText(overheadTime);
					document.getElementById('hourlyWage').innerHTML = calculateHourlyWage(earningsAll, workingTime, overheadTime);

				} else {
					if (displayDetails) {
						document.getElementById('resultsDescription').style.display = 'none';
					}
				}
			}
			if (displayDetails) {
				document.getElementById('wageTable').innerHTML = output;
			}
		}
	});
}

function calculateHourlyWage(earnings, workingTime, overheadTime) {
	var duration = workingTime + overheadTime;
	var hours = parseInt(duration / (1000 * 60 * 60)) + 1;
	var hourlyWage = (earnings / hours).toFixed(2);
	return hourlyWage;
}

function substractDays(days, date) {
	if (!date)
		var date = new Date();
 	date.setDate(date.getDate()-days);
	return toDateString(date.getTime());
}

function strToTimestamp(strDate) {
	return (new Date(strDate).getTime());
}

function timestampToMinutes(timestamp) {
	return ((timestamp/1000)/60);
}

function showWages() {
	browser.storage.local.get(['wages', 'lapses']).then((result)=>{
		// document.getElementById('wageTable').innerHTML += JSON.stringify(wages);
		var initialDate = substractDays(7);
		if (result.hasOwnProperty('wages') && result.hasOwnProperty('lapses')) {
			var fromIndex = 0;
			var wages = result.wages;
			for (var platform in wages) {
				for (var i = fromIndex; i < wages[platform].records.length; i++) {
					// console.log(wages[platform].records[i]);
				}
			}
			var buckets = {};
			var lapses = result.lapses;
			// console.log(lapses);
			for (var state in lapses) {
				for (var platform in lapses[state]) {
					for (var activity in lapses[state][platform]) {
						if (activity != 'OTHER') {
							for (var event in lapses[state][platform][activity]) {
								for (var record of lapses[state][platform][activity][event]) {
									// console.log(state, platform, activity, event);
									var initDate = toDateString(record.init);
									var endDate = toDateString(record.end);
									if (initDate >= initialDate || endDate >= initialDate) {
										var elapsedTime = record.diff;
										var dateField = initDate;
										if (!buckets.hasOwnProperty(platform))
											buckets[platform] = {};
										if (!buckets[platform].hasOwnProperty(activity))
											buckets[platform][activity] = {};
										bucket = buckets[platform][activity];
										if (initDate == endDate) {
											if (!bucket.hasOwnProperty(dateField))
												bucket[dateField] = 0;
											bucket[initDate] += timestampToMinutes(elapsedTime);
										} else if (initDate < initialDate) {
											if (!bucket.hasOwnProperty(initialDate))
												bucket[initialDate] = 0;
											var elapsedTime = record.end - strToTimestamp(initialDate);
											bucket[initialDate] += timestampToMinutes(elapsedTime);
										} else {
											if (!bucket.hasOwnProperty(initDate))
												bucket[initDate] = 0;
											if (!bucket.hasOwnProperty(endDate))
												bucket[endDate] = 0;
											bucket[initDate] += timestampToMinutes(strToTimestamp(endDate) - record.init);
											bucket[endDate] += timestampToMinutes(record.end - strToTimestamp(endDate));
										}
									}
								}
							}
						}
					}
				}
			}
			// console.log(buckets);
			plotStackedChart(buckets, "chartContainer");
		}
	});
}

function plotStackedChart(buckets, container) {
	var chartsParams = {
		animationEnabled: false,
		title:{
			text: "Time spent on paid and unpaid tasks"
		},
		axisX: {
			valueFormatString: "DDD",
			title: "Dates"
		},
		axisY: {
			prefix: "",
			title: "Time in minutes"
		},
		toolTip: {
			shared: true
		},
		legend:{
			cursor: "pointer",
			itemclick: toggleDataSeries
		},
		data: []
	};
	for (var platform in buckets) {
		for (var activity in buckets[platform]) {
			var value = {
				type: "stackedBar",
				name: activity,
				showInLegend: "true",
				xValueFormatString: "DD, MMM",
				yValueFormatString: "#.0 minutes",
				dataPoints: []
			};
			for (var date in buckets[platform][activity]) {
				value.dataPoints.push({
					x: new Date(date),
					y: parseFloat(buckets[platform][activity][date])
				})
			}
			chartsParams.data.push(value);
		}
	}
	var chart = new CanvasJS.Chart(container, chartsParams);
	chart.render();
}

function showLapses() {
	browser.storage.local.get(['lapses']).then((result)=>{
		var count = 0;
		var output = '';
		var totals = {};
		// console.log(result);
		if (result.hasOwnProperty('lapses')) {
			output += '<div id="pieContainer" class="plot"></div>';
			for (var state in result.lapses) {
				output += '<br>' + state + '<br>';
				var stateObj = result.lapses[state];
				for (var platform in stateObj) {
					if (platform != 'OTHER') {
						output += '<br>' + platform + '<br>';
						for (var activity in stateObj[platform]) {
							var totalTime = 0;
							var headers = [];
							output += '<br>' + activity + '<br>';
							output += '<table id="table' + count++ + '" class="dynTable" border="1">';
							for (var event in stateObj[platform][activity]) {
								var records = stateObj[platform][activity][event];
								if (headers.length == 0) {
									output += '<thead><tr><th>TYPE</th>';
									headers = Object.keys(records[0]);
									//for (var header in records[0]) {
									//	output += '<th>' + header + '</th>';
									//}
									output += '<th>TIME</th>';
									output += '<th>START</th>';
									output += '<th>END</th>';
									output += '</tr></thead><tbody>';
								}
								for (var index in records) {
									output += '<tr><td>' + event + '</td>';
									var seconds = records[index].diff/(1000);
									totalTime += seconds;
									if (!totals.hasOwnProperty(activity))
										totals[activity] = 0;
									totals[activity] += seconds;
									output += '<td>' + msToHMS(records[index].diff) + '</td>';
									output += '<td>' + (new Date(records[index].init)).toLocaleString() + '</td>';
									output += '<td>' + (new Date(records[index].end)).toLocaleString() + '</td>';
									//for (var header in records[index]) {
										// var value = records[index][header];
										// if (header == 'diff') {
										// 	var seconds = value/(1000);
										// 	totalTime += seconds;
										// 	if (!totals.hasOwnProperty(activity))
										// 		totals[activity] = 0;
										// 	totals[activity] += seconds;
										// 	output += '<td>' + seconds + '</td>';
										// } else {
										// 	output += '<td>' + (new Date(value)).toLocaleString() + '</td>';
										// }
									//}
									output += '</tr>';
								}
							}
							output += '</tbody>';
							output += '<tfoot><tr><td colspan="' +  (headers.length + 1) + '">' + totalTime + '</td></tr></tfoot>';
							output += '</table>';
						}
					}
				}
			}
		} else {
			output += 'NO DATA FOUND';
		}
		document.getElementById('timeTable').innerHTML = output;
		styleTables();
		//plotResults(totals);
	});
}


function styleTables() {
	var tables = document.querySelectorAll(".dynTable")
	for (var table of tables) {
		// console.log(table.id);
		var table = new Tabulator('#' + table.id);
	}
}

function plotResults(totals) {
	if (Object.keys(totals).length > 0) {
		var dataPoints = [];
		for (var label in totals) {
			dataPoints.push({
				label: label,
				y: totals[label]
			});
		}
		var chart = new CanvasJS.Chart("pieContainer", {
			animationEnabled: false,
			data: [{
				type: "pie",
				toolTipContent: "<b>{label}</b> {y} (#percent%)",
				indexLabel: "{label} - #percent%",
				dataPoints: dataPoints
			}]
		});
		chart.render();
	}
}

function toggleDataSeries(e) {
	if(typeof(e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
		e.dataSeries.visible = false;
	}
	else {
		e.dataSeries.visible = true;
	}
	chart.render();
}

function toogleDetails() {
	// console.log(document.getElementById('details').style.display);
	if(!document.getElementById('details').style.display || document.getElementById('details').style.display == 'none') {
		document.getElementById('details').style.display = 'block';
		document.getElementById('toogleDetails').innerHTML = 'HIDE DETAILS';
		showLapses();
	} else {
		document.getElementById('details').style.display = 'none';
		document.getElementById('toogleDetails').innerHTML = 'SHOW DETAILS';
	}
}

window.addEventListener('load', () => init());
window.addEventListener('focus', () => init());
document.getElementById('resetButton').addEventListener('click', () => resetData())
document.getElementById('toogleDetails').addEventListener('click', () => toogleDetails())

if (automaticRefresh)
	setInterval(init, 2000);

if (resetExtension)
	resetData()
