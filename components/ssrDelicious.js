const DEL_API_HOST = "https://api.del.icio.us/";
const DEL_GET_RECENT_BKMS = DEL_API_HOST + "v1/posts/recent?count=10";
const DEL_ALL_URL = DEL_API_HOST + "v1/posts/all?";
const DEL_LAST_UPDATE = DEL_API_HOST + "v1/posts/update";
const DEL_GETBOOKMARKS_URL = DEL_API_HOST + 'v1/posts/get?';

const DEL_REQ_ABORT = 30 * 1000;//30 seconds
const DEL_UA_STRING = "crbmext";

function ssrDeliciousSingleton () {
  this._init();
}

ssrDeliciousSingleton.prototype = {
	reqAbortCount : 0,
	
  _init: function () {  
  },
	
	getLastUpdateTime: function(cb) {
		opera.postError("getLastUpdateTime..");
		var onerror = function(event) {
			 opera.postError("getLastUpdateTime::onerror");
			 cb.onerror(event);
		};
		
    var onload = function(event) {
			try {
				//opera.postError(event.target.responseText);
				var doc = event.target.responseXML;
				if(doc) {
					var nodes = doc.getElementsByTagName("update");
					 opera.postError("getLastUpdateTime nodelen:" + nodes.length);
					 var timeAttr = nodes[0].getAttribute("time");
					 opera.postError("last update time:" + timeAttr);
					 var inboxnew = nodes[0].getAttribute("inboxnew");
					 var updateTime = ssrDeliciousHelper._getTimeFromString(timeAttr);
					 var result = {};
					 result.time = updateTime;
					 result.inboxnew = inboxnew;
					 cb.onload(result);
				}
			} catch(e) {
				opera.postError("getLastUpdateTime::ONload exception:" + e);
				cb.onerror(event);
			}
    };
		this._post(DEL_LAST_UPDATE, onload, onerror);
	},
  
	getAllBookmarks: function(start, count, cb) {
		opera.postError("getAllbookmarks");
    var queryString = DEL_ALL_URL + "&results=" + count + "&start=" + start + "&meta=1";
		var onerror = function(event) {
			 cb.onerror(event);
		};
    var onload = function(event) {
			var posts = ssrDeliciousHelper._loadBookmarks( event, true );
			if ( posts ) {
				cb.onload( posts );
			}
			else {
				cb.onerror(event);
			}  
    };
    this._post(queryString, onload, onerror);
  },
	
	getBookmarkHashes: function(cb) {
		opera.postError("getBookmarkHashes");
		var queryString = DEL_ALL_URL + "&hashes";
		var onerror = function(event) {
			 cb.onerror(event);
		};
    var onload = function(event) {
			if (!ssrDeliciousHelper._isValidResponse(event, false)) {
					opera.postError("ssrDelicious::getRecentBookmarks::Invalid response from server "+ event.target.responseText);
					cb.onerror(event);
					return;
			}
			var doc = event.target.responseXML;
			if(doc) {
				if (doc.getElementsByTagName('posts').length != 1) {
					 opera.postError("Failed: Invalid \'all\' result");
					 cb.onerror(event);
					 return;
				}
				var nodes = doc.getElementsByTagName('post');
				var result = [];
				 for (var i = 0; i < nodes.length; i++) {
						var node = nodes[i];
						var hash = node.getAttribute("url");
						var metahash = node.getAttribute("meta");
						//result.push({hash: hash, metahash: metahash});
						result[hash] = metahash;
				 }
				 cb.onload(result);
			} else {
				cb.onerror(event);
			}
    };	
    this._post(queryString, onload, onerror);
	},
	
	getBookmarksFromHashes: function(downloadList, cb) {
		var queryString = DEL_GETBOOKMARKS_URL + "hashes=";
		for(var i=0, len = downloadList.length; i <len; ++i) {
			queryString += downloadList[i];
			if(i != (len-1)) {
				queryString += "+";
			}
		}
		queryString += "&meta=1";
		var onerror = function(event) {
			cb.onerror(event);
		};
		var onload = function(event) {
			var posts = ssrDeliciousHelper._loadBookmarks( event, true );
			if ( posts ) {
				cb.onload( posts );
			}
			else {
				cb.onerror(event);
			}
		};
		this._post(queryString, onload, onerror);
	},
	
  getRecentBookmarks: function( callback ) {
		try {
			var onload = function(event) {
				if (!ssrDeliciousHelper._isValidResponse(event, false)) {
					opera.postError("ssrDelicious::getRecentBookmarks::Invalid response from server");
					opera.postError("event.target.responseText:" + event.target.responseText);
					return;
				}
				var result = [];
				var doc = event.target.responseXML;
				//opera.postError(event.target.responseText);
				var posts = doc.getElementsByTagName("post");
				for(var i=0; i<posts.length; i++) {
					//opera.postError(posts[i].getAttribute("href"));
					var post = posts[i];
					if(post.hasAttribute("href") && post.hasAttribute("description")) {
						var url = post.getAttribute("href");
						if(url) {
							var title = post.getAttribute("description");
							if(!title) title = url;
							//truncate title to fit in as button
							title = ybookmarksUtils.truncateString(title, 20);
							result.push({url: url, title: title});
						}
					}
				}
				callback(result);
			};
			var onerror = function(event) {
				opera.postError("ssrDelicious::getRecentBookmarks::Error talking to server "+event.target.status);
			};
			this._post(DEL_GET_RECENT_BKMS, onload, onerror);
		} catch(e) {
			opera.postError("ssrDelicious::getRecentBookmarks::Error"+e);
		}
  },
   
  _post: function(url, onload, onerror, async) {
		try {
			var str = "";	
			var bgPage = chrome.extension.getBackgroundPage();		
			if (bgPage.DeliciousAddon.LocalStorage.getUserCookie()) {
				str = bgPage.DeliciousAddon.LocalStorage.getUserCookie();
			} else {
				opera.postError("_post: No user cookie, Not sending the request");
				return;
			}
			/* add the src parameter. */
			if (url.indexOf("?") > 0) {
			   if (url[url.length - 1] != "?") {
			      url += "&";
			   }   
			} else {
			   url += "?";
			}      
			url += "src=" + DEL_UA_STRING + XT_VERSION;
			return this._postWithContent(
				 url, "application/x-www-form-urlencoded", str, onload, onerror, async);
		} catch(e) {
			opera.postError("ssrDelicious::_post::Error"+e);
		}
  },
   
  _postWithContent: function(url, contentType, content, onload, onerror, async) {
		try {
			var req = new XMLHttpRequest();
			if(async == null) {
				 async = true;
			}
			var onLoad = function(event) {
				ssrDelicious.reqAbortCount = 0;
				onload(event);  
			}
			var onError = function(event) {
				opera.postError("xhr error for url:" + url);
				if(reqTimeOut) {
					clearTimeout(reqTimeOut);
				}
				onerror(event);
			};
			req.open('POST', url, async); 
			req.onload = onLoad;
			req.onerror = onError;
			req.setRequestHeader('Authorization', 'Basic '+ btoa("cookie:cookie"));
			req.setRequestHeader("Content-Type", contentType);
			var reqTimeOut = setTimeout(function(req) {
																		console.error("request timedout:" + url);
																		ssrDelicious.reqAbortCount++;
																		req.abort();
																		if(ssrDelicious.reqAbortCount > 3) {
																			DeliciousAddon.LocalStorage.setUserCookie("");//logout
																		}
																		onerror({target:{status: "aborted by XT"}});
																	},
																	DEL_REQ_ABORT,//30 seconds
																	req);
			req.onreadystatechange = function(event) {
				if(req.readyState == 2) {
					clearTimeout(reqTimeOut);
				}
			};
			req.send(content);
			return req;
		} catch(e) {
			opera.postError("ssrDelicious::_postWithContent::Error"+e);
		}
  }
}

var ssrDeliciousHelper = {
	_loadBookmarks: function(event, shouldGetTotal) {
    if (!ssrDeliciousHelper._isValidResponse(event, false)) {
       return false;
    }
     var doc = event.target.responseXML;
		 //opera.postError("loadBookmarks:" + event.target.responseText);
     var rootElement = doc.getElementsByTagName('posts');
     if(!rootElement || (rootElement.length == 0)) {
        return false;
     }
     var nodes = doc.getElementsByTagName('post');
     var posts = [];
     var node, data;
		 if ( shouldGetTotal ) {
       // first element is always total number of elements
       var total = doc.documentElement.getAttribute( "total" );
       posts.push( {total: total} );
     }
     for (var i = 0; i < nodes.length; i++) {
       node = nodes.item(i);
			 data = {
				  url: node.getAttribute("href"),
					title: node.getAttribute("description"),
					tags: node.getAttribute("tag"),
					hash: node.getAttribute("hash"),
					meta_hash: node.getAttribute("meta"),
					time: this._getTimeFromString(node.getAttribute("time"))
				};
       posts.push(data);
     }
     return posts;
   },
	 
  _isValidResponse: function(event, json) {
		//opera.postError("validate response:" + event.target.responseXML);
    if (event.target.status != 200) {
      return false;
    }
    if (!json) {
      try { // handle malformed XML
        var doc = event.target.responseXML;
        if (!doc || !doc.firstChild) {
           return false;
        }
        if (doc.firstChild.tagName == "error") {
           return false;
        }
      } catch (e) {
        return false;
      }
    }
    return true;
  },
	
	/**
	 * Takes a date and time string in the API format and converts it to a
	 * number format (microseconds).
	 * @param timeStr string representation of a given time, in the format
	 * YYYY-MM-DDThh:mm:ssZ.
	 * @return time in microseconds.
	 */
	_getTimeFromString: function(timeStr) {
		 var time = timeStr;
		 
		 time = time.replace(/-/g, "/");
		 time = time.replace("T", " ");
		 time = time.replace("Z", " ");
		 
		 time += "GMT"; //  times returned by the del.icio.us API are in GMT, so we must treat them as such
		 return Date.parse(time) * 1000;
	},
   
	/**
	 * Formats the given time to the date and time string required by the API.
	 * @param time time in milliseconds.
	 * @return string representation of the given time, in the format
	 * YYYY-MM-DDThh:mm:ssZ.
	 */
	_formatTime: function(time) {
		 var date = new Date();
		 var timeString;
		 var month;
		 var day;
		 var hours;
		 var minutes;
		 var seconds;
			
		 date.setTime(time);
		 month = _pad2Digits(date.getMonth() + 1);
		 day = _pad2Digits(date.getDate());
		 hours = _pad2Digits(date.getHours());
		 minutes = _pad2Digits(date.getMinutes());
		 seconds = _pad2Digits(date.getSeconds());
		 
		 timeString = 
				date.getFullYear() + "-" + month + "-" + day + "T" + hours + ":" +
				minutes + ":" + seconds + "Z";
				
		 return timeString;
	},
	
	/**
	 * Returns a string representation of a number, with a fixed length of 2.
	 * @param the number to convert to a string of size 2.
	 * @return string of size 2 padded with a zero to the left if necessary.
	 */
	_pad2Digits: function(number) {
		 var str = (number + 100) + "";
		 return str.substring(1,3);
	}
}

var ssrDelicious = new ssrDeliciousSingleton();
