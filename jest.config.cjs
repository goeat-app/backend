module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@modules/(.*)$': '<rootDir>/modules/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
  },
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  transformIgnorePatterns: ['/node_modules/(?!(p-limit|yocto-queue)/)'],
};
