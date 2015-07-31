/// <reference path="constants.ts" />
/// <reference path="bookmark.ts" />
/// <reference path="api.ts" />
declare var chrome: any;

module Cache {
    export interface CacheStorage {
        get(keys: any, callback: (data: any) => void): void;
        set(kvPairs: any, after: () => void): void;
        clear(cb: () => void): void;
    }

    export interface CachedBookmarks {
        bookmarks: Types.Bookmark[];
        updated: Date;
    }

    export class BookmarkCache {
        constructor(private storage: CacheStorage) {};

        destroy(cb : () => void): void {
            this.storage.clear(cb);
        }

        getBookmarks(api : API.PinboardAPI, clientcb : (bookmarks : CachedBookmarks) => void): void {
            var _self = this;
            api.getModifiedDate(function(latestUpdate){
                var cacheBeforeCallback = function(bookmarks){
                    var record = {
                        bookmarks: bookmarks,
                        updated: latestUpdate
                    }
                    _self.setBookmarks(record, clientcb);
                }

                _self.storage.get(LATEST_UPDATE, function(data : Object) {
                    var prevUpdate : Date = data[LATEST_UPDATE] && new Date(data[LATEST_UPDATE]);
                    if (DISABLE_CACHE) prevUpdate = null;

                    if (!prevUpdate){
                        console.log("Cache empty (or disabled). Refreshing all.")
                        api.getAllBookmarks(cacheBeforeCallback);
                    } else if (prevUpdate.getTime() < latestUpdate.getTime()){
                        api.getBookmarksSince(prevUpdate, function(newBookmarks){
                            console.log("Found " + newBookmarks.length + " new bookmarks.");
                            _self.getBookmarksFromStorage(function(oldBookmarks){
                                var bookmarks = oldBookmarks.concat(newBookmarks);
                                cacheBeforeCallback(bookmarks);
                            });
                        });
                    } else {
                        console.log("Cache up-to-date; latest bookmark was updated " + prevUpdate);
                        _self.getLocalBookmarks(clientcb);
                    }
                });
            });
        };

        getLocalBookmarks(cb : (bookmarks : CachedBookmarks) => void): void {
            var _self = this;
            _self.storage.get(LATEST_UPDATE, function(updata : Object) {
                var updated = updata[LATEST_UPDATE];
                _self.getBookmarksFromStorage(function(bookmarks){
                    cb({
                        bookmarks: bookmarks,
                        updated: updated
                    });
                });
            });
        }

        private getBookmarksFromStorage(cb : (bookmarks: Types.Bookmark[]) => void): void {
            this.storage.get(BOOKMARKS, function(data : Object) {
                var bookmarks : Types.Bookmark[] = data[BOOKMARKS];
                cb(bookmarks);
            });
        }

        private setBookmarks(bookmarks : CachedBookmarks, cb){
            var kv = {};
            kv[LATEST_UPDATE] = bookmarks.updated.toString();
            kv[BOOKMARKS] = bookmarks.bookmarks;
            this.storage.set(kv, function(){
                if(chrome && chrome.runtime.lastError) console.log("CACHE PUT FAILED");
                cb(bookmarks);
            });
        }
    }
}
