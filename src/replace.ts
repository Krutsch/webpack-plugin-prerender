const { getOptions } = require("loader-utils");

type pattern = { regex: RegExp; value: string };

module.exports = function replace(source: string) {
  const options = getOptions(this);

  (options.functionCalls || []).forEach((func: string) => {
    // replace all function calls
    const regex = new RegExp(`${func}\\((\\s|.)*?\\);`, "g");
    source = source.replace(regex, "");
  });
  (options.externals || []).forEach((lib: string) => {
    // replace all imports of that external
    // we already have an entry for externals in the webpack config,
    // but the generated code by terser will still have something like: e.exports = dependency1
    const regex = new RegExp(`import.*?${lib}.;`, "g");
    source = source.replace(regex, "");
  });
  (options.patterns || []).forEach((pattern: pattern) => {
    source = source.replace(pattern.regex, pattern.value);
  });
  return source;
};
