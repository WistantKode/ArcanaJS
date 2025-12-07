const fs = require("fs");
const path = require("path");

const distDir = path.resolve(__dirname, "../dist");

const entryPoints = [
  "arcanajs",
  "arcanox",
  "arcanajs.client",
  "arcanajs.validator",
  "arcanajs.auth",
  "arcanajs.mail",
  "cli/index",
];

if (!fs.existsSync(distDir)) {
  console.error("Dist directory does not exist. Run build first.");
  process.exit(1);
}

entryPoints.forEach((entryName) => {
  const fileName = `${entryName}.js`;
  const filePath = path.join(distDir, fileName);
  const devBundle = `./development/${path.basename(entryName)}.js`;
  const prodBundle = `./production/${path.basename(entryName)}.min.js`;

  const content = `'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('${prodBundle}');
} else {
  module.exports = require('${devBundle}');
}
`;

  // Ensure directory exists for nested entry points like cli/index
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filePath, content);
  console.log(`Created entry point: ${fileName}`);
});

console.log("Entry points created successfully.");
