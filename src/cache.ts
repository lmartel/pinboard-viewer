/// <reference path="constants.ts" />
/// <reference path="bookmark.ts" />
/// <reference path="api.ts" />
module Cache {
    export interface CacheStorage {
        get(keys: any, callback: (data: any) => void): void;
        set(kvPairs: any, after: () => void): void;
    }

    export class BookmarkCache {
        constructor(private storage: CacheStorage) {};

        getBookmarks(api : API.PinboardAPI, clientcb : (bookmarks : Types.Bookmark[]) => void): void {
            var _self = this;
            api.getModifiedDate(function(latestUpdate){
                var cacheBeforeCallback = function(bookmarks){
                    _self.setBookmarks(latestUpdate, bookmarks, clientcb);
                }

                _self.storage.get(LATEST_UPDATE, function(data : Object) {
                    var prevUpdate : Date = data[LATEST_UPDATE] && new Date(data[LATEST_UPDATE]);
                    if (DISABLE_CACHE) prevUpdate = null;

                    if (!prevUpdate){
                        console.log("Cache empty (or disabled). Refreshing all.")
                        api.getAllBookmarks(cacheBeforeCallback);
                    } else if (prevUpdate.getTime() < latestUpdate.getTime()){
                        console.log("There's a new update!");
                        api.getBookmarksSince(prevUpdate, function(newBookmarks){
                            _self.getBookmarksFromStorage(function(oldBookmarks){
                                var bookmarks = oldBookmarks.concat(newBookmarks);
                                cacheBeforeCallback(bookmarks);
                            });
                        });
                    } else {
                        console.log("Cache up-to-date; latest bookmark was updated " + prevUpdate);
                        _self.getBookmarksFromStorage(clientcb);
                    }
                });
            });
        };

        private setBookmarks(currentUpdate : Date, bookmarks : Types.Bookmark[], cb){
            var kv = {};
            kv[LATEST_UPDATE] = currentUpdate.toString();
            kv[BOOKMARKS] = bookmarks;
            this.storage.set(kv, function(){
                if(chrome && chrome.runtime.lastError) console.log("CACHE PUT FAILED");
                cb(bookmarks);
            });
        }

        private getBookmarksFromStorage(cb){
            this.storage.get(BOOKMARKS, function(data : Object) {
                var bookmarks : Types.Bookmark[] = data[BOOKMARKS];
                cb(bookmarks);
            });
        }
    }
}
