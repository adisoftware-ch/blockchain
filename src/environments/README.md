# environment

`environment.ts` and `environment.prod.ts` are not pushed to GitHub, as they contain private firebase config.

Look them up in firebase-console, project adisoftware-blockchain, web-app. Resp. create your own firebase project if cloning this repo.

```
export const environment = {
  production: false,            => resp. true for environment.prod.ts
  firebase: {
    apiKey: '...',
    authDomain: '...',
    databaseURL: '...',
    projectId: '...',
    storageBucket: '...',
    messagingSenderId: '...',
    appId: '...'
  }
};
```