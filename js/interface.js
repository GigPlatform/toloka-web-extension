var globalTasks = null;
var sandboxMode = true;
var topTasks = [];
var interfaceSource = 'interface';

function formatNumber(number) {
    if (number == null)
        return " -- ";
    return '$' + parseFloat(number).toFixed(2);
}

function formatTime(seconds) {
    if (seconds) {
        if (seconds < 60)
            return seconds + 's';
        return parseInt(seconds/60) + 'm';
    }
    return '--';
}

function addAlertIcon() {
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
}

function drawInterface() {
    return new Promise((resolve, reject) => {
        getChromeLocal('settings', {}).then(config => {
            if ($('#alertPopup').length) {
                $('#alertPopup').remove();
            }
            if (config.currentMode == 'ACTIVE') {       
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
                                        <form id="formSett">
                                            <table>
                                                <tr class="border-top">
                                                    <td class="gig-sett-field">
                                                        Enable in-site notifications
                                                    </td>
                                                    <td class="gig-sett-value">
                                                        <input id="not_page" name="not_page" type="checkbox" ${config.settings.not_page?'checked':''}>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td class="gig-sett-field">
                                                        Enable in-browser notifications
                                                    </td>
                                                    <td class="gig-sett-value">
                                                        <input id="not_brow" name="not_brow" type="checkbox" ${config.settings.not_brow?'checked':''}>
                                                    </td>
                                                </tr>
                                                <tr class="border-top">
                                                    <td class="gig-sett-field">
                                                        Enable requester messages
                                                    </td>
                                                    <td class="gig-sett-value">
                                                        <input id="msg_requ" name="msg_requ" type="checkbox" ${config.settings.msg_requ?'checked':''}>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td class="gig-sett-field">
                                                        Enable worker messages
                                                    </td>
                                                    <td class="gig-sett-value">
                                                        <input id="msg_work" name="msg_work" type="checkbox" ${config.settings.msg_work?'checked':''}>
                                                    </td>
                                                </tr>
                                                <tr class="border-top">
                                                    <td class="gig-sett-field">
                                                        Display notifications while working
                                                    </td>
                                                    <td class="gig-sett-value">
                                                        <input id="not_whil" name="not_whil" type="checkbox" ${config.settings.not_whil?'checked':''}>
                                                    </td>
                                                </tr>
                                                <tr class="border-top">
                                                    <td class="gig-sett-field">
                                                        Number of suggested tasks
                                                    </td>
                                                    <td class="gig-sett-value">
                                                        <input id="num_task" name="num_task" type="text" size="3" value="${config.settings.num_task}" placeholder="${config.settings.num_task}">
                                                    </td>
                                                </tr>
                                            </table>
                                        </form>
                                    </div>
                                    <div class="user-menu__separator"></div>
                                    <div class="user-menu__footer">
                                        <div class="user-menu-item user-menu-item_clickable user-menu-item_in-footer">
                                            <div class="popButton gig-sett-button">
                                                Cancel
                                            </div>
                                        </div>
                                        <div class="user-menu-item user-menu-item_clickable user-menu-item_in-footer">
                                            <div id="settSave" class="popButton gig-sett-button">
                                                Save
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </span>
                    </div>
                `);

                $("#settButton, #backButton, .gig-sett-button").on("click", () => {
                    $('#divTasks').toggle();
                    $('#divSettings').toggle();
                });

                $("#startButton").on("click", () => {
                    $("#tasksForm input:checkbox:checked").each(function() {
                        var taskPos = parseInt(this.id.split('_')[1]);
                        // console.log("_LINK_", topTasks[taskPos]);
                        browser.runtime.sendMessage({
                            msg: "custom",
                            action: "openTabUrl",
                            params: topTasks[taskPos],
                            function(response) {
                                // console.log(response.status);
                            }
                        });
                    });
                });

                $("#settSave").on("click",() => {
                    var settings = {};
                    $("#formSett input:checkbox").each(function(){
                        settings[this.name] = this.checked;
                    });
                    $("#formSett input:text").each(function(){
                        settings[this.name] = this.value;
                    });
                    getChromeLocal('settings', {}).then(config => {
                        config.settings = settings;
                        setChromeLocal('settings', config);
                    });
                });

                getActiveTasks().then(tasks => populateTasks(tasks));
            } else {
                $('#alertDiv').append(`
                    <div id="alertPopup" class="popup popup_show_bottom-right user-switcher__popup popup_visible">
                        <span class="popup__content">
                            <div id="divTasks" class="gig-popup-tasks">
                                <div class="user-menu">
                                    <div class="user-menu-item">
                                        <span class="gig-popup-left">
                                            <b>
                                                Culture Fit
                                            </b>
                                        </span>
                                        <span id="settButton" class="gig-popup-right">
                                        </span>
                                    </div>
                                    <div class="user-menu__separator"></div>
                                    <div class="user-menu-item">
                                        <div id="taskList">
                                            <div id="alertMessage"></div>
                                        </div>
                                    </div>
                                    <div class="user-menu__separator"></div>
                                    <div class="user-menu__footer">
                                        <div class="user-menu-item user-menu-item_clickable user-menu-item_in-footer">
                                            <div class="popButton">
                                                Close
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </span>
                    </div>
                `);
            }
            $("#alertImage").on("click", (event) => {
                event.stopImmediatePropagation();                
                // console.log('ALERT_CLICK', $('#alertPopup').is(":hidden"));
                if ($('#alertPopup').is(":hidden")) {
                //  getActiveTasks().then(tasks => populateTasks(tasks));
                    drawInterface().then(()=>showTasks());
                    $('#alertPopup').show();
                } else {
                    $('#alertPopup').hide();
                }
                approveNotifications();
                $("#alertNum").hide();
                trackTelemetry('alertClick', {source: interfaceSource});
            });
            $(".popButton").on("click", () => {
                $('#alertPopup').hide();
            }); 
            // $("#alertImage, .popButton").on("click", () => {
            //     console.log('ALERT_CLICK');
            //     $('#alertPopup').toggle();
            //     drawInterface().then(()=>showTasks());
            //     trackTelemetry('alertClick', {source: interfaceSource});
            // });
            resolve();
        });
    });
}

function approveNotifications() {
    if (Notification.permission !== 'granted') {
        Notification.requestPermission();
    }
}

function processMode() {    
    getChromeLocal('settings', {}).then(config => {
        if (config.currentMode == 'PASSIVE') {
            $('#alertMessage').text('This feature is disabled');
        }
    });
}

function showTasks() {
    $('#alertPopup').show();
    processMode();
}

function sendTelemetry(eventName, eventData) {
    // console.log('RECORDING TELEMETRY');
    let event = topTasks[eventData.position];
    window.open(event.link, '_blank');
    event.source = interfaceSource;
    trackTelemetry(eventName, event);
    updateRequesters(event.task.requesterInfo.name.EN).then(() => {
        updateDataset(event.taskId, event.task, {status: 1, preference:x=>x+1});
        updateFeatures(event.taskId, event.task, {status: 1, preference:x=>x+1});
    });
}

function initMessageServer() {
    var port = browser.runtime.connect({name: "knockknock"});
    port.postMessage({joke: "Knock knock"});
    port.onMessage.addListener(function(msg) {
        if (msg.action == 'alert') {
            $("#alertNum").show();
        } else if (msg.action == 'message') {
            notifyMe(msg.text, msg.link);
        }
    });
}

function notifyMe(text, link) {
    if (Notification.permission == 'granted') {
        var notification = new Notification('Culture Fit', {
            icon: 'https://research.hcilab.ml/files/img.png',
            body: text,
        });
        notification.onclick = function() {
            window.open(link);
        };
    }
}

function populateTasks(tasks) {
    var numTask = 0;
    if (tasks.length > 0) {
        getChromeLocal('settings', {}).then(config => {
            let maxTasks = parseInt(config.settings.num_task);
            var html = '<table>';
            var count = 0;
            topTasks = [];
            augmentData(tasks);
            tasks = getRankedResults(tasks);
            // console.log(tasks);
            globalTasks = tasks;
            for (var task of tasks) {
                // console.log(task);
                if (task.availability.available) {
                    if (!task.trainingDetails.training) {
                        let taskId = `${task.pools[0].id}`;
                        // let taskId = `${task.projectId}_${task.pools[0].id}`;
                        // var taskUrl = `https://toloka.yandex.com/task/${task.pools[0].id}?refUuid=${task.refUuid}`;
                        var taskUrl = `https://sandbox.toloka.yandex.com/task/${task.pools[0].id}/${task.refUuid}`;
                        html += `
                            <tr>
                                <td>
                                    <div class="gig-rounded">
                                        <div class="git-label-desc" title="${task.description}">
                                            <div class="links taskLink" data-pos="${count}">${task.title}</div>
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
                                                    ${task.projectStats.acceptanceRate?task.projectStats.acceptanceRate+'%':'--'}
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
                            "taskId": taskId,
                            "task": task,
                            "link": taskUrl
                        });
                        if (count == maxTasks) break;
                    }
                }
            }
            html += '</table>'
            $('#taskList').html(html);
            $('.taskLink').on('click', function(){
                sendTelemetry('taskClick', {position: $(this).data('pos')});
            });
        });
    }
}