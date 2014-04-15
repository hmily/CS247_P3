// Initial code by Borui Wang, updated by Graham Roth
// For CS247, Spring 2014

(function() {

  var cur_video_blob = null;
  var fb_instance;
  var message;
  var options = ["lol", "LOL", ":)",":(", ":-)", ":-(", "muahaha", "Muahaha", "aw", ";)", ":O", ":P", ":p", ":/"];
  var messages;
  var emoticons = new Array();

  $(document).ready(function(){
    connect_to_chat_firebase();
    connect_webcam();
  });

  function connect_to_chat_firebase(){
    /* Include your Firebase link here!*/
    fb_instance = new Firebase("https://vivid-fire-5868.firebaseio.com/");

    // generate new chatroom id or use existing id
    var url_segments = document.location.href.split("/#");
    if(url_segments[1]){
      fb_chat_room_id = url_segments[1];
    }else{
      fb_chat_room_id = Math.random().toString(36).substring(7);
    }
   // display_msg({m:"Share this url with your friend to join this chat: "+ document.location.origin+"/#"+fb_chat_room_id,c:"red"})

    // set up variables to access firebase data structure
    var fb_new_chat_room = fb_instance.child('chatrooms').child(fb_chat_room_id);
    var fb_instance_users = fb_new_chat_room.child('users');
    var fb_instance_stream = fb_new_chat_room.child('stream');
    var my_color = "#"+((1<<24)*Math.random()|0).toString(16);

    // listen to events
    fb_instance_users.on("child_added",function(snapshot){
      display_msg({m:snapshot.val().name+" joined the room",c: snapshot.val().c});
    });
    fb_instance_stream.on("child_added",function(snapshot){
      display_msg(snapshot.val());
    });

    // block until username is answered
    var username = window.prompt("Welcome, warrior! please declare your name?");
    if(!username){
      username = "anonymous"+Math.floor(Math.random()*1111);
    }
    fb_instance_users.push({ name: username,c: my_color});
    $("#waiting").remove();

    // bind submission box
    $("#submission input").keydown(function( event ) {
      if (event.which == 13) {
      	message = $(this).val();
        if(has_emotions($(this).val())){
        	console.log("true");
        	parsemessage(message);
          fb_instance_stream.push({m:username+": ", v:cur_video_blob, c: my_color});
        }else{
        console.log("false");
          fb_instance_stream.push({m:username+": " + message, c: my_color});
        }
        $(this).val("");
        scroll_to_bottom(0);
      }
    });

    // scroll to bottom in case there is already content
    scroll_to_bottom(1300);
  }
  
  function parsemessage (message) {
  	messages = message.split(emoticons[0]);
  }
  
  // creates a message node and appends it to the conversation
  function display_msg(data){
    $("#conversation").append("<div class='msg' style='color:"+data.c+"'>"+data.m+"</div>");
    if(data.v){
      // for video element
      var video = document.createElement("video");
      video.setAttribute("class", "video");
      video.autoplay = true;
      video.controls = false; // optional
      video.loop = false;
      video.width = 550;
      
  video.onmouseover = function()   {
      this.play();
      this.loop = true;
   };
     video.onmouseout = function()   {
      this.pause();
      this.loop = false;
   };

      var source = document.createElement("source");
      source.src =  URL.createObjectURL(base64_to_blob(data.v));
      source.type =  "video/webm";

      video.appendChild(source);

	if(emoticons[0] == "muahaha") {
		var audio = document.createElement("audio");
      audio.setAttribute('src', '../muahaha.mp3');
		audio.play();
	}


      // for gif instead, use this code below and change mediaRecorder.mimeType in onMediaSuccess below
      // var video = document.createElement("img");
      // video.src = URL.createObjectURL(base64_to_blob(data.v));

	var fr1 = document.createElement("div");
	fr1.setAttribute("id", "frame1");
	var p1 = document.createElement("p");
	p1.setAttribute("id", "p1");
	var node1=document.createTextNode(messages[0] + emoticons[0]);
	p1.appendChild(node1);
	fr1.appendChild(p1);
	var fr2 = document.createElement("div");
	fr2.setAttribute("id", "frame2");
	var p2 = document.createElement("p");
	p2.setAttribute("id", "p2");
	var node2=document.createTextNode(messages[1]);
	p2.appendChild(node2);
	fr2.appendChild(p2);
	document.getElementById("conversation").appendChild(fr1);
    document.getElementById("conversation").appendChild(video);
    document.getElementById("conversation").appendChild(audio);
   document.getElementById("conversation").appendChild(fr2);
    }
  }


  function scroll_to_bottom(wait_time){
    // scroll to bottom of div
    setTimeout(function(){
      $("html, body").animate({ scrollTop: $(document).height() }, 200);
    },wait_time);
  }

  function connect_webcam(){
    // we're only recording video, not audio
    var mediaConstraints = {
      video: true,
      audio: false
    };

    // callback for when we get video stream from user.
    var onMediaSuccess = function(stream) {
      // create video element, attach webcam stream to video element
      var video_width= 160;
      var video_height= 120;
      var webcam_stream = document.getElementById('webcam_stream');
      var video = document.createElement('video');
      video.setAttribute("id","stream");
      webcam_stream.innerHTML = "";
      // adds these properties to the video
      video = mergeProps(video, {
          controls: false,
          width: video_width,
          height: video_height,
          src: URL.createObjectURL(stream)
      });
      video.play();
      webcam_stream.appendChild(video);

      // counter
      var time = 0;
      var second_counter = document.getElementById('second_counter');
      var second_counter_update = setInterval(function(){
        second_counter.innerHTML = time++;
      },1000);

      // now record stream in 5 seconds interval
      var video_container = document.getElementById('video_container');
      var mediaRecorder = new MediaStreamRecorder(stream);
      var index = 1;

      mediaRecorder.mimeType = 'video/webm';
      // mediaRecorder.mimeType = 'image/gif';
      // make recorded media smaller to save some traffic (80 * 60 pixels, 3*24 frames)
      mediaRecorder.video_width = video_width/2;
      mediaRecorder.video_height = video_height/2;

      mediaRecorder.ondataavailable = function (blob) {
          //console.log("new data available!");
          video_container.innerHTML = "";

          // convert data into base 64 blocks
          blob_to_base64(blob,function(b64_data){
            cur_video_blob = b64_data;
          });
      };
      setInterval( function() {
        mediaRecorder.stop();
        mediaRecorder.start(2000);
      }, 2000 );
      console.log("connect to media stream!");
    }

    // callback if there is an error when we try and get the video stream
    var onMediaError = function(e) {
      console.error('media error', e);
    }

    // get video stream from user. see https://github.com/streamproc/MediaStreamRecorder
    navigator.getUserMedia(mediaConstraints, onMediaSuccess, onMediaError);
  }

  // check to see if a message qualifies to be replaced with video.
  var has_emotions = function(msg){
  	emoticons = new Array();
  	var n = -1;
    for(var i=0;i<options.length;i++){
    	n = msg.indexOf(options[i]);
      if(n!= -1){
      	if (n > emoticons.length) {
      		emoticons.length = n;
      	}
      	emoticons[n] = options[i];
      }
    }
    emoticons = emoticons.filter(function(x){ return x != undefined });
    console.log(emoticons);
    if (emoticons.length > 0) {
    	return true;
    }
    return false;
  }


  // some handy methods for converting blob to base 64 and vice versa
  // for performance bench mark, please refer to http://jsperf.com/blob-base64-conversion/5
  // note useing String.fromCharCode.apply can cause callstack error
  var blob_to_base64 = function(blob, callback) {
    var reader = new FileReader();
    reader.onload = function() {
      var dataUrl = reader.result;
      var base64 = dataUrl.split(',')[1];
      callback(base64);
    };
    reader.readAsDataURL(blob);
  };

  var base64_to_blob = function(base64) {
    var binary = atob(base64);
    var len = binary.length;
    var buffer = new ArrayBuffer(len);
    var view = new Uint8Array(buffer);
    for (var i = 0; i < len; i++) {
      view[i] = binary.charCodeAt(i);
    }
    var blob = new Blob([view]);
    return blob;
  };

})();
