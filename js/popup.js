interfaceSource = 'inbrowser';
drawInterface().then(()=>showTasks());
//showTasks();

$("#saveButton").on("click", function(){
    $(".control").each(function(){
        // console.log(this.id);
        setChromeLocal(this.id, $(this).val()).then(()=>{
            // console.log($(this).val());
        });
    });
});

$("#testButton").on("click", function(){
    getTasks().then((data)=>{
        // console.log(data);
    });
});

browser.browserAction.setBadgeText({text: ""});
trackTelemetry('alertClick', {source: interfaceSource});