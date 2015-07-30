module Secret {
    export class SecretToken {
        constructor(private name : string, private token : string){}
        getUser() { return this.name; }
        get() { return this.token; }
    }
}
