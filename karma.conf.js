// Karma configuration
// Generated on Tue Dec 22 2015 11:24:15 GMT+1100 (AEDT)

module.exports = function(config) {
  config.set({

    browserNoActivityTimeout: 100000000,

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: 'wwwroot',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
      'build/TerriaJS-specs.js',
      {
        pattern: 'build/Cesium/**',
        watched: false,
        included: false,
        served: true
      }
    ],

    proxies: {
        '/data': 'http://localhost:3002/data',
        '/images': 'http://localhost:3002/images',
        '/test': 'http://localhost:3002/test',
        '/build': 'http://localhost:3002/build'
    },

    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },

    customLaunchers: {
        'PhantomJS_debug': {
            base: 'PhantomJS',
            debug: true
        },
        sl_chrome: {
              base: 'SauceLabs',
              browserName: 'chrome',
              platform: 'Windows 7',
              version: '46'
        }
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'saucelabs'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['sl_chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultanous
    concurrency: Infinity,

    sauceLabels: {
        testName: 'TerriaJS Unit Tests',
        tunnelIdentifier: process.env.TRAVIS_BUILD_NUMBER
    }
  })
}
