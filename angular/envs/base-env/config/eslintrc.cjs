// force bit to recognize this as dependency
require('@bitdev/angular.dev-services.linter.eslint');

module.exports = {
  extends: [require.resolve('@bitdev/angular.dev-services.linter.eslint')],
  rules: {}
};
