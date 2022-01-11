interfaceSource = 'inbrowser';

drawInterface().then(()=>showTasks());
cleanAlert(interfaceSource);
trackTelemetry(window.location.href, 'BELL_CLICK', {source: interfaceSource});