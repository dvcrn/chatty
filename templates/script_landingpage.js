		$(document).ready(function() {
			var socket = io.connect('{{ socket_uri }}');
			socket.on("e_socket_count", function(data) {
				$('#status span').html(data.count);
			});

			window.setInterval(function() {
				socket.emit("e_socket_count");
			}, 30000);

			socket.emit("e_socket_count");
		});