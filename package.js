Package.describe({
    name: 'leaf4monkey:op-hooks',
    version: '0.0.2',
    // Brief, one-line summary of the package.
    summary: 'add hooks for C,U,D operations of mongodb.',
    // URL to the Git repository containing the source code for this package.
    git: 'https://github.com/leaf4monkey/mongo-op-hooks.git',
    // By default, Meteor will default to using README.md for documentation.
    // To avoid submitting documentation, set this field to null.
    documentation: 'README.md'
});

Package.onUse(function (api) {
    api.versionsFrom('1.4.1.1');
    api.use([
        'ecmascript',
        'random',
        'mongo'
    ], 'server');
    api.mainModule('op-hooks.js', 'server');
});

//Package.onTest(function (api) {
//    api.use([
//        'ecmascript',
//        'random',
//        'mongo'
//    ], 'server');
//    api.use('tinytest');
//    api.use('leaf4monkey:op-hooks', 'server');
//    api.mainModule('op-hooks-tests.js', 'server');
//});
