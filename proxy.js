var http = require("http");
var url = require("url");

var port = 9000;

var proxy = http.createServer(function(request, response) {
	request.headers.connections = "close";
	delete request.headers["proxy-connection"];
	delete request.headers["upgrade-insecure-requests"];
	delete request.headers['accept-encoding'];
	var ori_url = url.parse(request.url);
	var options = {
		method: request.method,
		path: ori_url.path,
		hostname: ori_url.hostname,
		port: ori_url.port | 80,
		headers: request.headers
	};
	var req = http.request(options, function(res) {
		console.log(request.url);
		res.pipe(response);
	});
	switch (request.method) {
		case "POST":
			request.on('data', function (data) {
				req.write(data);
			});
			req.on('end', function () {
				req.end();
			});
			break;
		case "GET":
		default:
			req.end();
			break;
	}
}).listen(port);
console.log("listening " + port);

module.exports = exports = proxy;

proxy.port = port;