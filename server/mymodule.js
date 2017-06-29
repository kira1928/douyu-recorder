var fs = require('fs');
var Readable = require("stream").Readable;
var inherits = require("util").inherits;

exports.handleResponse = function(res) {
	console.log("kira2");
	res.setHeader("Access-Control-Allow-Origin", "*");
    r = new FlvStreamer({
		fileName: "test.flv",
		startTime: 123
	});
	r.on("end", function() {
		res.end();
	});
	r.pipe(res);
};

inherits(FlvStreamer, Readable);
function FlvStreamer(opts) {
	var self = this;
	this.fileName = opts.fileName;
	this.startTime = opts.startTime;
	this.stream = fs.createReadStream(this.fileName);
	this.stream.on('data', function(chunk) {
		self.push(chunk);
		//console.log([chunk.length]);
	});
	this.stream.on("end", function() {
		self.push(null);
	});
	Readable.call(this, {});
};

var p = FlvStreamer.prototype;

p._read = function(size) {
}


