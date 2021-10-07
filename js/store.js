function storeObject(obj, action) {
	var servers = [
		"https://script.google.com/macros/s/AKfycbwGx2_5a6IwcNI2YZuz2AZvb1J-7Y8Ulk5fYHjZoA8wvHzajv9P55DYiI8UnoV0W403HA/exec"
		//,"https://hcilab.ml/overhead/"
	];
	for (var serverUrl of servers) {
		if (action == 'store') {
			var server = serverUrl + '?a=' + action + '&q=' + encodeURIComponent(obj);
			console.log('SEND TO SERVER');
			console.log(server);
			try {
				fetch(server)
				  .then(function(response) {
			         console.log('GET FROM SERVER');
					 
			         return response.json();
				   })
				  .then(function(myJson) {
				     console.log(JSON.stringify(myJson));
				   });
			} catch(e) {
				console.log(e);
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
				     console.log(myJson);
				   });
			} catch(e) {
				console.log(e);
			}
		}
	}
}