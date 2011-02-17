var ybookmarksUtils = {
  //open url in new tab
  openURLInNewTab : function (url) {
    chrome.windows.getCurrent( function( win) {
      chrome.tabs.create({windowId: win.id, url: url, selected: true}, function () {});
    });
  },
    
  getUsernameFromCookie: function (cookie) {
    if(cookie) {
      var tmp = unescape(cookie.substr(cookie.indexOf("=")+1));
      tmp = tmp.substr(0, tmp.indexOf(" "));
      return tmp;
    }
    
    return "";
  },
  
  truncateString: function (string, len) {
    if(string.length > len) {
      return string.substr(0, len) + "...";
    } else {
      return string;
    }
  },
  
  getFaviconUrl: function (url) {
    var re = new RegExp('^(?:f|ht)tp(?:s)?\://([^/]+)', 'im');
    var arr = url.match(re);
    var host = (arr) ? arr[0] : "";
    return host.toString()+"/favicon.ico"; 
  }
};