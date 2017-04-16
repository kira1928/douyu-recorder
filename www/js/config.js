// Declare this variable before loading RequireJS JavaScript library
// To config RequireJS after itÅfs loaded, pass the below object into require.config();
var require = {
	shim: {
		"bootstrap" : {
			"deps" : [
				"jquery"
			]
		}
	},
	baseUrl: "js",
	paths: {
		"bootstrap": "libs/bootstrap.min",
		"jquery": "libs/jquery.min"
	}
};