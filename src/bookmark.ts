module Types {
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
            return new Bookmark(
                node.getAttribute('href'),
                node.getAttribute('description'),
                node.getAttribute('extended'),
                node.getAttribute('tag').split(' '),
                (new Date(node.getAttribute('time'))).getTime(),
                true, // TODO
                false
            );
        }
    }
}
