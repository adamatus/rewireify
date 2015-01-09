var through = require("through");
var path = require("path");
var minimatch = require("minimatch");

var defaultIgnore = ["*.json", "__get__", "__set__", "rewire"];

console.warn("Injecting Rewireify into modules");

module.exports = function rewireify(file, options) {
  options = {
    ignore: options.ignore || [],
	defaultIgnore: options.defaultIgnore || defaultIgnore
  };

  var ignore = defaultIgnore.concat(options.ignore);

  if (ignore.some(minimatch.bind(null, path.basename(file)))) {
    return through();
  }

  var data = "";
  var post = "";
  var __get__ = require("./__get__").toString();
  var __set__ = require("./__set__").toString();

  function write(buffer) {
    data += buffer;
  }

  function end() {
    post += "/* This code was injected by Rewireify */\n";
    post += "module.exports.__get__ = " + __get__ + ";\n";
    post += "module.exports.__set__ = " + __set__ + ";\n";

    this.queue(data);
    this.queue(post);
    this.queue(null);
  }

  return through(write, end);
};
