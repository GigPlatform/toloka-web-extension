function storeObject(obj, action) {
	getSettings().then(config=>{
		var servers = config.serverUrls;
		for (var serverUrl of servers) {
			if (action == 'store') {
				var server = serverUrl + '?a=' + action + '&q=' + encodeURIComponent(obj);
				// console.log('SEND TO SERVER');
				// console.log(server);
				try {
					fetch(server)
					    .then((response) => {
							if (response.ok) {
								return response.json();
							}
						})
					    .then(function(myJson) {
							// console.log(JSON.stringify(myJson));
					     })
					    .catch((error)=>{});
				} catch(e) {
					// console.log(e);
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
					   });
				} catch(e) {
					// console.log(e);
				}
			}
		}
	});
}