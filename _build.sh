#!/bin/sh
rm delicious.oex > /dev/null
zip -r delicious.oex . -x background.html *-chrome.* *Copy.* *.json *.sh *.cmd *-chromeLib.*

