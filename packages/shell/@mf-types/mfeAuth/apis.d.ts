
    export type RemoteKeys = 'mfeAuth/AuthRoutes' | 'mfeAuth/AuthApp';
    type PackageType<T> = T extends 'mfeAuth/AuthApp' ? typeof import('mfeAuth/AuthApp') :T extends 'mfeAuth/AuthRoutes' ? typeof import('mfeAuth/AuthRoutes') :any;