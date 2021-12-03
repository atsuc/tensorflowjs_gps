const CLASSES = { 0: 'zero', 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine' }

//-----------------------
// start button event
//-----------------------

startWebcam();

$("#start-button").click(function () {
	setInterval(send_data, 5000);
});

//-----------------------
// load model
//-----------------------

let model;
async function loadModel() {
	console.log("model loading..");
	$("#console").html(`<li>model loading...</li>`);
	model = await tf.loadLayersModel(`./sign_language_vgg16/model.json`);
	console.log("model loaded.");
	$("#console").html(`<li>model loaded.</li>`);
};

//-----------------------
// start webcam 
//-----------------------

var video;
function startWebcam() {
	const medias = {
		audio: false,
		video: {
			facingMode: {
				exact: "environment" // リアカメラにアクセス
			}
		}
	};
	console.log("video streaming start.");
	$("#console").html(`<li>デバイスIDを入力してStartボタンを押してください</li>`);

	if (window.innerHeight > window.innerWidth) {
        /* 縦画面時の処理 */
		$('#main-stream-video').width(270); 
		$('#main-stream-video').height(360); 
    }

	video = $('#main-stream-video').get(0);


	if (navigator.userAgent.match(/(iPhone|iPad|iPod|Android)/i)) {
		// スマホ・タブレット（iOS・Android）の場合
		const promise = navigator.mediaDevices.getUserMedia(medias);

		promise.then(successCallback)
			.catch(errorCallback);

		function successCallback(stream) {
			localStream = stream;
			video.srcObject = stream;
			video.play();
		};

		function errorCallback(err) {
			alert(err);
		};

	} else {
		// PCの場合

		vendorUrl = window.URL || window.webkitURL;

		navigator.getMedia = navigator.getUserMedia ||
			navigator.webkitGetUserMedia ||
			navigator.mozGetUserMedia ||
			navigator.msGetUserMedia;

		navigator.getMedia({
			video: true,
			audio: false
		}, function (stream) {
			localStream = stream;
			video.srcObject = stream;
			video.play();
		}, function (error) {
			alert("Something wrong with webcam!");
		});

	}


}

//-----------------------
// predict button event
//-----------------------

$("#predict-button").click(function () {
	setInterval(captureWebcam, 5000);
});

//-----------------------
// TensorFlow.js method
// predict tensor
//-----------------------

async function predict() {
	var s_time = new Date();
	let tensor = captureWebcam();

	let prediction = await model.predict(tensor).data();
	//let prediction = await model.predict(tensor);
	//console.log(prediction[2].dataSync().length);

	console.log(prediction)


	let results = Array.from(prediction)
		.map(function (p, i) {
			return {
				probability: p,
				className: CLASSES[i]
			};
		}).sort(function (a, b) {
			return b.probability - a.probability;
		}).slice(0, 5);
	$("#console").empty();

	results.forEach(function (p) {
		$("#console").append(`<li>${p.className} : ${p.probability.toFixed(6)}</li>`);
		//console.log(p.className,p.probability.toFixed(6))
		//console.log(p)
	});
	var e_time = new Date();
	var diff = e_time.getTime() - s_time.getTime();
	//location_text += "<li>推論時間(ミリ秒):" + diff + "</li>";
	$("#console").append(`<li>推論時間(ミリ秒) : ${diff}</li>`);


};

function send_data(){
	let base64_image = captureWebcam();

	let send_data = {
		device_id : $("#device_id").val(),
		latitude : lat,
		longitude : lon,
		original_image : base64_image
    };

	//console.log(send_data);
	
	/*
	$.ajax({
        type:"post",                // method = "POST"
        url:"",        // POST送信先のURL
        data:JSON.stringify(send_data),  // JSONデータ本体
        contentType: 'application/json', // リクエストの Content-Type
        dataType: "json",           // レスポンスをJSONとしてパースする
        success: function(response_data) {   // 200 OK時
            // JSON Arrayの先頭が成功フラグ、失敗の場合2番目がエラーメッセージ
            if (!response_data[0]) {    // サーバが失敗を返した場合
                alert("Transaction error. " + response_data[1]);
                return;
            }
            // 成功時処理
        },
        error: function() {         // HTTPエラー時
            alert("Server Error. Please try again later.");
        },
        complete: function() {      // 成功・失敗に関わらず通信が終了した際の処理
            
        }
	});
	*/
};

//------------------------------
// capture streaming video 
// to a canvas object
//------------------------------

function captureWebcam() {
	var canvas = document.createElement("canvas");
	var context = canvas.getContext('2d');
	if (window.innerHeight > window.innerWidth) {
        /* 縦画面時の処理 */
		canvas.width = 270;
		canvas.height = 360;
		context.drawImage(video, 0, 0, 270, 360);
    }else{
		canvas.width = 360;
		canvas.height = 270;
		context.drawImage(video, 0, 0, 360, 270);
	}
	/*
	canvas.width = document.getElementById("main-stream-video").style.width;
	canvas.height = document.getElementById("main-stream-video").style.height;
	context.drawImage(video, 0, 0, video.width, video.height);
	*/

	var resultcanvas = document.getElementById("resultcanvas");
	var resultcontext = resultcanvas.getContext('2d');
	resultcanvas.width = 360; //video.width;
	resultcanvas.height = 240; //video.height;

	var w = canvas.width;
	var h = canvas.height;
	var w_h_ratio = 1.5;
	if(w / h < w_h_ratio){
		var after_croped_h = parseInt(w / w_h_ratio);
		var crop_size_h = parseInt((h - after_croped_h) / 2)
		resultcontext.drawImage(canvas, 0, crop_size_h, w, after_croped_h, 0, 0, 360, 240);
	}else{
		var after_croped_w = parseInt(h * w_h_ratio);
		var crop_size_w = parseInt((w - after_croped_w) / 2)
		resultcontext.drawImage(canvas, crop_size_w, 0, after_croped_w, h, 0, 0, 360, 240);
	}
	
	var showcanvas = document.getElementById("showcanvas");
	var showcontext = showcanvas.getContext('2d');
	showcontext.drawImage(resultcanvas, 0, 0);

	return resultcanvas.toDataURL("image/jpeg").split(',')[1];


	//360 240
	//tensor_image = preprocessImage(canvas);

	//return tensor_image;
}

//-----------------------
// TensorFlow.js method
// image to tensor
//-----------------------

function preprocessImage(image) {
	//let tensor = tf.fromPixels(image).resizeNearestNeighbor([100,100]).toFloat();	
	let tensor = tf.browser.fromPixels(image).resizeNearestNeighbor([100, 100]).toFloat();
	let offset = tf.scalar(255);
	return tensor.div(offset).expandDims();
}

//-----------------------
// clear button event
//-----------------------

$("#clear-button").click(function clear() {
	location.reload();
});


var watchID;
var lat;
var lon;
var mymap;
var addMarker = null;
var is_init = true;
var location_text = "";

if (navigator.geolocation) {

	// 現在の位置情報を取得
	watchID = navigator.geolocation.watchPosition(

		// 位置情報の取得を成功した場合
		function (pos) {
			location_text = "<li>" + "緯度：" + pos.coords.latitude + "</li>";
			location_text += "<li>" + "経度：" + pos.coords.longitude + "</li>";
			document.getElementById("location").innerHTML = location_text;
			lat = pos.coords.latitude;
			lon = pos.coords.longitude;
			//console.log(mymap)
			if (mymap !== undefined && mymap !== null) {
				mymap.setView([lat, lon], 17);
				if (mymap && addMarker) {
					mymap.removeLayer(addMarker);
					addMarker = null;
				}
				addMarker = L.marker([lat, lon]).addTo(mymap);
			}
			
			if(is_init){
				initmap();
			}
		},
		null,
		{ enableHighAccuracy: true }
	);
} else {
	window.alert("本ブラウザではGeolocationが使えません");
}

function clearWatchPosition() {
	navigator.geolocation.clearWatch(watchID);
}

function initmap() {
	mymap = L.map('mapid').setView([lat, lon], 17);

	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: '© <a href="http://osm.org/copyright">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
	}).addTo(mymap);

	is_init = false;
}

