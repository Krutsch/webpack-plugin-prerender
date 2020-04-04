const path = require("path");
const { Stats } = require("webpack");
const preRender = require("./renderHTML.js");
const stringToBase64 = (str) => Buffer.from(str).toString("base64");
const prepare = (files4PR, assets) => {
  return files4PR
    .reduce((arr, module) => {
      const file = path.basename(module, path.extname(module));
      if (file + ".js" in assets) {
        arr.push({
          src: stringToBase64(assets[file + ".js"].source()),
          css: file + ".css" in assets ? file + ".css" : "", // css files are needed due to css-mini-extract-plugin "CSS_CHUNK_LOAD_FAILED"
        });
      }
      return arr;
    }, [])
    .filter(Boolean);
};
class PRPlugin {
  constructor(options) {
    this.options = options;
  }

  apply(compiler) {
    const options = this.options;
    let isFirstRun = true;
    let renderedHTML, htmlFileName;
    const files4PR = [];

    compiler.hooks.compilation.tap("compilation", (compilation) => {
      compilation.hooks.buildModule.tap("findJSFiles", (module) => {
        const test = options.test || /\.js$/;
        const exclude = options.exclude || /node_modules/;
        if (!exclude.test(module.resource) && test.test(module.resource)) {
          if (isFirstRun) {
            if (
              !files4PR.length ||
              (module.issuer && files4PR.includes(module.issuer.resource))
            ) {
              files4PR.push(module.resource);
            }
          } else {
            module.loaders.unshift({
              loader: path.resolve(__dirname, "replace.js"),
              options: options || {},
            });
          }
        }
      });
    });

    compiler.hooks.emit.tapAsync(
      "renderedHTML",
      async (compilation, callback) => {
        if (!isFirstRun) {
          compilation.assets[htmlFileName] = {
            source: () => {
              return renderedHTML;
            },
            size: () => {
              return renderedHTML.length;
            },
          };
          callback();
          return;
        }
        isFirstRun = false; // currently we are in the first run and set it so false for the next compilation

        htmlFileName = Object.keys(compilation.assets)
          .filter((asset) => /\.html$/.test(asset))
          .pop(); // get the name of the first html file
        const html = compilation.assets[htmlFileName].source();
        const files = prepare(files4PR, compilation.assets);
        renderedHTML = await preRender(
          html,
          files,
          options.externals,
          options.browser
        );
        callback();
      }
    );

    compiler.hooks.done.tapAsync("reCompile", async (stats, callback) => {
      // start re-compilation
      compiler.compile((err, compilation) => {
        compiler.emitAssets(compilation, () => {
          compiler.emitRecords(() => {
            const newStats = getNewStats(compilation, compilation.startTime);
            updateStats(stats, newStats);
            callback();
          });
        });
      });
    });
  }
}
// utils for stats
function updateStats(existingStats, newStats) {
  for (const i in newStats) {
    if (!Object.prototype.hasOwnProperty.call(newStats, i)) {
      continue;
    }
    existingStats[i] = newStats[i];
  }
}
function getNewStats(compilation, compilationStartingTime) {
  const stats = compilation ? new Stats(compilation) : null;
  if (stats) {
    stats.startTime = compilationStartingTime;
    stats.endTime = Date.now();
  }
  return stats;
}
module.exports = PRPlugin;
