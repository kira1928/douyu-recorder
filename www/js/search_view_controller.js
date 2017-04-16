require(["jquery"], function($) {
	$("#search_text").keyup(function(event) {
		if (event.keyCode == 13) {
			search();
		}
	});
	$("#search_button").click(function() {
		search();
	});
	var search = function() {
		var $list_container = $("#list_container");
		$list_container.empty();
		var room_id = $("#search_text").val();
		if (!room_id) {
			return;
		}
		$.ajax({
			url: "add_cors_header.php",
			type: "POST",
			data: {
				host: "http://open.douyucdn.cn/api/RoomApi/room/" + room_id,
			},
			dataType: "json"
		}).done(function(data) {
			if (data.error != 0) {
				var error_msg = "错误 " + data.error + " ： ";
				switch (data.error) {
					case 501:
						error_msg += "不存在此分类";
						break;
					case 999:
						error_msg += "接口维护中";
						break;
					default:
						error_msg += "未知错误";
				}
				$("#info_bar").val(error_msg);
				return;
			}
			data = data.data;
			var list_entry_dom = create_list_entry(data);
			$list_container.append(list_entry_dom);
		}).fail(function(jqXHR, textStatus) {
			
		});
	};

	var create_list_entry = function(data) {
		var ret = $($("#list_entry_template").html());
		// 房间预览图
		ret.find("img.room_thumb").attr("src", data.room_thumb);
		// 主播头像
		ret.find("img.avatar").attr("src", data.avatar);
		// 房间名
		ret.find("b.room_name").text(data.room_name);
		// 房间人气数
		ret.find("b.online").text(data.online);
		// 主播名
		ret.find("b.owner_name").text(data.owner_name);
		// 是否直播中
		ret.find("b.is_online").text(data.room_status == 1 ? "直播中" : "已下播");

		// buttons
		var room_id = data.room_id;
		ret.find("button.btn_homepage").click(function() {
			location.href = "http://douyu.com/" + room_id;
		});
		ret.find("button.btn_watch_live").click(function() {
			location.href = "watch_live.php?room_id=" + room_id;
		});
		ret.find("button.btn_watch_video").click(function() {
			location.href = "watch_video.php?room_id=" + room_id;
		});
		return ret[0];
	}
});