var portExt = null;
var extensionId = null;

history.pushState = ( f => function pushState(){
    var ret = f.apply(this, arguments);
    window.dispatchEvent(new Event('pushstate'));
    window.dispatchEvent(new Event('locationchange'));
    return ret;
})(history.pushState);

history.replaceState = ( f => function replaceState(){
    var ret = f.apply(this, arguments);
    window.dispatchEvent(new Event('replacestate'));
    window.dispatchEvent(new Event('locationchange'));
    return ret;
})(history.replaceState);

window.addEventListener('popstate',()=>{
    window.dispatchEvent(new Event('locationchange'));
});

window.addEventListener('hashchange', function() { 
  window.dispatchEvent(new Event('locationchange'));
});

window.addEventListener('locationchange', function(){
    // console.log('LOCATIONCHANGE');
    sendEventMessage({action: "changeUrl", value:{url:location.href}});
    // sendNewMessage({msg: "custom", action:"changeUrl", value:{url:location.href}});
    // postNewMessage({action: "changeUrl", value:{url:location.href}});
});

function sendEventMessage(content) {
    window.postMessage(content, "*");
}

function initInject() {
}

function initClientServer(extId) {
    extensionId = extId;
    // console.log('CLIENT SERVER STARTED', extensionId);
    // portExt = browser.runtime.connect(extensionId, {name: "knockknock"});
    // portExt.onMessage.addListener(function(msg) {
    //     console.log(msg);
    // });
    // postNewMessage({action: "connect"});
}

// function postNewMessage(content) {
//     portExt = browser.runtime.connect(extensionId, {name: "knockknock"});
//     portExt.postMessage(content);
//     console.log("MESSAGE POSTED", extensionId);
// }

// function sendNewMessage(content) {
//     browser.runtime.sendMessage(extensionId, content, function(response) {});
//     console.log("MESSAGE SENT", extensionId);
// }

// console.log('INJECTED');
initInject();