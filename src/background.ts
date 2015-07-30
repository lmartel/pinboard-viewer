/// <reference path="secret.ts" />
/// <reference path="bookmark.ts" />
/// <reference path="api.ts" />
/// <reference path="cache.ts" />

var chrome: any;
var chromeLocalStorage : Cache.CacheStorage = chrome.storage.local;

interface State {
    secret: Secret.SecretToken;
    api: API.PinboardAPI;
    cache: Cache.BookmarkCache;
}

var state : State = null;
var clearState = function() {
    if(state){
        state.cache.destroy();
        state = null;
    }
}
var getState = function(name, token) : State{
    if(state){
        if(name == state.secret.getUser() && token == state.secret.get()) {
            return state;
        } else {
            clearState();
        }
    }

    var secret = new Secret.SecretToken(name, token);
    var api = new API.PinboardAPI(secret);
    var cache = new Cache.BookmarkCache(chromeLocalStorage);
    state = {
        secret: secret,
        api: api,
        cache: cache
    };
    return state;
}

function debug(o){ console.log(o); return o; }

function extractTags (bookmarks : Types.Bookmark[]): Types.BookmarkList {
    var tags : string[] = Object.keys(
        bookmarks.reduce(function(tags, bookmark){
            for(var i = 0; i < bookmark.tags.length; i++){
                var tag = bookmark.tags[i];
                tags[tag] = true;
            }
            return tags;
        }, {})
    );

    console.log("Found " + bookmarks.length + " bookmarks with " + tags.length + " tags.");

    return {
        bookmarks: bookmarks,
        tags: tags
    };
}

function tryPost(port, msg){
    try {
        port.postMessage(msg);
    } catch(err) { console.log(err) }
}

chrome.runtime.onConnect.addListener(function(port){
    console.log("Received connection request.");
    console.assert(port.name == "bookmarks");
    port.onMessage.addListener(function(request){
        console.log("Received message:");
        console.log(request);
        if (request.message == "logout"){
            clearState();
        } else if (request.message == "getBookmarks"){
            if (!request.name || !request.token) return;

            var state : State = getState(request.name, request.token);
            state.cache.getLocalBookmarks(function(cachedBookmarks : Cache.CachedBookmarks){
                var bookmarksAreCached : boolean = !!cachedBookmarks.bookmarks;
                if(bookmarksAreCached)
                    tryPost(port, extractTags(cachedBookmarks.bookmarks));

                state.cache.getBookmarks(state.api, function(refreshedBookmarks : Cache.CachedBookmarks){
                    if (!bookmarksAreCached || cachedBookmarks.updated < refreshedBookmarks.updated)
                        tryPost(port, extractTags(refreshedBookmarks.bookmarks));
                });
            });
        } else {
            console.log("Unknown message type. Suppressed.");
        }
        return true; // Response will be sent async
    });
});
