var http = require('http');

http.createServer(function (req, res) {
  delete require.cache[require.resolve('./mymodule.js')];
  try {
	  require("./mymodule.js").handleResponse(res);
  } catch (e) {
	  console.error(e);
  }
}).listen(6022);