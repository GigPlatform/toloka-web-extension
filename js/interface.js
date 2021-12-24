var maxTasks = 4;
var globalTasks = null;
var topTasks = null;
var sandboxMode = true;

Object.flatten = function(data) {
    var result = {};
    function recurse (cur, prop) {
        if (Object(cur) !== cur) {
            result[prop] = cur;
        } else if (Array.isArray(cur)) {
             for(var i=0, l=cur.length; i<l; i++)
                 recurse(cur[i], prop + "[" + i + "]");
            if (l == 0)
                result[prop] = [];
        } else {
            var isEmpty = true;
            for (var p in cur) {
                isEmpty = false;
                recurse(cur[p], prop ? prop+"."+p : p);
            }
            if (isEmpty && prop)
                result[prop] = {};
        }
    }
    recurse(data, "");
    return result;
};

Object.unflatten = function(data) {
    "use strict";
    if (Object(data) !== data || Array.isArray(data))
        return data;
    var regex = /\.?([^.\[\]]+)|\[(\d+)\]/g,
        resultholder = {};
    for (var p in data) {
        var cur = resultholder,
            prop = "",
            m;
        while (m = regex.exec(p)) {
            cur = cur[prop] || (cur[prop] = (m[2] ? [] : {}));
            prop = m[2] || m[1];
        }
        cur[prop] = data[p];
    }
    return resultholder[""] || resultholder;
};

function formatNumber(number) {
    if (number == null)
        return " -- ";
    return '$' + parseFloat(number).toFixed(2);
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

function formatTime(seconds) {
    if (seconds < 60)
        return seconds + 's';
    return parseInt(seconds/60) + 'm';
}

function normalize(obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            if (typeof obj[key] === 'object') {
                if (key === 'data') {
                    // check if data object also has a data property
                    if (obj[key].hasOwnProperty('data')) {
                        // double recursion
                        normalize(obj[key]);
                        normalize(obj);
                    }
                    else {
                        // copy all values to the parent
                        // (only if they don't exist in the parent yet)
                        for (var subKey in obj[key]) {
                            if (obj[key].hasOwnProperty(subKey)
                            &&  !obj.hasOwnProperty(subKey)) {
                                obj[subKey] = obj[key][subKey];
                            }
                        }
                        // remove the data key
                        delete obj[key];
                    }
                }
                else {
                    // recursion
                    normalize(obj[key]);
                }
            }
        }
    }
}

function drawInterface() {
    return new Promise((resolve, reject) => {
        $("#header > header > div > div:nth-child(3)").prepend(`
            <div id="alertIcon" style="margin-right:20px;" class="t-hint t-hint_theme_menu t-hint_size_m">
                <div id="alertDiv" class="popup-overlay">
                    <span id="alertImage">
                        <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M28.59,22.49c-.28-.5-.62-1-1-1.53a9.25,9.25,0,0,1-1.83-3.87l-.42-5.9C25.09,6.62,22.42,2,17.11,2H14.89c-5.31,0-8,4.62-8.27,9.18L6.2,17.09A9.38,9.38,0,0,1,4.37,21c-.34.52-.68,1-.91,1.45a2.22,2.22,0,0,0-.2,2.33A2.4,2.4,0,0,0,5.46,26h7.72a3,3,0,1,0,5.64,0h7.72a2.4,2.4,0,0,0,2.2-1.26A2.14,2.14,0,0,0,28.59,22.49ZM17,27a1,1,0,1,1-1-1A1,1,0,0,1,17,27Zm10-3.17c0,.08-.17.17-.42.17H5.46c-.25,0-.38-.09-.42-.17s0-.19.1-.35c.27-.46.58-.94.9-1.42,1-1.44,2-3.08,2.15-4.83l.43-5.91C8.83,7.94,10.6,4,14.89,4h2.22c4.29,0,6.06,3.94,6.27,7.33l.43,5.9C23.93,19,25,20.62,26,22.06c.32.48.63,1,.95,1.51A.25.25,0,0,1,27,23.83Z" data-name="39-Notification"/></svg>
                    </span>
                    <span id="alertNum" class="alert-num">•</span>
                </div>
            </div>
        `);

        $("#content > div > div.new-task-page > div.new-task-page__header > div.new-task-page-header-right-actions").prepend(`
            <div id="alertIcon" style="margin-right:15px;margin-top:10px;" class="t-hint t-hint_theme_menu t-hint_size_m">
                <div id="alertDiv" class="popup-overlay">
                    <span id="alertImage">
                        <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M28.59,22.49c-.28-.5-.62-1-1-1.53a9.25,9.25,0,0,1-1.83-3.87l-.42-5.9C25.09,6.62,22.42,2,17.11,2H14.89c-5.31,0-8,4.62-8.27,9.18L6.2,17.09A9.38,9.38,0,0,1,4.37,21c-.34.52-.68,1-.91,1.45a2.22,2.22,0,0,0-.2,2.33A2.4,2.4,0,0,0,5.46,26h7.72a3,3,0,1,0,5.64,0h7.72a2.4,2.4,0,0,0,2.2-1.26A2.14,2.14,0,0,0,28.59,22.49ZM17,27a1,1,0,1,1-1-1A1,1,0,0,1,17,27Zm10-3.17c0,.08-.17.17-.42.17H5.46c-.25,0-.38-.09-.42-.17s0-.19.1-.35c.27-.46.58-.94.9-1.42,1-1.44,2-3.08,2.15-4.83l.43-5.91C8.83,7.94,10.6,4,14.89,4h2.22c4.29,0,6.06,3.94,6.27,7.33l.43,5.9C23.93,19,25,20.62,26,22.06c.32.48.63,1,.95,1.51A.25.25,0,0,1,27,23.83Z" data-name="39-Notification"/></svg>
                    </span>
                    <span id="alertNum" class="alert-num">•</span>
                </div>
            </div>
        `);

        $('#alertDiv').append(`
            <div id="alertPopup" class="popup popup_show_bottom-right user-switcher__popup popup_visible">
                <span class="popup__content">
                    <div id="divTasks" class="gig-popup-tasks">
                        <div class="user-menu">
                            <div class="user-menu-item">
                                <span class="gig-popup-left">
                                    <b>
                                        Tasks
                                    </b>
                                </span>
                                <span id="settButton" class="gig-popup-right">
                                    <svg width="16" height="16" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"viewBox="0 0 64 64" enable-background="new 0 0 64 64" xml:space="preserve"><g><g><path d="M63.8,28.3l-0.2-1.5L55,25.3c-0.2-0.9-0.5-1.7-0.9-2.5c-0.3-0.8-0.7-1.6-1.2-2.4l5-7.1l-0.9-1.2c-1.5-1.9-3.3-3.7-5.2-5.2L50.7,6l-7.1,5c-1.6-0.9-3.2-1.5-4.9-2l-1.5-8.6l-1.5-0.2c-2.5-0.3-5-0.3-7.4,0l-1.5,0.2L25.3,9c-0.9,0.2-1.7,0.5-2.5,0.9c-0.8,0.3-1.6,0.7-2.4,1.2l-7.1-5l-1.2,0.9c-1.9,1.5-3.7,3.3-5.2,5.2L6,13.3l5,7.1c-0.9,1.6-1.5,3.2-2,4.9l-8.6,1.5l-0.2,1.5c-0.3,2.5-0.3,5,0,7.4l0.2,1.5L9,38.7c0.2,0.9,0.5,1.7,0.9,2.5c0.3,0.8,0.7,1.6,1.2,2.4l-5,7.1l0.9,1.2c1.5,1.9,3.3,3.7,5.2,5.2l1.2,0.9l7.1-5c1.6,0.9,3.2,1.5,4.9,2l1.5,8.6l1.5,0.2c1.2,0.1,2.5,0.2,3.7,0.2s2.5-0.1,3.7-0.2l1.5-0.2l1.5-8.6c0.9-0.2,1.7-0.5,2.5-0.9c0.8-0.3,1.6-0.7,2.4-1.2l7.1,5l1.2-0.9c1.9-1.5,3.7-3.3,5.2-5.2l0.9-1.2l-5-7.1c0.9-1.6,1.5-3.2,2-4.9l8.6-1.5l0.2-1.5C64.1,33.3,64.1,30.8,63.8,28.3z M32,44c-6.6,0-12-5.4-12-12s5.4-12,12-12s12,5.4,12,12S38.6,44,32,44z"/></g></g></svg>
                                </span>
                            </div>
                            <div class="user-menu__separator"></div>
                            <div class="user-menu-item">
                                <form id="tasksForm">
                                    <div id="taskList"></div>
                                </form>
                            </div>
                            <div class="user-menu__separator"></div>
                            <div class="user-menu__footer">
                                <div class="user-menu-item user-menu-item_clickable user-menu-item_in-footer">
                                    <div class="popButton">
                                        Close
                                    </div>
                                </div>
                                <div class="user-menu-item user-menu-item_clickable user-menu-item_in-footer">
                                    <div id="startButton" class="popButton">
                                        Start
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="divSettings" class="git-popup-sett">
                        <div class="user-menu">
                            <div class="user-menu-item">
                                <span class="gig-popup-left">
                                    <b>
                                        Settings
                                    </b>
                                </span>
                                <span id="backButton" class="gig-popup-right">
                                    <svg width="16" height="16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 1000 1000" enable-background="new 0 0 1000 1000" xml:space="preserve"><g><g><g><g><path d="M500,10C229.4,10,10,229.4,10,500c0,270.7,219.4,490,490,490c270.7,0,490-219.3,490-490C990,229.4,770.7,10,500,10z M604.5,688.9c12.7,12.7,12.7,33.5,0,46.2c-12.7,12.7-33.5,12.7-46.2,0L346.5,523.2c-6.4-6.4-9.5-14.8-9.5-23.2c0-8.4,3.1-16.8,9.5-23.2l211.9-211.9c12.7-12.7,33.5-12.7,46.2,0c12.7,12.7,12.7,33.5,0,46.2L415.7,500L604.5,688.9z"/></g></g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></g></svg>
                                </span>
                            </div>
                            <div class="user-menu__separator"></div>
                            <div class="user-menu-item gig-sett-div">
                                <table>
                                    <tr class="border-top">
                                        <td class="gig-sett-field">
                                            Enable in-site notifications
                                        </td>
                                        <td class="gig-sett-value">
                                            <input id="alert1" type="checkbox" checked>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="gig-sett-field">
                                            Enable in-browser notifications
                                        </td>
                                        <td class="gig-sett-value">
                                            <input id="alert2" type="checkbox" checked>
                                        </td>
                                    </tr>
                                    <!--
                                    <tr>
                                        <td class="gig-sett-field">
                                            Enable OS notifications
                                        </td>
                                        <td class="gig-sett-value">
                                            <input id="alert3" type="checkbox" checked>
                                        </td>
                                    </tr>
                                    <tr class="border-top">
                                        <td class="gig-sett-field">
                                            Enable audio notifications
                                        </td>
                                        <td class="gig-sett-value">
                                            <input id="alert4" type="checkbox" checked>
                                        </td>
                                    </tr>
                                    -->
                                    <tr class="border-top">
                                        <td class="gig-sett-field">
                                            Enable notifications from requesters
                                        </td>
                                        <td class="gig-sett-value">
                                            <input id="alert5" type="checkbox" checked>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="gig-sett-field">
                                            Display notifications while working
                                        </td>
                                        <td class="gig-sett-value">
                                            <input id="alert4" type="checkbox" checked>
                                        </td>
                                    </tr>
                                    <tr class="border-top">
                                        <td class="gig-sett-field">
                                            Number of suggested tasks
                                        </td>
                                        <td class="gig-sett-value">
                                            <input id="field1" type="text" size="3" placeholder="3">
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            <div class="user-menu__separator"></div>
                            <div class="user-menu__footer">
                                <div class="user-menu-item user-menu-item_clickable user-menu-item_in-footer">
                                    <div class="popButton gig-sett-button">
                                        Cancel
                                    </div>
                                </div>
                                <div class="user-menu-item user-menu-item_clickable user-menu-item_in-footer">
                                    <div class="popButton gig-sett-button">
                                        Save
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </span>
            </div>
        `);

        $("#alertImage, .popButton").on("click", () => {
            $('#alertPopup').toggle();
            approveNotifications();
            $("#alertNum").hide();
        });

        $("#settButton, #backButton, .gig-sett-button").on("click", () => {
            $('#divTasks').toggle();
            $('#divSettings').toggle();
        });

        $("#startButton").on("click", () => {
            $("#tasksForm input:checkbox:checked").each(function() {
                var taskPos = parseInt(this.id.split('_')[1]);
                console.log("_LINK_", topTasks[taskPos]);
                chrome.runtime.sendMessage({
                    msg: "custom",
                    action: "openTabUrl",
                    params: topTasks[taskPos],
                    function(response) {
                        console.log(response.status);
                    }
                });
            });
        });

        getTasks().then(tasks => populateTasks(tasks));
        resolve();
    });
}

function setNotifications() {
    document.addEventListener('DOMContentLoaded', function() {
        if (!Notification) {
            alert('Desktop notifications not available in your browser. Try Chromium.');
            return;
        }
        if (Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
    }); 
}

function approveNotifications() {
    if (Notification.permission !== 'granted') {
        Notification.requestPermission();
    }
}

function notifyMe() {
    if (Notification.permission == 'granted') {
        var notification = new Notification('Culture Fit', {
            icon: 'https://research.hcilab.ml/files/img.png',
            body: 'Hi! This is Toloka I posted this task: English Comprehension Test',
        });
        notification.onclick = function() {
            window.open(`https://${sandboxMode?'sandbox.':''}toloka.yandex.com/tasks`);
        };
    }
}

function showTasks() {
    $('#alertPopup').show();
}

function getTasks() {
    return new Promise((resolve, reject) => {
        fetch(`https://${sandboxMode?'sandbox.':''}toloka.yandex.com/api/task-suite-pool-groups?userLangs=EN`, {
            "method": "GET",
            "mode": "cors",
            "credentials": "include"
        }).then(response => response.json())
          .then(data => {
            resolve(data);
        });
    });
}

function augmentData(tasks) {
    for (var task of tasks) {
        task.taskType = getTaskType(task);
    }
}

function initMessageServer() {
    var port = chrome.runtime.connect({name: "knockknock"});
    port.postMessage({joke: "Knock knock"});
    port.onMessage.addListener(function(msg) {
        if (msg.available) {
            $("#alertNum").show();
        }
    });
}

function populateTasks(tasks) {
    var numTask = 0;
    if (tasks.length > 0) {
        var html = '<table>';
        var count = 0;
        topTasks = [];
        augmentData(tasks);
        tasks.sort((a, b) => (a.pools[0].reward < b.pools[0].reward) ? 
            1 : (a.pools[0].reward === b.pools[0].reward) ? 
            ((a.projectStats.averageSubmitTimeSec > b.projectStats.averageSubmitTimeSec) ? 
            1 : -1) : -1 );
        globalTasks = tasks;
        var flatTasks = tasks.map(x => Object.flatten(x));
        for (var task of tasks) {
            if (task.availability.available) {
                if (!task.trainingDetails.training) {
                    var taskUrl = `https://toloka.yandex.com/task/${task.pools[0].id}?refUuid=${task.refUuid}`;
                    html += `
                        <tr>
                            <td>
                                <div class="gig-rounded">
                                    <div class="git-label-desc" title="${task.description}">
                                        <a class="links" href="${taskUrl}" target="_blank">${task.title}</a>
                                    </div>
                                    <div>
                                        <!--
                                        <span class="git-label-field">
                                            <div class="git-label-top">
                                                ${task.taskType}
                                            </div>
                                            <div class="git-label-sub">
                                                type
                                            </div>
                                        </span>
                                        -->
                                        <span class="git-label-field">
                                            <div class="git-label-top git-label-reward">
                                                ${formatNumber(task.pools[0].reward)}
                                            </div>
                                            <div class="git-label-sub">
                                                per task
                                            </div>
                                        </span>
                                        <span class="git-label-field">
                                            <div class="git-label-top">
                                                ${formatNumber(task.projectStats.moneyMax3)}
                                            </div>
                                            <div class="git-label-sub">
                                                max pay
                                            </div>
                                        </span>
                                        <span class="git-label-field">
                                            <div class="git-label-top">
                                                ${formatTime(task.projectStats.averageSubmitTimeSec)}
                                            </div>
                                            <div class="git-label-sub">
                                                time
                                            </div>
                                        </span>
                                        <span class="git-label-field">
                                            <div class="git-label-top">
                                                ${formatTime(task.pools[0].assignmentMaxDurationSeconds)}
                                            </div>
                                            <div class="git-label-sub">
                                                max time
                                            </div>
                                        </span>
                                        <span class="git-label-field">
                                            <div class="git-label-top">
                                                ${task.projectStats.acceptanceRate}%
                                            </div>
                                            <div class="git-label-sub">
                                                acceptance
                                            </div>
                                        </span>
                                        <span class="git-label-mid">
                                            <div class="git-label-top git-label-req" title="${task.requesterInfo.name.EN}">
                                                ${task.requesterInfo.name.EN}
                                            </div>
                                            <div class="git-label-sub">
                                                requester
                                            </div>
                                        </span>
                                    </div>
                                </div>
                            </td>
                            <td class="gig-centered">
                                <input type="checkbox" class="gig-checkbox" id="field_${count}">
                            </td>
                        </tr>
                    `;
                    count++;
                    topTasks.push({
                        "title": task.title,
                        "link": taskUrl
                    });
                    if (count == maxTasks) break;
                }
            }
        }
        html += '</table>'
        $('#taskList').html(html);
    }
}