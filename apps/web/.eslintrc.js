module.exports = {
  root: true,
  extends: ['next/core-web-vitals'],
  rules: {
    // Remove TypeScript-specific rules that aren't available
    'no-unused-vars': 'off', // Disabled due to false positives with TypeScript
    'no-console': 'warn',
    'jsx-a11y/alt-text': 'off', // Disabled due to false positives with lucide-react icons
  },
};
