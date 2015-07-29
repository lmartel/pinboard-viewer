/// <reference path="bookmark.ts" />

declare var chrome: any;
declare var $: any;
declare var _: any;

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
    console.log("Filtering by " + tags);
    console.log(items);

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
//    control.refreshOptions();
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

declare var Selectize : any;
var oldRegister = Selectize.prototype.registerOption;
Selectize.prototype.registerOption = function(data){
    delete data.$order;
    return oldRegister.call(this, data);
}

chrome.runtime.sendMessage({ message: "getBookmarks" }, function(response) {
    console.log("Received response");

    var tags : SearchTag[] = response.tags.map(function(tag : string) {
        var tagObj = {
            title: '#' + tag,
            url: '#' + tag,
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

    var allOpts : SearchItem[] = (<SearchItem[]> allBookmarks).concat(tags);

    $('#search-loading').hide();
    var control = $('#search').selectize({
        delimiter: ' ',
        create: false,
        maxItems: null,
        maxOptions: 1000,
        labelField: 'title',
        valueField: 'data',
        searchField: ['title', 'url'],
        options: allOpts
    })[0].selectize;

    var exit = function() { window.close() };

    var activeTags : string[] = [];
    var activeOptions : SearchItem[] = allOpts;

    var itemAdd = function(itemData : string){
        if (isTag(itemData)){
            unhandle();
            var tag = getRaw(itemData);
            activeTags.push(tag);
            activeOptions = filterBy(activeOptions, [tag]);
            updateControl(control, activeOptions, activeTags);
            handle();
        } else {
            var url = getRaw(itemData);
            chrome.tabs.update({ url: protocolize(url) });
            exit();
        }
    }

    var itemRemove = function(itemData : string){
        if (!isTag(itemData)) return;

        unhandle();
        var i = activeTags.indexOf(getRaw(itemData));
        activeTags.splice(i, 1);
        activeOptions = filterBy(allOpts, activeTags);
        console.log(activeOptions);
        updateControl(control, activeOptions, activeTags);
        handle();
    }

    var handle = function(){
        control.on('item_add', itemAdd);
        control.on('item_remove', itemRemove);
        control.on('blur', exit);
        control.on('dropdown_close', exit);
    }

    var unhandle = function(){
        control.off('item_add', itemAdd);
        control.off('item_remove', itemRemove);
        control.off('blur', exit);
        control.off('dropdown_close', exit);
    }

    handle();
    $('#search-container').show();
    control.focus();
});
