/// <reference path="bookmark.ts" />

declare var chrome: any;
declare var $: any;
declare var _: any;

// Patch bug in Selectize library: preserves hidden `order` field on deleted-and-readded options
declare var Selectize : any;
(function(){
    var oldRegister = Selectize.prototype.registerOption;
    Selectize.prototype.registerOption = function(data){
        delete data.$order;
        return oldRegister.call(this, data);
    }
})();

var BOOKMARKS = "localStorage::bookmarks";
var TAGS = "localStorage::tags";
var OPTIONS = "localStorage::selectize::options";
var IS_CACHED = "localStorage::isCached";

interface SearchItem {
    title: string;
    url: string;
    data: string; // type:value, eg "tag:programming" or "bookmark:www.foo..."
}

interface SearchBookmark extends Types.Bookmark, SearchItem {}
interface SearchTag extends SearchItem {}

function titleCmp(l : SearchItem, r : SearchItem) {
    var alpha : RegExp = /[^a-zA-Z]/g
    var lTitle : string = l.title.replace(alpha, '');
    var rTitle : string = r.title.replace(alpha, '');
    if (lTitle < rTitle) return -1;
    if (lTitle > rTitle) return 1;
    return 0;
}

function containsAll(needles : any[], haystack : any[]): boolean {
    return _.intersection(needles, haystack).length === needles.length;
}

function filterBy(items : SearchItem[], tags : string[]){
    if(tags.length === 0) return items.slice();

    return items.filter(function(item){
        return isTag(item.data) || containsAll(tags, (<SearchBookmark> item).tags);
    });
}

function isTag(itemData : string): boolean {
    return !!itemData.match(/^tag/);
}

function getRaw(itemData : string): string {
    return itemData.replace(/^.*:/, '');
}

function updateControl(control : any, options : SearchItem[], activeTags : string[]){
    control.clearOptions();
    control.addOption(options);
    for(var i = 0; i < activeTags.length; i++)
        control.addItem('tag:' + activeTags[i], true);

    control.refreshItems();
    control.close();
    control.open();
}

function protocolize(url : string){
    if(url.match(/^https?:\/\//)) return url;
    if(url.match(/^\/\//)) return 'http:' + url;
    return 'http://' + url;
}

function connectToPinboardViewerBackend(){ // main IO functions; closure to protect helpers above from mutable state
    var port = chrome.runtime.connect({ name: "bookmarks" });
    var selectizeControl;
    var allOpts : SearchItem[];
    var activeTags : string[] = [];
    var activeOptions : SearchItem[];

    // Initialize bookmark search
    port.onMessage.addListener(handleResponse);
    if(localStorage[IS_CACHED]){
        allOpts = JSON.parse(localStorage[OPTIONS]);
        initializeSearch();
        port.postMessage({ message: "getBookmarks" });
    } else {
        port.postMessage({ message: "getBookmarks" });
    }

    // Handler functions

    function itemAdd(itemData : string){
        if (isTag(itemData)){
            unhandle();
            var tag = getRaw(itemData);
            activeTags.push(tag);
            activeOptions = filterBy(activeOptions, [tag]);
            updateControl(selectizeControl, activeOptions, activeTags);
            handle();
        } else {
            var url = getRaw(itemData);
            chrome.tabs.update({ url: protocolize(url) });
            window.close();
        }
    }

    function itemRemove(itemData : string){
        if (!isTag(itemData)) return;

        unhandle();
        var i = activeTags.indexOf(getRaw(itemData));
        activeTags.splice(i, 1);
        activeOptions = filterBy(allOpts, activeTags);
        updateControl(selectizeControl, activeOptions, activeTags);
        handle();
    }

    function handle(){
        selectizeControl.on('item_add', itemAdd);
        selectizeControl.on('item_remove', itemRemove);
    }

    function unhandle(){
        selectizeControl.off('item_add', itemAdd);
        selectizeControl.off('item_remove', itemRemove);
    }

    function initializeSearch(){
        $('#search-loading').hide();
        activeOptions = filterBy(allOpts, activeTags);
        console.log("Initializing search with " + activeOptions.length + " pins and tags.");
        selectizeControl = $('#search').selectize({
            delimiter: ' ',
            create: false,
            maxItems: null,
            maxOptions: null,
            selectOnTab: true,
            openOnFocus: false,
            labelField: 'title',
            valueField: 'data',
            searchField: ['title', 'url'],
            options: activeOptions,
            render: {
                option: function(item, escape) {
                    var label = item.title;
                    var caption = item.url ? item.url : null;
                    return '<div>' +
                        '<span class="label">' + escape(label) + '</span>' +
                        (caption ? '<span class="caption">' + escape(caption) + '</span>' : '') +
                        '</div>';
                }
            }
        })[0].selectize;

        handle();
        $('#search-container').show();
        $('#search-container input').focus();
    }

    function handleResponse(response) {

        if (!(response.bookmarks && response.tags)){
            console.log("Unknown message received, ignoring:")
            console.log(response);
            return;
        }

        var tags : SearchTag[] = response.tags.map(function(tag : string) {
            var tagObj = {
                title: '#' + tag,
                data: "tag:" + tag
            }
            return tagObj;
        });
        tags.sort(titleCmp);

        var allBookmarks : SearchBookmark[] = response.bookmarks.map(function(bookmark){
            bookmark.data = "bookmark:" + bookmark.url
            return bookmark;
        });
        allBookmarks.sort(titleCmp);

        allOpts = (<SearchItem[]> allBookmarks).concat(tags);

        if (selectizeControl){
            if (localStorage[IS_CACHED] && JSON.stringify(allOpts) == localStorage[OPTIONS])
                return;

            selectizeControl.destroy();
        }

        localStorage[OPTIONS] = JSON.stringify(allOpts);
        localStorage[IS_CACHED] = "true";

        initializeSearch();
    }
}
