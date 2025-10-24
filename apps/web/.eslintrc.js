module.exports = {
  root: true,
  extends: ['next/core-web-vitals'],
  rules: {
    // Remove TypeScript-specific rules that aren't available
    'no-unused-vars': 'error',
    'no-console': 'warn',
  },
};
