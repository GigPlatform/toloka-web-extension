function drawInterface() {
    
    $("#header > header > div > div:nth-child(3)").prepend(`
        <div id="alertIcon" style="margin-right:20px;" class="t-hint t-hint_theme_menu t-hint_size_m">
            <div id="alertDiv" class="popup-overlay">
                <span id="alertImage">
                    <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M28.59,22.49c-.28-.5-.62-1-1-1.53a9.25,9.25,0,0,1-1.83-3.87l-.42-5.9C25.09,6.62,22.42,2,17.11,2H14.89c-5.31,0-8,4.62-8.27,9.18L6.2,17.09A9.38,9.38,0,0,1,4.37,21c-.34.52-.68,1-.91,1.45a2.22,2.22,0,0,0-.2,2.33A2.4,2.4,0,0,0,5.46,26h7.72a3,3,0,1,0,5.64,0h7.72a2.4,2.4,0,0,0,2.2-1.26A2.14,2.14,0,0,0,28.59,22.49ZM17,27a1,1,0,1,1-1-1A1,1,0,0,1,17,27Zm10-3.17c0,.08-.17.17-.42.17H5.46c-.25,0-.38-.09-.42-.17s0-.19.1-.35c.27-.46.58-.94.9-1.42,1-1.44,2-3.08,2.15-4.83l.43-5.91C8.83,7.94,10.6,4,14.89,4h2.22c4.29,0,6.06,3.94,6.27,7.33l.43,5.9C23.93,19,25,20.62,26,22.06c.32.48.63,1,.95,1.51A.25.25,0,0,1,27,23.83Z" data-name="39-Notification"/></svg>
                </span>
            </div>
        </div>
    `);

    $('#alertDiv').append(`
        <div id="alertPopup" class="popup popup_show_bottom-right user-switcher__popup popup_visible">
            <span class="popup__content">
                <div id="divTasks" style="width:300px;">
                    <div class="user-menu">
                        <div class="user-menu-item">
                            <span style="float:left;">
                                Tasks
                            </span>
                            <span id="settButton" style="float:right;">
                                <svg width="16" height="16" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"viewBox="0 0 64 64" enable-background="new 0 0 64 64" xml:space="preserve"><g><g><path d="M63.8,28.3l-0.2-1.5L55,25.3c-0.2-0.9-0.5-1.7-0.9-2.5c-0.3-0.8-0.7-1.6-1.2-2.4l5-7.1l-0.9-1.2c-1.5-1.9-3.3-3.7-5.2-5.2L50.7,6l-7.1,5c-1.6-0.9-3.2-1.5-4.9-2l-1.5-8.6l-1.5-0.2c-2.5-0.3-5-0.3-7.4,0l-1.5,0.2L25.3,9c-0.9,0.2-1.7,0.5-2.5,0.9c-0.8,0.3-1.6,0.7-2.4,1.2l-7.1-5l-1.2,0.9c-1.9,1.5-3.7,3.3-5.2,5.2L6,13.3l5,7.1c-0.9,1.6-1.5,3.2-2,4.9l-8.6,1.5l-0.2,1.5c-0.3,2.5-0.3,5,0,7.4l0.2,1.5L9,38.7c0.2,0.9,0.5,1.7,0.9,2.5c0.3,0.8,0.7,1.6,1.2,2.4l-5,7.1l0.9,1.2c1.5,1.9,3.3,3.7,5.2,5.2l1.2,0.9l7.1-5c1.6,0.9,3.2,1.5,4.9,2l1.5,8.6l1.5,0.2c1.2,0.1,2.5,0.2,3.7,0.2s2.5-0.1,3.7-0.2l1.5-0.2l1.5-8.6c0.9-0.2,1.7-0.5,2.5-0.9c0.8-0.3,1.6-0.7,2.4-1.2l7.1,5l1.2-0.9c1.9-1.5,3.7-3.3,5.2-5.2l0.9-1.2l-5-7.1c0.9-1.6,1.5-3.2,2-4.9l8.6-1.5l0.2-1.5C64.1,33.3,64.1,30.8,63.8,28.3z M32,44c-6.6,0-12-5.4-12-12s5.4-12,12-12s12,5.4,12,12S38.6,44,32,44z"/></g></g></svg>
                            </span>
                        </div>
                        <div class="user-menu__separator"></div>
                        <div id="taskList" class="user-menu-item">
                            <table style="width:100%;">
                                <tr>
                                    <td>
                                        <div>
                                            Title 1
                                        </div>
                                        <div>
                                            Description 1
                                        </div>
                                    </td>
                                    <td>
                                    <input id="task1" type="checkbox">
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <div>
                                            Title 2
                                        </div>
                                        <div>
                                            Description 2
                                        </div>
                                    </td>
                                    <td>
                                    <input id="task2" type="checkbox">
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <div>
                                            Title 3
                                        </div>
                                        <div>
                                            Description 3
                                        </div>
                                    </td>
                                    <td>
                                        <input id="task3" type="checkbox">
                                    </td>
                                </tr>
                            </table>
                        </div>
                        <div class="user-menu__separator"></div>
                        <div class="user-menu__footer">
                            <div class="user-menu-item user-menu-item_clickable user-menu-item_in-footer">
                                <div class="popButton">
                                    Next
                                </div>
                            </div>
                            <div class="user-menu-item user-menu-item_clickable user-menu-item_in-footer">
                                <div class="popButton">
                                    Back
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="divSettings" style="display:none;width:200px;">
                    <div class="user-menu">
                        <div class="user-menu-item">
                            <span style="float:left;">
                                Settings
                            </span>
                            <span id="backButton" style="float:right;">
                                <svg width="16" height="16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 1000 1000" enable-background="new 0 0 1000 1000" xml:space="preserve"><g><g><g><g><path d="M500,10C229.4,10,10,229.4,10,500c0,270.7,219.4,490,490,490c270.7,0,490-219.3,490-490C990,229.4,770.7,10,500,10z M604.5,688.9c12.7,12.7,12.7,33.5,0,46.2c-12.7,12.7-33.5,12.7-46.2,0L346.5,523.2c-6.4-6.4-9.5-14.8-9.5-23.2c0-8.4,3.1-16.8,9.5-23.2l211.9-211.9c12.7-12.7,33.5-12.7,46.2,0c12.7,12.7,12.7,33.5,0,46.2L415.7,500L604.5,688.9z"/></g></g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></g></svg>
                            </span>
                        </div>
                        <div class="user-menu__separator"></div>
                        <div class="user-menu-item">
                            <table>
                                <tr>
                                    <td>
                                        Alert for tasks
                                    </td>
                                    <td>
                                        <input id="field1" type="text" size="3">
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        Estimated hourly
                                    </td>
                                    <td>
                                        <input id="field2" type="text" size="3">
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        Snooze
                                    </td>
                                    <td>
                                        <input id="field3" type="checkbox">
                                    </td>
                                </tr>
                            </table>
                        </div>
                        <div class="user-menu__separator"></div>
                        <div class="user-menu__footer">
                            <div class="user-menu-item user-menu-item_clickable user-menu-item_in-footer">
                                <div class="popButton">
                                    Next
                                </div>
                            </div>
                            <div class="user-menu-item user-menu-item_clickable user-menu-item_in-footer">
                                <div class="popButton">
                                    Back
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
    });

    $("#settButton, #backButton").on("click", () => {
        $('#divTasks').toggle();
        $('#divSettings').toggle();
    });

    getTasks().then(tasks => populateTasks(tasks));
}

function getTasks() {
    return new Promise((resolve, reject) => {
        fetch("https://toloka.yandex.com/api/task-suite-pool-groups?userLangs=EN", {
            "headers": {
                "accept": "*/*",
                "accept-language": "en-US,en;q=0.9",
                "sec-ch-ua": "\"Chromium\";v=\"94\", \"Google Chrome\";v=\"94\", \";Not A Brand\";v=\"99\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"macOS\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin"
            },
            "referrer": "https://toloka.yandex.com/tasks",
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": null,
            "method": "GET",
            "mode": "cors",
            "credentials": "include"
        }).then(response => response.json())
          .then(data => {
            resolve(data);
        });
    });
}

function populateTasks(tasks) {
    var maxTasks = 3;
    var numTask = 0;
    var html = '<table>';
    var count = 0;
    for (var task of tasks) {
        if (task.availability.available) {
            if (!task.trainingDetails.training) {
                html += `
                    <tr>
                        <td>
                            <div class="gig-rounded">
                                <div style="display:inline-block;width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                                    ${task.title}
                                </div>
                                <span style="width:50px;">
                                    ${task.pools[0].reward}
                                </span>
                                <span style="width:50px;">
                                    ${task.projectStats.averageSubmitTimeSec}
                                </span>
                            </div>
                            <div style="width:100px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                                ${task.description}
                            </div>
                        </td>
                        <td>
                            <input type="checkbox" id="field${count}">
                        </td>
                    </tr>
                `;
                count++;
                if (count == maxTasks) break;
            }
        }
    }
    html += '</table>'
    $('#taskList').html(html);
}

setTimeout(() => {
    drawInterface();
}, 6000);