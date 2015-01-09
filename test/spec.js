var fs = require("fs");
var vows = require("vows");
var sinon = require("sinon");
var assert = require("assert");
var fixture = require("./bundle");

function reset(target) {
  fixture.__get__(target).restore && fixture.__get__(target).restore();
}

vows.describe("Injecting methods").addBatch({

  "Methods are injected into bundle": {
    topic: function() {
      fs.readFile(require.resolve("./bundle.js"), { encoding: "utf8" }, this.callback)
    },
    "to leak variables": function(err, contents) {
      assert.isNull(err);
      assert.match(contents, /module\.exports\.__get__/);
    },
    "to modify variables": function(err, contents) {
      assert.isNull(err);
      assert.match(contents, /module\.exports\.__set__/);
    }
  }

}).run();

vows.describe("Getters and setters").addBatch({

  "Private variables": {
    "can be inspected": {
      topic: function() {
        return fixture.__get__("inspectPrivate");
      },
      "with the getter": function(topic) {
        assert.equal(topic, "I am private");
      }
    },
    "can be modified": {
      "individually": {
        topic: function() {
          fixture.__set__("modifyIndividual", "I have been changed");
          return fixture.__get__("modifyIndividual");
        },
        "with the setter": function(topic) {
          assert.equal(topic, "I have been changed");
        }
      },
      "within objects": {
        topic: function() {
          fixture.__set__("modifyWithin.key", "I have been changed");
          return fixture.__get__("modifyWithin.key");
        },
        "using dot notation": function(topic) {
          assert.equal(topic, "I have been changed");
        }
      },
      "en masse": {
        topic: function() {
          fixture.__set__({
            modifyEnMasseA: "I have been changed",
            modifyEnMasseB: "I have been changed, too"
          });

          return [fixture.__get__("modifyEnMasseA"), fixture.__get__("modifyEnMasseB")];
        },
        "by passing an object": function(topic) {
          assert.equal(topic[0], "I have been changed");
          assert.equal(topic[1], "I have been changed, too");
        }
      }
    }
  },

  "Dependencies": {
		"will be ignored if requested": {
			topic: function() {
				return function() { fixture.__get__("ignoredDependency").__get__("test"); };
			},
			"should throw an error if access is attempted": function(topic) {
				assert.throws(topic, TypeError);
			}
		},
		"will not ignore files not on ignore list": {
			topic: function() {
				return fixture.__get__("privateDependency").__get__("test");
			},
			"should throw an error if access is attempted": function(topic) {
				assert.equal(topic, "reachable");
			}
		},
    "can be inspected": {
      "with a spy": {
        topic: function() {
          reset("privateDependency.exampleMethod");
          sinon.spy(fixture.__get__("privateDependency"), "exampleMethod")();
          return fixture.__get__("privateDependency.exampleMethod");
        },
        "using sinon.spy": function(topic) {
          assert.equal(topic.calledOnce, true);
        }
      }
    },
    "can be modified": {
      "with a stub": {
        topic: function() {
          reset("privateDependency.exampleMethod");
          sinon.stub(fixture.__get__("privateDependency"), "exampleMethod", function() {
            return "I am a stub";
          });
          return fixture.methodUsingDependency();
        },
        "using sinon.stub": function(topic) {
          assert.equal(topic, "I am a stub");
        }
      },
      "with a double": {
        topic: function() {
          fixture.__set__("privateDependency", {
            exampleMethod: function() {
              return "I am a double";
            }
          });

          return fixture.methodUsingDependency();
        },
        "with a test double": function(topic) {
          assert.equal(topic, "I am a double");
        }
      }
    }
  }

}).run();
