// jest.config.js
module.exports = {
  transform: {
    "^.+\\.(ts|tsx)$": "babel-jest"
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  testEnvironment: "jsdom",  // This is important for React components
  transformIgnorePatterns: ["/node_modules/"],  // Ignore transformations for node_modules
};
