/// <reference path="secret.ts" />
/// <reference path="bookmark.ts" />
/// <reference path="api.ts" />
/// <reference path="cache.ts" />

var chrome: any;
var chromeLocalStorage : Cache.CacheStorage = chrome.storage.local;

function debug(o){ console.log(o); return o; }

function allBookmarks (cb: (bookmarks: Types.Bookmark[]) => void) {
    var secret = new Secret.SecretToken();
    var api = new API.PinboardAPI(secret);
    var cache = new Cache.BookmarkCache(chromeLocalStorage);
    cache.getBookmarks(api, cb);
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
    console.log("Received request.");
    if (request.message == "getBookmarks"){
        allBookmarks(function(bookmarks){
            console.log("Dug up " + bookmarks.length + " bookmarks.");
            var tags : string[] = Object.keys(
                bookmarks.reduce(function(tags, bookmark){
                    for(var i = 0; i < bookmark.tags.length; i++){
                        var tag = bookmark.tags[i];
                        tags[tag] = true;
                    }
                    return tags;
                }, {})
            );

            try {
                sendResponse({
                    bookmarks: bookmarks,
                    tags: tags
                });
            } catch(err) { console.log(err) }
        });
    } else {
        console.log("Unknown message type. Suppressed.");
    }
    return true; // Response will be sent async
});
