var md5 = require("./md5");
var http = require('http');
var fs = require('fs');

var room_id = 633019;

function get_api_url(room_id) {
	var time = Math.ceil(Date.now()/1000);
	var k = "room/"+room_id+"?aid=android&client_sys=android&time="+time+1231;
	var auth = md5(k);
	var api_url = "http://capi.douyucdn.cn/api/v1/room/"+room_id+"?aid=android&client_sys=android&time="+time+"&auth=" + auth;
	console.log(api_url+"\n");
	return api_url;
}

function get_download_url(room_id, callback) {
	var api_url = get_api_url(room_id);
	http.request(api_url, function(response) {
		response.setEncoding("utf8");
		var body = '';
		response.on('data', function (chunk) {
			body += chunk;
		});
		response.on('end', function () {
			var res = JSON.parse(body);
			if (!res.data || !res.data.rtmp_multi_bitrate) {
				console.log("no live now");
				return;
			}
			var data = res.data;
			var host = data.rtmp_url;
			var path = data.rtmp_live || data.rtmp_multi_bitrate.middle2;
			var url = host + "/" + path;
			console.log(url);
			if (callback) {
				callback(url);
			}
		});
	}).end();
}

function get_current_datetime_string() {
	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth() + 1; //January is 0!
	var yyyy = today.getFullYear();
	var hour = today.getHours();
	var minute = today.getMinutes();
	var second = today.getSeconds();
	if (dd < 10) {
		dd = '0' + dd
	}
	if (mm < 10) {
		mm = '0' + mm
	}
	if (hour < 10) {
		hour = '0' + hour
	}
	if (minute < 10) {
		minute = '0' + minute
	}
	if (second < 10) {
		second = '0' + second
	}
	today = yyyy + '-' + mm + '-' + dd + "_" + hour + "-" + minute + "-" + second;
	return today;
}

function main() {
	var current_datetime_string = get_current_datetime_string();
	var filename = room_id + "_" + current_datetime_string + ".flv";
	get_download_url(room_id, function(url) {
		console.log(url);
		var on_response = function(response) {
			if (response.statusCode === 302) {
				var location = response.headers["location"];
				console.log(["302", location]);
				http.request(location, on_response).end();
				return;
			}
			var file = fs.createWriteStream(filename, {'flags': 'a'});
			response.on('data', function (chunk) {
				file.write(chunk);
			});
			response.on('end', function () {
				file.close();
				console.log("done");
			});
		};
		http.request(url, on_response).end();
	});
}

main();