module Types {
    export interface BookmarkList {
        bookmarks: Bookmark[];
        tags: string[];
    }

    export class Bookmark {
        constructor(public url: string,
                    public title: string,
                    public description: string,
                    public tags: Array<string>,
                    public createdAt: number,
                    public isPublic: boolean,
                    public isReadLater: boolean
                   ) {}

        static build(node: HTMLScriptElement){
            var tag = node.getAttribute('tag');
            return new Bookmark(
                node.getAttribute('href'),
                node.getAttribute('description'),
                node.getAttribute('extended'),
                tag.length > 0 ? node.getAttribute('tag').split(' ') : [],
                (new Date(node.getAttribute('time'))).getTime(),
                true, // TODO
                false
            );
        }
    }
}
