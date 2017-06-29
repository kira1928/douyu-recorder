// flv is big-endian

var fs = require('fs');
var filename = "test.flv";
var buffer = new Buffer(65536);
var FLV_HEADER_LENGTH = 9;
var FLV_PREVIOUS_TAG_SIZE_LENGTH = 4;

fs.open(filename, "r", function(err, fd) {
	if (err) {
		console.error("open " + filename + "failed. ", err);
		return;
	}
	read_flv(fd)
})

var read_flv_header = function(fd, callback) {
	if (typeof callback !== "function") {
		callback = function() {};
	}
	fs.read(fd, buffer, 0, FLV_HEADER_LENGTH, 0, function(err, bytes_read, buff) {
		if (err) {
			callback(err);
			return;
		}
		callback();
	})
};

var read_flv_previous_tag_size = function(fd, position, callback) {
	if (typeof callback !== "function") {
		callback = function() {};
	}
	fs.read(fd, buffer, 0, FLV_PREVIOUS_TAG_SIZE_LENGTH, position, function(err, bytes_read, buff) {
		if (err) {
			callback(err);
			return;
		}
		callback();
	})
};

var FlvParser = (function() {

	var DEFAULT_BUFFER_SIZE = 1024;

	var FlvParser = function(opts, on_complete) {
		this.file_name = opts.file_name;
		this.current_tag_position = 0;
		this.fd = fs.openSync(this.file_name, "r");
		this.buffer = new Buffer(DEFAULT_BUFFER_SIZE);
		parse_flv_initial_part_sync_.call(this, on_complete);
		
		// TODO remove the following debug code
		// for test.flv
		this.key_frames = [{
			time: 0x0,	// 0
			position: 0x020D
		}, {
			time: 0x0BB8,	// 3000
			position: 0x149CEA
		}, {
			time: 0x1770,	// 6000
			position: 0x2CA316
		}];
	};

	var p = FlvParser.prototype;
	
	p.file_name = "";
	
	p.start_time = 0;
	
	p.fd = null;
	
	p.current_file_position = 0;
	
	// ---------- private ----------
	var parse_flv_initial_part_sync_ = function(on_complete) {
		var self = this;
		fs.read(fd, this.buffer, 0, this.buffer.length, 0, function(err, bytes_read, buff) {
			if (err) {
				on_complete(err);
				return;
			}
			read_flv_header_.call(self);
			read_flv_previous_tag_size_.call(self);
			var first_tag = new FlvTag(buff, self.current_file_position);
			self.current_file_position += first_tag.buffer.length;
			var second_tag = new FlvTag(buff, self.current_file_position);
			self.current_file_position += second_tag.buffer.length;
			var third_tag = new FlvTag(buff, self.current_file_position);
			self.current_file_position += third_tag.buffer.length;
			self.initial_tags = [first_tag, second_tag, third_tag];
			on_complete();
		});
	}
	
	var read_flv_header_ = function() {
		this.current_file_position += FLV_HEADER_LENGTH;
	};
	
	var read_flv_previous_tag_size_ = function() {
		this.current_file_position += FLV_PREVIOUS_TAG_SIZE_LENGTH;
	}
	
	// ---------- public ----------
	p.create_read_stream = function() {
		var ret = new FlvStreamer(this);
	};
	
	/**
	 * @param {number} time in millisecond
	 */
	p.seek_to_time = function(time) {
		var key_frame_info = this.find_key_frame_info_by_time(time);
		this.current_file_position = key_frame_info.position;
	};
	
	/**
	 * Find the key frame info which has the nearest "time" to the given "time".
	 * @param {number} time in millisecond
	 */
	p.find_key_frame_info_by_time = function(time) {
		if (!Array.isArray(this.key_frames) || key_frames.length === 0) {
			throw "Need this.key_frames array when calling FlvParser::find_key_frame_by_time().";
		}
		this.key_frames.reduce(function (prev, curr) {
			return (Math.abs(curr.time - time) < Math.abs(prev.time - time) ? curr : prev);
		});
	}

	return FlvParser;
}());

var FlvStreamer = (function() {

	var FlvStreamer = function(flv_parser) {
		this.flv_parser = flv_parser;
		Readable.call(this, {});
	};

	inherits(FlvStreamer, Readable);

	var p = FlvStreamer.prototype;

	p.init = function() {
		var self = this;
		
		// this.push(this.flv_parser.get_header_buffer());
		// this.push(this.flv_parser.get_first_previous_tag_size_buffer());
		// this.push(this.flv_parser.get_init_config_tags_buffer());
		var flv_parser = this.flv_parser;
		this.push(flv_parser.get_fixed_initial_buffer());

		flv_parser.seek_to(this.start_time, function(exact_start_time) {
			var flv_tag_stream = flv_parser.create_flv_tag_stream();
			flv_tag_stream.on("flv_tag", function(tag) {
				tag.time_stamp -= exact_start_time;
				self.push(tag.buffer);
			});
			flv_tag_stream.on("end", function() {
				// TODO
				// self.exit();
			});
			flv_tag_stream.start();
		});
	}

	p._read = function(size) {
	};
	
	return FlvStreamer;
}());

var FlvTag = (function() {

	var FLV_TAG_HEADER_LENGTH = 11;

	var FlvTag = function(buffer, position) {
		if (buffer && typeof position !== "undefined") {
			this.read(buffer, position);
		}
	};

	FlvTag.prototype.read = function(buffer, position) {
		if (!this.buffer) {
			this.buffer = new Buffer(FLV_TAG_HEADER_LENGTH);
		}
		var header_buffer = buffer.slice(position, position + FLV_TAG_HEADER_LENGTH);
		var total_bytes_read = FLV_TAG_HEADER_LENGTH;
		var first_byte = header_buffer.readUInt8(0);
		var filter = first_byte & 0x20;
		if (filter) {
			throw "Unimplemented feature: flv tag filter";
		}
		this.tag_type = first_byte & 0x1f;
		this.data_size = read_uint24_be(header_buffer, 1);
		this.buffer = new Buffer(FLV_TAG_HEADER_LENGTH + this.data_size);
		this.header_buffer.copy(this.buffer);
		this.time_stamp = read_uint24_be(header_buffer, 4) & (header_buffer.readUInt8(7) << 24);
		var tag_position = position + FLV_TAG_HEADER_LENGTH;
		var on_complete = function(err, data, bytes_read) {
			if (err) {
				return;
			}
			total_bytes_read += bytes_read;
			self.data = data;
			// console.log(JSON.stringify(ret));
			callback(null, self, total_bytes_read);
		};
		switch (self.tag_type) {
			case 8:		// audio
				return;
				read_flv_audio_tag(fd, tag_position, on_complete);
				break;
			case 9:		// video
				self.data = new FlvVideoTag(self.data_size);
				self.data.read(fd, tag_position, on_complete);
				break;
			case 18:	// metadata
				read_flv_script_data(fd, tag_position, on_complete);
				break;
			default:	// error
				callback("Unknown tag type: " + tag_type);
				break;
		}
	};
	
	return FlvTag;
}());

read_flv_script_data = function(fd, position, callback) {
	if (typeof callback !== "function") {
		callback = function() {};
	}
	read_flv_script_tag_body(fd, position, callback);
};

read_flv_script_tag_body = function(fd, position, callback) {
	if (typeof callback !== "function") {
		callback = function() {};
	}
	read_flv_script_data_value(fd, position, function(err, name, bytes_read) {
		if (err) {
			callback(err);
			return;
		}
		var total_bytes_read = bytes_read;
		var value_position = position + bytes_read;
		read_flv_script_data_value(fd, value_position, function(err, value, bytes_read) {
			if (err) {
				callback(err);
				return;
			}
			total_bytes_read += bytes_read;
			var ret = {
				name: name,
				value: value
			};
			callback(null, ret, total_bytes_read);
		});
	});
};

var read_flv_script_data_value = function(fd, position, callback) {
	if (typeof callback !== "function") {
		callback = function() {};
	}
	fs.read(fd, buffer, 0, 1, position, function(err, bytes_read, buff) {
		if (err) {
			console.error(err);
			callback(err);
			return;
		}
		var total_bytes_read = bytes_read;
		var type = buff.readUInt8(0);
		var value_position = position + 1;
		var on_complete = function(err, value, bytes_read) {
			if (err) {
				console.error(err);
				callback(err);
				return;
			}
			total_bytes_read += bytes_read;
			callback(null, value, total_bytes_read);
		}
		switch (type) {
			case 0:
				read_double(fd, value_position, on_complete);
				break;
			case 1:
				read_boolean(fd, value_position, on_complete);
				break;
			case 2:		// string
				read_flv_script_data_string(fd, value_position, on_complete);
				break;
			case 8:		// ECMA array
				read_flv_ecma_array(fd, value_position, on_complete);
				break;
			case 3:
			case 4:
			case 5:
			case 6:
			case 7:
			case 9:
			case 10:
			case 11:
			case 12:
				callback("Unimplemented script data value type: " + type);
				break;
			default:
				callback("Unknown script data value type: " + type);
				break;
		}
	});
};

var read_flv_script_data_string = function(fd, position, callback) {
	if (typeof callback !== "function") {
		callback = function() {};
	}
	fs.read(fd, buffer, 0, 2, position, function(err, bytes_read, buff) {
		if (err) {
			callback(err);
			return;
		}
		var total_bytes_read = 2;
		var length = buff.readUInt16BE(0);
		var string_position = position + 2;
		fs.read(fd, buffer, 0, length, string_position, function(err, bytes_read, buff) {
			if (err) {
				callback(err);
				return;
			}
			total_bytes_read += bytes_read;
			var string = buff.toString("utf8", 0, length);
			callback(null, string, total_bytes_read);
		});
	});
};

var read_flv_ecma_array = function(fd, position, callback) {
	if (typeof callback !== "function") {
		callback = function() {};
	}
	fs.read(fd, buffer, 0, 4, position, function(err, bytes_read, buff) {
		if (err) {
			callback(err);
			return;
		}
		var length = buff.readUInt32BE(0);
		var current_position = position + 4;
		var ret = [];
		var read_array_value = function() {
			read_flv_script_data_object_property(fd, current_position, function(err, data, bytes_read) {
				if (err) {
					callback(err);
					return;
				}
				current_position += bytes_read;
				ret.push(data);
				if (ret.length < length) {
					read_array_value();
				} else {
					read_flv_script_data_object_end(fd, current_position, function(err, bytes_read) {
						if (err) {
							callback(err);
							return;
						}
						current_position += bytes_read;
						var total_bytes_read = current_position - position;
						callback(null, ret, total_bytes_read);
					});
				}
			});
		};
		read_array_value();
	});
};

var read_flv_script_data_object_end = function(fd, position, callback) {
	if (typeof callback !== "function") {
		callback = function() {};
	}
	fs.read(fd, buffer, 0, 3, position, function(err, bytes_read, buff) {
		if (err) {
			callback(err);
			return;
		}
		callback(null, bytes_read);
	});
};

var read_flv_script_data_object_property = function(fd, position, callback) {
	if (typeof callback !== "function") {
		callback = function() {};
	}
	var current_position = position;
	read_flv_script_data_string(fd, position, function(err, name, bytes_read) {
		if (err) {
			callback(err);
			return;
		}
		current_position += bytes_read;
		read_flv_script_data_value(fd, current_position, function(err, value, bytes_read) {
			if (err) {
				callback(err);
				return;
			}
			current_position += bytes_read;
			var ret = {
				name: name,
				value: value
			};
			var total_bytes_read = current_position - position;
			callback(null, ret, total_bytes_read);
		});
	});
};

var read_double = function(fd, position, callback) {
	if (typeof callback !== "function") {
		callback = function() {};
	}
	fs.read(fd, buffer, 0, 8, position, function(err, bytes_read, buff) {
		if (err) {
			callback(err);
			return;
		}
		var value = buff.readDoubleBE(0);
		callback(null, value, 8);
	});
};

var read_boolean = function(fd, position, callback) {
	if (typeof callback !== "function") {
		callback = function() {};
	}
	fs.read(fd, buffer, 0, 1, position, function(err, bytes_read, buff) {
		if (err) {
			callback(err);
			return;
		}
		var value = buff.readUInt8(0) !== 0;
		callback(null, value, 1);
	});
};

/*
this.header.frame_type:
	1 = key frame (for AVC, a seekable frame)
	2 = inter frame (for AVC, a non-seekable frame)
	3 = disposable inter frame (H.263 only)
	4 = generated key frame (reserved for server use only)
	5 = video info/command frame

this.header.codec_id:
	2 = Sorenson H.263
	3 = Screen video
	4 = On2 VP6
	5 = On2 VP6 with alpha channel
	6 = Screen video version 2
	7 = AVC

this.header.avc_packet_type:
	0 = AVC sequence header
	1 = AVC NALU
	2 = AVC end of sequence (lower level NALU sequence ender is
	not required or supported)

this.header.composition_time:
	IF AVCPacketType == 1
		Composition time offset
	ELSE
		0
	See ISO 14496-12, 8.15.3 for an explanation of composition times.
	The offset in an FLV file is always in milliseconds.
*/
var FlvVideoTag = function(data_size){
	this.data_size = data_size;
};

FlvVideoTag.prototype.data_size = 0;

FlvVideoTag.prototype.header = null;

FlvVideoTag.prototype.body = null;

FlvVideoTag.prototype.read = function(fd, position, callback) {
	if (typeof callback !== "function") {
		callback = function() {};
	}
	var self = this;
	fs.read(fd, buffer, position, )
	this.read_flv_video_tag_header(fd, position, function(err, header, bytes_read) {
		if (err) {
			callback(err);
			return;
		}
		self.header = header;
		var current_position = position + bytes_read;
		self.read_flv_video_data(fd, current_position, function(err, data, bytes_read) {
			if (err) {
				callback(err);
				return;
			}
			current_position += bytes_read;
			var total_bytes_read = current_position - position;
			self.body = data;
			callback(null, self, total_bytes_read);
		});
	});
};

FlvVideoTag.prototype.read_flv_video_data = function(fd, position, callback) {
	this.read_flv_video_tag_body(fd, position, callback);
};

FlvVideoTag.prototype.read_flv_video_tag_body = function(fd, position, callback) {
	if (typeof callback !== "function") {
		callback = function() {};
	}
	var self = this;
	if (this.header.frame_type === 5) {	
		fs.read(fd, buffer, 0, 1, position, function(err, bytes_read, buff) {
			if (err) {
				callback(err);
				return;
			}
			// Video frame payload or frame info
			self.body = buff.readUInt8(0);
			callback(null, self.body, bytes_read);
		});
	} else {
		switch(this.header.codec_id) {
			case 7:
				
				break;
			case 2:
			case 3:
			case 4:
			case 5:
			case 6:
				fs.read(fd, );
				//callback("Unimplemented video tag codec id: " + this.header.codec_id);
				return;
			default:
				callback("Unknown video tag codec id: " + this.header.codec_id);
				return;
		}
	}
};

FlvVideoTag.prototype.read_flv_video_tag_header = function(fd, position, callback) {
	if (typeof callback !== "function") {
		callback = function() {};
	}
	var self = this;
	fs.read(fd, buffer, 0, 1, position, function(err, bytes_read, buff) {
		if (err) {
			callback(err);
			return;
		}
		var current_position = position + 1;
		var first_byte = buff.readUInt8(0);
		var frame_type = first_byte >> 4;
		var codec_id = first_byte & 0x0f;
		var header = {
			frame_type: frame_type,
			codec_id: codec_id
		};
		if (codec_id === 7) {
			fs.read(fd, buffer, 0, 4, current_position, function(err, bytes_read, buff) {
				if (err) {
					callback(err);
					return;
				}
				var current_position = position + bytes_read;
				header.avc_packet_type = buff.readUInt8(0);
				header.composition_time = read_int24_be(buff, 1);
				var total_bytes_read = current_position - position;
				self.header = header;
				callback(null, header, total_bytes_read);
			});
		} else {
			self.header = header;
			callback(null, header, bytes_read);
		}
	});
};

var read_uint24_be = function(buffer, position) {
	var ret = (buffer[position] << 16) | (buffer[position + 1] << 8) | buffer[position + 2];
	return ret;
};

var read_int24_be = function(buffer, position) {
	var value = read_uint24_be(buffer, position);
	var is_negative = value & 0x800000;
	if (!is_negative) {
		return value;
	}
	return value | 0xff000000;
}

var read_flv = function(fd) {
	var current_position = 0;
	var _read_flv_header = read_flv_header.bind(null, fd, function(err) {
		if (err) {
			console.error(err);
			return;
		}
		current_position += FLV_HEADER_LENGTH;
		_read_flv_previous_tag_size();
	});
	var _read_flv_previous_tag_size = function() {
		read_flv_previous_tag_size(fd, current_position, function(err, size) {
			if (err) {
				console.error(err);
				return;
			}
			current_position += FLV_PREVIOUS_TAG_SIZE_LENGTH;
			_read_flv_tag();
		});
	};
	var _read_flv_tag = function() {
		read_flv_tag(fd, current_position, function(err, tag, bytes_read) {
			if (err) {
				console.error(err);
				return;
			}
			current_position += bytes_read;
			_read_flv_previous_tag_size();
		});
	};
	_read_flv_header();
};