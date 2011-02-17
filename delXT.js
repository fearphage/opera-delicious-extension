const DEL_TRANS_TIMER = 10 * 60 * 1000;
const DEL_TRANS_INITIAL = 10 * 1000;//10 seconds

var DelXT = {
  
  startTransactionTimer: function() {
    opera.postError("Starting transaction timer");
    this.initialTransRetry = setTimeout(this.retryTransactions, DEL_TRANS_INITIAL);
    this.transTimer = setInterval(this.retryTransactions, DEL_TRANS_TIMER);//Periodic sync checks
  },
  
  getLastAddBookmarkStatus : function() {
    return localStorage.getItem("ReportAddBookmarkError");
  },
  
  setAddBookmarkFailed: function() {
    localStorage.setItem("ReportAddBookmarkError", "true");
    this.showAddBookmarkError();
  },
  
  showAddBookmarkError: function() {
    //chrome.browserAction.setBadgeText({text:"X"});
    //chrome.browserAction.setTitle({title:"Oops, Last bookmark was not saved to Delicious"});
    this.setBrowserAction();
  },
  
  resetAddBookmarkFailed: function() {
    localStorage.setItem("ReportAddBookmarkError", "false");
/*
    chrome.browserAction.setBadgeText({text:""});
    chrome.browserAction.setTitle({title:"Save in Delicious"});
    chrome.tabs.getSelected(null, function (tab) {
      DelXT.setBrowserActionIcon(tab);
    });
*/
	this.setBrowserAction();
//	DelXT.setBrowserActionIcon(opera.extension.tabs.getFocused());
  },
  
  setBrowserActionIcon: function(tab) {
    if(!tab) {
	opera.postError('setBrowserActionIcon - tab is null');
      return;
    }
    DeliciousAddon.LocalStorage.isBookmarked(tab.url,
      function(url) {
          var ico = "./skin/delTag.png";
          var title = "Save in Delicious";
          if(url == tab.url) {
            ico = "./skin/delTagged.png";
            title = "Edit Bookmark on Delicious";
          }
          if(localStorage.getItem("ReportAddBookmarkError") == "true") {
            DelXT.showAddBookmarkError();
            title = "Oops, Last bookmark was not saved to Delicious";
						Delicious.OperaUI.source.postMessage({id: 'set-badge-text', text: 'X'});
            //chrome.browserAction.setBadgeText({text:"X", tabId: tab.id});
          } else {
						Delicious.OperaUI.source.postMessage({id: 'set-badge-text', text: ''});
            //chrome.browserAction.setBadgeText({text:"", tabId: tab.id});
          }
          chrome.browserAction.setIcon({"path":ico,
                          tabId : tab.id});
          chrome.browserAction.setTitle({"title": title,
                                    tabId: tab.id});
          
      }
    );
  },
  
  setBrowserAction: function() {
	DelXT.setBrowserActionIcon(opera.extension.tabs.getFocused());
  },
  
  parsePostDataIntoBookmarkObject: function (postData) {
  	if(postData) {
  		var arr = postData.split("&");
  		var url = "";
  		var title = "";
  		var tags = "";
  		
  		if(arr.length > 0)
  		
  		for(var i=0; i<arr.length; i++) {
  			if(arr[i].indexOf("url=") == 0) {
  				url = decodeURIComponent(arr[i].substr(4));
  				//opera.postError(url);
  			} else if(arr[i].indexOf("title=") == 0) {
  				title = decodeURIComponent(arr[i].substr(6));
  				//opera.postError(title);
  			} else if(arr[i].indexOf("tags=") == 0) {
  				tags = decodeURIComponent(arr[i].substr(5));
  				//opera.postError(tags);
  			}
  		}
  		
  		if(url && title) {
  			return {url: url, title: title, tags: tags, hash: "", meta_hash:"", time: ""};
  		} else {
  			opera.postError("Inside parsePostDataIntoBookmarkObject: Error parsing postData.");
  			return null;
  		}
  	}
  },
  
  handleSave: function(url, postData) {
    if(!url) {
      return;
    }
    var cb = {
      onsuccess: function(id) {
        DelXT.delSave(id, this.postData);
      },
      onerror: function(r){
        opera.postError("Ooops, error adding transaction to DB");
        DelXT.delSave(null, this.postData);//Anyways post it to delicious.
      }
    }
    cb.postData = postData;
    //Add locally.
    var bo = DelXT.parsePostDataIntoBookmarkObject(postData);
    if(bo) DeliciousAddon.LocalStorage.addBookmark(bo);
    DeliciousAddon.LocalStorage.addTransaction(postData, cb);
  },
  
  delSave: function(id, postData, noui) {
    var Conn = YAHOO.util.Connect;
    /*
    //Look through all the pages in this extension to find one we can use.
		var views = chrome.extension.getViews();
		var view = null;
		
		for (var i = 0; i < views.length; i++) {
  		view = views[i];
  		
  		//If this view has the right URL and hasn't been used yet...
			if (view.location.href.indexOf("popup.html") > 0) {
				break; //we're done
  		} else {
  			view = null;
  		}
		}
*/
    var view, cb = {
      transId : id,
      success : function(event) {
        opera.postError("Inside bg:HandleSave:success");
	  		
	  		//Remove UI of last error if any
			  DelXT.resetAddBookmarkFailed();

        if(event && event.responseText=='true') {
          opera.postError("Successfully added bookmark to server");
          //opera.postError("Going to delete transaction:" + this.transId);
          DeliciousAddon.LocalStorage.deleteTransaction(this.transId, {onsuccess:function(e){}, onerror:function(e){}})
        }
var a = [], b;
for (b in event) a.push(b + ' = ' + event[b]);
opera.postError('Inside bg:HandleSave:success\n' + a.join('\n'));
        return Delicious.OperaUI.source.postMessage({
					action: 'chrome-callback-save-success'
					,data: event.responseText
				});

        if(view && view.Delicious) {
          view.Delicious.Chrome.callbackSaveSuccess(event);
        }
      },
      failure : function(event) {
        opera.postError("bg:HandleSave:error");
        if(!noui) DelXT.setAddBookmarkFailed();
        
        if(view) {
          view.window.close();
        }

      }
    };
    //opera.postError("cb.rowid:" + cb.rowId)
    Conn.asyncRequest('POST', 'http://delicious.com/chromesave',
      cb, postData);    
  },
  
  retryTransactions: function() {
    //opera.postError("Inside transaction retry");
    //check if sync is on. skip if yes
    if(syncService.isSyncing) return;
    
    var cb = {
      onsuccess: function(result) {
        if(result && result.rows) {
          var len = result.rows.length;
          for(var i=0; i<len; ++i) {
            DelXT.delSave(result.rows.item(i).id, result.rows.item(i).data, true); //dont show failed status of txns
          }
        }
      },
      onerror: function(result) {
        
      }
    };
    DeliciousAddon.LocalStorage.getAllTransactions(cb);
  }
};
