var server = require('http');
var app = server.createServer(function(request, response) {

  response.end();
});

var io = require('socket.io').listen(app);


io.configure('production', function(){
	io.enable('browser client minification');  // send minified client
	io.enable('browser client etag');          // apply etag caching logic based on version number
	io.enable('browser client gzip');          // gzip the file
	io.set('log level', 1);                    // reduce logging
	io.set('transports', [                     // enable all transports (optional if you want flashsocket)
	    'websocket'
	  , 'flashsocket'
	  , 'htmlfile'
	  , 'xhr-polling'
	  , 'jsonp-polling'
	]);
});


app.listen(8000);

var sockets = Array();
var sockets_idle = Array();
var sockets_paired = Array();


// Taken from stackoverflow
function randomKey(obj) {
    var ret;
    var c = 0;
    for (var key in obj)
        if (Math.random() < 1/++c)
           ret = key;
    return ret;
}

function getKey(obj, s) {

	for (var i in obj)
	{
		//console.log(i);
	 	if (obj[i].socket == s) {
	 		return i;
	 	}
	}    
}

function arraySize(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

setInterval(function() {
	var u1_key = randomKey(sockets_idle);
	//console.log(u1_key);

	for (var i = 0; i < 5; i++) {
		var u2_key = randomKey(sockets_idle);
		if (u2_key != u1_key)
		{
			//console.log("Connecting " + u1_key + " to " + u2_key);

			sockets_paired[u1_key] = { 'partner_socket': sockets[u2_key].socket, 'partner_id': u2_key };
			sockets_paired[u2_key] = { 'partner_socket': sockets[u1_key].socket, 'partner_id': u1_key };

			delete sockets_idle[u1_key];
			delete sockets_idle[u2_key];

			sockets[u1_key].socket.emit('e_connection_success');
			sockets[u2_key].socket.emit('e_connection_success');

			sockets[u1_key].connected = true;
			sockets[u2_key].connected = true;

			break;
		}
	};
}, 1000);

io.sockets.on('connection', function(socket) {

	socket.on('disconnect', function(data) {
		var index = getKey(sockets, socket);

		// User Socket aus allens ockets löschen
		delete sockets[index];
		delete sockets_idle[index];

		// Ist der user im moment mit einem anderen verunden? Wenn ja, ihm eine Nachricht geben und auch löschen
		if (sockets_paired[index]) {
			sockets_paired[index].partner_socket.emit('e_connection_disconnect');
			
			pid = sockets_paired[index].partner_id;
			
			//delete sockets[pid];
			//delete sockets_idle[pid];
			delete sockets_paired[pid];
			delete sockets_paired[index];

			sockets[pid].connected = false;
		}

		//console.log("Socket disconnected");
	});

	socket.on('e_disconnect', function(data) {
		var index = getKey(sockets, socket);

		if (sockets[index].connected) {
			sockets_paired[index].partner_socket.emit('e_connection_disconnect');
			
			pid = sockets_paired[index].partner_id;
			
			//delete sockets[pid];
			//delete sockets_idle[pid];
			delete sockets_paired[pid];
			delete sockets_paired[index];

			sockets[pid].connected = false;
			sockets[index].connected = false;
		} 
	});

	socket.on('e_next', function() {
		var index = getKey(sockets, socket);

		if (index != undefined) {
			if (sockets[index].connected) {
				sockets_paired[index].partner_socket.emit('e_connection_disconnect');
				
				pid = sockets_paired[index].partner_id;
				
				//delete sockets[pid];
				//delete sockets_idle[pid];
				delete sockets_paired[pid];
				delete sockets_paired[index];

				sockets[pid].connected = false;
				sockets[index].connected = false;
			}

			sockets_idle[index] = socket;
			socket.emit('e_servermessage', { 'msg': 'Connecting...' });		
		} 

		//console.log("Pushing " + index + " back to idle");
		
	});

	socket.on('e_connect', function(data) {
		if (sockets[data.id]) {
			socket.emit('e_connection_error', { 'msg': 'You are already connected! Maybe having another tab open?' });
		}
		else {
			sockets[data.id] = { 'socket': socket, 'connected': false};
			sockets_idle[data.id] = socket;

			//console.log(data.id + " connected officially :)");
			socket.emit('e_servermessage', { 'msg': 'Connecting...' });		
		}
	});

	socket.on('e_reveal_request', function(data) {
		var index = getKey(sockets, socket);
		if (sockets[index].connected) {
			sockets_paired[index].partner_socket.emit('e_reveal_request');
		}
	});

	socket.on('e_reveal_success', function(data) {
		var index = getKey(sockets, socket);

		if (sockets[index].connected) {

			var user1_options = {
			  host: 'apps.personalitycores.com',
			  port:  80,
			  path: '/chatty/rest/'+index+'/'
			};

			var user2_options = {
				host: 'apps.personalitycores.com',
				port: 80,
				path: '/chatty/rest/'+sockets_paired[index].partner_id+'/'
			};

			var user1_req = server.request(user1_options, function(user1_res) {
				user1_res.on('data', function (user1_data) {

					var user2_req = server.request(user2_options, function(user2_res) {
						user2_res.on('data', function (user2_data) {
							sockets_paired[index].partner_socket.emit('e_reveal_success', { 'partner_id': index, 'partner_data': user1_data.toString() });
							sockets[index].socket.emit('e_reveal_success', { 'partner_id': sockets_paired[index].partner_id, 'partner_data': user2_data.toString() });
						});
					});
					user2_req.end();
				});
			});

			user1_req.end();
		}
	});

	socket.on('e_reveal_failure', function(data) {
		var index = getKey(sockets, socket);
		if (sockets[index].connected) {
			sockets_paired[index].partner_socket.emit('e_reveal_failure');
		}
	});

	socket.on('e_message', function(data) {
		var index = getKey(sockets, socket);
		if (sockets[index].connected) {
			sockets_paired[index].partner_socket.emit('e_partnermessage', { 'msg': data.msg });
		}
	});

	socket.on('e_socket_count', function() {
		socket.emit('e_socket_count', {
			'count': arraySize(sockets)
		});
	});

})