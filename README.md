# douyu-recorder

本项目的用途是在`CentOS`服务器端自动录制特定斗鱼直播间的视频，以供下班回家后享用=w=

本项目预计将会有一个网页版UI

进展方面，各个步骤手动操作下来都可行，接下来需要做的是把这些组合成一个自动的服务器程序。总的来说项目完成还是希望很大滴=w=


# memo

一、环境配置

本文部分参考了 https://gist.github.com/textarcana/5855427

1. `sudo yum -y install firefox Xvfb libXfont Xorg java python`
2. `sudo yum -y groupinstall "X Window System" "Desktop" "Fonts" "General Purpose Desktop"` (installation takes a few minutes)
3. Launch an XWindows Virtual Frame Buffer(XVFB) session on display port 99: `Xvfb :99 -ac -screen 0 1280x1024x24 &`
4. Tell all XWindows applications in this terminal session to use the new Xvfb display port: `export DISPLAY=:99`
5. Download Selenium server: `wget http://selenium-release.storage.googleapis.com/2.53/selenium-server-standalone-2.53.1.jar`
6. Start the Selenium server, eg: `java -jar ./selenium-server-standalone-2.53.1.jar &`
7. Download flash plugin for linux: `wget http://linuxdownload.adobe.com/adobe-release/adobe-release-x86_64-1.0-1.noarch.rpm`
8. Add flash plugin repo: `yum localinstall adobe-release-x86_64-1.0-1.noarch.rpm`
9. Install flash plugin: `sudo yum install flash-plugin`

二、开启HTTP代理

待完善。

三、执行selenium访问斗鱼页面，让HTTP代理得到想要的房间的直播下载地址
```
from selenium import webdriver

# http://stackoverflow.com/a/17093125
PROXY = "localhost:9001"

webdriver.DesiredCapabilities.FIREFOX['proxy'] = {
    "httpProxy":PROXY,
    "ftpProxy":PROXY,
    "sslProxy":PROXY,
    "noProxy":None,
    "proxyType":"MANUAL",
    "class":"org.openqa.selenium.Proxy",
    "autodetect":False
}

# you have to use remote, otherwise you'll have to code it yourself in python to 
driver = webdriver.Remote("http://localhost:4444/wd/hub", webdriver.DesiredCapabilities.FIREFOX)

driver = webdriver.Firefox()
driver.get("http://www.douyu.com/633019")
driver.close()

```
