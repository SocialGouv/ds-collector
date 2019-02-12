module.exports = {
  collectCoverageFrom: ["src/*"],
  preset: "ts-jest",
  setupFiles: ["./setupJest.js"],
  testEnvironment: "node",
  verbose: true
};
