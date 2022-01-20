var globalTasks = null;
var topTasks = [];
var interfaceSource = 'interface';
var loaderCode = '<img src="https://i.gifer.com/AqA0.gif">';

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
        getSettings().then(config => {
            // console.log(config);
            getLabels().then(labels=>{
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
                                                    ${labels["tasks"]}
                                                </b>
                                            </span>
                                            <span id="settButton" class="gig-popup-right">
                                                <svg width="16" height="16" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"viewBox="0 0 64 64" enable-background="new 0 0 64 64" xml:space="preserve"><g><g><path d="M63.8,28.3l-0.2-1.5L55,25.3c-0.2-0.9-0.5-1.7-0.9-2.5c-0.3-0.8-0.7-1.6-1.2-2.4l5-7.1l-0.9-1.2c-1.5-1.9-3.3-3.7-5.2-5.2L50.7,6l-7.1,5c-1.6-0.9-3.2-1.5-4.9-2l-1.5-8.6l-1.5-0.2c-2.5-0.3-5-0.3-7.4,0l-1.5,0.2L25.3,9c-0.9,0.2-1.7,0.5-2.5,0.9c-0.8,0.3-1.6,0.7-2.4,1.2l-7.1-5l-1.2,0.9c-1.9,1.5-3.7,3.3-5.2,5.2L6,13.3l5,7.1c-0.9,1.6-1.5,3.2-2,4.9l-8.6,1.5l-0.2,1.5c-0.3,2.5-0.3,5,0,7.4l0.2,1.5L9,38.7c0.2,0.9,0.5,1.7,0.9,2.5c0.3,0.8,0.7,1.6,1.2,2.4l-5,7.1l0.9,1.2c1.5,1.9,3.3,3.7,5.2,5.2l1.2,0.9l7.1-5c1.6,0.9,3.2,1.5,4.9,2l1.5,8.6l1.5,0.2c1.2,0.1,2.5,0.2,3.7,0.2s2.5-0.1,3.7-0.2l1.5-0.2l1.5-8.6c0.9-0.2,1.7-0.5,2.5-0.9c0.8-0.3,1.6-0.7,2.4-1.2l7.1,5l1.2-0.9c1.9-1.5,3.7-3.3,5.2-5.2l0.9-1.2l-5-7.1c0.9-1.6,1.5-3.2,2-4.9l8.6-1.5l0.2-1.5C64.1,33.3,64.1,30.8,63.8,28.3z M32,44c-6.6,0-12-5.4-12-12s5.4-12,12-12s12,5.4,12,12S38.6,44,32,44z"/></g></g></svg>
                                            </span>
                                        </div>
                                        <div class="user-menu-item">
                                            <div id="alertMessage"></div>
                                        </div>
                                        <div class="user-menu__separator"></div>
                                        <div class="user-menu-item">

                                        <div role="group" class="ButtonMenu">
                                            <button id="recButton" type="button" class="ButtonElement ButtonSelected">
                                                <span>${labels["suggested"]}</span>
                                            </button>
                                            <button id="newButton" type="button" class="ButtonElement">
                                                <span>${labels["new"]}</span>
                                            </button>
                                            <input id="hideUnpaid" type="checkbox" ${config.hideUnpaidTasks?'checked':''}>
                                            ${labels["hidetasks"]}
                                        </div>

                                        </div>
                                        <div class="user-menu__separator"></div>
                                        <div class="user-menu-item">
                                            <form id="tasksForm">
                                                <div id="taskList" class="taskList1">
                                                    ${loaderCode}
                                                </div>
                                            </form>
                                        </div>
                                        <div class="user-menu__separator"></div>
                                        <div class="user-menu__footer">
                                            <div class="user-menu-item user-menu-item_clickable user-menu-item_in-footer">
                                                <div class="popButton">
                                                    ${labels["close"]}
                                                </div>
                                            </div>
                                            <div class="user-menu-item user-menu-item_clickable user-menu-item_in-footer">
                                                <div id="startButton" class="popButton">
                                                    ${labels["start"]}
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
                                                    ${labels["settings"]}
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
                                                            ${labels["insite"]}
                                                        </td>
                                                        <td class="gig-sett-value">
                                                            <input id="not_page" name="not_page" type="checkbox" ${config.settings.not_page?'checked':''}>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td class="gig-sett-field">
                                                            ${labels["inbrowser"]}
                                                        </td>
                                                        <td class="gig-sett-value">
                                                            <input id="not_brow" name="not_brow" type="checkbox" ${config.settings.not_brow?'checked':''}>
                                                        </td>
                                                    </tr>
                                                    <tr class="border-top">
                                                        <td class="gig-sett-field">
                                                            ${labels["msgreq"]}
                                                        </td>
                                                        <td class="gig-sett-value">
                                                            <input id="msg_requ" name="msg_requ" type="checkbox" ${config.settings.msg_requ?'checked':''}>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td class="gig-sett-field">
                                                            ${labels["msgwor"]}
                                                        </td>
                                                        <td class="gig-sett-value">
                                                            <input id="msg_work" name="msg_work" type="checkbox" ${config.settings.msg_work?'checked':''}>
                                                        </td>
                                                    </tr>
                                                    <tr class="border-top">
                                                        <td class="gig-sett-field">
                                                            ${labels["notwhile"]}
                                                        </td>
                                                        <td class="gig-sett-value">
                                                            <input id="not_whil" name="not_whil" type="checkbox" ${config.settings.not_whil?'checked':''}>
                                                        </td>
                                                    </tr>
                                                    <tr class="border-top">
                                                        <td class="gig-sett-field">
                                                            ${labels["numtask"]}
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
                                                    ${labels["cancel"]}
                                                </div>
                                            </div>
                                            <div class="user-menu-item user-menu-item_clickable user-menu-item_in-footer">
                                                <div id="settSave" class="popButton gig-sett-button">
                                                    ${labels["save"]}
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
                        // trackTelemetry(window.location.href, `SETT_CLICK`, null);
                        logEvent(`SETT_CLICK`, window.location.href, null);
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
                        getSettings().then(config => {
                            config.settings = settings;
                            setChromeLocal('settings', config);
                        });
                        // trackTelemetry(window.location.href, `SETT_SAVE`, settings);
                        logEvent(`SETT_SAVE`, window.location.href, settings);
                    });

                    $("#recButton").on("click", function() {
                        showRecTasks();
                        // trackTelemetry(window.location.href, `LIST_RECOM`, null);
                        logEvent(`LIST_RECOM`, window.location.href, null);
                    });

                    $("#newButton").on("click", function() {
                        showNewTasks();
                        // trackTelemetry(window.location.href, `LIST_NEW`, null);
                        logEvent(`LIST_NEW`, window.location.href, null);
                    });

                    $("#hideUnpaid").on("click", function() {
                        getSettings().then(config => {
                            config.hideUnpaidTasks = $(this).is(":checked");
                            setChromeLocal('settings', config);
                            $('.ButtonSelected').click();
                            if (config.hideUnpaidTasks) {
                                // trackTelemetry(window.location.href, `TASK_HIDE_ON`, null);
                                logEvent(`TASK_HIDE_ON`, window.location.href, null);
                            } else {
                                // trackTelemetry(window.location.href, `TASK_HIDE_OFF`, null);
                                logEvent(`TASK_HIDE_OFF`, window.location.href, null);
                            }
                        });
                    });

                    getTasksToShow(true);
                } else if (config.currentMode == 'PASSIVE' || config.currentMode == 'FINISH') {
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
                                            <div id="taskList" class="taskList2">
                                                <div id="alertMessage"></div>
                                            </div>
                                        </div>
                                        <div class="user-menu__separator"></div>
                                        <div class="user-menu__footer">
                                            <div class="user-menu-item user-menu-item_clickable user-menu-item_in-footer">
                                                <div class="popButton">
                                                    ${labels["close"]}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </span>
                        </div>
                    `);
                }
                $("#alertImage, #alertNum").on("click", (event) => {
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
                    cleanAlert(interfaceSource);
                    // trackTelemetry(window.location.href, 'BELL_CLICK', {source: interfaceSource});
                    logEvent('BELL_CLICK', window.location.href, {source: interfaceSource});
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
    });
}

function showNewTasks() {
    $('#taskList').html(loaderCode);
    getAddedTasks().then(addedTasks => {
        addedTasks.available = false;
        let addedIds = addedTasks.list.map(obj=>`${obj.pools[0].id}`);
        getActiveTasks().then(tasks => populateTasks(tasks, "TIME", addedIds));
        addedTasks.list = [];
        setChromeLocal('addedTasks', addedTasks);
        $("#recButton").removeClass("ButtonSelected");
        $("#newButton").addClass("ButtonSelected");
    });
}

function showRecTasks() {
    $('#taskList').html(loaderCode);
    getSettings().then(config => {
        getActiveTasks().then(tasks => populateTasks(tasks, config.rankMethod, []));
        $("#recButton").addClass("ButtonSelected");
        $("#newButton").removeClass("ButtonSelected");
    });
}

function getTasksToShow(validateAdded) {
    if (validateAdded) {
        getAddedTasks().then(addedTasks => {
            if (addedTasks.available) {
                showNewTasks();
            } else {
                showRecTasks();
            }
        });
    } else {
        showRecTasks();
    }
    getAddedTasks().then(addedTasks => {
        if (addedTasks.available) {
            $("#alertNum").show();
        }
    });
}

function approveNotifications() {
    if (Notification.permission !== 'granted') {
        Notification.requestPermission();
    }
}

function getLabels() {
    return new Promise((resolve, reject) => {
        getLanguages().then(languages=>{
            getLanguage().then(lang=>{
                resolve(languages.texts[lang]);
            });
        })
    });
}

function getRemainingTime(nextDue, labels) {
    let curTime = (new Date()).getTime();
    let remaining = nextDue - curTime;
    if (remaining < 0) {
        remaining = 0;
    }
    if (remaining > 24*60*60*1000) {
        return `${parseInt(remaining/(24*60*60*1000))} ${labels['days']}`;
    } else if (remaining > 60*60*1000) {
        return `${parseInt(remaining/(60*60*1000))} ${labels['hours']}`;
    } else if (remaining > 60*1000) {
        return `${parseInt(remaining/(60*1000))} ${labels['minutes']}`;
    } else {
        return `${parseInt(remaining/(1000))} ${labels['seconds']}`;
    }
}

function getSurveyLink(config) {
    let curTime = (new Date()).getTime();
    let remaining = config.nextDue - curTime;
    let remainingDays = parseInt(remaining/(24*60*60*1000));
    return config.surveyLinks[config.currentMode][remainingDays+''] + config.userId + '_' + (new Date()).getTime() + '_' + remainingDays + '_' + config.currentMode;
}

function processMode() {
    // console.log('processMode');
    getSettings().then(config => {
        // console.log('ENTER');
        getLabels().then(labels=>{
            // console.log('ENTER_0');
            if (config.mode == 'PASSIVE' && config.currentMode == 'PASSIVE') {
                // console.log('ENTER_1');
                $('#alertMessage').html(`
                    ${labels["disabled"]}
                `);
            } else if (config.mode == 'PROTOCOL' && config.currentMode == 'PASSIVE') {
                // console.log('ENTER_2');
                if (config.protocol[config.currentState+1] !== undefined) {
                  let state = config.protocol[config.currentState+1].mode;
                  if (state == 'ACTIVE') {
                    // console.log('ENTER_3');
                    $('#alertMessage').html(`
                        ${labels["msgpassive"]} ${getRemainingTime(config.nextDue, labels)}.
                        ${labels["surreminder"]}
                        <a target="_blank" href="${getSurveyLink(config)}">${labels["linksurvey"]}</a>
                    `);
                  } else if (state == 'FINISH') {
                    // console.log('ENTER_4');
                    $('#alertMessage').html(`
                        ${labels["keeptool"]} ${getRemainingTime(config.nextDue, labels)}.
                        ${labels["surreminder"]}
                        <a target="_blank" href="${getSurveyLink(config)}">${labels["linksurvey"]}</a>
                    `);
                  }
                } else {
                    // console.log('ENTER_5');
                    $('#alertMessage').html(`
                        ${labels["disabled"]}
                    `);
                }
            } else if (config.currentMode == 'FINISH') {
                // console.log('ENTER_6');
                $('#alertMessage').html(`
                    ${labels["completed"]}
                    <a target="_blank" href="${config.finalSurveyUrl}${config.userId}">${labels["linksurvey"]}</a>
                `);
            } else if (config.currentMode == 'ACTIVE') {
                // console.log('ENTER_7');
                if (config.isUserStudy) {
                    $('#alertMessage').html(`
                        <a target="_blank" href="${getSurveyLink(config)}">${labels["todaysurl"]}<b>${getNumDay(config)}</b></a> ${labels["timeleft"]} ${getRemainingTime(config.nextDue, labels)}
                    `);
                }
            }
        });
    });
}

function getNumDay(config) {
    let curTime = (new Date()).getTime();
    let remaining = curTime - config.installTime;
    let numDays = parseInt(remaining/(24*60*60*1000)) + 1;
    return numDays;
}

function showTasks() {
    $('#alertPopup').show();
    processMode();
}

function sendTelemetry(eventName, eventData) {
    // console.log('RECORDING TELEMETRY');
    let event = topTasks[eventData.position];
    event.source = interfaceSource;
    updateRequesters(event.task.requesterInfo.name.EN).then(() => {
        updateDataset(event.taskId, event.task, {status: 1, preference:x=>x+1});
        updateFeatures(event.taskId, event.task, {status: 1, preference:x=>x+1});
    });
    // trackTelemetry(window.location.href, eventName, event).then(()=>{
    logEvent(window.location.href, eventName, event).then(()=>{
        window.open(event.link, '_blank');    
    });
}

function trackTelemetry(url, eventName, eventData) {
    return new Promise((resolve, reject) => {
        logURL(url, eventName, JSON.stringify(eventData), null)
          .then(data => {
            // console.log(data);
            for (record of data) {
                eventFired(record.data).then(()=>{
                    resolve();    
                });
            }
          });
    });
}

function initMessageServer() {
    var port = browser.runtime.connect({name: "knockknock"});
    port.postMessage({joke: "Knock knock"});
    port.onMessage.addListener(function(msg) {
        if (msg.action == 'alert') {
            $("#alertNum").show();
        } else if (msg.action == 'alerthide') {
            $("#alertNum").hide();
        } else if (msg.action == 'message') {
            notifyMe(msg.text, msg.link, msg.source);
            // trackTelemetry(window.location.href, `MSG_RCV_${msg.source}`, msg);
            logEvent(`MSG_RCV_${msg.source}`, window.location.href, msg);
        } else if (msg.action == 'brow') {
            browser.runtime.sendMessage({
                msg:"params",
                action:"showIconValue",
                params:[msg.text]
            });
        }
    });
}

function notifyMe(text, link, source) {
    if (Notification.permission == 'granted') {
        var notification = new Notification('Culture Fit', {
            icon: 'https://research.hcilab.ml/files/img.png',
            body: text,
        });
        notification.onclick = function() {
            // trackTelemetry(link, `MSG_CLICK_${source}`, {text:text, link:link});
            logEvent(`MSG_CLICK_${source}`, link, {text:text, link:link});
            window.open(link);
        };
    }
}

function populateTasks(tasks, rankMethod, toHighlight) {
    var numTask = 0;
    if (tasks.length > 0) {
        getSettings().then(config => {
            getLabels().then(labels=>{
                let maxTasks = parseInt(config.settings.num_task);
                var html = '<table>';
                var count = 0;
                topTasks = [];
                augmentData(tasks);
                tasks = getRankedResults(tasks, rankMethod);
                // console.log(tasks);
                globalTasks = tasks;
                for (var task of tasks) {
                    // console.log(task);
                    if (task.availability.available) {
                        let filterTask = false;
                        if (config.hideUnpaidTasks && task.trainingDetails.training) {
                            filterTask = true;
                        }
                        if (!filterTask) {
                            let taskId = `${task.pools[0].id}`;
                            let highlight = false;
                            // console.log(taskId, toHighlight.indexOf(taskId), toHighlight);
                            if (toHighlight && toHighlight.indexOf(taskId) != -1) {
                                highlight = true;
                            }
                            // let taskId = `${task.projectId}_${task.pools[0].id}`;
                            // var taskUrl = `https://toloka.yandex.com/task/${task.pools[0].id}?refUuid=${task.refUuid}`;
                            // var taskUrl = `https://${sandboxMode?'sandbox.':''}toloka.yandex.com/task/${task.pools[0].id}/${task.refUuid}`;
                            var taskUrl = `https://${sandboxMode?'sandbox.':''}toloka.yandex.com/task/${task.pools[0].id}/`;
                            html += `
                                <tr>
                                    <td>
                                        <div class="gig-rounded ${highlight?'gig-rounded-highlighted':''}">
                                            <div class="git-label-desc" title="${task.description}">
                                                <div class="links taskLink" data-pos="${count}">${task.title}</div>
                                            </div>
                                            <div>
                                                <!--
                                                <span class="git-label-field">
                                                    <div class="git-label-top">
                                                        ${task.taskType}
                                                    </div>
                                                    <div class="git-label-sub" title="${labels['type']}">
                                                        ${labels['type']}
                                                    </div>
                                                </span>
                                                -->
                                                <span class="git-label-field">
                                                    <div class="git-label-top git-label-reward">
                                                        ${formatNumber(getPrice(task))}
                                                    </div>
                                                    <div class="git-label-sub" title="${labels['pertask']}">
                                                        ${labels['pertask']}
                                                    </div>
                                                </span>
                                                <span class="git-label-field">
                                                    <div class="git-label-top">
                                                        ${formatNumber(task.projectStats.moneyMax3)}
                                                    </div>
                                                    <div class="git-label-sub" title="${labels['maxpay']}">
                                                        ${labels['maxpay']}
                                                    </div>
                                                </span>
                                                <span class="git-label-field">
                                                    <div class="git-label-top">
                                                        ${formatTime(task.projectStats.averageSubmitTimeSec)}
                                                    </div>
                                                    <div class="git-label-sub" title="${labels['time']}">
                                                        ${labels['time']}
                                                    </div>
                                                </span>
                                                <span class="git-label-field">
                                                    <div class="git-label-top">
                                                        ${formatTime(task.pools[0].assignmentMaxDurationSeconds)}
                                                    </div>
                                                    <div class="git-label-sub" title="${labels['maxtime']}">
                                                        ${labels['maxtime']}
                                                    </div>
                                                </span>
                                                <span class="git-label-field">
                                                    <div class="git-label-top">
                                                        ${task.projectStats.acceptanceRate?task.projectStats.acceptanceRate+'%':'--'}
                                                    </div>
                                                    <div class="git-label-sub" title="${labels['acceptance']}">
                                                        ${labels['acceptance']}
                                                    </div>
                                                </span>
                                                <span class="git-label-field">
                                                    <div class="git-label-top">
                                                        ${task.trainingDetails.training?labels['yes']:labels['no']}
                                                    </div>
                                                    <div class="git-label-sub" title="${labels['train']}">
                                                        ${labels['train']}
                                                    </div>
                                                </span>
                                                <span class="git-label-mid">
                                                    <div class="git-label-top git-label-req" title="${task.requesterInfo.name.EN}">
                                                        ${task.requesterInfo.name.EN}
                                                    </div>
                                                    <div class="git-label-sub" title="${labels['requester']}">
                                                        ${labels['requester']}
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
                    sendTelemetry('TASK_CLICK', {source: interfaceSource, position: $(this).data('pos')});
                });
            });
        });
    }
}

function cleanAlert(source) {
  if (source == 'inbrowser') {
    browser.browserAction.setBadgeText({text: ""});
    browser.runtime.sendMessage({msg: "hideIconInter"});
  } else {
    // $("#alertNum").hide();
    browser.runtime.sendMessage({msg: "hideIconInter"});
    browser.runtime.sendMessage({msg: "hideIconValue"});
  }
}