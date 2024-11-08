/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/test/setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@shared/(.*)$":
      "<rootDir>/node_modules/@irubey/chores-app-shared/dist/$1",
    "^@api/(.*)$": "<rootDir>/src/lib/api/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.jest.json",
      },
    ],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/__fixtures__/",
    "/__tests__/",
    "/(__)?mock(s__)?/",
    "/__stories__/",
  ],
  transformIgnorePatterns: ["/node_modules/(?!@irubey/chores-app-shared)"],
};

module.exports = config;
