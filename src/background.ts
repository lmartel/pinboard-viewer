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

allBookmarks(function(bookmarks){ console.log(bookmarks) });
