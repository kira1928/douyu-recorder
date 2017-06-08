import importlib
import imp
import json
import sys
import os

def import_youtube_dl():
	parent_path = os.path.dirname(__file__)
	module_path = (parent_path if parent_path else ".") + "/youtube-dl"
	module_name = "youtube_dl"
	(file, filename, data) = imp.find_module(module_name, [module_path])
	global youtube_dl
	youtube_dl = imp.load_module(module_name, file, filename, data)

import_youtube_dl()

ydl = youtube_dl.YoutubeDL({'outtmpl': '%(id)s%(ext)s'})

with ydl:
	result = ydl.extract_info(
		"http://douyu.com/288016", # LPL
		download=False
	)

if "entries" in result:
	# Can be a playlist or a list of videos
	video = result["entries"][0]
else:
	# Just a video
	video = result

video_url = video["url"]
print(video_url)
