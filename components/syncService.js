const DEL_CHUNK_SIZE = 200;
const DEL_SYNC_WAIT = 2 * 1000;//between chunks 2 seconds is fine.
const DEL_PERIODIC_SYNC_INTERVAL = 10 * 60 * 1000;//10 minutes for now
const DEL_INITIAL_SYNC = 10 * 1000;

function syncServiceSingleton () {
  this.init();
}

syncServiceSingleton.prototype = {
  isSyncing: false,
  syncTimer: null,
  retryCount: 0,
  initialSyncTimerId: null,
  periodicSyncTimerId: null,
  
  init: function () {
    if(this.isSyncEnabled()) {
      opera.postError("Sync is enabled, starting the timers.")
      this.schedulePeriodicSync();
    } else {
      opera.postError("Sync is disabled.")
    }
  },
  
  schedulePeriodicSync: function () {
    this.initialSyncTimerId = setTimeout(this.periodicSync, DEL_INITIAL_SYNC);//Initial sync after 15 sec
    this.periodicSyncTimerId = setInterval(this.periodicSync, DEL_PERIODIC_SYNC_INTERVAL);//Periodic sync checks
  },
  
  _compareBookmarkHashes: function(localHashList, remoteHashList) {
   var result = [];
   var deleteList = [];
   var downloadList = [];
   var localMatch;
   for (var remoteUrlHash in remoteHashList) {
     localMatch = localHashList[remoteUrlHash];
     if (localMatch) {
       if (remoteHashList[remoteUrlHash] != localMatch) {
         //opera.postError("Bookmark was edited => download " + remoteUrlHash);
         downloadList.push(remoteUrlHash);
       }
       localHashList[remoteUrlHash] = null;
     }
     else {
       //opera.postError("New bookmark was added to the remote => download " + remoteUrlHash);      
       downloadList.push(remoteUrlHash);
     }
   }  

   for (var localUrlHash in localHashList) {
     if (localHashList[localUrlHash] != null) {
       //remove from the list
       //opera.postError("Delete local bookmark ---> " + localUrlHash);      
       deleteList.push(localUrlHash);
     }
   }
   result["deleteList"] = deleteList;
   result["downloadList"] = downloadList;   
   return result;
  },

  _delete_diff: function(deleteList) {
    opera.postError("_delete_diff()::deleting bookmarks, len:" + deleteList.length);
    for(var i=0, len = deleteList.length; i<len; ++i) {
      DeliciousAddon.LocalStorage.deleteBookmarkFromHash(deleteList[i]);
    }
  },
  
  _download_diff: function(downloadList, lastUpdateTime) {
    var len = downloadList.length;
    if(len > 0) {
      opera.postError("_download_diff()::download len:" + len);
      var cb = {
        onload:  function(posts) {
          syncService.updateStore(posts);
          DeliciousAddon.LocalStorage.setLastUpdateTime(lastUpdateTime);
        },
        onerror: function(event) {
          opera.postError("_download_diff()::onerror Unable to download bookmarks from hashes:" +
                    (event ? (event.target ? event.target.status : "" ) : "") );
        }
      };
      ssrDelicious.getBookmarksFromHashes(downloadList, cb);
    } else {
      opera.postError("_download_diff()::Nothing to download...")
    }
  },

  syncPartially: function(lastUpdateTime) {
    //Get all bookmark hashes
    var cb ={
      onload: function(result) {
        if(result) {
          function cb(localHashArray) {
            var lists = syncService._compareBookmarkHashes(localHashArray, result);
            //delete local bookmarks
            var deleteList = lists["deleteList"];
            if (deleteList.length > 0 ) {
               syncService._delete_diff(deleteList);
            }
            //download remote bookmarks
            var downloadList = lists["downloadList"];        
            //more than 100 bookmarks, we do a full sync instead
            if (downloadList.length > 100) {
               opera.postError(" Going for full sync, downloadList.length is a big number: " + downloadList.length);
               syncService.syncNow();
            } else {
               opera.postError(" Going for a partial sync, downloadList.length is : " + downloadList.length);
               syncService._download_diff (downloadList, lastUpdateTime);               
            }
          };
          DeliciousAddon.LocalStorage.getBookmarkHashes(cb);
        }
      },
      onerror: function(event) {
        opera.postError("syncPartially()::onerror:" +
                    (event ? (event.target ? event.target.status : "" ) : "") );
      }
    }
    ssrDelicious.getBookmarkHashes(cb);
  },
  
  periodicSync: function() {
    //Check for lastupdatetime change and start a periodic sync
    opera.postError("Oh yeah, timer called periodic sync");
    if(syncService.isSyncing) {
      opera.postError("Currently syncing.. skipping periodic sync");
      return;
    } else if(!DeliciousAddon.LocalStorage.getUserCookie()) {
      opera.postError("periodicSync()::No cookiee.. No Sync");
      return;
    }
    if(!syncService.isSyncEnabled()) {
      opera.postError("periodicSync attempt cancelled, disabled via prefs.");
      return;
    }
    var cb ={
      onload: function(result) {
        var localLastUpdateTime = DeliciousAddon.LocalStorage.getLastUpdateTime();
        //opera.postError("Reading last update time from localstore:" + localLastUpdateTime);
        var serverLUT = result ? result.time : null;
        opera.postError("llu:" + localLastUpdateTime + " dlu:" + serverLUT);
        if(serverLUT && (serverLUT != localLastUpdateTime)) {
          opera.postError("Need a partial sync..");          
          syncService.syncPartially(serverLUT);
        }
      },
      onerror: function(event) {
        opera.postError("periodicSync::onerror:" +
                    (event ? (event.target ? event.target.status : "" ) : "") );
      }
    }
    ssrDelicious.getLastUpdateTime(cb);
  },
  
  isSyncEnabled: function() {
    if(DeliciousAddon.LocalStorage.getPrefSyncEnabled() == "true") {
      return true;
    }
    return false;
  },
  
  syncNow : function (callback) {
    opera.postError("syncNow():: Full Sync Invoked");
    if(!syncService.isSyncEnabled()) {
      opera.postError("Sync cancelled, disabled via prefs.");
      return;
    }
    this.cancelSync();//Cancel if any attempt is running.
    syncService.isSyncing = true;
    DeliciousAddon.LocalStorage.setLastUpdateTime("-1");
    var cb ={
      onload: function(result) {
        syncService._getChunk(0, result.time, callback);
      },
      onerror: function(event) {
        opera.postError("syncNow::getLastUpdateTime::onerror->" +
                    (event ? (event.target ? event.target.status : "" ) : "") );
      }
    }
    ssrDelicious.getLastUpdateTime(cb);
  },
  
  _getChunk : function (start, lastUpdateTime) {
    opera.postError("Get Chunk starting from " + start);
    if(!DeliciousAddon.LocalStorage.getUserCookie()) {
      opera.postError("_getChunk()::No cookiee.. No Sync");
      syncService.isSyncing = false;
      return;
    }
    var cb = {
      startTime : (new Date()).getTime(),
      onload: function (posts) {
        syncService.updateStore(posts);
        syncService.retryCount = 0;//reset error count, it is working now :)
        if((posts.length-1) == DEL_CHUNK_SIZE) {
          var elapsedTime = (new Date()).getTime() - this.startTime;
          syncService.syncTimer = setTimeout(syncService._getChunk, DEL_SYNC_WAIT - elapsedTime, start+DEL_CHUNK_SIZE, lastUpdateTime);
        } else { //done
          syncService.isSyncing = false;
          opera.postError("_getChunk() Full sync completed");
          //Store last update time after sync
          DeliciousAddon.LocalStorage.setLastUpdateTime(lastUpdateTime);
        }
      },
      onerror: function(event) {
        opera.postError("_getChunk() Error::onerror->" +
                    (event ? (event.target ? event.target.status : "" ) : "") );
        //retry the same chunk 3 times
        if(syncService.retryCount <= 3) {
          syncService.retryCount++;
          syncService.syncTimer = setTimeout(syncService._getChunk, DEL_SYNC_WAIT, start, lastUpdateTime, callback);
          opera.postError("Retrying for the same chunk. Retry "+syncService.retryCount);
        }
        else {
          opera.postError("Too many sync errors. canceling sync.");
          syncService.isSyncing = false;
          syncService.cancelSync();
        }
      }
    };
    
    ssrDelicious.getAllBookmarks(start, DEL_CHUNK_SIZE, cb);
  },
  
  //Cancel the full sync.
  cancelSync : function() {
    clearTimeout(syncService.syncTimer);
  },
  
  //Stop periodic sync
  stopPeriodicSync: function() {
    if(syncService.initialSyncTimerId) {//initial sync on start
      clearTimeout(syncService.initialSyncTimerId);
    }
    if(syncService.periodicSyncTimerId) {
      clearInterval(syncService.periodicSyncTimerId);
    }
  },
  
  //Add bookmarks to the local store(db and chrome bookmarks)
  updateStore : function (bookmarks) {
    opera.postError("Updating store");
    if(!bookmarks) return;
    try {
      if(bookmarks.length > 0) {
        for(var i=0, len=bookmarks.length; i<len; i++) {
          if(bookmarks[i].url) {
            //opera.postError("updateStore:: addbookmark->" + bookmarks[i].url);
            DeliciousAddon.LocalStorage.addBookmark(bookmarks[i]);
          }
        }
      }
    } catch(e) {
      opera.postError("Exception in updateStore:" + e);
    }
  }
}

var syncService = new syncServiceSingleton();