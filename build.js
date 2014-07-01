({
    mainConfigFile : "dev/main.js",
    appDir: "dev",
    baseUrl: "./",
    removeCombined: true,
    findNestedDependencies: true,
    dir: "prod",
    optimize: "uglify2",
    preserveLicenseComments: false,
    optimizeCss: "standard",
    modules: [
        {
            name: "main"
        }
    ],
    paths: {
        collections: 'js/collections',
        custom: 'js/custom',
        lib: 'js/lib',
        main: 'js/main',
        models: 'js/models',
        views: 'js/views'
    },
    generateSourceMaps: false
})