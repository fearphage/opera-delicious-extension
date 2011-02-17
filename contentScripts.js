var port = null;
try {
    port = opera.extension.connect();
} catch(e) {
    opera.postError("Oops..might be incognito mode:" + e);
}
if(!port) {
    opera.postError("Unable to connect to the extension port");
} else if(window.location && isDeliciousHost(window.location.hostname)) {
  //check for cookies if present
	if(document.cookie) {
		var cookie = getCookie("_user");
		//opera.postError(cookie);
		port.postMessage({msg: "updateCookie", cookie: cookie});
	} else {
    opera.postError("No document.cookie");
    port.postMessage({msg: "updateCookie", cookie: null});
  }
}

opera.extension.onrequest.addListener(
  function(request, sender, sendResponse) {
    if(!sender.tab) { //From XT
        if (request.id == "pageDetails") {
            sendResponse(composeBookmarkObject());
        }
    }
  }
);

function isDeliciousHost(hostname) {
    if(hostname == "delicious.com" ||
       (hostname.length >=14 && (hostname.indexOf(".delicious.com") == hostname.length-14))) {
        return true;
    }
}

function composeBookmarkObject() {
	try {
		var url = window.location.href;
		var title = document.title;
		if(!url) {
			return null;
		}
		var notes = "";
		var selection = window.getSelection();
		if(selection && selection.toString().length) {
			notes = selection.toString();
		}
    opera.postError("contentScripts::compoesBookmarkObject::"+notes);
		return {
			url: url,
			title: title,
			notes: notes
		};
	} catch(e) {
		opera.postError("contentScripts::compoesBookmarkObject::Error"+e);
	}	
}

function getCookie(cookieName) {
	try {
    var dCookie = document.cookie;
    var cookieLen = dCookie.length;
		if (cookieLen) {
				var beg = dCookie.indexOf(cookieName + "=");
				if (beg != -1) {
						var delim = dCookie.indexOf(";", beg);
						if (delim == -1) delim = cookieLen;
						return dCookie.substring(beg, delim);
				}
		}
	} catch(e) {
		opera.postError("contentScripts::getCookie::Error"+e);
	}	
	return "";
}