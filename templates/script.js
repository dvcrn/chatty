		$(document).ready(function() {
			var chatinput = $('#chatinput');
			var chatbutton = $('#sendbutton');
			var revealbutton = $('#infobtn');
			var chatcontent = $('#chatbox');
			var socket = io.connect('{{ socket_uri }}');
			var connected = false;
			var shared = false;
			var userid = "{{user_fbid}}";

			var u_avatar = $('#userpic');
			var u_name = $('#userinfo .name');
			var u_gender = $('#userinfo .gender');
			var u_relationship = $('#userinfo .relationship');
			var u_interested_in = $('#userinfo .interested_in');
			var u_birthday = $('#userinfo .birthday');

			var m_disconnect = $('#m_disconnect');
			var m_next = $('#m_next');

			var partner_name = "Stranger";
			var partner_id = 0;

			strip = function(html)
			{
			   var tmp = document.createElement("DIV");
			   tmp.innerHTML = html;
			   return tmp.textContent||tmp.innerText;
			}

			scroll_to_bottom = function() {
				chatcontent.scrollTo("1000000000000", 200);
			}

			showmessage = function(msg, sender) {
				
				if (sender == "system") {
					chatcontent.append("<div class='message-system'>"+msg+"</div>");	
				}

				msg = strip(msg);
				
				if (sender == "you") {
					chatcontent.append("<div class='message-you'><img class='message-avatar' src='http://graph.facebook.com/"+userid+"/picture/' /><p class='message-sender'>You</p><p class='message-content'>"+msg+"</p></div>");
				}

				if (sender == "partner") {
					if (partner_id == 0) {
						partner_avatar = '{{ STATIC_PREFIX }}img/avatar-default-small.gif';
					}
					else {
						partner_avatar = 'http://graph.facebook.com/' + partner_id + '/picture/';	
					}

					chatcontent.append("<div class='message-partner'><img class='message-avatar' src='"+partner_avatar+"' /><p class='message-sender'>"+partner_name+"</p><p class='message-content'>"+msg+"</p></div>");
				}

				scroll_to_bottom();
			}

			cleanup = function() {
				chatcontent.html("");

				revealbutton.show();
				$('#addbtn').fadeOut('slow');
				$('#userdesk').animate({
					'height': '200',
					'border-radius': '0.3em'
				}, 500);

				$('#userinfo').fadeOut('slow');

				shared = false;
				connected = false;
				partner_name = "Stranger";
				partner_id = 0;
				u_avatar.attr('src', "{{ STATIC_PREFIX }}img/no-pic.gif");
			}

			request_reveal = function() {
				socket.emit('e_reveal_request');
			}

			chatinput.keydown(function(event) {
				if(event.keyCode == 13){
					chatbutton.click();
				}
			});

			revealbutton.click(function() {
				if (connected) {
					request_reveal();
					showmessage("Request sent. Waiting for partner approval", "system");	
				}
			});

			chatbutton.click(function() {				
				if (connected) {
					var val = chatinput.val();

					chatinput.val(null);
					if (val.length > 1) {				
						showmessage(val, "you");
						socket.emit('e_message', { 'msg': val });	
					}	
				}
			});

			m_next.click(function() {
				cleanup();
				socket.emit('e_next');
			});

			m_disconnect.click(function() {
				if (connected) {
					showmessage("Connection closed", "system");
					connected = false;
					socket.emit('e_disconnect');	
				}
			});

			$('#addbtn').click(function() {
				window.open("http://www.facebook.com/dialog/friends/?id="+partner_id+"&app_id=321455234537667&display=popup&redirect_uri=http://apps.personalitycores.com/chatty/callback/","Add as Friend","menubar=0,resizable=1,width=580,height=420");
			});

			socket.on('e_connection_success', function(data) {
				showmessage("Connection Sucessful. Say Hi! :)", "system");
				connected = true;
			});

			socket.on('e_connection_disconnect', function(data) {
				showmessage("Your partner disconnected. Sorry!", "system");
				connected = false;
			});

			socket.on('e_connection_error', function(data) {
				showmessage(data.msg, "system");
				connected = false;
			});

			socket.on('e_servermessage', function(data) {
				showmessage(data.msg, "system");
			});

			socket.on('e_partnermessage', function(data) {
				showmessage(data.msg, "partner");
			});

			socket.on('e_reveal_success', function(data) {
				var parsed_data = $.parseJSON(data.partner_data);

				// Die Rechte Spalte veraendern
				u_gender.html("<span>Gender:</span> " + parsed_data.gender);
				u_name.html("<span>Name:</span> <a target='blank' href='http://www.facebook.com/"+parsed_data.id+"'>" + parsed_data.first_name + " " + parsed_data.last_name + "</a>");
				u_relationship.html("<span>Relationship:</span> " + parsed_data.relationship_status);
				u_birthday.html("<span>Birthday:</span> " + parsed_data.birthday);
				u_avatar.attr('src', "http://graph.facebook.com/"+parsed_data.id+"/picture?type=large&cache=" + Math.floor(Math.random() * 10000));
				u_interested_in.html("<span>Interested In:</span> " + parsed_data.interested_in.join(', '));

				// Wird gebraucht, damit avatar + name im chat angezeigt wird
				partner_name = parsed_data.first_name;
				partner_id = parsed_data.id;


				// Spalte sichtbar machen
				revealbutton.hide();
				$('#addbtn').fadeIn('slow');
				$('#userdesk').animate({
					'height': '320px',
					'border-radius': '0.3em 0.3em 0 0'
				}, 500);

				$('#userinfo').fadeIn('slow');

				shared = true;
				showmessage("Sharing complete! Check out the box!", "system")	
			});

			socket.on('e_reveal_failure', function(data) {
				showmessage("Your Partner declined your request. Sorry!", "system")
			});


			socket.on('e_reveal_request', function(data) {

				if (shared == false) {
					// Die ID muss removed werden damit, falls der button nochmal gedrueckt wird, das event nicht doppelt ausgeloest wird.
					$('#reveal_success_button').removeAttr('id');
					$('#reveal_decline_button').removeAttr('id');

					showmessage("Your Partner is Requesting your Data. Click <a id='reveal_success_button' href='#'>here</a> to commit or <a id='reveal_decline_button' href='#'>decline</a> the request..", "system");				
					$('#reveal_success_button').click(function() {
						socket.emit('e_reveal_success');
					});

					$('#reveal_decline_button').click(function() {
						socket.emit('e_reveal_failure');
					});
				}

			});

			socket.emit("e_connect", { 'id': userid }); 

		});