function _(obj) {
	var array = []
 for (var key in obj) {
   array.push(key + ' = ' + obj[key]);
 }
 return array;
}
/**
 * YUI Libs
 */
var Dom = YAHOO.util.Dom;
var Evt = YAHOO.util.Event;
var Conn = YAHOO.util.Connect
var AutoComplete  = YAHOO.widget.AutoComplete;

const DEL_UA_STRING = "crbmext";
const XT_VERSION = "0.998";	//other two places: manifest, background.html

/**
 * Root Delicious namespace object
 */
if (typeof(window.Delicious)=='undefined') Delicious = {};
Delicious = function() {

    return {

        // TODO: Switch this on a query string / hostname basis.
        DEBUG: true,
		isChromeExt: false,

        /**
         * Initialize elements on the page
         */
        init: function() {

            // Send any YUI log messages to the browser console (ie. or Firebug)
            if (!YAHOO.env.ua.ie) {
                YAHOO.widget.Logger.enableBrowserConsole();
            }
            
            // If the body has a class of 'debug', turn on debugging.
            if (typeof DELICIOUS_DEBUG != 'undefined' && DELICIOUS_DEBUG == true) {
                YAHOO.log("DEBUG MODE ON");
                this.DEBUG = true;
            }

            // Catchall block for things to be done upon page load.
            Evt.on(window, 'load', function() {
                // Inject a logging div, if needed.
                if (this.DEBUG && !this.log_reader) {
                    if (!Dom.get(this.LOG_ID)) {
                        var divEl = DIV({'class': 'yui-skin-sam'});                        
                        divEl.appendChild(DIV({'id': this.LOG_ID}));                        
                        document.body.appendChild(divEl);
                    }
                    this.log_reader = new YAHOO.widget.LogReader(this.LOG_ID);
                    this.log_reader.collapse();
                }

                this.log = Delicious.getLogger("Global");
                this.log("init");

            }, this, true);
        },

        /**
         * Provide a common way to handle logging in context
         */
        LOG_ID: "yui_log",
        getLogger: function(cat) {
          if (Delicious.DEBUG == true) {
            return function(msg, lvl) {
                YAHOO.log(msg, (lvl || "debug"), "del:"+cat);
            }.bind(this);
          }
          else {
            return function(msg, lvl) {
            }.bind(this);
          }
        },

        EOF : null
    };
}();
Delicious.init();


/**
 ** Simple Configuration setting, storage and retrieval
 */
Delicious.Config = function() {
    _data = {};
    return {
        set: function(key, value) {
            if (key)
                _data[key] = value;
        },
        get: function(key) {
            if (_data[key]) return _data[key];
            else return undefined;
        }, 
        EOF: null
    };
}();







if(!YAHOO.ULT){YAHOO.ULT={};}
YAHOO.ULT.BEACON="http://us.brd.yahoo.com/t";
YAHOO.ULT.DOMAIN=".delicious.com";
YAHOO.ULT.CONF={cleanest:1};

Delicious.PageBeacon = function() {

    return {

        beaconSRC: false,

        init: function(beaconSRC) {
            // bail if there's no string here
            if (!beaconSRC) return;
            // store src in object for reference later
            this.beaconSRC = beaconSRC;
            // add eventListener so we launch this thing once everything else is done
            Evt.on(window, 'load', this.wireUpBeacon, this, true);
        },

        wireUpBeacon: function() {
            var parent = Dom.get('beacon');
            var beacon = document.createElement('img');
            beacon.alt = '';
            beacon.src = this.beaconSRC;
            if (parent)
                parent.appendChild(beacon);
        },

        EOF: null
    };
}();





/**
 * A small collection of handy DOM manipulation utilities
 */
Delicious.DOM = function() {

    return {

        /**
         * Given a DOM node, scrape out the text from it and all its children.
         */
        scrapeText: function(node) {
            if (!node) return '';
            if (1 == node.nodeType) {
                var out = '';
                var cn = node.childNodes;
                for (var i=0,child; child=cn[i]; i++)
                    out += this.scrapeText(child);
                return out;
            } else {
                return node.nodeValue;
            }
        },

        escapeHTML: function (str) {
            return (''+str).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        },

        // See: http://simon.incutio.com/archive/2003/06/15/javascriptWithXML
        createElement: function(el) {
            var self = arguments.callee;
            if (!self.createElement) {
                if (typeof document.createElementNS != 'undefined') {
                    self.createElement = function(el) { return document.createElementNS('http://www.w3.org/1999/xhtml', el); };
                }
                if (typeof document.createElement != 'undefined') {
                    self.createElement = function(el) { return document.createElement(el); };
                }
            }
            return self.createElement(el);
        },

        replaceChildNodes: function(parent, nodes) {
            while(parent.firstChild)
                parent.removeChild(parent.firstChild);
            return this.appendChildNodes(parent, nodes);
        },
        appendChildNodes: function(parent, nodes) {
            for (var i=0; i<nodes.length; i++) {
                var node = nodes[i];
                if (node.nodeType)
                    parent.appendChild(node);
                else if ( (typeof(node) == 'object') && node.length)
                    this.appendChildNodes(parent, node);
                else
                    parent.appendChild(document.createTextNode(''+node));
            }
        },

        /**
         * @fn createDOM(name, attributes, child_nodes)
         */
        createDOM: function(name, attrs, nodes) {
            var elem = null;

            if (YAHOO.env.ua.ie && attrs['name']) {

                // IE hates setting names and making radio buttons via DOM
                // See: http://cf-bill.blogspot.com/2006/03/another-ie-gotcha-dynamiclly-created.html
                // See: http://msdn.microsoft.com/workshop/author/dhtml/reference/properties/name_2.asp
                var tag = '<'+this.escapeHTML(name);
                if (attrs) for (k in attrs) {
                    if (YAHOO.lang.hasOwnProperty(attrs, k) && attrs[k]!==null) {
                        tag += ' '+k+'="'+this.escapeHTML(attrs[k])+'"';
                    }
                }
                tag += ' />';
                elem = document.createElement(tag);

            } else {

                // If no other hack created an element, create one in the usual way.
                elem = this.createElement(name);

                // Update the element with attributes
                if (attrs) for (k in attrs) {
                    if (YAHOO.lang.hasOwnProperty(attrs, k) && attrs[k]!==null) {
                        var v = attrs[k];
                        elem.setAttribute(k, v);
                        if (YAHOO.env.ua.ie && k=='class') {
                            elem.className = v;
                        }
                    }
                }

            }
            if (nodes) this.appendChildNodes(elem, nodes);
            return elem;
        },

        createDOMFunc: function(name) {
            return function(attrs) {
                var nodes = [];
                for (var i=1; i<arguments.length; i++)
                    nodes[nodes.length] = arguments[i];
                return this.createDOM(name, attrs, nodes);
            }.bind(this);
        }

    }

}();

// Generate some shortcut functions for the DOM builder.
forEach([
    'A', 'BUTTON', 'BR', 'CANVAS', 'DIV', 'EMBED', 'FIELDSET', 'FORM', 'H1', 'H2', 'H3',
    'H4', 'H5', 'H6', 'HR', 'IMG', 'INPUT', 'LABEL', 'LEGEND', 'LI', 'OBJECT', 'OL',
    'OPTGROUP', 'OPTION', 'P', 'PARAM', 'PRE', 'SELECT', 'SPAN', 'STRONG', 'EM', 'TABLE',
    'TBODY', 'TD', 'TEXTAREA', 'TFOOT', 'TH', 'THEAD', 'TR', 'TT', 'UL'
], function(n) { window[n] = Delicious.DOM.createDOMFunc(n); });
window.EL = Delicious.DOM.createDOM.bind(Delicious.DOM);






/**
 * At the moment, all this does is handle cookies
 */
Delicious.util = function() {

    return {

        cookies: [],

        init: function() {
            // parse cookies
            this.parseCookies();
        },

        /********************
         ** COOKIE METHODS **
         ********************/
        addCookie: function(name, value, expires) {
            if (expires == 'perm') {
                var _nextYear = new Date();
                _nextYear.setFullYear(_nextYear.getFullYear() +1);
                var expDate = _nextYear.toGMTString();
            } else {
                var expDate = false;
            };
            var _cookieString = name + '=' + value + ';path=/';

            if (expDate != false) {
                _cookieString += ';expires=' + expDate;
            };
            
            // Bug 3133136. Delete old cookie from delicous.com domain
            //Delicious.util.removeCookie(name, 'delicious.com');
            
            document.cookie = _cookieString;
        },

        removeCookie: function(name, domain) {
            if (!domain) {
                domain = 'delicious.com';
            }
            document.cookie = name + '=removed; expires=Thu, 01-Jan-1970 00:00:01 GMT; domain=' + domain;
        },

        getCookie: function(name) {
          return this.cookies[name];
        },

        parseCookies: function() {
          for (var cur = 0; cur < document.cookie.length; )
          {
            var name = '';
            var value = '';

            var delim = document.cookie.indexOf('=', cur);
            var marker = document.cookie.indexOf(';', cur);

            if (marker == -1)
              marker = document.cookie.length;

            if ((delim > marker) || (delim == -1)) {
              name = document.cookie.substring(cur, marker);
            } else {
              name = document.cookie.substring(cur, delim);
              value = document.cookie.substring(delim + 1, marker);
            };

            this.cookies[name] = unescape(value);
            cur = marker + 2;
          }
        },

        /********************
         ** REMOVE LINKS   **
         ********************/
        /*
         * @fn: removeAjaxLinks(links)
         * @description: this prepends "javascript: return false;" statement
         *               to the beginning of each link, to prevent it from
         *               firing on JS-enabled sites. this is really a fallback
         *               method and is only necessary the odd time something
         *               goes wrong with the normal method for supressing links
         */
        removeAjaxLinks: function(links) {
            // if node
            if (links && (links.nodeType && links.nodeName.toLowerCase()=='a')) {
                this.removeThisAjaxLink(links);
            };
            // if String (eg: ID)
            if (YAHOO.lang.isString(links) || !links) {
                link = document.getElementByID(links);
                this.removeThisAjaxLink(link);
            };
            // if array of links
            if (links.length !== undefined) {
                for (var i=0; i<links.length; i++) {
                    this.removeThisAjaxLink(links[i]);
                };
            };
        },

        removeThisAjaxLink: function(link) {
            // make sure we have something to work with
            if (!link || link.nodeName.toLowerCase()!='a') return;
            // replace link with empty return
            if (link.href!='') {
                link.href = 'javascript:return false; '+ link.href;
            };
        },

        EOF:null
    };
}();
Delicious.util.init();





/* USED to Initialize any common UI requirements */
/* this goes here instead of in del-ui.js because it is shared with the popup */
Delicious.Display = function() {

    return {
        init: function() {
            this.wireUpFrameBusting();
            this.wireUpJSEnable();
        },

        // security feature -- no buttons are displayed by default,
        // they must be enabled here in order to work
        wireUpFrameBusting: function() {
            // check to see if we're the top frame
            try {
                if (top.location.hostname != self.location.hostname) {
                    throw 1;
                };
                // we're fine, enable buttons
                Dom.addClass('doc', 'enableButtons');
                Dom.addClass('doc3', 'enableButtons');
            } catch (e) {
               // possible clickjack attack, leave content hidden
            };
        },

        // some CSS needs to know if JS is enabled or not
        wireUpJSEnable: function() {
            // add class 'jsEnabled' to the 'doc3' element
            Dom.addClass('doc', 'jsEnabled');
            Dom.addClass('doc3', 'jsEnabled');
        },

        EOF: null
    };
}();






/**
 * UI code for Common module pages.
 * @class Delicious.Common
 */
Delicious.Common = function() { 

    return {
    
        // Valid bookmark list styles with UI selection hooks
        bookmark_list_styles: [ 'full', 'list', 'grid' ],

        /**
         * @fn init()
         * Initialize elements on the page
         */
        init: function() {
            // Wire up the tag scope nav menu.
            // Evt.onContentReady("tagscopenav", this.wireUpTagScopeNav, this, true);
            
            Evt.onContentReady("siteNotice", this.wireUpSiteNotification, this, true);

            // Catchall block for things to be done upon page load.
            Evt.on(window, 'load', function() {
                
                // Wire up the View actuator (switching views)
                this.wireUpViewSort();

                // Wire up the items per page actuator
                this.wireUpItemsPerPage();

                // Wire up bookmarks shown
                this.wireUpBookmarksShown();

                // Last ditch effort to init tags for autocomplete.
                //if (!Delicious.MagicTags.data_source.data.length)
                //    Delicious.MagicTags.initTags();
                
            }, this, true);

            // Wire up unload event for final cleanup.
            Evt.on(window, 'unload', this.destroy, this, true);
        },

        /**
         * @fn getParamsFromURL
         * Given a URL, pluck off the query parameters in an object.
         */
        getParamsFromURL: function(url) {
            var params = {};
            var qpos = url.indexOf('?');
            if (qpos != -1) {
                var param_str = url.substring(qpos+1);
                var parts = param_str.split('&');
                for (var i=0, part; part=parts[i]; i++) {
                    var name_val = part.split('=');
                    params[name_val[0]] = name_val[1];
                }
            }
            return params;
        },

        /**
         * @fn wireUpTagScopeNav()
         * Wire up the menu and magic box functionality needed by the tag scope nav bar.
        wireUpTagScopeNav: function() {
            // Bail if there's no tag scope nav on the page.
            if (!Dom.get('tagscopenav')) return;

            Evt.on('currscope', 'click', function(ev) {
                Delicious.UI.toggleVisibility('scopechoices');
                return Evt.stopEvent(ev);
            }, this, true);
        },
         */
        
        /**
         * @fn wireUpAlerts()
         * Wire up the close link on alerts.
         */
        wireUpSiteNotification: function() {

            // Bail if there's no alert on the page.
            if (!Dom.get('siteNotice')) return;

            var a = Dom.getElementsByClassName('hideAction', 'a');
            Evt.on(a[0], 'click', this.alertCloseHandler, this, true);
        },
        
        
        /**
         * @fn alertCloseHandler()
         * Hide the display of the alert and cookie the id
         */
        alertCloseHandler: function(ev) {
            var oTrg = Evt.getTarget(ev);
            
            //Move up the dom until we get to the link (rather than the image)
            while (oTrg.id == '') {
                oTrg = oTrg.parentNode;
            }
            
            //Hide the alert box						
            var oTrgDiv = Dom.get('siteNotice');
            oTrgDiv.style.display='none';

            var alert_id = oTrg.id;
            var _currentCookie = document.cookie;

            var ids = Array();
            var pos = _currentCookie.indexOf('del_alerts=');
            if (pos != -1) {
                var start = pos + 11;
                var end = _currentCookie.indexOf(';', start);
                if (end == -1) {
                    end = _currentCookie.length;
                }
                var value = _currentCookie.substring(start, end);
                
                ids = value.split('%2c');
            }
            
            //Add the id of the alert just dismissed to the list
            if (alert_id != '') {            
                ids.push(alert_id);
                
                //If there are already 10 cookies, pop off the first one.
                if (ids.length > 10) {
                    ids.shift();
                }
            
                var idsString = '';
                if (ids.length == 1) {
                    idsString = ids[0];
                }
                else {
                    idsString = ids.join('%2c');
                }
    
                var _nextYear = new Date();
                _nextYear.setFullYear(_nextYear.getFullYear() +1);
    
                var _cookieString = "del_alerts=";
                _cookieString += idsString; 
                _cookieString += "; path=/; domain=delicious.com; expires="+ _nextYear.toGMTString();
                document.cookie = _cookieString;
                
                // Bug 3133136. Delete old cookie from delicous.com domain
                //Delicious.util.removeCookie('del_alerts', 'delicious.com');
            }
            return Evt.stopEvent(ev);

        },
                
        /**
         * When present on the page, open an options list when this is clicked
         */
         wireUpViewSort: function() {
            // make sure we can add event
            if (! Dom.get('sortOpts')) return;
            // add event
            Evt.on("viewact", "click", this.openViewOptions, this, true); 
         },

        /**
         * open view options menu
         */
        openViewOptions: function(ev, obj) {
            // cancel out default behaviour
            Evt.stopEvent(ev)
            // blur out clicked event (removes nasty dotted border in FF)
            var targetObj = Evt.getTarget(ev);
            if (targetObj.blur) targetObj.blur();
            // make changes
            var listOptionsObj = Dom.get('viewlistoptions');
            var onOff = (listOptionsObj.style.display!='block') ? true : false;
            if (listOptionsObj && onOff) {
                listOptionsObj.style.display = 'block';
                window.setTimeout(function() {Evt.on(document.body, 'click', Delicious.Common.globalCloseNav, Delicious.Common, true);}, 100);
            } else {
                listOptionsObj.style.display = 'none';
                Evt.removeListener(document.body, 'click', obj.globalCloseNavs);
            };
        },

        /**
         * Add event for items per page drop down
         */
         wireUpItemsPerPage: function() {
            // make sure we can add event
            if (! Dom.get('bookmark-display')) return;
            // add event
            Evt.on("ippact", "click", this.openItemsPerPage, this, true); 
         },

        /**
         * Add event for bookmarks shown drop down
         */
         wireUpBookmarksShown: function() {
            // make sure we can add event
            if (! Dom.get('bookmarks-shown-list')) return;
            // add event
            Evt.on("bookmarks-shown-button", "click", this.openBookmarksShown, this, true); 
         },

        /**
         * Open items per page drop down
         */
        openItemsPerPage: function(ev, obj) {
            // cancel out default behaviour
            Evt.stopEvent(ev)
            // blur out clicked event (removes nasty dotted border in FF)
            var targetObj = Evt.getTarget(ev);
            if (targetObj.blur) targetObj.blur();
            // make changes
            var listOptionsObj = Dom.get('ipplistoptions');
            var onOff = (listOptionsObj.style.display!='block') ? true : false;
            if (listOptionsObj && onOff) {
                listOptionsObj.style.display = 'block';
                window.setTimeout(function() {Evt.on(document.body, 'click', Delicious.Common.globalCloseNav, Delicious.Common, true);}, 100);
            } else {
                listOptionsObj.style.display = 'none';
                Evt.removeListener(document.body, 'click', obj.globalCloseNavs);
            };
        },        

        /**
         * Open items per page drop down
         */
        openBookmarksShown: function(ev, obj) {
            // cancel out default behaviour
            Evt.stopEvent(ev);
            // blur out clicked event (removes nasty dotted border in FF)
            var targetObj = Evt.getTarget(ev);
            if (targetObj.blur) targetObj.blur();
            // make changes
            var listOptionsObj = Dom.get('bookmarks-shown-list');
            var onOff = (listOptionsObj.style.display!='block') ? true : false;
            if (listOptionsObj && onOff) {
                listOptionsObj.style.display = 'block';
                window.setTimeout(function() {Evt.on(document.body, 'click', Delicious.Common.globalCloseNav, Delicious.Common, true);}, 100);
            } else {
                listOptionsObj.style.display = 'none';
                Evt.removeListener(document.body, 'click', obj.globalCloseNavs);
            };
        },        
        
        globalCloseNav: function(ev, obj) {
            var targetObj = YAHOO.util.Event.getTarget(ev);
            var listOptionsObj = Dom.get('viewlistoptions');
            if (listOptionsObj && targetObj.className.indexOf('listoption-item') < 0 && targetObj.id!='viewlistoptions')  {
                Evt.removeListener(document.body, 'click', obj.globalCloseNavs);
                listOptionsObj.style.display = 'none';
            }
            var listOptionsObj = Dom.get('ipplistoptions');
            if (listOptionsObj && targetObj.className.indexOf('ippoption-item') < 0 && targetObj.id!='ipplistoptions')  {
                Evt.removeListener(document.body, 'click', obj.globalCloseNavs);
                listOptionsObj.style.display = 'none';
            }
            var listOptionsObj = Dom.get('bookmarks-shown-list');
            if (listOptionsObj && targetObj.className.indexOf('bookmarks-shown-item') < 0 && targetObj.id!='bookmarks-shown-list')  {
                Evt.removeListener(document.body, 'click', obj.globalCloseNavs);
                listOptionsObj.style.display = 'none';
            }
        },

        /**
         * Given a url, pull it apart, create a form post from the pieces and submit it
         */
        linkToPostConverter: function(url, targetName) {
            var linkToForm = document.createElement('form');
            linkToForm.method = 'post';
            //split the url into two pieces. form action, and URI
            parts = url.split('?');

            // if the form should be submitted to another window or iframe or frame:
            if (targetName)
                linkToForm.target = targetName;
            
            linkToForm.action = parts[0];

            //Now we need to build up the inputs for the form
            if (parts[1] != null) {
                var inputs = parts[1].split('&');
                if (inputs != null) {
                    for (var i=0; i < inputs.length; i++) {
                        var pieces = inputs[i].split('=');
                        //assuming there are a key and a value, build a hidden input and append to the form
                        if (pieces.length == 2) {
                            var formInput = INPUT({'type':'hidden', 'name':pieces[0], 'value':pieces[1]});
                            linkToForm.appendChild(formInput);
                        }
                    }
                }
            }
            //Submit the form
            document.body.appendChild(linkToForm);
            linkToForm.submit();
        },
        
        isInArray: function(arrayObj, strObj) {
            var isInArray = false;
            for (var i=0; i<arrayObj.length; i++) {
                if (strObj.toLowerCase() == arrayObj[i].toLowerCase()) {
                    isInArray = true;
                    break;
                };
            };
            return isInArray;
        },

        /**
         * Alert message box for dangerous urls
         */
        warnDangerousURL: function(url) {
            alert(del_text.msgs.MSG_ALERT_URL_DANGEROUS);
            return false;
        },        
        
        /**
         * Make sure to release any memory-leaky element references at
         * page-unload.
         */
        destroy: function () {
        },

        EOF:null
    }

}();
Delicious.Common.init();





/**
 * AUTO COMPLETE
 */
Delicious.AutoCompleteManager = function() {
    return {
        ACForms: {},
        add: function(formID, inputID, ACModID, dataSource) {
            // don't add any forms that don't exist
            if (!Dom.get(formID) || !Dom.get(inputID))
                return false;
            // add form
            //YAHOO.log("Adding AutoComplete to input: "+ inputID +" in element: "+formID);
            this.ACForms[ACModID] = new Delicious.AutoComplete();
            this.ACForms[ACModID].init(formID, inputID, ACModID, dataSource);
        },
        get: function(ACModID) {
            if (ACModID && this.ACForms[ACModID] && this.ACForms[ACModID].autoCompleteObj) 
                return this.ACForms[ACModID].autoCompleteObj;
        },
        EOF:null
    };
}();


Delicious.AutoComplete = function() {

    return {

        formID: false,
        formObj: false,
        inputID: false,
        inputObj: false,
        ACResultsModID: false,
        autoCompleteObj: false,

        init: function(formID, inputID, ACResultsModID, tags_dataSource) {
            // store args
            this.formID = formID;
            this.inputID = inputID;
            this.ACResultsModID = ACResultsModID;
            this.formObj = Dom.get(formID);
            this.inputObj = Dom.get(inputID);
            // wire up form
            this.wireUpAutoComplete(tags_dataSource);
        },

        /**
         * @fn wireUpAutoComplete()
         * @description: 
         */
        wireUpAutoComplete: function(tags_dataSource) {
            // draw and initialize AC
            // Inject a div to contain the autocomplete results for magic box.
            this.addtagACMod = DIV({'id':this.ACResultsModID}, []);
            this.inputObj.parentNode.insertBefore(this.addtagACMod, this.inputObj);

            // Hook up the autocomplete code to the magic box.
            this.autoCompleteObj = new AutoComplete(
                this.inputID,
                this.ACResultsModID,
                tags_dataSource,
                {
                    queryDelay : 0.1, //seconds to start parsing
                    prehighlightClassName : "yui-ac-prehighlight",
                    autoHighlight : false,
                    maxResultsDisplayed : 10,
                    useShadow : false,
                    useIFrame : false,
                    typeAhead : false,
                    allowBrowserAutocomplete : false,
                    alwaysShowContainer : false,
                    forceSelection : false,
                    animHoriz : false,
                    animVert : false,
                    delimChar : " "
                }
            );
            // customize the format of all AC list-items
            this.autoCompleteObj.formatResult = function(aResultItem, sQuery) {
                var sCount, sResult, sType, sName;

                //opera.postError('Delicious.AutoComplete.formatResult()');

                // get string
                var sResult = aResultItem[0].replace(/&/, '&amp;');
                sResult = sResult.replace('>', '&gt;');
                sResult = sResult.replace(/</, '&lt;');
                // get count
                if (aResultItem[1])
                    sCount = aResultItem[1];
                else
                    sCount = (aResultItem[2]=='del') ? '0' : '';
                // get name for send
                sName = (aResultItem[3] && (aResultItem[3].toLowerCase() != aResultItem[0].toLowerCase())) ? ' ('+aResultItem[3]+')' : '';
                // get type
                //opera.postError(aResultItem);
                sType = (aResultItem[2]) ? aResultItem[2] : 'tag';

                // highlight the matching part of the tag
                var tagMatchIndex = sResult.toLowerCase().indexOf(sQuery);
                if (tagMatchIndex > -1)
                    var displayTag = this.highlightMatch(sResult, sQuery, tagMatchIndex);
                else
                    var displayTag = sResult;

                // highlight the matching part of the name
                var nameMatchIndex = sName.toLowerCase().indexOf(sQuery);
                if (nameMatchIndex > -1)
                    var displayName = this.highlightMatch(sName, sQuery, nameMatchIndex);
                else
                    var displayName = sName;

                // assemble the string
                var displayName = displayTag + displayName ;

                // draw result
                if (sResult && sCount) {
                    // ONLY USE THIS IF AUTOCOMPLETE LIV IS MODIFIED TO ACCEPT OBJECTS
                    // return SPAN({'class':type}, [ sResult,  STRONG({'class':'numSaves'}, sCount) ]);
                    return '<strong class="'+sType+'">'+ displayName +'<em class="numSaves">'+ sCount +'</em></strong>';
                };
                if (sResult) {
                    // ONLY USE THIS IF AUTOCOMPLETE DIV IS MODIFIED TO ACCEPT OBJECTS
                    // return SPAN({'class':type}, [ sResult, STRONG({'class':'numSaves'}, '') ]);
                    return '<strong class="'+sType+'">'+ displayName +'<em class="numSaves"></em></strong>';
                };

                //return document.createTextNode('');
                return '';
            };

            this.autoCompleteObj.highlightMatch = function(full, snippet, matchindex) {
                return full.substring(0, matchindex) +
                    "<b>" +
                    full.substr(matchindex, snippet.length) +
                    "</b>" +
                    full.substring(matchindex + snippet.length);
            };

        },

        EOF:null
    };
};






// TODO - place in new OOP style format
Delicious.FormManager = function() {
    return {
        formHandlers: [],
        add: function(inputID, submitID) {
            var counter = this.formHandlers.length;
            this.formHandlers[counter] = new Delicious.FormHandler();
            this.formHandlers[counter].init(inputID, submitID);
        },
        EOF: null
    };
}();

Delicious.FormHandler = function() {
    return {
        inputObj: false,
        submitObj: false,
        defaultVal: false,
        defaultColor: false,

        init: function(inputID, submitID) {
            // get Submit & Input objects from form
            this.submitObj = Dom.get(submitID);
            this.inputObj = Dom.get(inputID);
            if (!this.inputObj)
                return false;

            // get default value of form input
            this.defaultVal   = this.inputObj.value;
            this.defaultColor = this.inputObj.style.color;

            // add event listeners
            Evt.on(this.submitObj,  'click', this.handleClick, this, true);
            Evt.on(this.inputObj, 'focus',  this.handleFocus,  this, true);
        },

        handleClick: function(ev) {
            if (this.inputObj.value == this.defaultVal || this.inputObj.value=='') {
                Evt.stopEvent(ev);
                this.inputObj.value = this.defaultVal;
                this.inputObj.style.color = this.defaultColor;
                Evt.on(this.inputObj, 'focus',  this.handleFocus,  this, true);
            }
        },

        handleFocus: function(ev) {
            this.inputObj.style.color = '#333';
            this.inputObj.value = '';
            Dom.addClass(this.inputObj.parentNode, 'on');
            Evt.removeListener(this.inputObj, 'focus', this.handleFocus);
        },

        EOF:null
    };
};



/**
 * AUTO COMPLETE
 */
Delicious.AutoCompleteManager = function() {
    return {
        ACForms: {},
        add: function(formID, inputID, ACModID, dataSource, callback) {
            //opera.postError('Delicious.AutoCompleteManager.add('+formID+', '+inputID+ ', '+ACModID+', '+ callback +')');
            // don't add any forms that don't exist
            if (!Dom.get(formID) || !Dom.get(inputID))
                return false;
            // add form
            //YAHOO.log("Adding AutoComplete to input: "+ inputID +" in element: "+formID);
            this.ACForms[ACModID] = new Delicious.AutoComplete();
            this.ACForms[ACModID].init(formID, inputID, ACModID, dataSource, callback);
            //opera.postError(this.ACForms);
        },
        get: function(ACModID) {
            //opera.postError('Delicious.AutoCompleteManager.get('+ACModID+')');
            if (ACModID && this.ACForms[ACModID] && this.ACForms[ACModID].autoCompleteObj)
                return this.ACForms[ACModID].autoCompleteObj;
        },
        EOF:null
    };
}();



Delicious.AutoComplete = function() {

    return {

        formID: false,
        formObj: false,
        inputID: false,
        inputObj: false,
        ACModID: false,
        autoCompleteObj: false,

        init: function(formID, inputID, ACModID, tags_dataSource, callback) {
            //opera.postError('Delicious.AutoComplete.init('+formID+', '+inputID+ ', '+ACModID+')');
            // store args
            this.formID = formID;
            this.inputID = inputID;
            this.ACModID = ACModID;
            this.formObj = Dom.get(formID);
            this.inputObj = Dom.get(inputID);
            // wire up form
            this.wireUpAutoComplete(tags_dataSource, callback);
        },

        /**
         * @fn wireUpAutoComplete()
         * @description:
         */
        wireUpAutoComplete: function(tags_dataSource, callback) {
            //opera.postError('wireUpAutoComplete()');
            //opera.postError(callback);
            // draw and initialize AC
            // Inject a div to contain the autocomplete results for magic box.
            this.addtagACMod = DIV({'id':this.ACModID}, []);
            this.inputObj.parentNode.insertBefore(this.addtagACMod, this.inputObj);

            // Hook up the autocomplete code to the magic box.
            this.autoCompleteObj = new AutoComplete(
                this.inputID,
                this.ACModID,
                tags_dataSource,
                {
                    queryDelay : 0.1, //seconds to start parsing
                    prehighlightClassName : "yui-ac-prehighlight",
                    maxResultsDisplayed : Delicious.Config.get('ACResults'),
                    useShadow : false,
                    useIFrame : false,
                    typeAhead : false,
                    allowBrowserAutocomplete : false,
                    alwaysShowContainer : false,
                    forceSelection : false,
                    animHoriz : false,
                    animVert : false,
                    delimChar : " "
                }
            );

            // apply specified callback function on selectEvent completion
            if (this.autoCompleteObj.itemSelectEvent && callback) {
                this.autoCompleteObj.itemSelectEvent.subscribe(callback);
            };
            // customize the format of all AC list-items
            this.autoCompleteObj.formatResult = function(aResultItem, sQuery) {
                var sCount, sResult, sType, sName;

                //opera.postError('Delicious.AutoComplete.formatResult()');

                // get string
                var sResult = aResultItem[0].replace(/&/, '&amp;');
                sResult = sResult.replace('>', '&gt;');
                sResult = sResult.replace(/</, '&lt;');
                // get count
                if (aResultItem[1])
                    sCount = aResultItem[1];
                else
                    sCount = (aResultItem[2]=='del') ? '0' : '';
                // get name for send
                sName = (aResultItem[3] && (aResultItem[3].toLowerCase() != aResultItem[0].toLowerCase())) ? ' ('+aResultItem[3]+')' : '';
                // get type
                //opera.postError(aResultItem);
                sType = (aResultItem[2]) ? aResultItem[2] : 'tag';

                // highlight the matching part of the tag
                var tagMatchIndex = sResult.toLowerCase().indexOf(sQuery);
                if (tagMatchIndex > -1)
                    var displayTag = this.highlightMatch(sResult, sQuery, tagMatchIndex);
                else
                    var displayTag = sResult;

                // highlight the matching part of the name
                var nameMatchIndex = sName.toLowerCase().indexOf(sQuery);
                if (nameMatchIndex > -1)
                    var displayName = this.highlightMatch(sName, sQuery, nameMatchIndex);
                else
                    var displayName = sName;

                // assemble the string
                var displayName = displayTag + displayName ;

                // draw result
                if (sResult && sCount) {
                    // ONLY USE THIS IF AUTOCOMPLETE LIV IS MODIFIED TO ACCEPT OBJECTS
                    // return SPAN({'class':type}, [ sResult,  STRONG({'class':'numSaves'}, sCount) ]);
                    return '<strong class="'+sType+'">'+ displayName +'<em class="numSaves">'+ sCount +'</em></strong>';
                };
                if (sResult) {
                    // ONLY USE THIS IF AUTOCOMPLETE DIV IS MODIFIED TO ACCEPT OBJECTS
                    // return SPAN({'class':type}, [ sResult, STRONG({'class':'numSaves'}, '') ]);
                    return '<strong class="'+sType+'">'+ displayName +'<em class="numSaves"></em></strong>';
                };

                //return document.createTextNode('');
                return '';
            };

            this.autoCompleteObj.highlightMatch = function(full, snippet, matchindex) {
                return full.substring(0, matchindex) +
                    "<b>" +
                    full.substr(matchindex, snippet.length) +
                    "</b>" +
                    full.substring(matchindex + snippet.length);
            };


        },

        EOF:null
    };
};


Delicious.TagsDataObj = function() {

    var disabled = false;

    return {
        tags_dataSource: false, // tags data, for use in AutoComplete objects
        dynamicTagsURL: false,  // if this is set, it will grab tag data via AJAX, instead of from the DOM
        forceDOMTags: false,    // set this to force the app to use DOM data, instead of dynamic data
        parentNode: 'bd',
        objName: '',

        /**
         * @fn: useDOMTags()
         * @description: set this before init(); if you want the app to force itself to use the DOM
         * tags instead of grabbing via AJAX
         */
        useDOMTags: function() {
            this.forceDOMTags = true;
        },

        /**
         * @fn: setDOMParent()
         * @description: Send this function the ID of the node you wish to cull the list of DOM tags from
         */
        setDOMParent: function(parentNode) {
            this.parentNode = parentNode;
        },

        /**
         * @fn: setDynamicTags()
         * @description: set this before you call init(). It forces tags_dataSource to be fetched via an AJAX call
         * instead of being culled from the DOM.
         */
        setDynamicTags: function(dynamicURL) {
            if (dynamicURL)
                this.dynamicTagsURL = dynamicURL;
        },

        /**
         * @fn: disable()
         * @description: calling this method will disable gathering and storing tags for this object
         */
        disable: function() {
            disabled = true;
        },

        /**
         * @fn: isDisabled()
         * @description: returns false
         */
        isDisabled: function() {
            return disabled;
        },

        /**
         * @fn: isDynamicCall()
         * @description: Checks whether or not the call being made should be dynamic or not (ie. static).
         * If the call has a dynamicTagsURL and has NOT been forced to use DOM Tags, it will return true,
         * and therefore be dynamic.
         */
        isDynamicCall: function() {
            if (this.dynamicTagsURL && !this.forceDOMTags)
                return true;
            else
                return false;
        },

        /** @fn: addTags()
         *  @description: appends tags (MUST be from a dataSource obj) onto this objects
         *  internal dataSource file. First arg is the dataSourceObj, second arg is true | false
         *  depending on whether you want it sorted (true) or not (false).
         *  tagsData is an array of objects = {'tag', 'count', 'type'}
         */
        addTags: function(tagsData, orderTags, dedupe) {
            //opera.postError(this.objName +'.addTags()');
            // make sure we have data to work with
            if (!tagsData || !(tagsData.length>0) ) return;

            // merge with any data currently in dataSource
            if (this.tags_dataSource && this.tags_dataSource.liveData.length > 0) {
                tagsData = tagsData.concat(this.tags_dataSource.liveData);
            };

            // sort
            if (orderTags)
                tagsData.sort(this.tagSort);

            // dedupe
            if (dedupe)
                tagsData = this.dedupeTags(tagsData);

            // create new dataobject
            this.tags_dataSource = new YAHOO.util.LocalDataSource(tagsData); 
            this.tags_dataSource.responseSchema = {fields:["tag", 'count', 'type']}; 
        },

        tagSort: function(x, y) {
            var aNum = x.count*1;
            var bNum = y.count*1;
            var aAlpha = x.tag.toLowerCase();
            var bAlpha = y.tag.toLowerCase();
            // first, try and sort by number
            if (aNum > bNum) {
                return -1;
            } if (aNum < bNum) {
                return 1;
            } else {
                // if the numbers are equal, sort alphabetically
                if (aAlpha > bAlpha) {
                    return 1;
                } if (aAlpha < bAlpha) {
                    return -1;
                } else {
                    return 0
                };
            };
        },


        /**
         * @fn: dedupeTagsInDataSource
         * @description: Ensures that the autocomplete data source contains only unique tags.
         * This method is only ever called internally
         */
        dedupeTags: function(tagsData) {
            //opera.postError(this.objName +'dedupeTags()');

            var t, i=0, tag='', tags_seen={}, new_data=[];
            // make a pass of all the tags
            for (i=0; t=tagsData[i]; i++) {
                tag = t.tag;
                if (tag) {
                    // only push onto array if it isn't there already
                    if (!tags_seen[tag.toLowerCase()]) {
                        tags_seen[tag.toLowerCase()] = 1;
                        new_data.push(t);
                    };
                };
            };
            return new_data;
        },

        /**
         * @fn: countTags()
         * @description: returns a value for how many tags are in the dataObject
         */
        countTags: function() {
            if (this.tags_dataSource && this.tags_dataSource.liveData)
                return this.tags_dataSource.liveData.length;
            else
                return 0;
        },

        EOF: null
    };
};
Delicious.UserTagsData = new Delicious.TagsDataObj;
Delicious.MagicTagsData = new Delicious.TagsDataObj;
Delicious.UserSendData = new Delicious.TagsDataObj;
Delicious.UserTagsData.objName = 'Delicious.UserTagsData';
Delicious.MagicTagsData.objName = 'Delicious.MagicTagsData';
Delicious.UserSendData.objName = 'Delicious.UserSendData';









Delicious.TagsData = function() {

    // vars to decide if we should duplicate calls
    var dynamicCallsAreIdentical = false;
    var domCallsAreIdentical = false;
    var moduleType = 'userposts';

    // we only want to add AC when all timers are complete
    var _timer = {};
    _timer['user'] = 0;
    _timer['send'] = 0;
    _timer['magic'] = 0;

    return {

        areDynamicTagCallsIdentical: function() {
            var magicTagsData='';
            var userTagsData='';
            // need to split calls because callbacks & privacy settings will be different
            if (Delicious.MagicTagsData.dynamicTagsURL)
                magicTagsData = Delicious.MagicTagsData.dynamicTagsURL.split('?callback')[0];
            if (Delicious.UserTagsData.dynamicTagsURL)
                userTagsData = Delicious.UserTagsData.dynamicTagsURL.split('?callback')[0];
            // check if same
            if (magicTagsData == userTagsData) {
                return true;
            }
            return false;
        },

        /**
         * @fn: init()
         * @description: calls various TagsData objects to initialize them. The only reason we do
         * it here is because IF two objects have the same dynamic/DOM data source, there's no need
         * for the fetching -- just copy the data over from one to the other
         */
        init: function(modType) {
            var i=0;

            // this is here just in case we need it later
            moduleType = modType;

            // both data lists are grabbed via the DOM
            domCallsAreIdentical = (
                   !Delicious.MagicTagsData.isDynamicCall() && !Delicious.UserTagsData.isDynamicCall()
               ) ? true : false ;

            // both data lists are Dynamically fetched, and the call is the same
            dynamicCallsAreIdentical = (this.areDynamicTagCallsIdentical()) ? true : false ;

            // Here's the deal with Dynamic Tags: We fetch dynamic tags & names for both AC and Magic Tags.
            // If the dynamic tags for AC & Magic are the same, we mark them identical and only fetch
            // tags & names for the User. The Callback function will handle copying identical User data over
            // to the Magic data object.

            // gather USER TAGS
            if (!Delicious.UserTagsData.isDisabled()) {
                if (Delicious.UserTagsData.isDynamicCall()) {
                    //opera.postError('NOTE: userTags: dynamic');
                    // get dynamically (callback happens onload of these calls)
                    this.getDynamicTags(Delicious.UserTagsData.dynamicTagsURL, 'tags');
                } else {
                    //opera.postError('NOTE: userTags: scrape DOM');
                    // scrape the DOM and store
                    Delicious.UserTagsData.addTags(Delicious.TagsData.gatherDOMTags('m', Delicious.UserTagsData.parentNode), true, true);
                    // callback happens now
                    Evt.onDOMReady(function() {
                        this.addUserTagsAC();
                      }, this, true);
                };
            };

            // gather SEND
            if (!Delicious.UserSendData.isDisabled()) {
                if (Delicious.UserSendData.isDynamicCall()) {
                    //opera.postError('NOTE: sendTags: dynamic');
                    // get dynamically (callback happens onload of these calls)
                    this.getDynamicTags(Delicious.UserSendData.dynamicTagsURL, 'send');
                } else {
                    //opera.postError('NOTE: sendTags: scrape DOM');
                    // scrape the DOM and store
                    Delicious.UserSendData.addTags(Delicious.TagsData.gatherDOMTags('m-for', Delicious.UserSendData.parentNode), true, true);
                    // callback happens now
                    Evt.onDOMReady(function() {
                        this.addUserSendAC();
                      }, this, true);
                };
            };

            // gather MAGIC TAGS
            if (!Delicious.MagicTagsData.isDisabled()) {
                if (Delicious.MagicTagsData.isDynamicCall()) {
                    // get dynamically (callback happens onload of these calls)
                    if (dynamicCallsAreIdentical) {
                        // this is usually done in getDynamicTags(), but since we're not calling that...
                        if (Delicious.UserTagsData.dynamicTagsURL)
                            this.addTimer('magic');
                    } else {
                        this.getDynamicTags(Delicious.MagicTagsData.dynamicTagsURL, 'magic');
                    };
                } else {
                    // scrape the DOM and store
                    if (domCallsAreIdentical) {
                        //opera.postError('NOTE: MagicTags should just use UserTags');
                        // they're the same as for UserTags, just use those
                        Delicious.MagicTagsData.addTags(Delicious.UserTagsData.tags_dataSource.liveData, false, false);
                    } else {
                        //opera.postError('NOTE: magicTags: scrape DOM');
                        // nope, we actually have to scrape the DOM
                        Delicious.MagicTagsData.addTags(Delicious.TagsData.gatherDOMTags('m', Delicious.MagicTagsData.parentNode), true, true);
                        Delicious.MagicTagsData.addTags(Delicious.TagsData.gatherDOMTags('m-name', Delicious.MagicTagsData.parentNode), true, true);
                    };
                    // callback happens now
                    Delicious.MagicTags.init();
                };
            };
        },


        /**
         * @fn: gatherDOMTags()
         * @description: Fetches tags for autocomplete from the DOM.  This is done by finding all elements
         * with class <nodeClassName> within <parentNode> and lifting out the tags listed there.
         */
        gatherDOMTags: function(nodeClassName, parentNode) {
            //opera.postError('Delicious.TagData.gatherDOMTags("'+nodeClassName +'")');
            var tag, type, tmpCount, count, ele, i, isFor;
            var tags = [];

            // make sure we have a root node to work with
            if (!Dom.get(parentNode))
                parentNode = '';

            // get tags
            var nodes = Dom.getElementsByClassName(nodeClassName, '', parentNode);
            //opera.postError(nodes);
            if (!nodes.length>0) return;

            // go through each tag, and put each tag into this.data_source.data;
            for (ele,i=0; ele=nodes[i]; i++) {
                if (ele.innerHTML) {
                    type = 'tag';
                    if (nodeClassName == 'm') {
                        tag = ele.getAttribute('title').trim();
                        // strip any sub-nodes
                        if (tag.lastIndexOf('(')>-1) {
                            tag = tag.split('(')[0];
                        };
                        // for tag stuff
                        //isFor = (tag.substr(0, 4)=='for:') ? 1 : 0;
                        if (Dom.hasClass(ele, 'for')) {
                            type = 'for';
                            tag = 'for:'+tag;
                        };
                    } else if (nodeClassName == 'm-name') {
                        tag = (ele.getAttribute('title').trim());
                    } else {
                        tag = (ele.getAttribute('title').trim());
                        type = 'del';
                        if (Dom.hasClass(ele, 'm-for-email')) type = 'email';
                        if (Dom.hasClass(ele, 'm-for-twitter')) type = 'twitter';
                    };
                    //opera.postError(tag);
                    tmpCount = ele.getElementsByTagName('em');
                    count = (tmpCount && tmpCount.length>0 && tmpCount[0]) ? tmpCount[0].innerHTML : '';
                    if (tag) tags.push( {'tag':tag, 'count':count, 'type':type} );
                };
            };

            //opera.postError(tags);

            return tags;
        },


        /**
         * @fn: getDynamicTags()
         * @description: fetches tags via scriptNode
         */
        getDynamicTags: function(dynamicTagsURL, userType) {
            //opera.postError('Delicious.TagData.getDynamicTags('+userType+')');
            //opera.postError(dynamicTagsURL);

            if (!dynamicTagsURL) return;
            // set a timer,
            this.addTimer(userType);
            // get script, add as scriptNode
            Evt.onDOMReady(function() {
                //YAHOO.log("Loading tags feed: "+ dynamicTagsURL);
                var scr = document.createElement("script");
                scr.setAttribute("type", "text/javascript");
                scr.setAttribute("src", dynamicTagsURL);
                document.getElementsByTagName("head").item(0).appendChild(scr);
            }, this, true);
        },


        /* ****************************************** *
         * CALLBACK FUNCTIONS FROM DYNAMIC TAGS CALLS *
         * ****************************************** */

        callbackDynamicUserTags: function(tags) {
            //opera.postError('Delicious.TagsData.callbackDynamicUserTags()');
            // add tags, remove the timer, and wireUp AC
            Delicious.UserTagsData.addTags(this.processTagsFeed(tags), true, false);
            this.removeTimer('user');
            this.addUserTagsAC();
            // if these apply to Magic Tags, do the same for them
            if (dynamicCallsAreIdentical) {
                this.callbackDynamicMagicTags(tags);
            };
        },

        callbackDynamicMagicTags: function(tags) {
		    //opera.postError('Delicious.TagsData.callbackDynamicMagicTags()');
            Delicious.MagicTagsData.addTags(this.processTagsFeed(tags), true, false);
            this.removeTimer('magic');
            Delicious.MagicTags.init();
        },

        callbackDynamicSocialSend: function(data) {
            //opera.postError('Delicious.TagsData.callbackDynamicSocialSend()');
            // add tags, remove timer and wireUp AC
            //opera.postError(data);			
            Delicious.UserSendData.addTags(this.processSocialFeed(data), true, false);
            this.removeTimer('send');
            this.addUserSendAC();
        },

        processTagsFeed: function(tags) {
            // go through names, and put them in tag format
            var tag, count, newTags = [], counter=0, type;
            for (var i in tags) {
                //opera.postError(i);
                type = (i.substr(0,4)!=='for:') ? 'tag' : 'for';
                newTags.push( {'tag':i, 'count':tags[i], 'type':type} );
                counter++;
            };
            //opera.postError(newTags);
            return newTags;
        },


        processSocialFeed: function(data) {
            // go through data, and put them in tag format
            var user, newTags = [];
            for (var i in data) {
                user = data[i].user;
                if (!user && data[i].type == 'twitter') {
                    user = '@twitter';
                }
                
                if (user) {
                    newTags.push( {'tag':user, 'count':data[i].count, 'type':data[i].type} );
                };
            };
            return newTags;
        },




        /* ******************************* *
         * START SOME AUTOCOMPLETE OBJECTS *
         * ******************************* */

        addUserTagsAC: function() {
            //opera.postError("*** Delicious.TagData.addUserTagsAC()");
            //opera.postError(Delicious.UserTagsData.tags_dataSource);
            if (Delicious.UserTagsData.countTags() > 0) {
                if (this.checkTimer('user')) {

                    // figure out what object we're using for save stuff
                    var sendObj = false;
                    if (Delicious.Post && Delicious.Post.isRegistered('send')) {
                        sendObj = Delicious.Post;
                    } else if (Delicious.Opera && Delicious.Opera.isRegistered('send')) {
                        sendObj = Delicious.Opera;
                    };

                    // tagBundles AC
                    Delicious.AutoCompleteManager.add(
                          'bundleInput', 
                          'tagsInput', 
                          'magicbox-ac-results', 
                          Delicious.UserTagsData.tags_dataSource
                        );
                    // POST page AC
                    Delicious.AutoCompleteManager.add(
                          'saveitem', 
                          'tags', 
                          'tags-ac-results', 
                          Delicious.UserTagsData.tags_dataSource, 
                          sendObj.ACTagsCallback
                        );
                };
            };
        },

        addUserSendAC: function() {
            //opera.postError("*** Delicious.TagData.addUserSendAC()");
            //opera.postError(Delicious.UserSendData.tags_dataSource);
            if (Delicious.UserSendData.countTags() > 0) {
                if (this.checkTimer('send')) {

                    // figure out what object we're using for save stuff
                    var sendObj = false;
                    if (Delicious.Post && Delicious.Post.isRegistered('send')) {
                        sendObj = Delicious.Post;
                    } else if (Delicious.Opera && Delicious.Opera.isRegistered('send')) {
                        sendObj = Delicious.Opera;
                    };

                    // POST page AC
                    if (sendObj && sendObj.isRegistered('send')) {
                        Delicious.AutoCompleteManager.add(
                            'saveitem', 
                            sendObj.SendEditor.newTagInput.id, 
                            'send-ac-results', 
                            Delicious.UserSendData.tags_dataSource,
                            sendObj.ACSendCallback
                          );
                    };
                };
            };
        },




        /* TIMERS -- we need to use these to make sure all dynamic data
                     is in before we start adding AutoComplete features */

        addTimer: function(userType) {
            _timer[userType] = 1;
        },

        removeTimer: function(userType) {
            _timer[userType] = 0;
        },

        checkTimer: function(userType) {
            if (!_timer[userType]) return true;
            else return false;
        },


        EOF:null
    }
}();



Delicious.MagicTags = function() {

    var _input = false;

    return {

        init: function() {
            //opera.postError('*** Delicious.MagicTags.init()');
            if (Delicious.MagicTagsData.countTags() > 0) {
                Delicious.AutoCompleteManager.add('magicboxform', 'addtag', 'magicbox-ac-results', Delicious.MagicTagsData.tags_dataSource, Delicious.MagicTags.ACCallback);
            };

            _input = Dom.get('addtag');

            Evt.on(_input, 'keyup', this.handleKeyDown, this, true);
        },

        handleKeyUp: function(ev) {
            //opera.postError('Delicious.MagicTags.handleKeyUp()');
            var thisKey = ev.keyCode;

            if (thisKey == 13) {
                window.setTimeout(Delicious.MagicTags.submit, 200);
            };
        },

        ACCallback: function() {
            //opera.postError('Delicious.MagicTags.ACCallback()');
            var type = 'tag';
            var tag = '';
            try {
                type = arguments[1][2][2].trim();
                tag  = arguments[1][2][0].trim();
            } catch (e) {};
            // since we don't know which SEND editor might have just completed, let's just complete them all :)
            _input.value = _input.value.trim();
            if (type == 'for') {
                var inputTags = _input.value.split(' ');
                for (var i=0; i<inputTags.length; i++) {
                    if (inputTags[i].trim() == tag.trim()) {
                        inputTags[i] = tag;
                    };
                };
                _input.value = inputTags.join(' ');
            };
        },

        EOF: null
    };
}();


/**
 * UI code for handling events when user types in the tag input
 * If user types a tag that matches a suggested tag, then we highlight that tag
 * If they start deleting a tag that's already highlighted, we remove the highlighting
 */
Delicious.InputTags = function() {
    return {

        inputObj: false,
        objName: false, 
        objType: false,
        caller: false,
        inlineID: false,

        /** INITIALIZATION STUFF
         ** Args: inputObj: the uniqueID, or Obj for the input field we want to work with
         **       objType:
         **       objName: global namespace 4 this object, use with window calls where we need global names
         **       caller: the JS Obj that called this object
         */
        init: function(inputObj, objType, objName, caller, inlineID) {
            //opera.postError('Delicious.InputTags.init("'+inputObj+'", "'+objType+'", "'+objName+'", "'+inlineID+'")');
            // inputObj can be either object or string
            if (typeof inputObj == "string")
                this.inputObj = Dom.get(inputObj);
            else 
                this.inputObj = inputObj;
            if (!this.inputObj) return;

            // save caller for use later
            this.objName = objName;
            this.objType = objType;
            this.caller = caller;
            this.inlineID = inlineID;

            // handle any existing tags that were pre-populated
            //this.exeSpaceKey();

            // add eventListener
            if (this.caller.isRegistered('suggestions', this.inlineID) || (this.caller.isRegistered('send', this.inlineID))) {
                Evt.on(this.inputObj, 'keyup', this.handleKeyUp, this, true);
            };
        },

        handleKeyUp: function(ev) {
            //opera.postError('Delicious.InputTags.handleKeyUp()');
            // get tags
            var tagsArray = this.getTags();

            // handle suggestions
            if (this.caller.isRegistered('suggestions', this.inlineID)) {
                this.caller.getRegisteredObject('suggestions', this.inlineID).updateTags('tags', tagsArray);
            };

            // if the space key is hit, see if there are any 'send' tags in here
            if (ev && this.caller.isRegistered('send', this.inlineID)) {
                var thisKey = ev.keyCode;
                if (thisKey == 32)   // space key
                    this.exeSpaceKey(tagsArray);
            };
        },

        // this fires on completion on an AutoComplete event
        exeAC: function(tagToLookFor) {
            //opera.postError('Delicious.InputTags.exeAC()');
            window.setTimeout(this.objName + '.exeSpaceKey(false, "'+tagToLookFor+'")', 10);
        },

        // tagToLookFor: this is set if it's from AC from a for: tag
        exeSpaceKey: function(tagsArray, tagToLookFor) {
            //opera.postError('Delicious.InputTags.exeSpaceKey()');
            if (this.caller.isRegistered('send', this.inlineID)) {
                if (!tagsArray)
                    tagsArray = this.getTags();
                this.handleForTags(tagsArray, tagToLookFor);
            };
        },

        // tagToLookFor: this is set if it's from AC from a for: tag
        handleForTags: function(tagsArray, tagToLookFor) {
            //opera.postError('Delicious.InputTags.handleForTags()');
            //opera.postError(tagsArray);
            var cleanArray = [];
            var atLeast1ForTag = false;
            for (var i=0; i<tagsArray.length; i++) {
                if (tagsArray[i].substr(0,4)=='for:') {
                    // add tag to SEND input
                    this.handleForTag(tagsArray[i].substr(4));
                    atLeast1ForTag = true;
                    // remove it from TAGS input
                } else {
                    // check to see if it's a for: tag, just without the "for:" prefix
                    if (tagToLookFor && tagsArray[i] == tagToLookFor) {
                        // add tag to SEND input
                        this.handleForTag(tagsArray[i]);
                        atLeast1ForTag = true;
                    } else {
                        if (tagsArray[i] && tagsArray[i] != ' ') {
                            cleanArray.push(tagsArray[i]);
                        };
                    };
                };
            };
            if (atLeast1ForTag) {
                cleanTags = cleanArray.join(' ');
                this.inputObj.value = cleanTags + ' ';
            };
        },

        handleForTag: function(tag) {
            //opera.postError('Delicious.InputTags.handleForTag('+tag+')');
            this.caller.getRegisteredObject('send', this.inlineID).addTag(tag);
        },

        getTags: function() {
            //opera.postError('Delicious.InputTags.getTags()');
            var tagsValue = this.inputObj.value;
            var tagsArray = [];
            if (tagsValue && tagsValue!=' ') {
                tagsArray = tagsValue.split(' ');
            };
            return tagsArray;
        },

        checkIfTagExists: function(tag) {
            //opera.postError('Delicious.InputTags.checkIfTagExists('+tag+')');
            tag = tag.toLowerCase();
            var currentTags = this.getTags();
            for (var i=0; i<currentTags.length; i++) {
                if (tag == currentTags[i].toLowerCase()) {
                    return true;
                };
            };
            return false;
        },

        /**
         ** TAG ADDING METHODS
         */

        addTag: function(tag) {
            tag = tag;
            //opera.postError('Delicious.InputTags.addTag('+tag+')');
            // get current tags
            var currentTags = this.inputObj.value.trim()
            this.inputObj.value = currentTags +' '+ tag + ' ';
            // update suggestion highlights
            if (this.caller.isRegistered('suggestions', this.inlineID))
                this.caller.getRegisteredObject('suggestions', this.inlineID).highlightTag('tags', tag);
        },

        removeTag: function(tag) {
            tag = tag;
            //opera.postError('Delicious.InputTags.removeTag('+tag+')');
            var cleanTags = [];
            var currentTags = this.getTags();
            for (var i=0; i<currentTags.length; i++) {
                if (tag.toLowerCase()!=currentTags[i].toLowerCase())
                    cleanTags.push(currentTags[i]);
            };
            this.inputObj.value = cleanTags.join(' ');
            // update suggestion highlights
            if (this.caller.isRegistered('suggestions', this.inlineID))
                this.caller.getRegisteredObject('suggestions', this.inlineID).clearTag('tags', tag);
        },

        updateTag: function(tag) {
            tag = tag;
            //opera.postError('Delicious.InputTags.updateTag('+tag+')');
            // check to see if this tag exists
            if (this.checkIfTagExists(tag))
                this.removeTag(tag);
            else
                this.addTag(tag);
            // focus on input
            //this.focus();
        },

        focus: function() {
            if (this.objType != 'bundle') 
                this.inputObj.focus();
        },

        EOF:null
    };
};



/**
 ** UI code for TagLines DHTML interaction
 **/
Delicious.TagLines = function() {
    return {
        // local vars
        objName: false,                 // name of the object, for global window calls
        objType: false,                 // type of tag-chain (tag, share, etc)
        oldTagInput: false,             // the original tag input object
        formRow: false,                 // the parent div in the form that holds all this goodness
        uniqueID: 0,                    // since this is replicated, we need a uniqueID to identify 
        inlineID: false,

        tagInputClass: 'newTagInput',
        tagsClearClass: 'clearNewTags',
        tagInputItemClass: 'newTagInputWrapper',
        tagLinesItemClass: 'newTagItem',
        tagLinesShareItemClass: 'newShareItem',
        tagLinesClass: 'newTagsList tagLines',
        tagLinesEditorClass: 'newTagsEditor',
        formRowClass: 'tagLinesEnabled',

        autoComplete: false,         //  AutoComplete wrapper DIV
        tagsForm: false,             // form object
        newTagInput: false,          // tags field
        tagInputSize: 0,             // tags field
        tagInputUL: false,           // tag form field use to display tags to the user
        tagDelimiterCode: 32,        // tag delimiter
        tagDelimiterCharacter: ' ',  // tag delimiter
        tagsArray: [],               // array of tags
        controlKeyIsDown: false,     // true/false -- used to determine if CNTL is being applied, before the V key (for paste)

        blurTimer: false,            // onBlur actions are delayed
        ACTimer: false,              // AC actions should use a timer

        offset: 0,                   // offset
        
        /**
         ** INITIALIZATION STUFF
         ** Args: inputObj: the DOM id for the input field we want to work with
         **       objType:
         **       objName:  global namespace 4 this object, use with window calls where we need global names
         **       caller:   the JS Obj that called this object
         */
        init: function(inputObj, objType, objName, caller, inlineID, offset) {
            //opera.postError('Delicious.TagLines.init("'+inputObj+'", "'+objType+'", "'+objName+'", [object], "'+inlineID+'", "'+ offset +'")');
            
            // store local vars
            // tagsInput can be either object or string
            if (typeof inputObj == "string")
                inputObj = Dom.get(inputObj);
            //opera.postError(inputObj);
            if (!inputObj) return;
    
            this.oldTagInput = inputObj;

            this.objType = (objType) ? objType : 'Tags';
            this.objName = objName;
            this.caller = caller;
            this.inlineID = inlineID;
            if (offset)
                this.offset = offset;
            
            // get parent div for this form "row"
            this.formRow = this.getFormRow();
            //opera.postError(this.formRow);
            if (!this.formRow) return;

            this.formRowPadding = this.formRow.style.paddingLeft;

            // for when we need a unique ID, generate a rand # between 1,000,000 and 9,999,999
            this.uniqueID = Math.floor(Math.random() * (9999999 - 1000000 + 1)) + 1000000;
            //opera.postError(this.uniqueId);

            // create the HTML for the UI
            this.createUI();

            // resize
            this.resize();

            // prepopulate any tags in the existing tag Input Field, and make new tags out of 'em
            this.prePopulateTags();

        },

        // gets the parentDiv that this tag entry is going to be in
        getFormRow: function() {
            //opera.postError('Delicious.TagLines.getformRow()');
            // can't do this without the oldTagInput Object
            if (!this.oldTagInput)
                return false;

            // loop up through the DOM to find the form row div
            var formRow = this.oldTagInput;
            while (!Dom.hasClass(formRow, 'field')) {
                formRow = formRow.parentNode;
            };

            // add a class, to let CSS know this row is now being used for tagLines display
            Dom.addClass(formRow, this.formRowClass);
            // return obj
            return formRow;
        },

        // this draws the DHTML Tag Editor stuff
        createUI: function() {
            //opera.postError('Delicious.TagLines.createUI()');

            // replace the old tag input with a hidden one 
            // (IE7 bug won't let you change an inputType once it's been created)
            var tmpInput = document.createElement('input');
            tmpInput.type = 'text';
            tmpInput.type = 'hidden'
            tmpInput.name = this.oldTagInput.name;
            tmpInput.id = this.oldTagInput.id;
            tmpInput.classname = this.oldTagInput.className;
            tmpInput.value = this.oldTagInput.value;
            this.formRow.removeChild(this.oldTagInput);
            this.formRow.appendChild(tmpInput);
            this.oldTagInput = tmpInput;

            // create new tag input
            this.newTagInput = document.createElement('input');
              this.newTagInput.name = 'new'+ this.objType;
              this.newTagInput.id = 'new'+this.objType+'Input-'+this.uniqueID;
              this.newTagInput.className = this.tagInputClass;
              this.newTagInput.type = 'text';
              this.newTagInput.value = '';

            // delete all button
            this.clearAll = A({'class':this.tagsClearClass, 'title':'Clear this field'}, [SPAN({}, '(clear)')]);

            // place new tag input into a list-item
            this.newTagItem = LI({'class':this.tagInputItemClass}, this.newTagInput);
            this.newTagsList = UL({'class':this.tagLinesClass}, [this.newTagItem, LI({'class':'clr'}, [])]);
            this.newTagsEditor = DIV({'class':this.tagLinesEditorClass}, [this.newTagsList]);
            this.formRow.appendChild(this.newTagsEditor);
            this.formRow.appendChild(this.clearAll);

            // move info span to end of formRow, REALLY should use one classname for this!
            var infoObj = Dom.getElementsByClassName('info', 'span', this.formRow);
            if (infoObj[0]) {
                this.formRow.removeChild(infoObj[0]);
                this.formRow.appendChild(infoObj[0]);
            };
            var infoObj = Dom.getElementsByClassName('fieldMsg', 'em', this.formRow);
            if (infoObj[0]) {
                this.formRow.removeChild(infoObj[0]);
                this.formRow.appendChild(infoObj[0]);
            };

            // add event listeners
            Evt.on(this.newTagInput, 'keydown',  this.handleKeyDown,  this, true);
            Evt.on(this.newTagInput, 'keyup',    this.handleKeyUp,    this, true);
            Evt.on(this.newTagsList, 'click',    this.handleTagClick, this, true);
            Evt.on(this.clearAll,    'click',    this.handleClearAll, this, true);
            Evt.onBlur(this.newTagInput, this.handleBlur, this, true);
            if (!Delicious.isChromeExt)
                Evt.on(window, 'resize', this.handleResize, this, true);
        },
        
        // takes any tags that are in the original Tag input field, and makes them UI Tags
        prePopulateTags: function() {
            //opera.postError('Delicious.TagLines.prePopulateTags()');
            // grab existing tags, and place in array
            var tagsValue = this.oldTagInput.value;

            // display tags to user
            if (tagsValue && tagsValue!=' ') {
                var tags = tagsValue.split(this.tagDelimiterCharacter);
                // clear field
                this.oldTagInput.value = '';
                // write out tags
                for (var i=0; i<tags.length; i++) {
                    this.addTag(tags[i]);
                };
            };
        },

        


        /**
         ** EVENT HANDLERS
         */

        handleBlur: function(ev) {
            //opera.postError('Delicious.TagLines.handleBlur()');
            this.blurTimer = window.setTimeout(
                    this.objName + '.handleBlurTimer()'
            , 200);
        },

        handleBlurTimer: function(ev) {
            //opera.postError('Delicious.TagLines.handleBlurTimer()');
            if (this.blurTimer) {
                this.exeSpaceKey(ev);
            };
        },

        // listens for a window resize, so we can resize the DHTML display
        handleResize: function(ev) {
            //opera.postError('Delicious.TagLines.handleResize()');
            // set width to 100% again
            this.formRow.style.width = '100%';
            // reset tagEditorWidth
            this.tagEditorWidth = false;
            // resize
            this.resize();
        },

        handleClearAll: function() {
            //opera.postError('Delicious.TagLines.handleClearAll()');
            // remove visible tags
            this.removeAllTags();
            // clear input value
            this.newTagInput.value = '';
            this.newTagInput.focus();
            // clear Tag Suggestions
            if (this.caller.isRegistered('suggestions', this.inlineID)) {
                this.caller.getRegisteredObject('suggestions', this.inlineID).updateTags('send', []);
            };
            // resize
            this.resize();
        },

        // listens for tag entry as well as enter, space, right, tab and control keys
        handleKeyDown: function(ev) {
            //opera.postError('Delicious.TagLines.handleKeyDown()');
            // get key that was clicked
            var thisKey = ev.keyCode;
            this.controlKeyIsDown = false;
            switch (thisKey) {
                case 13:   // enter key
                    if (ev.preventDefault) ev.preventDefault();
                    else ev.returnValue = false;
                    //this.exeAC();
                    break;
                case 32:   // space key
                    if (ev.preventDefault) ev.preventDefault();
                    else ev.returnValue = false;
                    this.exeSpaceKey(ev);
                    break;
                case 39:   // right key
                    //this.exeAC();
                    break;
                case 8:
                    this.exeBackspaceKey(ev);
                    break;
                case 9:   // tab key
                    //this.exeAC();
                    break;
                case 224:  // control key (keep track for cut-and-paste operations)
                    this.controlKeyIsDown = true;
                    break;
            };
        },

        /* listens specifically for the backspace key
        handleKeyPress: function(ev) {
            var thisKey = ev.keyCode;
            //opera.postError('Delicious.TagLines.handleKeyPress('+thisKey+')');
            if (thisKey == 8) {    // backspace key
                this.exeBackspaceKey(ev); 
            }; 
        },
        */

        // listens specifically for the "V" key, when control is already pressed in
        handleKeyUp: function(ev) {
            //opera.postError('Delicious.TagLines.handleKeyUp()');
            var thisKey = ev.keyCode;
            if (thisKey == 86 && this.controlKeyIsDown) {    // paste key 
                this.exeSpaceKey(ev);
            };
        },

        // listens for 'clicks' on completed tags
        handleTagClick: function(ev) {
            //opera.postError('Delicious.TagLines.handleTagClick()');

            // get tag that was clicked
            var target = Evt.getTarget(ev);
            var nodeName = target.nodeName.toLowerCase();

            // don't need to fire things onBlur
            window.clearTimeout(this.blurTimer);
            this.blurTimer = null;

            // delete tag
            if (nodeName=='span' && Dom.hasClass(target, 'rm')) {
                // remove tag
                Evt.stopEvent(ev);
                target = target.parentNode.parentNode;
                var tag = this.getUITagValue(target);
                this.removeTag(target, tag);
                // resize and return
                this.resize();
                return;
            };
            
            // edit tag
            if (nodeName=='em' || nodeName=='a') {
                // edit tag
                Evt.stopEvent(ev);
                target = (nodeName=='em') ? target.parentNode.parentNode : target.parentNode;
                this.editTag(target);
                // resize and return
                //this.resize();
            };
        },




        /**
         ** EXECUTE (based on Event Handlers)
         */

        // execute if backspace key was pressed, via this.handleKeyPress()
        exeBackspaceKey: function() {
            //opera.postError('Delicious.TagLines.exeBackspaceKey()');
            if (this.newTagInput.value=='') {
                this.editTag();
            };
        },

        // runs it the spacebar was pressed, via this.handleKeyDown()
        exeSpaceKey: function(ev) {
            var value = this.newTagInput.value.trim();
            //opera.postError('Delicious.TagLines.exeSpaceKey('+ value +')');

            // make sure latest tag has no spaces in it already (cut & paste error??)
            var tags = value.split(' ');
            // Add tag, and clear value
            for (var i=0; i<tags.length; i++) {
                if (tags[i] && tags[i]!=' ') {
                    this.addTag(tags[i]);
                };
            };

            // clear tag input value
            this.newTagInput.value = '';
        },
        
        // fired by the AutoComplete object, whenever a completion is done
        exeAC: function() {
            //opera.postError('Delicious.TagLines.exeAC()');
            this.ACTimer = window.setTimeout(this.objName + '.exeSpaceKey()', 10)
        },




        /**
         ** TAG ADDING METHODS
         */
        addTag: function(tag) {
            //opera.postError('Delicious.TagLines.addTag('+tag+')');
            
            if (!tag) return;

            // check to see if this is already in the list
            var tagIndex = this.getTagIndexData(tag)
            if (tagIndex > -1 ) {
                this.flashUITag(tagIndex);
                return;
            };

            // add tag to data array
            this.addTagToData(tag);

            // add new tag to UI
            this.addUITag(tag);

            // highlight any suggestions, that match the tag
            if (this.caller.isRegistered('suggestions', this.inlineID)) {
                this.caller.getRegisteredObject('suggestions', this.inlineID).highlightTag('send', tag);
            };

            // resize input field
            this.resize();
        },

        // just an alias
        addOutsideTag: function(tag) {
            //opera.postError('Delicious.TagLines.addOutsideTag('+tag+')');
            this.addTag(tag);
        },

        // EDIT TAGS 
        //selectAll: true,
        editTag: function(tagObj) {
            //opera.postError('Delicious.TagLines.editTag()');
            //opera.postError(tagObj);

            // if there is currently content in the input field, save it as a tag
            if (this.newTagInput.value && this.newTagInput.value!=' ') {
                this.addTag(this.newTagInput.value);
            };

            // if no tag specified, get last tag item instead
            if (!tagObj) {
                tagObj = this.getLastUITag();
            };
            
            // get tag value
            var tag = this.getUITagValue(tagObj);    

            // remove the tag
            this.removeTag(tagObj, tag);
            
            // add the tag        
            if (tag)
                window.setTimeout(this.objName + '.editTagTimeout(\''+tag+'\')', 10);
        },

        // this is in a seperate function because it needs to execute on Timeout after calling editTags()        
        editTagTimeout: function(tag) {
            //opera.postError('Delicious.TagLines.editTagTimeout('+ tag +')');
            this.newTagInput.value = tag;
            this.newTagInput.select();

            this.resize();
        },
        
        removeTag: function(tagObj, tag) {    
            //opera.postError('Delicious.TagLines.removeTag('+tag+')');
            // get tag vlue, if not present
            if (!tag)
                tag = this.getUITagValue(tagObj);
            // remove from YUI
            if (tagObj && tagObj.parentNode)
                tagObj.parentNode.removeChild(tagObj);
            // remove tag from Data
            this.removeTagFromData(tag);
            // highlight any suggestions, that match the tag
            if (this.caller.isRegistered('suggestions', this.inlineID))
                this.caller.getRegisteredObject('suggestions', this.inlineID).clearTag('send', tag);
        },

        removeOutsideTag: function(tag) {
            //opera.postError('Delicious.TagLines.removeOutsideTag('+tag+')');
            var tagObj = this.getUITag(tag);
            this.removeTag(tagObj, tag);
        },
        
        removeAllTags: function(tagObj, tag) {  
            //opera.postError('Delicious.TagLines.removeAllTags()');
            // get tags
            var tags = this.getUITags();
            // hide input, so it doesn't flash to the next line before resize() can get to it
            this.newTagInput.style.display = 'none';
            // remove from UI
            for (var i=0; i<tags.length; i++) {
                // remove visible 
                this.removeTag(tags[i]);
            };
            // update tag data
            this.clearTagData();
            // show the tag input again
            this.newTagInput.style.display = 'block';
            // resize
            this.resize();
        },

        // use this when you don't know whether you're adding or deleting a tag from the line
        // IF the tag is present in the input, delete it. If it is absent, add it
        updateTag: function(tag) {
            //opera.postError('Delicious.TagLines.updateTag('+tag+')');
            // check to see if this tag exists
            tag = (tag.substr(0, 4)=='for:') ? tag.substr(4) : tag;
            //opera.postError(tag);
            var currentTag = this.getUITag(tag)
            //opera.postError(currentTag);
            if (currentTag)
                this.removeTag(currentTag, tag);
            else 
                this.addTag(tag);
            // focus on field
            //this.newTagInput.focus();
        },


        removeAllProviders: function() {
            //opera.postError('Delicious.TagLines.removeAllProviders()');
            // get tags
            var tags = this.getUITags();
            // hide input, so it doesn't flash to the next line before resize() can get to it
            this.newTagInput.style.display = 'none';
            // remove from UI
            var tagValue = '';
            for (var i=0; i<tags.length; i++) {
                tagValue = this.getUITagValue(tags[i]);
                if (tagValue.substr(0, 1) == '@') {
                    this.removeTag(tags[i], tagValue);
                };
            };
            // update tag data
            this.clearTagData();
            // resize
            this.resize();
        },




        /**
        ** TAG-DATA MANAGEMENT
        ** All completed tags are stored in the this.tagsArray array(), as well as the hidden 'tags' input
        **/

        // everytime a tag is added (via spacekey, or AC), the tag is added
        // to this.tagsArray, as well as the hidden 'tags' input
        addTagToData: function(tag) {
            //opera.postError('Delicious.TagLines.addTagToData('+ tag +')');
            // let's only deal with lowercase here
            tag = tag.toLowerCase();
            // add to string
            Dom.addClass(this.oldTagInput, tag);
            this.oldTagInput.value = this.oldTagInput.className;
            // add to array
            this.tagsArray = this.oldTagInput.value.split(' ');
            //opera.postError(this.tagsArray);
        },

        // everytime a tag is deleted (via backspace, or click), the tag is removed
        // from this.tagsArray, as well as the hidden 'tags' input
        removeTagFromData: function(tag) {
            //opera.postError('Delicious.TagLines.removeTagFromData('+ tag +')');
            // let's only deal with lowercase here
            tag = tag.toLowerCase();
            // remove from hidden form field
            Dom.removeClass(this.oldTagInput, tag);
            this.oldTagInput.value = this.oldTagInput.className;
            // remove fom array
            this.tagsArray = this.oldTagInput.value.split(' ');
            //opera.postError(this.tagsArray);
        },
        
        // removes all Tag Data
        clearTagData: function() {
            //opera.postError('Delicious.TagLines.clearTagData()');
            this.tagsArray = [];
            this.oldTagInput.className = '';
            this.oldTagInput.value = '';
        },
        
        // returns the index of the desired tag in this.tagsArray
        getTagIndexData: function(tag) {
            //opera.postError('Delicious.TagLines.getTagIndexData('+tag+')');
            for (var i=0; i<this.tagsArray.length; i++) {
                if (this.tagsArray[i].toLowerCase() === tag.toLowerCase()) {
                    return i;
                };
            };
            return -1;
        },

        // count number of tags currently in data
        countTagData: function() {
            //opera.postError('Delicious.TagLines.countTagData()');
            return this.tagsArray.length;
        },




       /**
        ** TAG-UI MANAGEMENT
        ** Handles accessing, creating and deleting the tags we display in the UI
        **/

        // returns a list of the displayed tags
        getUITags: function() {
            //opera.postError('Delicious.TagLines.getUITags()');
            return Dom.getElementsByClassName(this.tagLinesItemClass ,'li', this.newTagsList);
        },

        // returns the last UI tag obj (used when the user hits the backspace)
        // accepts the 'tagList' arg, simply so you don't have to go fetch these
        // again if you already have it
        getLastUITag: function(tagList) {
            //opera.postError('Delicious.TagLines.getLastUITag()');
            if (!tagList) {
                tagList = this.getUITags();
            };
            var last = tagList.length;
            if (last > 0) {
                return tagList[last-1];
            } else {
                return false;
            }
        },

        // returns a UI tag obj, by tag string (used when a user clicks on a tag)
        getUITag: function(tag) {
            //opera.postError('Delicious.TagLines.getUITag('+tag+')');
            // find out which index the tag is at
            var tagIndex = this.getTagIndexData(tag);
            if (tagIndex < 0) return false;   // make sure this tag actually exists
            // get tag UI object
            var tags = this.getUITags();
            if (tagIndex > tags.length) return false;   // make sure this tagIndex actually exists
            // return whatever we have
            return tags[tagIndex];
        },

        // returns a UI tag obj, by index position
        getUITagByIndex: function(tagIndex) {
            //opera.postError('Delicious.TagLines.getUITagByIndex('+tagIndex+')');
            // get a list of tags
            var tags = this.getUITags();
            if (tagIndex > tags.length) return false;   // make sure this tagIndex is represented by a real tag
            // return whatever is in the right position
            return tags[tagIndex];
        },

        // returns the tag (string) from a tagObj
        getUITagValue: function(tagObj) {
            //opera.postError('Delicious.TagLines.getUITagValue()');
            if (!tagObj) return '';
            var tags = tagObj.getElementsByTagName('em');
            if (!tags || tags.length <1) return '';
            return tags[0].innerHTML.trim();
        },

        // adds a tag to the UI
        addUITag: function(tag) {
            //opera.postError('Delicious.TagLines.addUITag()');
            // determine what class to use, if it's a "share" or "tag" item
            var className = this.tagLinesItemClass;
            if (this.objType=='Send') {
                className +=  ' '+ this.tagLinesShareItemClass;
                
                // If the string is a for: tag, strip for:
                if (tag.substr(0,4)=='for:') {
                    tag = tag.substr(4);
                }
            };
            // create the tag and add it to the DOM
            var tagObj = LI({'class':className}, A({}, [EM({}, tag), SPAN({'class':'rm'}, '')]))
            this.newTagsList.insertBefore(tagObj, this.newTagItem);
        },

        // adds a temporary className to an existing UI tag
        // to give a visual clue that the tag already exists
        flashUITag: function(tagIndex) {
            //opera.postError('Delicious.TagLines.flashUITag('+tagIndex+')');
            var tag = this.getUITagByIndex(tagIndex);
            Dom.addClass(tag, 'flash');
            window.setTimeout(this.objName + '.unFlashUITag('+tagIndex+')', 100)
        },
        
        // removes a temporary className to an existing UI tag
        unFlashUITag: function(tagIndex) {
            //opera.postError('Delicious.TagLines.unFlashUITag('+tagIndex+')');
            var tag = this.getUITagByIndex(tagIndex);
            Dom.removeClass(tag, 'flash');
        },




        /**
         ** RESIZE UI STUFF
         ** Note: This is VERY specific to the CSS being used
         */
        resize: function(tag) {
            //opera.postError('Delicious.TagLines.resize()');

            // first, we need to clear all widths, to allow the elements to auto-flow
            this.formRow.style.width = 'auto';
            this.newTagsEditor.style.width = 'auto';
            this.newTagsList.style.width = 'auto';
            this.newTagItem.style.width = '100px';

            // get the objects we need
            var tagsList = this.getUITags();
            var lastTag = this.getLastUITag(tagsList);

            // tells us how much total room we have to play with
            var formRowWidth = this.getTagEditorWidth();

            // if this is 0, it means the module is closed and we don't need to do it
            if (formRowWidth < 1) return;

            // account for any padding
            var tagEditorWidth = (Delicious.isChromeExt) ? formRowWidth : formRowWidth+4;

            // hard-code in the widths of the parent nodes, so we don't
            // get confused with 100% widths + padding...
            this.formRow.style.width = (formRowWidth) + 'px';
            this.newTagsEditor.style.width = (tagEditorWidth) + 'px';
            this.newTagsList.style.width = (tagEditorWidth-6) + 'px';

            // tells us what line the last tag is on
            var lastTagOffsetWidth, lastTagOffsetLeft;
            if (lastTag) {
                lastTagOffsetWidth = lastTag.offsetWidth;
                lastTagOffsetLeft  = lastTag.offsetLeft;
            } else {
                lastTagOffsetWidth = 0;
                lastTagOffsetLeft  = 0;
            };

            // calculate the remaining space left over
            var remainingWidth = (tagEditorWidth - (lastTagOffsetWidth + lastTagOffsetLeft));
            //opera.postError('remainingWidth: '+ remainingWidth);

            // make a new line if there isn't enough space
            var isNewLine = false;
            if (tagsList.length<1 || remainingWidth < 100) {
                //opera.postError('*** NEW LINE!!!');
                var isNewLine = true;
                remainingWidth = tagEditorWidth;
            };

            // define size of input
            var inputSize = (remainingWidth- this.offset) + 'px';
            this.newTagItem.style.width = inputSize;

            // change AC position
            var ACResults = Dom.get('send-ac-results');
            if (ACResults) {
                if (isNewLine) 
                    ACResults.style.left = '0px';
                else
                    ACResults.style.left = (lastTagOffsetWidth + lastTagOffsetLeft +2)+'px';
            };


            // decide whether to show message field or not
            if (this.caller.isRegistered('message', this.inlineID)) {
                if (tagsList.length > 0) {
                    this.caller.getRegisteredObject('message', this.inlineID).toggleMessage(true);
                } else {
                    this.caller.getRegisteredObject('message', this.inlineID).toggleMessage(false);
                };
            };

            // decide whether to show the clear-all button
            this.clearAll.style.display = (tagsList.length > 0) ? 'block' : 'none';

            // if this is the popup, we need to resize that too:
            if (Delicious.BookmarkletVersion && Delicious.BookmarkletVersion.isActive)
                Delicious.BookmarkletVersion.resize();

        },


        focus: function() {
            this.newTagInput.focus();
        },
        
        //tagEditorWidth: false,
        getTagEditorWidth: function() {
            // simply return value, if user hasn't resized (don't need to calculate every time!)
            return this.formRow.offsetWidth;
        },

        EOF: null
    };
};






/**
 * UI code for Url module pages.
 */
Delicious.Post = function() { 
    //  suggestions, tags, send
    var _registered = {};

    return {

        /**
         * Initialize elements on the page
         */
        init: function() {
            //opera.postError('Delicious.Post.init()');

            // initialize tag/send suggestions
            this.SuggestionsManager = new Delicious.SuggestionsManager;
            this.SuggestionsManager.init('recs', Delicious.Post);
            this.setRegisteredObject('suggestions', this.SuggestionsManager);

            // initialize message editor
            this.MessageEditor = new Delicious.MessageEditor;
            this.MessageEditor.init('messageField', 'Delicious.Post.MessageEditor', Delicious.Post);
            this.setRegisteredObject('message', this.MessageEditor);

            // initialize send editor
            this.SendEditor = new Delicious.TagLines;
            this.SendEditor.init('send', 'Send', 'Delicious.Post.SendEditor', Delicious.Post, 8);
            this.setRegisteredObject('send', this.SendEditor);

            // initialize tags editor
            this.TagsEditor = new Delicious.InputTags;
            this.TagsEditor.init('tags', 'Tags', 'Delicious.Post.TagsEditor', Delicious.Post);
            this.setRegisteredObject('tags', this.TagsEditor);

            // initialize Suggestions Tabbed-Panel support
            this.SuggestionsPanel = new Delicious.SuggestionsPanel;
            this.SuggestionsPanel.init(Delicious.Post);
            this.setRegisteredObject('panel', this.SuggestionsPanel);

            // initialize scrollable panels
            this.ScrollPanel = new Delicious.ScrollPanels;
            this.ScrollPanel.init('sendPanelBd', 'panel-list', 'recs', 'Delicious.Post.ScrollPanel', Delicious.Post);
            this.setRegisteredObject('scrollpanels', this.ScrollPanel);

            // initialize twitter account
            this.TwitterSettings = new Delicious.SendSettings;
            this.TwitterSettings.init('twitter', 'Twitter');

            // initialize 'mark private' checkbox
            this.Private = new Delicious.MarkPrivate;
            this.Private.init('share', 'Delicious.Post.Private', Delicious.Post);
            this.setRegisteredObject('markprivate', this.Private);

            // handle 'cancel' button
            Evt.on('cancel', 'click', this.handleCancelClick, this, true);

            // handle sort controls
            this.Sort = new Delicious.SortSuggestions;
            this.Sort.init();
            this.setRegisteredObject('sort', this.Sort);

            // focus on the tag input
            var tagsObj = Dom.get('tags');
            if (tagsObj && tagsObj.focus)
                tagsObj.focus();

            // add notes input counter
            this.notesCounter = new Delicious.textareaCounter;
            this.notesCounter.init('notes', 'notescount', 1000);

            // add message input counter
            this.msgCounter = new Delicious.textareaCounter;
            this.msgCounter.init('messageField', 'messagecount', 116);

            // bookmarklet delete (BUG #2117179)
            if (Dom.get('popupDelete')) {
                Evt.on('savedon', 'click', this.handleDeleteClick, this, true);
            };
        },

       /*
        * OUTSIDE AC callback-funcitons
        */
        ACTagsCallback: function() {
            //opera.postError('Delicious.Post.ACTagsCallback()');
            var type = 'tag';
            var tag = '';
            try {
                type = arguments[1][2][2];
                tag  = arguments[1][2][0];
            } catch (e) {};
            if (type=='for') {
                if (Delicious.Post.isRegistered('tags') ) {
                    Delicious.Post.getRegisteredObject('tags').exeAC(tag);
                };
            };
        },

        ACSendCallback: function() {
            //opera.postError('Delicious.Post.ACSendCallback()');
            if (Delicious.Post.isRegistered('send') ) {
                // do post AC stuff
                Delicious.Post.getRegisteredObject('send').exeAC();
                // clear the onBlur timer, since we have to blur to do this via a mouse-click
                Delicious.Post.getRegisteredObject('send').blurTimer = false;
                Window.clearTimeout(Delicious.Post.getRegisteredObject('send').blurTimer);
            };
        },


       /*
        * JS OBJECT REGISTRATION
        */
        isRegistered: function(type) {
            if (_registered[type]) return true;
            else return false;
        },
        setRegisteredObject: function(type, jsObj) {
            _registered[type] = jsObj;
        },
        getRegisteredObject: function(type) {
            if (_registered[type]) return _registered[type];
            else return false;
        },

        handleCancelClick: function(ev) {
            if (Evt.getTarget(ev)==Dom.get('cancel') && Dom.get('oldurl').value!='new') {
                Evt.stopEvent(ev);
                history.back();
            };

        },

       /*
        * EVENT HANDLERS
        */
        handleDeleteClick: function(ev) {
            Evt.stopEvent(ev);
            var target = Evt.getTarget(ev);
            // hide actuator
            if (target.id == 'delete') {
                this.handleDelete();
            } else if (target.id == 'deleteconfirm') {
                this.handleDeleteConfirm();
            } else if (target.id == 'deletecancel') {
                this.handleDeleteCancel();
            };
        },

        handleDelete: function() {
            // get confirmation
            Dom.removeClass('deleteconfirmation', 'hidden');
            // hide delete link
            Dom.addClass('delete', 'hidden');
            // hide date
            Dom.addClass('saveMsg', 'hidden'); 
        },

        handleDeleteCancel: function() {
            // get confirmation
            Dom.addClass('deleteconfirmation', 'hidden');
            // hide delete link
            Dom.removeClass('delete', 'hidden');
            // hide date
            Dom.removeClass('saveMsg', 'hidden');
        },

        handleDeleteConfirm: function() {
            // add 'doing something' icon
            Dom.addClass('deleteconfirmation', 'deleting');

            // Grab the item data from the form and package as a JSON string.
            var deleteConf = Dom.get('deleteconfirm');
            var params = Delicious.BookmarkList.getParamsFromURL(deleteConf.href);

            var data_json = JSONstring.make({
                'time': params['time'],
                'key':  params['key'],
                'hash': params['hash'],
                'url':  decodeURIComponent(params['url'])
            });

            // Fire off the AJAX POST with the new bookmark data.
            Conn.asyncRequest('POST', '/ajax/item/delete', {
                argument: [],
                success:  this.handleItemDeleteSuccess,
                failure:  this.handleItemDeleteFailure,
                scope:    this
            }, data_json);
        },

        handleItemDeleteSuccess: function(o) {
            window.close();
        },

        handleItemDeleteFailure: function(o) {
            // get confirmation
            Dom.addClass('deleteconfirmation', 'hidden');
            // hide delete link
            Dom.addClass('delete', 'hidden');
            // hide date
            Dom.removeClass('saveMsg', 'hidden');
            // message user of problem
            alert('there has been an error.\nPlease close this window and try again,\nor delete directly from www.delicious.com.');
            window.close();
        },
       
        EOF: null
	};
}();




    
Delicious.SortSuggestions = function() {
    return {

        sortObj: false,
        sortOptionsObj: false,
        alphaObj: false,
        frequencyObj: false,
        tagsRecObj: false,
        urlStr: '',

        init: function() {
            //opera.postError('Delicious.SortSuggestions.init()');

            this.sortOptionsObj = Dom.get('sortByOptions');
            this.alphaObj = Dom.get('alphaSort');
            this.frequencyObj = Dom.get('frequencySort');
            this.tagsRecObj = Dom.get('tags-rec');

            this.sortObj = Dom.get('sortBy');
            Evt.on(this.sortObj, 'click', this.handleClick, this, true);
        },

        destroy: function() {
            Evt.removeListener(this.sortObj, 'click', this.handleClick);
        },

        handleClick: function(ev) {
            //opera.postError('Delicious.SortSuggestions.handleClick()');
            // prevent link from firing
            Evt.stopEvent(ev);
            // determine which action to take
            var target = Evt.getTarget(ev);
            if (target.nodeName=='A') {
                if (!this.urlStr) {
                    var tmp = target.href.split('?url=');
                    if (tmp[1])
                        this.urlStr = tmp[1];
                };
                // do AJAX sort
                var sortType = (target==this.alphaObj) ? 'alpha' : 'frequency';
                // display 'load' notice
                this.displayLoadMsg();
                // do the sorting
                Conn.asyncRequest('GET', '/ajax/post/getAjaxTags?sort='+ sortType +'&url='+ this.urlStr, {
                    argument: sortType,
                    success:  this.getTagsSuccess,
                    failure:  this.getTagsFailure,
                    scope:    this
                });
            };
        },

        displayLoadMsg: function() {
            this.sortObj.innerHTML = '<p><strong>'+ del_text.msgs.TXT_LOADING +'</strong></p>';
        },

        getTagsSuccess: function(o) {
            //opera.postError('Delicious.SortSuggestions.getTagsSuccess()');
            // set cookie
            Delicious.util.addCookie('post-sort', o.argument, 'perm');
            // remove existing tags
            if (this.tagsRecObj) {
                this.tagsRecObj.innerHTML = '';
            };
            // remove eventListener
            this.destroy();
            // add new tags
            var text = o.responseText;
            this.tagsRecObj.innerHTML = text;
            // re-init
            this.init();
            // re-init Tag Suggestions & highlighting
            if (Delicious.Post.isRegistered('suggestions')) {
                Delicious.Post.getRegisteredObject('suggestions').init('recs', Delicious.Post);
                if (Delicious.Post.isRegistered('tags'))
                    Delicious.Post.getRegisteredObject('tags').handleKeyUp();
            };
        },

        getTagsFailure: function(o) {
            // display error message
            this.sortObj.innerHTML = '';
            var errMsg = P({'class':'error'}, 'There has been an error sorting your tags. Please try again later.');
            this.sortObj.appendChild(errMsg);
        },

        EOF:null
    };
};



Delicious.SuggestionsPanel = function() {
    return {

        /**
         * Given an element containing tabs, set up the click event handler.
         */
        init: function(caller) {
            this.tagsAct = Dom.get('act-tags-rec');
            this.tagsPanel = Dom.get('tags-rec');
            this.sendAct = Dom.get('act-send-rec');
            this.sendPanel = Dom.get('send-rec');

            this.sendNetworkList = Dom.get('sendNetworkList');

            this.caller = caller;

            // get current 'on' item
            this.currentlyOn = (Dom.hasClass(this.tagsAct.parentNode, 'selected')) ? 'tags' : 'send';

            if (this.caller.isRegistered('tags')) {
                var tagsInput = this.caller.getRegisteredObject('tags').tagsInput;
                Evt.on(tagsInput, 'focus', this.handleTagsFocus, this, true);
            };
            if (this.caller.isRegistered('send')) {
                var sendInput = this.caller.getRegisteredObject('send').newTagInput;
                Evt.on(sendInput, 'focus', this.handleSendFocus, this, true);
            };
            Evt.on('recTabs', 'click', this.handleTabClick, this, true);
            Evt.on('sendNetworkList', 'click', this.handleSendListClick, this, true);

            if (this.caller.isRegistered('tags'))
                this.caller.getRegisteredObject('tags').handleKeyUp();
        },

        handleTagsFocus: function() {
            this.togglePanel('tags');
        },

        handleSendFocus: function() {
            this.togglePanel('send');
        },

        handleTabClick: function(ev) {
            var target = Evt.getTarget(ev);
            Evt.stopEvent(ev);
            if (target == this.tagsAct) {
                this.togglePanel('tags')
            } else {
                this.togglePanel('send');
            };
        },

        togglePanel: function(type) {
            if (type == this.currentlyOn) return;
            if (type == 'tags') {
                this.currentlyOn = 'tags';
                // toggle tabs
                Dom.addClass(this.tagsAct.parentNode, 'selected');
                Dom.removeClass(this.sendAct.parentNode, 'selected');
                // toggle panels
                Dom.addClass(this.sendPanel, 'hidden');
                Dom.removeClass(this.tagsPanel, 'hidden');
                // place focus into tags input
                if (this.caller.isRegistered('tags'))
                    this.caller.getRegisteredObject('tags').focus();
            } else {
                this.currentlyOn = 'send';
                // toggle tabs
                Dom.addClass(this.sendAct.parentNode, 'selected');
                Dom.removeClass(this.tagsAct.parentNode, 'selected');
                // toggle panels
                Dom.addClass(this.tagsPanel, 'hidden');
                Dom.removeClass(this.sendPanel, 'hidden');
                // place focus into tags input
                if (this.caller.isRegistered('send'))
                    this.caller.getRegisteredObject('send').focus();
            };
        },

        handleSendListClick: function(ev) {
            //opera.postError('handleSendListClick()');

            var target = Evt.getTarget(ev);
            Evt.stopEvent(ev);

            // make sure we just clicked on a psuedo-link
            if (!Dom.hasClass(target.parentNode, 'netAct')) return;

            // get ID for this 'link'
            target = target.parentNode;
            var typeID = target.id.substr(7).toLowerCase();
            

            this.toggleNetworkList(target, typeID);

            // move focus back up to SEND field
            if (this.caller.isRegistered('send'))
                this.caller.getRegisteredObject('send').focus();
        },

        toggleNetworkList: function(target, typeID) {
            //opera.postError('toggleNetworkList('+typeID+')');
            // get list of actuators, and hide
            var actuators =  Dom.getElementsByClassName('netAct', 'li', 'sendNetworkList');
            Dom.removeClass(actuators, 'selected');

            // get list of panels, and hide
            var panels =  Dom.getElementsByClassName('sendPanel', 'div', 'sendOptions');
            Dom.removeClass(panels, 'visible');

            // make visible
            Dom.addClass(target, 'selected');
            Dom.addClass(typeID+'SendPanel', 'visible');
        },

        EOF: null
    };
};



/**
 ** This basically keeps track of when users click on suggestions,
 ** as well as turning them on/off via tag/send input 
 */
Delicious.SuggestionsManager = function() {

    /* PRIVATE PROPERTIES & METHODS */
    var _tagData = {};
    var _sendData = {};
    var _activeTags = {};
    var _activeSends = {};

    // this takes an array of suggested tags, 
    // and populates an internal associative array
    // where each tag acts as an array index 
    // (so it's easy to retrieve all suggestions for a specific tag)
    _addAllSuggestions = function(type, suggestions) {
        //opera.postError('Delicious.SuggestionsManager._addAllSuggestions("'+type+'")');
        var data = _getAllSuggestions(type);
        for (var i=0; i<suggestions.length; i++) {
            _addSuggestion(type, suggestions[i], suggestions[i].title.toLowerCase(), data);
        };
        //opera.postError(data);
    };

    // this adds a suggested tag object
    // to an associative array of suggestion
    _addSuggestion = function(type, obj, key, data) {
        if (data[key] && typeof(data[key])!='function') {
            try {
                data[key].push(obj);
            } catch(err) {};
        } else {
            data[key] = [obj];
        };
    };

    // returns the entire array of suggestion 
    // based on type ('tags' or 'send');
    _getAllSuggestions = function(type) {
        var suggestionsArray = (type=='tags') ? _tagData : _sendData;
        return suggestionsArray;
    };

    // gets all the suggested tag objects 
    // for a specific tag
    _getSuggestions = function(type, key) {
        //opera.postError('_getSuggestions("'+type+'", "'+key+'")');
        var data = _getAllSuggestions(type);
        if (data[key]) {
            return data[key];
        } else if (data['for:'+key]) {
            return data['for:'+key];
        } else {
            return [];
        };
    };

    _addActiveSuggestion = function(type, key) {
        //opera.postError('_addActiveSuggestion("'+type+'", "'+key+'")');
        var activeSuggestions = _getActiveSuggestions(type);
        //opera.postError(activeSuggestions);
        activeSuggestions[key] = 1;
        //opera.postError(activeSuggestions);
    };

    _removeActiveSuggestion = function(type, key) {
        //opera.postError('_removeActiveSuggestion("'+type+'", "'+key+'")');
        var activeSuggestions = _getActiveSuggestions(type);
        //opera.postError(activeSuggestions);
        if (activeSuggestions[key])
            delete activeSuggestions[key];
            //opera.postError(activeSuggestions);
    };

    _getActiveSuggestions = function(type) {
        //opera.postError('_getActiveSuggestions("'+type+'")');
        var activeSuggestions = (type=='tags') ? _activeTags : _activeSends;
        var cleanArray = {};
        return activeSuggestions;
    };


    /* PUBLIC PROPERTIES & METHODS */
    return {

        rootObj: false,
        caller: false,

        /**
         ** INITIALIZATION
         */

        init: function(rootNodeID, caller) {
            //opera.postError('Delicious.SuggestionsManager.init("'+rootNodeID+'")');
            this.rootObj = Dom.get(rootNodeID);
            if (!this.rootObj) return;

            // scrape the DOM to get all the visible tags/sends on the page
            var suggestedTags = Dom.getElementsByClassName('m', '', this.rootObj);
            var suggestedSends = Dom.getElementsByClassName('m-for', '', this.rootObj);
  
            this.caller = caller;
           
            // add each tag to the base objects
            _addAllSuggestions('tags', suggestedTags);
            _addAllSuggestions('send', suggestedSends);

            // add eventListeners
            Evt.on(this.rootObj, 'click', this.handleClick, this, true);
        },



        /**
         ** LISTENING TO USER-INTERACTION
         */

        handleClick: function(ev) {
            //opera.postError('Delicious.SuggestionsManager.handleClick()');
            var target = Evt.getTarget(ev);
            // sometimes we use some a SPAN in there
            if (target.nodeName == 'SPAN') 
                target = target.parentNode;
            // cancel out click
            if (Dom.hasClass(target, 'm') || Dom.hasClass(target, 'm-for')) {
                Evt.stopEvent(ev);
                var type = (Dom.hasClass(target, 'm')) ? 'tags' : 'send';
                this.exeTagClick(target, type);
            };
        },

        exeTagClick: function(target, type) {
            var tag = target.title;
            //opera.postError('Delicious.SuggestionsManager.exeTagClick('+tag+', '+ type +')');
            if (type=='tags') 
                this.caller.getRegisteredObject('tags').updateTag(tag);
            else
                this.caller.getRegisteredObject('send').updateTag(tag);
        },




        /**
         ** TAG HIGHLIGHTING
         */

        // this adds highlighting to a tag
        highlightTag: function(type, key) {
            //opera.postError('Delicious.SuggestionsManager.highlightTag('+type+', '+key+')');

            key = key.toLowerCase();
            // do the highlighting
            var suggestions = _getSuggestions(type, key);
            var suggestionToHighlight = false;
            if (!suggestions) return;
            for (var i=0; i<suggestions.length; i++) {
                Dom.addClass(suggestions[i].parentNode, 'on');
                suggestionToHighlight = true;
            };
            // keep track of what's active
            if (suggestionToHighlight)
                _addActiveSuggestion(type, key);
        },

        // this removed the highlighting from any active tags
        clearTag: function(type, key) {
            //opera.postError('Delicious.SuggestionsManager.clearTag('+type+', '+key+')');
            key = key.toLowerCase();
            // clear any highlighting
            var suggestions = _getSuggestions(type, key);
            for (var i=0; i<suggestions.length; i++) {
                Dom.removeClass(suggestions[i].parentNode, 'on');
            };
            // keep track of what's active
            _removeActiveSuggestion(type, key);
        },

        // NOTE: might want to rewrite this.
        // It's less efficient but visually nicer, to only clear
        // the tags you don't want to highlight, and then add it in the
        // ones you DO. But this will do for now.
        updateTags: function(type, keys) {
            //opera.postError('Delicious.SuggestionsManager.updateTags('+type+')');
            // first, clear tags
            var activeSuggestions = _getActiveSuggestions(type);
            for (var i in activeSuggestions) {
                this.clearTag(type, i);
            };
            // second, add tags
            for (var i=0; i<keys.length; i++) {
                 this.highlightTag(type, keys[i]);
            };
        },
 
        EOF: null    
    };
};



Delicious.ScrollPanels = function() {
    return {

        init: function(className, innerClassName, parentObj, objName, caller) {
            //opera.postError('Delicious.ScrollPanels.init()');
            this.parentObj = (typeof parentObj == "string") ? Dom.get(parentObj) : parentObj;
            if (!this.parentObj) return; 

            this.objName = objName;
            this.innerClassName = innerClassName;

            var scrollMods = Dom.getElementsByClassName(className, '', this.parentObj);
            if (scrollMods.length > 0) {
                this.wireUp(scrollMods);
            };
        },

        wireUp: function(scrollMods) {
            //opera.postError('Delicious.ScrollPanels.wireUp()');
            var i, scrollers;
            for (i=0; i<scrollMods.length; i++) {
                scrollers = this.createScrollers();
                Evt.on(scrollers, 'mousedown', this.handleMouseDown, this, true);
                Evt.on(scrollers, 'mouseup', this.handleMouseUp, this, true);
                scrollMods[i].appendChild(scrollers);
            };
        },

        createScrollers: function() {
            var scrollUp = SPAN({'class':'scroll-up'}, []);
            var scrollDown = SPAN({'class':'scroll-down'}, []);
            var scrollArea = DIV({'class':'panel-scrollers'}, [scrollUp, scrollDown]);
            return scrollArea;
        },

        handleMouseDown: function(ev) {
            //opera.postError('Delicious.ScrollPanels.handleMouseDown()');
            this.target = Evt.getTarget(ev);
            Evt.stopEvent(ev);
            // scroll
            this.firedOnce = 0;
            this.scrollMod = this.getScrollMod(this.target);
            this.parent =  this.target.parentNode.parentNode;
            this.maxHeight = -(this.scrollMod.offsetHeight - this.parent.offsetHeight);
            if (Dom.hasClass(this.target, 'scroll-up')) {
                this.scrollAmount = 18;
                this.scroll();
                this.scrollAmount = 5;
                this.timer = window.setTimeout(this.objName + '.handleTimer()', 200);
            } else if (Dom.hasClass(this.target, 'scroll-down')) {
                this.scrollAmount = -18; 
                this.scroll();
                this.scrollAmount = -5;
                this.timer = window.setTimeout(this.objName + '.handleTimer()', 200);
            };
        },

        handleMouseUp: function(ev) {
            //opera.postError('Delicious.ScrollPanels.handleMouseUp()');
            window.clearTimeout(this.timer);
            window.clearInterval(this.interval);
            this.timer = false;
            this.interval = false;
        },

        handleTimer: function() {
           this.interval = window.setInterval(this.objName + '.scroll()', 20);
        },

        scroll: function() {
            if (this.scrollMod) {
                // get current top:
                var currentTop = this.scrollMod.offsetTop;
                var minHeight = 0;
                var proposedTop= currentTop + this.scrollAmount;
                var top = (proposedTop > 0) ? 0 : (proposedTop);
                top = (top < this.maxHeight) ? this.maxHeight : top;
                this.scrollMod.style.top = top + 'px';
            };
        },

        getScrollMod: function() {
            this.firedOnce++;
            var parent = this.target.parentNode.parentNode;
            var scrollMods = Dom.getElementsByClassName(this.innerClassName, '', parent);
            if (scrollMods.length)
                return scrollMods[0];
            else
                return false;
        },

        EOF:null
    };
};


Delicious.SendSettings = function() {
    return {

        prefix: false,
        initialCheckboxState: false,
        checkbox: false,
        buttons: false,
        message: false,

        init: function(prefix, service) {
            //opera.postError('Delicious.SendSettings.init("'+prefix+'")');

            // save which element this is for
            if (!prefix) return false;
            this.prefix = prefix;
            this.service = service;

            // only do this if it's a save dialog
            //opera.postError(Dom.get(prefix+'SendPanel'));
            if (Dom.get(prefix+'SendPanel')) {
                this.initRemember();
                this.initAuth();
            };
        },

        /**
         ** REMEMBER INPUT
         **/
        initRemember: function() {
            //opera.postError('Delicious.SendSettings.initRemember()');

            // initialize vars
            this.form       = Dom.get(this.prefix +'Form');
            this.checkbox   = Dom.get(this.prefix +'PostAll');
            this.label      = Dom.get(this.prefix +'Label');
            this.buttons    = Dom.get(this.prefix +'Bttns');
            this.saveBtn    = Dom.get(this.prefix +'Save');
            this.cancelBtn  = Dom.get(this.prefix +'Cancel');
            this.message    = Dom.get(this.prefix +'Msg');
            this.deleteLink = Dom.get(this.prefix + 'Delete');
            this.contentArea = Dom.get(this.prefix + 'SendStatus');
            if (this.checkbox)
                this.initialCheckboxState = this.checkbox.checked

            // add event listeners
            Evt.on(this.form, 'click', this.handleClick, this, true);
        },

        handleClick: function(ev) {
            //opera.postError('Delicious.SendSettings.handleClick()');
            var target = Evt.getTarget(ev);

            switch (target) {
                case this.saveBtn: this.exeSave(ev); break;
                case this.cancelBtn: this.exeCancel(ev); break;
                case this.deleteLink: this.exeDelete(ev); break;
                case this.checkbox: 
                case this.label: this.exeCheck(ev); break;
            };
        },

        handleError: function(target) {
            if (target.href) {
				var authHref = 'http://delicious.com'+ target.href.substr(target.href.indexOf('/settings/bookmarks/sharing'));
                var sendAuthWindow = window.open(authHref, "sendUuthWindow", "width=800, height=400");
            };
        },

        exeDelete: function(ev) {
            //opera.postError('Delciious.SendSettings.exeDelete()');
            Evt.stopEvent(ev);

            // post delete form
            Delicious.Common.linkToPostConverter(this.deleteLink.href);

            // remove activation stuff
            this.contentArea.innerHTML = '';
            var msg = DIV({'class':'msg'}, ['A request has been made to remove your credentials from '+this.service+'.']);
            this.contentArea.appendChild(msg);
        },

        exeCheck: function(ev) {
            //opera.postError('Delicious.SendSettings.exeCheck()');
            // if change in state, show buttons
            if (this.checkbox.checked != this.initialCheckboxState) {
                this.buttons.style.display = 'block';
                this.message.innerHTML = '';
            };
        },

        exeCancel: function(ev) {
            opera.postError('Delicious.SendSettings.exeCancel()');
            Evt.stopEvent(ev);
            this.buttons.style.display = 'none';
            this.checkbox.checked = this.initialCheckboxState;
        },

        exeSave: function(ev) {
            opera.postError('Delicious.SendSettings.exeSave()');
            Evt.stopEvent(ev);

            // add cylon-slider
            Dom.addClass(this.saveBtn.parentNode, 'loading');

            // submit form
            Conn.setForm(this.form);
            Conn.asyncRequest('POST',  '/ajax/social/subscribechannel', {
                success:  this.callbackSaveSuccess,
                failure:  this.callbackSaveFailure,
                scope:    this
            });
        },

        callbackSaveSuccess: function(o) {
            opera.postError('Delicious.SendSettings.callbackSaveSuccess()');

            // show save message
            this.message.innerHTML = '<div class="success">Saved!</div>';

            // remove cylon-slider & hide buttons
            Dom.removeClass(this.saveBtn.parentNode, 'loading');
            this.buttons.style.display = 'none';

            // reset state
            this.initialCheckboxState =  this.checkbox.checked;
        },

        callbackSaveFailure: function(o) {
            //opera.postError('Delicious.SendSettings.callbackSaveFailure()');
            
            // remove cylon-slider
            Dom.removeClass(this.saveBtn.parentNode, 'loading');
            this.buttons.style.display = 'none';

            // error msg
            this.message.innerHTML = '<div class="error">Error. Please try again later.</div>';

            // reset state
            this.initialCheckboxState =  this.checkbox.checked;
        },


        /*
         * AUTH BUTTON
         */
        initAuth: function() {
            //opera.postError('Delicious.SendSettings.initAuth()');

            // get vars
            this.authForm = Dom.get(this.prefix +'AuthForm');
            this.authBtn = Dom.get(this.prefix +'AuthBtn');

            // add event listener
            if (this.authForm)
                Evt.on(this.authBtn, 'click', this.handleAuth, this, true);
        },

        handleAuth: function(ev) {
            //opera.postError('Delicious.SendSettings.handleAuth()');
            // cancel button
            Evt.stopEvent(ev);
            // open up window
            var authWindow = window.open('', 'authWindow', 'width=820,height=500');
            // submit form to window
            this.authForm.target = 'authWindow';
            this.authForm.submit();
        },


        EOF: null
    };

};






Delicious.textareaCounter = function() {

    var _textareaMaxChars = 1000;

    return {

        maxChars: _textareaMaxChars,
        formFieldObj: false,
        counterObj: false,
        timer: false,

        /**
         * Initialize elements on the page
         */
        init: function(formFieldID, counterID, maxChars) {
            // set max characters
            if (maxChars) {
                this.maxChars = maxChars;
            };

            // set objects
            this.formFieldObj = Dom.get(formFieldID);
            this.counterObj = Dom.get(counterID);
            if (!this.formFieldObj || !this.counterObj) return;

            // wire up object
            this.wireUpFormField();
        },

        wireUpFormField: function() {
            // do initial calc
            var charactersLeft = this.countCharactersRemaining();
            this.changeLabel(charactersLeft);

            // add event listeners
            Evt.on(this.formFieldObj, "keyup", this.handleKeyUp, this, true);
            Evt.on(this.formFieldObj, "keydown", this.handleKeyDown, this, true);
 
            // run calculation, form might be pre-populated
            this.calculate();
        },

        handleKeyDown: function(ev) {
            window.clearTimeout(this.timer);
            this.timer = false;
        },

        handleKeyUp: function(ev) {
            DeliciousTextAreaCounter = this;
            if (!this.timer)
                this.timer = window.setTimeout('DeliciousTextAreaCounter.checkTimer()', 200);
        },

        checkTimer:  function(ev) {
            this.handleKeyDown();
            this.calculate();
        },

        calculate: function(ev) {
            // change label
            var charactersLeft = this.countCharactersRemaining();
            this.changeLabel(charactersLeft);

            // provide error message
            if (charactersLeft<0 && !Dom.hasClass(this.counterObj, 'error'))
                Dom.addClass(this.counterObj, 'error');
            if (charactersLeft>=0 && Dom.hasClass(this.counterObj, 'error'))
                Dom.removeClass(this.counterObj, 'error');

        },

        changeLabel: function(charactersLeft) {
            // NOTE: Can't do simple innerHTML here, IE is choking
            var labelTxt = (charactersLeft==1) ? del_text.msgs.TXT_CHAR_LEFT : del_text.msgs.TXT_CHARS_LEFT;
            var label = document.createTextNode(' '+labelTxt);
            var counter = EM({}, [charactersLeft]);
            this.counterObj.innerHTML = '';
            this.counterObj.appendChild(counter);
            this.counterObj.appendChild(label);
        },

        countCharactersRemaining: function (ev) {
            var charCount = false;
            var inputVal = this.formFieldObj.value.trim();
            charCount = inputVal.length;
            var charactersLeft = (this.maxChars-charCount);
            return charactersLeft;
        },

        getCount: function(countMe) {
            var escapedStr = encodeURI(countMe);
            if (escapedStr.indexOf("%") != -1) {
                var count = escapedStr.split("%").length - 1;
                if (count == 0) count++  //perverse case; can't happen with real UTF-8
                var tmp = escapedStr.length - (count * 3);
                count = count + tmp;
            } else {
                count = escapedStr.length;
            };
            return count;
        },

        countBytesRemaining: function(valueToCount) {
            var escapedStr, count, tmp;
            escapedStr = encodeURI(valueToCount);
            if (escapedStr.indexOf("%") != -1) {
                count = escapedStr.split("%").length - 1
                if (count == 0) count++  //perverse case; can't happen with real UTF-8
                tmp = escapedStr.length - (count * 3)
                count = count + tmp
            } else {
                count = escapedStr.length
            };
            return(count)
         },

        EOF:null
    };

};



Delicious.TagCounter = function() {
    var Dom  = YAHOO.util.Dom;

    return {

        tagObjs: {},

        showError: function(thisInputObj) {
            //opera.postError('Delicious.TagCounter.showError()');
            var thisCounterObj = Dom.getElementsByClassName('tagCounter', '', thisInputObj.parentNode)[0];
            if (thisCounterObj) {
                var thisIndex = thisCounterObj.id;
                // make sure it's not already on
                if (!this.tagObjs[thisIndex]) {
                    // change object
                    Dom.addClass(thisCounterObj, 'error');
                    this.tagObjs[thisIndex] = true;
                };
            };
        },

        hideError: function(thisInputObj) {
            //opera.postError('Delicious.TagCounter.hideError()');
            var thisCounterObj = Dom.getElementsByClassName('tagCounter', '', thisInputObj.parentNode)[0];
            if (thisCounterObj) {
                var thisIndex = thisCounterObj.id;
                if (this.tagObjs[thisIndex]) {
                    Dom.removeClass(thisCounterObj, 'error');
                    delete this.tagObjs[thisIndex];
                };
            };
        },

        EOF: null
    };
}();






Delicious.MessageEditor = function() {
    return {
        inlineID: false,

        init: function(messageInput, thisObj, caller, inlineID) {
            //opera.postError('Delicious.MessageEditor.init("'+ messageInput +'", "'+ thisObj +'", "'+ caller +'", "'+ inlineID  +'")');

            // messageInput can be either object or string
            this.messageInput = (typeof messageInput == "string") ? Dom.get(messageInput) : messageInput;

            // get caller, and name of own object
            this.thisObj = thisObj;
            this.caller = caller;
            this.inlineID = inlineID;
        },

        toggleMessage: function(trueOrFalse) {
            //opera.postError('Delicious.MessageEditor.toggleMessage('+trueOrFalse+')');
            this.messageInput.parentNode.style.display = (trueOrFalse) ? 'block' : 'none';
        },

        EOF: null

    };
};




/**
 * UI code for save/edit 'mark private' checkbox
 * @class Delicious.MarkPrivate
 */
Delicious.MarkPrivate = function() {

    var _active = true;

    return {

        thisObj: false,
        caller: false,
        inlineID: false,

        /**
         * @method init()
         * @description: initializes the privateCheckbox, adds eventListener
         */
        init: function(privateCheckbox, thisObj, caller, inlineID) {
            //opera.postError('Delicious.MarkPrivate.init()');
            // make sure we've got an object to work with
            if (typeof privateCheckbox == "string")
                this.privateCheckbox = Dom.get(privateCheckbox);
            if (!this.privateCheckbox) return;

            this.caller = caller;
            this.thisObj = thisObj;
            this.inlineID = inlineID;

            // add event listener to checkbox
            Evt.on(this.privateCheckbox, 'click', this.handleClick, this, true);
        },


        /**
         * @method handleClick()
         * @description: fires when user clicks on 'mark private' checkbox.
         * It checks whether or not there are any "@" tags in the SEND field, and strips those
         */
        handleClick: function() {
            //opera.postError('Delicious.MarkPrivate.handleClick()');
            //opera.postError(this.privateCheckbox);
            //opera.postError(this.caller.isRegistered('send', this.inlineID));
            if (this.privateCheckbox.checked && this.caller.isRegistered('send', this.inlineID)) {
                var sendObject = this.caller.getRegisteredObject('send', this.inlineID);
                sendObject.removeAllProviders();
            };
        },

        deActivate: function() {
            _active = false;
        },

        reActivate: function() {
            _active = true;
        },

        EOF: null
    };
};



Delicious.OperaUI = function() {
    return {
        rootNode: false,
		initialized: false,
	source: null,
        init: function() {
			if(this.initialized) return;
            opera.postError('OperaUI.init()');
            this.rootNode = Dom.get('chrome');
            Delicious.isChromeExt = true;
            var bgPage = opera.extension//.getBackgroundPage();
            //Show last error
            if(bgPage.DelXT.getLastAddBookmarkStatus() == "true") {
                    // removing loading stuff
                    Dom.removeClass('chrome', 'loadingPage');
                    var loadingMsg = Dom.get('loadingMsg')
                    if (loadingMsg)
                        loadingMsg.parentNode.removeChild(loadingMsg);
                    // initialize all JS on the page
                    Delicious.Opera.init();
                    //New
                    Dom.get('titleAction').innerHTML = "Delicious";
                    this.displayAddError();
                    bgPage.DelXT.resetAddBookmarkFailed();
                    return;
            }
            //Dom.get('msgs').innerHTML = window.location.href; 
            // Check for page URL and TITLE
		var tab = opera.extension.tabs.getFocused();
            chrome.windows.getCurrent(function(obj) {
                chrome.tabs.getSelected(obj.id, function(tab) {
                    try {
                      var pageUrl = tab.url;
                      var pageTitle = tab.title;
                      
                      //fetch from content script.
                      var contentScriptLoaded = false;
                      chrome.tabs.getSelected(null, function(tab) {
                          chrome.tabs.sendRequest(tab.id, {id: "pageDetails"},
                              function(response) {
                                if(response && response.title && !pageTitle) pageTitle = response.title;
                                contentScriptLoaded = true;
                                Delicious.OperaUI.getURLDetailsfromServer(pageUrl, pageTitle, response.notes);
                              });
                      });
                      
                      window.setTimeout(function(event) {
                        if(!contentScriptLoaded) {
                          Delicious.OperaUI.getURLDetailsfromServer(pageUrl, pageTitle, null);
                        }
                      }, 200);
                      return;
                    } catch (e) { };
                    Delicious.OperaUI.getURLDetailsfromServer(pageUrl, pageTitle, null);
                });
            });
        },
        
        getURLDetailsfromServer: function(pageUrl, pageTitle, notes) {
            var saveUrl = 'http://delicious.com/chromesave?json=1&url='
                            + encodeURIComponent(pageUrl) 
                            +'&title='
                            + encodeURIComponent(pageTitle)
                            +'&src='
                            +DEL_UA_STRING
                            +XT_VERSION;
            // put these values into the form

/*
            Dom.get('url').value = pageUrl;
            Dom.get('title').value = pageTitle;
*/
            // make call to get data
            Conn.asyncRequest('GET', saveUrl,
              {
                argument: [saveUrl, pageUrl, pageTitle, notes],
                success:  Delicious.OperaUI.getChromeSuccess,
                failure:  Delicious.OperaUI.getChromeFailure,
                scope: Delicious.OperaUI,
                timeout: 4000
              }
            );  
        },

        getChromeSuccess: function(o) {
            //this.printMsg('Note', 'OperaUI.getChromeSuccess()', 1);
		opera.postError(' in getChromeSuccess:\n' + _(o).join('\n'));
            // get fetch return
        	//strip off comments if any
        	  var res = o.responseText;
        	 	if(o.responseText && o.responseText.indexOf('<!--') != -1) {
        	 		res = o.responseText.substr(0, o.responseText.indexOf('<!--'));
        	 	}
            var results = YAHOO.lang.JSON.parse(res);
			
			// get user login, and fetch AC Data
			var tagsCallback = 'http://feeds.delicious.com/v2/json/tags/'
					+results.login
					+'?callback=Delicious.TagsData.callbackDynamicUserTags'
					+'&private='+results.tagsKey;
			Delicious.UserTagsData.setDynamicTags(tagsCallback);
			var sendCallback = 'http://feeds.delicious.com/v2/json/socialcontacts/'
					+results.login
					+'?callback=Delicious.TagsData.callbackDynamicSocialSend'
					+'&private='+results.socialKey;
			Delicious.UserSendData.setDynamicTags(sendCallback);
			Delicious.TagsData.init();
            
            // removing loading stuff
		this.source.postMessage({action: 'stop-loading'});
	/*
            Dom.removeClass('chrome', 'loadingPage');
            var loadingMsg = Dom.get('loadingMsg')
            if (loadingMsg)
                loadingMsg.parentNode.removeChild(loadingMsg);
	*/
            // initialize all JS on the page
            Delicious.Opera.init();
            
            // check for login
            if (!results.login) {
                return this.source.postMessage({action: 'display-login'});
                return this.displayLogin();
            };
		this.source.postMessage({
			action: 'update-fields'
			,login: results.login
			,key: results.crumb
			,url: results.url
			,title: results.title
			,notes: o.argument[3] || results.note
			,tags: results.tags
			,share: results.isprivate
		});
		this.source.postMessage({action: 'init'});
		this.source.postMessage({action: 'focus-tags'});

/*
            var addError = false;//turn it to true for testing
            if(addError) {
                Dom.get('titleAction').innerHTML = "Delicious";
                this.displayAddError();
                
                return;
            }
            // print signin name
            var loginName = EM({}, [
                'signed in as ',
                STRONG({}, [results.login])
              ])
            Dom.get('signedInAs').appendChild(loginName);
                        
            // take contents of return, and place on page
            Dom.get('key').value = results.crumb;
            Dom.get('url').value = results.url;
            Dom.get('title').value = results.title;
            if(results.type == "edit") {
                Dom.get('titleAction').innerHTML = "Edit a Bookmark";
                Dom.get('notes').value = results.note;
                Dom.get('tags').value = results.tags;
                if (results.isPrivate)
                    Dom.get('share').checked = true;
            }
            Dom.get('tags').focus();
						
						//if notes are supplied by selecting text on page. put them to notes field. Override exisitng notes
						if(o.argument[3]) {
								Dom.get('notes').value = o.argument[3];
						}
*/
        },
        
        getChromeFailure: function(o) {
            //opera.postError('OperaUI.getChromeFailure()');
            
            // print error message
		this.source.postMessage({
			action: 'print-message'
			,type: 'Note'
			,message: 'We were unable to determine whether or not you have previously saved this bookmark. Please feel free to save this as a new bookmark.'
			,isNew: 1
		});
		this.source.postMessage({action: 'stop-loading'});
		this.source.postMessage({action: 'focus-tags'});
//            this.printMsg('Note', 'We were unable to determine whether or not you have previously saved this bookmark. Please feel free to save this as a new bookmark.', 1); 
/*            
            // removing loading stuff
            Dom.removeClass('chrome', 'loadingPage');
            var loadingMsg = Dom.get('loadingMsg')
            if (loadingMsg)
                loadingMsg.parentNode.removeChild(loadingMsg);
            Dom.get('tags').focus();
*/
        },
        
        displayLogin: function() {
            var saveFields = Dom.get('saveFields');
            saveFields.innerHTML = '';
            
            //this.printMsg('Login', 'You are not currently signed in.', 1);
            var loginMsg = SPAN({}, [
                'You are not currently logged in.',
                document.createElement('br'),
                document.createElement('br'),
                'Please ',
                A({'id':'loginLink', 'href':'http://delicious.com/login', 'onclick':'window.open("http://delicious.com/login?noui=yes", "authWIndow", "width=800, height=400")'}, 'login'),
                ' and then try saving this page again.'
            ]);
            this.printMsg('Note', loginMsg, 1);
        },
        
        displayAddError: function() {
            var saveFields = Dom.get('saveFields');
            saveFields.innerHTML = '';
            var div = DIV({'class':'Note'}, ['Oops. Your last bookmark was not saved to delicious.com.']);
            Dom.get('msgs').appendChild(div);
        },
        
        printMsg: function(msgType, msgText, isNew) {
            if (isNew)
                Dom.get('msgs').innerHTML = '';
            var message = (YAHOO.lang.isString(msgText)) ? SPAN({}, msgText) : msgText;
            var div = DIV({'class':msgType.toLowerCase()}, [STRONG({},msgType+':'), message]);
            Dom.get('msgs').appendChild(div);
        },
        
        drawForm: function(formHTML) {
            // add text
            this.rootNode.innerHTML = formHTML;
            // initialize all JS on the page
            Delicious.Opera.init();
        },

        EOF: null
    };
}();




/**
 * UI code for Common module pages.
 * @class Delicious.Common
 */
Delicious.Opera = function() {

    var _registered = {};

    return {
    
        init: function() {
            //opera.postError('Delicious.Opera.init()');

            Delicious.Config.set('ACResults', 4);

            // add notes input counter
            this.notesCounter = new Delicious.textareaCounter;
            this.notesCounter.init('notes', 'notescount', 1000);

            // add message input counter
            this.msgCounter = new Delicious.textareaCounter;
            this.msgCounter.init('message', 'messagecount', 116);

            // initialize message editing
            this.MessageEditor = new Delicious.MessageEditor;
            this.MessageEditor.init('message', 'Delicious.Opera.MessageEditor', Delicious.Opera);
            this.setRegisteredObject('message', this.MessageEditor);

            // initialize send editor
            this.SendEditor = new Delicious.TagLines;
            this.SendEditor.init('send', 'Send', 'Delicious.Opera.SendEditor', Delicious.Opera, 12, 6);
            this.setRegisteredObject('send', this.SendEditor);

            // initialize tags editor
            this.TagsEditor = new Delicious.InputTags;
            this.TagsEditor.init('tags', 'Tags', 'Delicious.Opera.TagsEditor', Delicious.Opera);
            this.setRegisteredObject('tags', this.TagsEditor);

            // initialize 'mark private' checkbox
            this.PrivateObj = new Delicious.MarkPrivate;
            this.PrivateObj.init('share', 'Delicious.Opera.PrivateObj', Delicious.Opera);
            this.setRegisteredObject('markprivate', this.PrivateObj);

            // initialize twitter account
            this.TwitterSettings = new Delicious.SendSettings;
            this.TwitterSettings.init('twitter');

            // initialize buzz account
            this.BuzzSettings = new Delicious.SendSettings;
            this.BuzzSettings.init('buzz');

            // save and cancel buttons
            Evt.on('cancel', 'click', this.handleCancel, this, true);
            Evt.on('save', 'click', this.handleSave, this, true);

        },
        
        term: function() {
            // Clear all JS Objects
            this.notesCounter = false;
            this.msgCounter = false;
            this.MessageEditor = false;
            this.SendEditor = false;
            this.TagsEditor = false;
            this.PrivateObj = false;
            this.TwitterSettings = false;
            this.BuzzSettings = false;
            
            // clear registered objects
            _registered = {};

            // clear eventListeners
            // (don't do this to the 'cancel' button, people should still be able to cancel)
            Evt.purgeElement('save');
        },

        handleCancel: function(ev) {
            Evt.stopEvent(ev);
            window.close();
        },

        handleSave: function(ev) {
            if(ev) {
                Evt.stopEvent(ev);
            }

            // add loading notice
            var saveInput = Dom.get('save');
            var saveBtn = saveInput.parentNode;
            Dom.addClass(saveBtn, 'loading');
            saveInput.value = 'loading' 
            
            // clear JS objects from memory
            this.term();
            
            // make call
            Conn.setForm('saveitem');
            var fd = Conn._sFormData;
            //chrome.extension.getBackgroundPage().DelXT.handleSave(Dom.get('url').value, fd);
            opera.extension.DelXT.handleSave(Dom.get('url').value, fd);
            //window.close();
        },

        callbackSaveSuccess: function(o) {
		opera.postError('Opera.callbackSaveSuccess()\n' + _(o).join('\n'));
		o.action = 'save-Success';
		return Delicious.OperaUI.source.postMessage(o)

			
            if (o.responseText=='true') {
                window.close();
            } else {
                Delicious.OperaUI.drawForm(o.responseText);
            };          
        },

        callbackSaveFailure: function(o) {
		opera.postError('Opera.callbackSaveSuccess()\n' + _(o).join('\n'));
		o.action = 'save-Failure';
		return Delicious.OperaUI.source.postMessage(o)

            // add loading notice
            var saveInput = Dom.get('save');
            var saveBtn = saveInput.parentNode;
            Dom.removeClass(saveBtn, 'loading');
            saveInput.value = 'save' 
            saveBtn.removeChild(saveInput);
            // print error message
            this.printMsg('Error', 'Sorry, we were unable to save this bookmark. Please try again later', 1); 
        },

       /*
        * OUTSIDE AC callback-funcitons
        */
        ACTagsCallback: function() {
            //opera.postError('Delicious.Opera.ACTagsCallback()');
            var type = 'tag';
            var tag = '';
            try {
                type = arguments[1][2][2];
                tag  = arguments[1][2][0];
            } catch (e) {};
            if (type=='for') {
                if (Delicious.Opera.isRegistered('tags') ) {
                    Delicious.Opera.getRegisteredObject('tags').exeAC(tag);
                };
            };
        },

        ACSendCallback: function() {
            //opera.postError('Delicious.Opera.ACSendCallback()');
            if (Delicious.Opera.isRegistered('send') ) {
                // do post AC stuff
                Delicious.Opera.getRegisteredObject('send').exeAC();
                // clear the onBlur timer, since we have to blur to do this via a mouse-click
                Delicious.Opera.getRegisteredObject('send').blurTimer = false;
                Window.clearTimeout(Delicious.Opera.getRegisteredObject('send').blurTimer);
            };
        },


       /*
        * JS OBJECT REGISTRATION
        */
        isRegistered: function(type) {
            if (_registered[type]) return true;
            else return false;
        },
        setRegisteredObject: function(type, jsObj) {
            _registered[type] = jsObj;
        },
        getRegisteredObject: function(type) {
            if (_registered[type]) return _registered[type];
            else return false;
        },

        EOF: null

    };
}();



setTimeout(function() { alert(2) },100);
