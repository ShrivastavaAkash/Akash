// imports
const fs = require("fs");
const config = require("./config");
const showdown = require("showdown");
const converter = new showdown.Converter();

// BEGIN _ functions
const getTitleTag = title => "\t\t<title>" + title + "</title>\n";
const getMetaTag = (name, content) => {
  return (
    (name == "title" ? getTitleTag(content) : "") +
    '\t\t<meta name="' +
    name +
    '" content="' +
    content +
    '" />\n' +
    '\t\t<meta property="og:' +
    name +
    '" content="' +
    content +
    '" />\n'
  );
};
const generateHTML = (metaTags, content) =>
  fs
    .readFileSync(config.templatePath, { encoding: "utf-8" })
    .toString()
    .replace(config.placeholderInTemplate.header, metaTags)
    .replace(config.placeholderInTemplate.content, content);

// All the meta tags to be included from metaData file
const pickMetaProperties = ({
  image,
  description,
  title,
  author,
  theme_color
}) => ({ image, description, title, author, theme_color });

const createDirIfNotExist = dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
};
// END _ functions

fs.readFile(config.metaDataTSSource, (e, content) => {
  if (e) console.log(e);

  const metaData = content
    .toString()
    .replace("export const ", "module.exports.")
    .replace("<string, any>", "");

  // Create meta data folder
  createDirIfNotExist(config.metaDataDirectoryName);

  fs.writeFile(config.metaDataFilePath, metaData, () => {
    const data = require(config.metaDataFilePath);
    const meta = Array.from(data.blogs)
      .map(v => [v[0], pickMetaProperties(v[1])])
      .map(v => ({
        name: v[0],
        metaTags: Object.keys(v[1])
          .map(b => getMetaTag(b, v[1][b]))
          .join(""),
        content: converter.makeHtml(
          fs.readFileSync(config.markdownPath + v[0] + ".md").toString()
        )
      }));

    // Create parent folder for helmets
    createDirIfNotExist(config.parentDirectoryName);

    meta.forEach(v => {
      // Create folder for helmet
      createDirIfNotExist(config.parentDirectoryName + "/" + v.name);
      // write index.html
      fs.writeFile(
        config.parentDirectoryName + "/" + v.name + "/" + config.filename,
        generateHTML(v.metaTags.replace(/_/g, "-"), v.content),
        () => {}
      );
    });
  });
});
