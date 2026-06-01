const fs = require("fs");
const path = require("path");

function loadSwaggerFromFile() {
  const p = path.join(__dirname, "swagger.js");
  if (!fs.existsSync(p)) return {};

  let text = fs.readFileSync(p, "utf8");
  // strip leading/trailing Markdown fences if present
  text = text.replace(/^\s*```(?:javascript)?\r?\n/, "");
  text = text.replace(/\r?\n```\s*$/, "");

  const moduleObj = { exports: {} };
  const func = new Function("module", "exports", "require", "__dirname", "__filename", text + "\n; return module.exports;");
  try {
    const exported = func(moduleObj, moduleObj.exports, require, __dirname, p);
    return exported || moduleObj.exports || {};
  } catch (err) {
    // If execution fails, surface a helpful message for debugging
    console.error("Failed to load swagger.js via loader:", err.message);
    return {};
  }
}

module.exports = loadSwaggerFromFile();
