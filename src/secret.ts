declare var localStorage: Storage;

// These constants copied from /js/common.js
// TODO on full Typescript migration: merge common.js into constants.ts
var authTokenKey : string = 'pb_viewer::auth_token';
var nameKey : string = 'pb_viewer::n';

module Secret {
    export class SecretToken {
        getUser() { return localStorage[nameKey]; }
        get() { return localStorage[authTokenKey]; }
    }
}
