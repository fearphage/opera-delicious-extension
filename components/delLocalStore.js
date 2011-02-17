if(typeof(DeliciousAddon) == "undefined") DeliciousAddon = {};

/**
 * The DB object holds database connection
 */
DeliciousAddon.DB = function () {
	
	// Setup DB parameters
	var _dbName = "deliciousBookmarks";
	var _dbVersion = "0.1";
	var _dbComment = "Delicious Addon Bookmarks Database";
	
	//connection object
	var _conn = null;
	
	var _dbConnected = false; //default
	
	//See if HTML 5 openDatabase call is available
	if(typeof(window.openDatabase) != "undefined") {
		try {
			_conn = window.openDatabase(_dbName, _dbVersion, _dbComment, 1024*1024*50);	//default db size is 50MB
			
			//check if connection is successfull
			if(typeof(_conn) == "object") {
				opera.postError("Connected to database");
				_dbConnected = true;
			} else {
				_conn = null;
				opera.postError("Unexpected return type from database API. Something wrong with the browser.")
			}
		} catch(e) {
			opera.postError("Exception thrown when tried to open the database. Most likely browser problem.");
		}
	} else {
		opera.postError("openDatabase method is not supported by the browser");
	}
	return {
		dbConnected: _dbConnected,
		executeSql: function (sql, params, cbSuccess, cbFail) {
			if(_dbConnected) {
				try {
					_conn.transaction(function(query) {
						query.executeSql(sql, params, cbSuccess, cbFail);
					});
				} catch(e) {
					opera.postError("Error executing SQL: "+e);
					if(cbFail) cbFail(null, null);
				}
			} else {
				if(cbFail) cbFail(null, null);
			}
		}
	}
}();

/**
 * ChromeBookmarks object.
 * Manages chrome bookmarks
 */
DeliciousAddon.ChromeBookmarks = function () {
	var _bookmarksFolder = "[Delicious-do_not_delete]";
	var _folderId = null;
	var _otherBookmarksId = null;
	
	//Creates new Delicious folder
	function _createDeliciousFolder(callback) {
		chrome.bookmarks.create({
			parentId: _otherBookmarksId,
			title: _bookmarksFolder
			},
			function (result) {
				opera.postError("New Delicious Folder Created");
				_folderId = result.id;
				callback(); //notify now.
			}
		);
	}
	
	//Gets exising Delicious folder, creates new one if not found
	function _setupDeliciousFolder(callback) {
		opera.postError("setupDeliciousFolder");
/*
		chrome.bookmarks.getTree(function(results) {
			if(results[0] && results[0].children.length > 0) results = results[0].children;
			//assume second folder as parent doesnt matter to check it title. as we know it will always be "other bookmarks"
			if(results.length > 0 && results[1] && !results[1].url) {
				_otherBookmarksId = results[1].id;
				chrome.bookmarks.getChildren(_otherBookmarksId, function(results) {
					if(results.length > 0) {
						for(var j=0, ln=results.length; j<ln; j++) {
							var node = results[j];
							if(node.title == _bookmarksFolder) {	//Del folder found
								_folderId = node.id;
								callback();
								opera.postError("Existing Delicious Folder Found");
								break;
							}
						}
					}
					
					// Del folder not found. create new.
					if(!_folderId) {
						_createDeliciousFolder(callback);
					}
				});
			}
		});
		*/
	}
	
	//setup folder on first execution
	_setupDeliciousFolder(function() {});
	
	return {
		//remove all the bookmarks
		deleteAll: function (callback) {
			if(_folderId) {
				chrome.bookmarks.removeTree(_folderId, function () {
					_createDeliciousFolder(callback);
				});
			} else {
				_setupDeliciousFolder(callback);
			}
		},
		
		//add new bookmark
		add: function(url, title) {
			if(_folderId) {	//looks like folder is there
				chrome.bookmarks.create({
						parentId: _folderId,
						url: url,
						title: title
					},
					function() {}
				);
			} else {	//no folder found. setup first
				_setupDeliciousFolder(function () {
					chrome.bookmarks.create({
							parentId: _folderId,
							url: url,
							title: title
						},
						function() {}
					);
				});
			}
		},
		
		//delete a bookmark
		remove: function(url) {
			if(_folderId) {
				//delete from bookmarks
				chrome.bookmarks.getChildren(_folderId, function (results) { 
					var found = false;
					var bk = null;
					if(results.length > 0) {
						for(var i=0, len=results.length; i<len; i++) {
							if(results[i].url == url) {
								found = true;
								bk = results[i];
								break;
							}
						}
						if(found) {
							chrome.bookmarks.remove(bk.id, function () {});
						} else {
							opera.postError("Bookmark not found in Chrome bookmarks.");
						}
					}
				});
			} //dont do anything if folder is not setup
		}
	}
}();

DeliciousAddon.LocalStorage = function () {
	var _lastUpdateTime = "ybLastUpdateTime";
	
	// Create bookmarks table table
	DeliciousAddon.DB.executeSql(
		'CREATE TABLE IF NOT EXISTS bookmarks(id INTEGER PRIMARY KEY AUTOINCREMENT,'+
		'name NOT NULL DEFAULT "" COLLATE NOCASE,' + 
		'url NOT NULL DEFAULT "" UNIQUE,' +
		'tags NOT NULL DEFAULT "",' +
		'hash NOT NULL DEFAULT "",' +
		'meta_hash NOT NULL DEFAULT "",' +
		'last_modified UNSIGNED NOT NULL DEFAULT 0)',
		[],
		function(transaction, result) {
				//opera.postError(result);
		},
		function(transaction, error) {
				opera.postError(error);
		}
	);
		
	// Create transactions table
	DeliciousAddon.DB.executeSql(
		'CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT,'+
		'data NOT NULL DEFAULT "")',
		[],
		function(transaction, result) {
				//opera.postError(result);
		},
		function(transaction, error) {
				opera.postError(error);
		}
	);


	return {
		addBookmark: function (bookmarkObject) {
			try {
				//add bookmark to DB
				DeliciousAddon.DB.executeSql(
					'REPLACE INTO bookmarks(name, url, tags, hash, meta_hash, last_modified) VALUES (?, ?, ?, ?, ?, ?)',
					[bookmarkObject.title, bookmarkObject.url, bookmarkObject.tags, bookmarkObject.hash, bookmarkObject.meta_hash, bookmarkObject.time],
					function(transaction, result) {
							//opera.postError("In AddBookmark, success:" + result);
					},
					function(transaction, error) {
							opera.postError("In AddBookmark()Error:" + error);
					}
				);
				
				//add to chrome as well.
				DeliciousAddon.ChromeBookmarks.add(bookmarkObject.url, bookmarkObject.title);	//async call but wont bother if fails
			} catch(e) {
				opera.postError("LocalStorage::addBookmark::Error"+e+"\nURL:"+bookmarkObject.url);
			}
		},
		
		deleteBookmark: function (url) {
			try {
				
				//remove bookmark from DB
				DeliciousAddon.DB.executeSql(
					'DELETE FROM bookmarks WHERE url=?',
					[url],
					function(transaction, result) {
					},
					function(transaction, error) {
							opera.postError("Error removing the bookmark from database.");
					}
				);
				
				//remove from Chrome bookmarks
				DeliciousAddon.ChromeBookmarks.remove(url); //async call dont bother if fails
			} catch(e) {
				opera.postError("LocalStorage::deleteBookmark::Error"+e);
			}
		},
		
		deleteBookmarkFromHash:function(hash) {
			try {
				DeliciousAddon.DB.executeSql(
					'SELECT url FROM bookmarks WHERE hash=?',
					[hash],
					function(transaction, result) {
						if(result.rows.length) {
							DeliciousAddon.LocalStorage.deleteBookmark(result.rows.item(0).url);
						}
					},
					function(transaction, error) {
							opera.postError("Failed deleteBookmarkFromHash.");
					}
				);
			} catch(e) {
				opera.postError("LocalStorage::deleteBookmarkFromHash::Error"+e);
			}
		},
		
		clearLocalStorage: function () {
			try {
				DeliciousAddon.LocalStorage.setLastUpdateTime("");
				DeliciousAddon.LocalStorage.clearDatabase();
				DeliciousAddon.ChromeBookmarks.deleteAll(function () {});
			} catch(e) {
				opera.postError("LocalStorage::clearLocalStorage::Error"+e);
			}
		},
	
		clearDatabase: function () {
			//clear bookmarks
			DeliciousAddon.DB.executeSql(
				'DELETE FROM bookmarks',
				[],
				function(transaction, result) {
						//opera.postError(result);
				},
				function(transaction, error) {
						opera.postError(error);
				}
			);
		
			//delete all transactions as well
			DeliciousAddon.DB.executeSql(
				'DELETE FROM transactions',
				[],
				function(transaction, result) {
						//opera.postError(result);
				},
				function(transaction, error) {
						opera.postError(error);
				}
			);
		},
		
		isBookmarked: function(url, callback) {
			try {
				DeliciousAddon.DB.executeSql(
					'SELECT url FROM bookmarks WHERE url=?',
					[url],
					function(transaction, result) {
						 var resRows = result.rows;
						 if(resRows && resRows.length && resRows.item(0).url) {
							callback(result.rows.item(0).url);
						 } else {
							callback(null);
						 }
					},
					function(transaction, error) {
							opera.postError(error);
							callback(null);
					}
				);
			} catch(e) {
				opera.postError("LocalStorage::isBookmarked:" + e);
			}
		},
		
		getBookmark: function (url, callback) {
			try {
				DeliciousAddon.DB.executeSql(
					'SELECT * FROM bookmarks WHERE url=?',
					[url],
					function(transaction, result) {
						 //opera.postError(result.rows);
						 callback();
					},
					function(transaction, error) {
							opera.postError(error);
					}
				);
			} catch(e) {
				opera.postError("LocalStorage::isBookmarked::Error"+e);
			}
		},
		
		getLastUpdateTime: function() {
			if(localStorage) {
				return localStorage.getItem(_lastUpdateTime);  
			}
		},
		
		setLastUpdateTime: function(lastUpdateTime) {
			if(localStorage) {
				localStorage.setItem(_lastUpdateTime, lastUpdateTime);  
			}
		},
		
		getHashPairArray: function(result) {
			var resArray = [];
			var len = result.rows.length;
			//opera.postError("getHashPairArray len:" + len);
			for(var i = 0; i < len; ++i) {
				resArray[result.rows.item(i).hash] = result.rows.item(i).meta_hash;
			}
			return resArray;
		},
		
		getBookmarkHashes: function(callback) {
			try {
				DeliciousAddon.DB.executeSql(
					'SELECT hash, meta_hash FROM bookmarks',
					[],
					function(transaction, result) {
						 opera.postError("In getBookmarkHashes, length:" + result.rows.length);
						 callback(DeliciousAddon.LocalStorage.getHashPairArray(result));
					},
					function(transaction, error) {
							opera.postError(error);
					}
				);
			} catch(e) {
				opera.postError("Exception in getBookmarkHashes():" + e);
			}
		},
		
		getUserCookie: function () {
			if(localStorage) {
				return localStorage.getItem("DelUserCookie");
			}
			return null;
		},
		
		setUserCookie: function (newVal) {
			if(localStorage) {
				localStorage.setItem("DelUserCookie", newVal);
			}
		},
		
		getExtensionVersion: function() {
			if(localStorage) {
				return localStorage.getItem("ExtensionVersion");
			}
		},
		
		setExtensionVersion: function(version) {
			if(localStorage) {
				localStorage.setItem("ExtensionVersion", version);
			}
		},
		
		
		getPrefSyncEnabled: function () {
			if(localStorage) {
				return localStorage.getItem("SyncEnabled");
			}
			
			return null;
		},
		
		setPrefSyncEnabled: function (newVal) {
			if(localStorage) {
				localStorage.setItem("SyncEnabled", newVal);
			}
		},
		
		//returns the rowID in callback.onsuccess
		addTransaction: function (data, cb) {
			DeliciousAddon.DB.executeSql(
				'INSERT INTO transactions(data) VALUES (?)',
				[data],
				function(transaction, result) {
						//opera.postError("In addTransaction, successful.");
						//opera.postError(result);
						//console("addtrans id:" + result.rows.item(0).id);
						if(result && result.insertId) {
							cb.onsuccess(result.insertId);
						} else {
							cb.onerror(result);
						}
				},
				function(transaction, error) {
						opera.postError("In addTransaction Error");
						opera.postError(error);
						cb.onerror(error);
				}
			);
		},
		
		editTransaction: function (id, data, cb) {
			DeliciousAddon.DB.executeSql(
				'UPDATE transactions SET data=? WHERE id=?',
				[data, id],
				function(transaction, result) {
						//opera.postError("In editTransaction, success:" + result);
						cb.onsuccess(result);
				},
				function(transaction, error) {
						opera.postError("In editTransaction Error");
						opera.postError(error);
						if(cb.onerror)  cb.onerror(error);
				}
			);
		},
		
		deleteTransaction: function (id, cb) {
			DeliciousAddon.DB.executeSql(
				'DELETE FROM transactions WHERE id=?',
				[id],
				function(transaction, result) {
						//opera.postError("In deleteTransaction, success:" + result);
						cb.onsuccess(result);
				},
				function(transaction, error) {
						opera.postError("In deleteTransaction Error");
						opera.postError(error);
						if(cb.onerror) cb.onerror(error);
				}
			);
		},
		
		getAllTransactions: function (cb) {
			DeliciousAddon.DB.executeSql(
				'SELECT * FROM transactions',
				[],
				function(transaction, result) {
					 //opera.postError(result);
					 cb.onsuccess(result);
				},
				function(transaction, error) {
						opera.postError(error);
						if(cb.onerror) cb.onerror(error);
				}
			);
		}
	}	//end of return
}();
