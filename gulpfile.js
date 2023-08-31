/*eslint-env node*/
/*eslint no-sync: 0*/

"use strict";

// Every module required-in here must be a `dependency` in package.json, not just a `devDependency`,
// so that our postinstall script (which runs `gulp post-npm-install`) is able to run without
// the devDependencies available.  Individual tasks, other than `post-npm-install` and any tasks it
// calls, may require in `devDependency` modules locally.
var gulp = require("gulp");

gulp.task("build-specs", function (done) {
  var runWebpack = require("./buildprocess/runWebpack.js");
  var webpack = require("webpack");
  var webpackConfig = require("./buildprocess/webpack.config.make.js")(
    false,
    true
  );

  runWebpack(webpack, webpackConfig, done);
});

gulp.task("release-specs", function (done) {
  var runWebpack = require("./buildprocess/runWebpack.js");
  var webpack = require("webpack");
  var webpackConfig = require("./buildprocess/webpack.config.make.js")(
    false,
    false
  );

  runWebpack(webpack, webpackConfig, done);
});

gulp.task("watch-specs", function (done) {
  var watchWebpack = require("./buildprocess/watchWebpack");
  var webpack = require("webpack");
  var webpackConfig = require("./buildprocess/webpack.config.make.js")(
    false,
    true
  );

  watchWebpack(webpack, webpackConfig, done);
});

gulp.task("lint", function (done) {
  var runExternalModule = require("./buildprocess/runExternalModule");

  runExternalModule("eslint/bin/eslint.js", [
    "lib",
    "test",
    "--ext",
    ".jsx",
    "--ext",
    ".js",
    "--ignore-pattern",
    "lib/ThirdParty",
    "--max-warnings",
    "0"
  ]);

  done();
});

gulp.task("reference-guide", function (done) {
  var runExternalModule = require("./buildprocess/runExternalModule");

  runExternalModule("jsdoc/jsdoc.js", [
    "./lib",
    "-c",
    "./buildprocess/jsdoc.json"
  ]);

  done();
});

gulp.task("copy-cesium-assets", function () {
  var path = require("path");

  var cesiumPackage = require.resolve("terriajs-cesium/package.json");
  var cesiumRoot = path.dirname(cesiumPackage);
  var cesiumWebRoot = path.join(cesiumRoot, "wwwroot");

  return gulp
    .src([path.join(cesiumWebRoot, "**")], {
      base: cesiumWebRoot
    })
    .pipe(gulp.dest("wwwroot/build/Cesium"));
});

gulp.task("test-browserstack", function (done) {
  runKarma("./buildprocess/karma-browserstack.conf.js", done);
});

gulp.task("test-saucelabs", function (done) {
  runKarma("./buildprocess/karma-saucelabs.conf.js", done);
});

gulp.task("test-firefox", function (done) {
  runKarma("./buildprocess/karma-firefox.conf.js", done);
});

gulp.task("test-travis", function (done) {
  if (process.env.SAUCE_ACCESS_KEY) {
    runKarma("./buildprocess/karma-saucelabs.conf.js", done);
  } else {
    console.log(
      "SauceLabs testing is not available for pull requests outside the main repo; using local headless Firefox instead."
    );
    runKarma("./buildprocess/karma-firefox.conf.js", done);
  }
});

gulp.task("test", function (done) {
  runKarma("./buildprocess/karma-local.conf.js", done);
});

function runKarma(configFile, done) {
  var karma = require("karma").Server;
  var path = require("path");

  karma.start(
    {
      configFile: path.join(__dirname, configFile)
    },
    function (e) {
      return done(e);
    }
  );
}

gulp.task("code-attribution", function userAttribution(done) {
  var spawnSync = require("child_process").spawnSync;

  var result = spawnSync(
    "yarn",
    ["licenses generate-disclaimer > doc/acknowledgements/attributions.md"],
    {
      stdio: "inherit",
      shell: true
    }
  );
  if (result.status !== 0) {
    throw new Error(
      "Generating code attribution exited with an error.\n" +
        result.stderr.toString(),
      { showStack: false }
    );
  }
  done();
});

gulp.task("build-for-doc-generation", function buildForDocGeneration(done) {
  var runWebpack = require("./buildprocess/runWebpack.js");
  var webpack = require("webpack");
  var webpackConfig = require("./buildprocess/webpack-tools.config.js")();

  runWebpack(webpack, webpackConfig, done);
});

gulp.task(
  "render-guide",
  gulp.series(
    function copyToBuild(done) {
      const fse = require("fs-extra");
      fse.copySync("doc", "build/doc");
      done();
    },
    function generateMemberPages(done) {
      const fse = require("fs-extra");
      const PluginError = require("plugin-error");
      const spawnSync = require("child_process").spawnSync;

      fse.mkdirpSync("build/doc/connecting-to-data/catalog-type-details");

      const result = spawnSync("node", ["generateDocs.js"], {
        cwd: "build",
        stdio: "inherit",
        shell: false
      });

      if (result.status !== 0) {
        throw new PluginError(
          "user-doc",
          "Generating catalog members pages exited with an error.",
          { showStack: false }
        );
      }
      done();
    },
    function mkdocs(done) {
      const PluginError = require("plugin-error");
      const spawnSync = require("child_process").spawnSync;

      const result = spawnSync(
        "mkdocs",
        ["build", "--clean", "--config-file", "mkdocs.yml"],
        {
          cwd: "build",
          stdio: "inherit",
          shell: false
        }
      );
      if (result.status !== 0) {
        throw new PluginError(
          "user-doc",
          `Mkdocs exited with an error. Maybe you didn't install mkdocs and other python dependencies in requirements.txt - see https://docs.terria.io/guide/contributing/development-environment/#documentation?`,
          {
            showStack: false
          }
        );
      }
      done();
    }
  )
);

gulp.task(
  "docs",
  gulp.series(
    gulp.parallel("code-attribution", "build-for-doc-generation"),
    "render-guide",
    function docs(done) {
      var fse = require("fs-extra");
      fse.copySync("doc/index-redirect.html", "wwwroot/doc/index.html");
      done();
    }
  )
);

gulp.task("geoportal-server", function (done) {
  // E.g. gulp geoportal-server --terriajsServerArg port=4000 --terriajsServerArg verbose=true
  //  or gulp dev --terriajsServerArg port=3000
  const { spawn } = require("child_process");
  const fs = require("fs");
  const minimist = require("minimist");

  const knownOptions = {
    string: ["terriajsServerArg"],
    default: {
      terriajsServerArg: []
    }
  };
  const options = minimist(process.argv.slice(2), knownOptions);

  const logFile = fs.openSync("./geoportal-server.log", "a");
  const serverArgs = Array.isArray(options.terriajsServerArg)
    ? options.terriajsServerArg
    : [options.terriajsServerArg];
  // Spawn detached - attached does not make geoportal-server
  //  quit when the gulp task is stopped
  const child = spawn(
    "node",
    [
      "./node_modules/.bin/geoportal-server",
      "--port=3002",
      ...serverArgs.map((arg) => `--${arg}`)
    ],
    { detached: true, stdio: ["ignore", logFile, logFile] }
  );
  child.on("exit", (exitCode, signal) => {
    done(
      new Error(
        "geoportal-server quit" +
          (exitCode !== null ? ` with exit code: ${exitCode}` : "") +
          (signal ? ` from signal: ${signal}` : "") +
          "\nCheck geoportal-server.log for more information."
      )
    );
  });
  // Intercept SIGINT, SIGTERM and SIGHUP, cleanup geoportal-server and re-send signal
  // May fail to catch some relevant signals on Windows
  // SIGINT: ctrl+c
  // SIGTERM: kill <pid>
  // SIGHUP: terminal closed
  process.once("SIGINT", () => {
    child.kill("SIGTERM");
    process.kill(process.pid, "SIGINT");
  });
  process.once("SIGTERM", () => {
    child.kill("SIGTERM");
    process.kill(process.pid, "SIGTERM");
  });
  process.once("SIGHUP", () => {
    child.kill("SIGTERM");
    process.kill(process.pid, "SIGHUP");
  });
});

gulp.task("cyr2lat", function (done) {
  var fse = require("fs-extra");
  var content = fse.readFileSync(
    "lib/Language/sr-Cyrl/translation.json",
    "UTF-8"
  );
  content = transliterate(content);
  fse.writeFileSync("lib/Language/sr-Latn/translation.json", content, "UTF-8");
  done();
});

var transliterate = function (text) {
  text = text
    .replace(/\u0410/g, "A")
    .replace(/\u0411/g, "B")
    .replace(/\u0412/g, "V")
    .replace(/\u0413/g, "G")
    .replace(/\u0414/g, "D")
    .replace(/\u0402/g, "Đ")
    .replace(/\u0415/g, "E")
    .replace(/\u0416/g, "Ž")
    .replace(/\u0417/g, "Z")
    .replace(/\u0418/g, "I")
    .replace(/\u0408/g, "J")
    .replace(/\u041a/g, "K")
    .replace(/\u041b/g, "L")
    .replace(/\u0409/g, "Lj")
    .replace(/\u041c/g, "M")
    .replace(/\u041d/g, "N")
    .replace(/\u040a/g, "Nj")
    .replace(/\u041e/g, "O")
    .replace(/\u041f/g, "P")
    .replace(/\u0420/g, "R")
    .replace(/\u0421/g, "S")
    .replace(/\u0422/g, "T")
    .replace(/\u040b/g, "Ć")
    .replace(/\u0423/g, "U")
    .replace(/\u0424/g, "F")
    .replace(/\u0425/g, "H")
    .replace(/\u0426/g, "C")
    .replace(/\u0427/g, "Č")
    .replace(/\u040f/g, "Dž")
    .replace(/\u0428/g, "Š")
    .replace(/\u0430/g, "a")
    .replace(/\u0431/g, "b")
    .replace(/\u0432/g, "v")
    .replace(/\u0433/g, "g")
    .replace(/\u0434/g, "d")
    .replace(/\u0452/g, "đ")
    .replace(/\u0435/g, "e")
    .replace(/\u0436/g, "ž")
    .replace(/\u0437/g, "z")
    .replace(/\u0438/g, "i")
    .replace(/\u0458/g, "j")
    .replace(/\u043a/g, "k")
    .replace(/\u043b/g, "l")
    .replace(/\u0459/g, "lj")
    .replace(/\u043c/g, "m")
    .replace(/\u043d/g, "n")
    .replace(/\u045a/g, "nj")
    .replace(/\u043e/g, "o")
    .replace(/\u043f/g, "p")
    .replace(/\u0440/g, "r")
    .replace(/\u0441/g, "s")
    .replace(/\u0442/g, "t")
    .replace(/\u045b/g, "ć")
    .replace(/\u0443/g, "u")
    .replace(/\u0444/g, "f")
    .replace(/\u0445/g, "h")
    .replace(/\u0446/g, "c")
    .replace(/\u0447/g, "č")
    .replace(/\u045f/g, "dž")
    .replace(/\u0448/g, "š");
  return text;
};

gulp.task("build", gulp.series("copy-cesium-assets", "build-specs"));
gulp.task("release", gulp.series("copy-cesium-assets", "release-specs"));
gulp.task("watch", gulp.series("copy-cesium-assets", "watch-specs"));
gulp.task("dev", gulp.parallel("geoportal-server", "watch"));
gulp.task("post-npm-install", gulp.series("copy-cesium-assets"));
gulp.task("default", gulp.series("lint", "build"));
