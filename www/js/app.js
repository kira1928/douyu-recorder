requirejs.onError = function (err) {
	throw err;
}
require(["jquery", "bootstrap"], function($) {
	// DOM ready
	$(function() {
		require(["search_view_controller"]);
	});
});