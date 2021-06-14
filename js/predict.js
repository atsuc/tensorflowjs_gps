const CLASSES = { 0: 'zero', 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine' }

//-----------------------
// start button event
//-----------------------

$("#start-button").click(function () {
	loadModel();
	startWebcam();
});

//-----------------------
// load model
//-----------------------

let model;
async function loadModel() {
	console.log("model loading..");
	$("#console").html(`<li>model loading...</li>`);
	//model=await tf.loadModel(`http://localhost/jsmodel/model.json`);
	//model=await tf.loadLayersModel(`http://localhost/jsmodel/model.json`);
	//model=await tf.loadLayersModel(`http://localhost/ssd_js/model.json`);
	model = await tf.loadLayersModel(`./sign_language_vgg16/model.json`);
	//model=await tf.loadLayersModel(`http://localhost/efficientnet_ssd/model.json`);
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
	$("#console").html(`<li>video streaming start.</li>`);
	video = $('#main-stream-video').get(0);


	if (navigator.userAgent.match(/(iPhone|iPad|iPod|Android)/i)) {
		// スマホ・タブレット（iOS・Android）の場合
		const promise = navigator.mediaDevices.getUserMedia(medias);

		promise.then(successCallback)
			.catch(errorCallback);

		function successCallback(stream) {
			video.srcObject = stream;
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
	setInterval(predict, 1000 / 10);
});

//-----------------------
// TensorFlow.js method
// predict tensor
//-----------------------

async function predict() {
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



};

//------------------------------
// capture streaming video 
// to a canvas object
//------------------------------

function captureWebcam() {
	var canvas = document.createElement("canvas");
	var context = canvas.getContext('2d');
	canvas.width = video.width;
	canvas.height = video.height;

	context.drawImage(video, 0, 0, video.width, video.height);
	tensor_image = preprocessImage(canvas);

	return tensor_image;
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

if (navigator.geolocation) {

	// 現在の位置情報を取得
	watchID = navigator.geolocation.watchPosition(

		// 位置情報の取得を成功した場合
		function (pos) {
			var location = "<li>" + "緯度：" + pos.coords.latitude + "</li>";
			location += "<li>" + "経度：" + pos.coords.longitude + "</li>";
			document.getElementById("location").innerHTML = location;
			lat = pos.coords.latitude;
			lon = pos.coords.longitude;
			console.log(mymap)
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

