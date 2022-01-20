function storeObject(obj, action) {
	// console.log('storeObject');
	
	return new Promise((resolve, reject) => {
		if (backLevel) {
			// console.log('STORE_1');
			getSettings().then(config=>{
				// console.log('STORE_2');
				var servers = config.serverUrls;
				for (var serverUrl of servers) {
					if (action == 'store') {
						var server = serverUrl + '?a=' + action + '&q=' + encodeURIComponent(obj);
						// console.log('SEND TO SERVER');
						// console.log(server);
						try {
							fetch(server)
							    .then((response) => {
							    	// console.log('STORE_3');
									if (response.ok) {
										return response.json();
									}
								})
							    .then(function(myJson) {
									// console.log(JSON.stringify(myJson));
									resolve(myJson);
							     })
							    .catch((error)=>{
							    	// console.log('STORE_4');
							    	// console.log(error);
							    	resolve(false);
							    });
						} catch(e) {
							// console.log('STORE_5');
							// console.log(e);
							resolve(false);
						}
					} else {
						var formData = new FormData();
						formData.append('a', action);
						formData.append('q', obj);
						try {
							fetch(serverUrl, {
								method: 'POST',
								body: formData
							})
							  .then(function(response) {
						         //console.log('SEND TO SERVER');
						         return response.text();
							   })
							  .then(function(myJson) {
							     // console.log(myJson);
							     resolve(myJson);
							   });
						} catch(e) {
							// console.log(e);
							resolve(false);
						}
					}
				}
			});
		} else {
			browser.runtime.sendMessage({
	            msg:"params",
	            action:"storeObject",
	            params:[obj, action]
	        }).then(()=>{
				resolve(true);
	        });
		}
	});
}