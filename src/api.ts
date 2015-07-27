/// <reference path="secret.ts" />
/// <reference path="bookmark.ts" />

module API {
    export interface APIParams {
        fromdt?: Date;
    }

    export class PinboardAPI {
        constructor(private token: Secret.SecretToken) {};

        getModifiedDate(cb: (lastUpdate: Date) => void) {
            this.apiGet('posts/update', this.token, {}, function(xmlDoc){
                var latestUpdate : Date = new Date(xmlDoc.getElementsByTagName('update').item(0).getAttribute('time'));
                cb(latestUpdate);
            });
        }

        getAllBookmarks(cb: (bookmarks: Types.Bookmark[]) => void){
            this.getBookmarksSince(null, cb);
        }

        getBookmarksSince(prevUpdate: Date, cb: (bookmarks: Types.Bookmark[]) => void){
            this.apiGet('posts/all', this.token, { fromdt: prevUpdate }, function(xmlDoc){
                var elem: HTMLScriptElement = xmlDoc.getElementsByTagName('posts').item(0);
                var posts : NodeList = elem.getElementsByTagName('post');
                var bookmarks : Types.Bookmark[] = [];
                for(var i = 0; i < posts.length; i++){
                    var bookmark = Types.Bookmark.build(<HTMLScriptElement> posts.item(i));
                    bookmarks.push(bookmark);
                }
                cb(bookmarks);
            });
        }

        private apiGet(endpoint: string, token: Secret.SecretToken, params: APIParams, cb): void {
            var xhr = new XMLHttpRequest();
            var urlParams : string = Object.keys(params).filter(function(key){
                return !!params[key];
            }).map(function(key){
                return key + '=' + params[key];
            }).concat('auth_token=' + token.get()).join('&');
            var requestUrl : string = 'https://api.pinboard.in/v1/' + endpoint + '?' + urlParams;
            console.log("[DEBUG] sending GET to " + requestUrl);
            xhr.open("GET", requestUrl, true);
            xhr.onload = function (e) {
                var xmlDoc = xhr.responseXML;
                cb(xmlDoc);
            }
            xhr.onerror = function(e){ console.log("XHR error: " + e); }
            xhr.send();
        }
    }
}
