const path = require("path");

module.exports = {
  rootDir: process.cwd(),
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
};
