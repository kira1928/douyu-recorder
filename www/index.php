<!DOCTYPE HTML>
<html lang="en-US">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>斗鱼视频回看</title>
	<link rel="stylesheet" href="css/bootstrap.min.css">
	<link rel="stylesheet" href="css/bootstrap-theme.min.css">
	<script src="js/config.js"></script>
	<script src="js/libs/require.js"></script>
	<script src="js/app.js"></script>
</head>
<body>
	<h1>输入斗鱼房间ID或房间别名</h1>
	<div id="info_bar"></div>
	<div>
		<input id="search_text" type="text" class="form-control" placeholder="Search" style="display:inline-block;width:auto;" value="lslalala">
		<button id="search_button" type="submit" class="btn btn-default">搜索</button>
	</div>
	<div class="list-group"  id="list_container">
	</div>
	<script type="text/template" id="list_entry_template">
		<a href="#" class="list-group-item" style="min-height:130px">
			<div style="width:100px;float:left">
				<img class="room_thumb"src="" alt="" style="width:inherit;"/>
				人气： <b class="online"></b><br />
				<b class="is_online"></b>
			</div>
			<div style="width:100px;float:right">
				<img class="avatar"src="" alt="" style="width:inherit;"/>
			</div>
			<div style="margin:0 100;padding-left:110px;">
				<b class="room_name" style=""></b><br />
				主播： <b class="owner_name"></b>
				<div style="position:absolute;bottom:20px;right:130px;">
					<button class="btn_homepage" style="width:80px;">斗鱼主页</button>
					<button class="btn_watch_live" style="width:80px;">看直播</button>
					<button class="btn_watch_video" style="width:80px;">视频</button>
				</div>
			</div>
		</a>
	</script>
</body>
</html>