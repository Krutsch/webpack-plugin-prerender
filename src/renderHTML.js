const playwright = require("playwright");

module.exports = async function preRender(
  html,
  files,
  externals = [],
  reqBrowser = "chromium"
) {
  const browser = playwright[reqBrowser];
  const instance = await browser.launch({ headless: true });
  const page = await instance.newPage();
  const extID = "pr_externals";
  const filesID = "pr-scripts";
  // insert js scripts
  html = html.replace(
    /(<\/head>)/,
    `${externals
      .map(
        (src, index) =>
          `<script id=${extID + index} src="https://unpkg.com/${src}"></script>`
      )
      .join("")}
      ${files
        .map(
          (file, index) =>
            `<script id=${
              filesID + index
            } type="module" src="data:text/javascript;base64,${
              file.src
            }"></script>${
              file.css &&
              `<link id=${
                filesID + index + "-css"
              } rel="stylesheet" type="text/css" href=${file.css} />`
            }`
        )
        .join("")}$1`
  );
  await page.setContent(html);
  // remove js scripts
  await page.evaluate(
    ([extID, extLength, filesID, filesLength]) => {
      Array.from({ length: extLength }, (_, index) => {
        const script = document.querySelector(`#${extID + index}`);
        script && script.remove();
      });
      Array.from({ length: filesLength }, (_, index) => {
        const script = document.querySelector(`#${filesID + index}`);
        script && script.remove();
        const css = document.querySelector(`#${filesID + index + "-css"}`);
        css && css.remove();
      });
    },
    [extID, externals.length, filesID, files.length]
  );

  const renderedHTML = await page.content();
  await instance.close();
  return renderedHTML;
};
