module.exports = {
  // configuration version 2020-04-10 (API+NPM)
  env: {
    node: true,
    'jest/globals': true,
  },
  extends: ['airbnb-base', 'prettier'],
  parser: 'babel-eslint',
  parserOptions: {
    ecmaFeatures: {
      classes: true,
      impliedStrict: true,
    },
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: ['prettier', 'jest'],
  rules: {
    'import/extensions': 'off',
    'import/newline-after-import': 'off',
    'import/order': 'off',
    'no-plusplus': 'off',
    'no-restricted-syntax': 'off',
    'no-underscore-dangle': 'off',
    'prefer-template': 'off',
    'prettier/prettier': ['error'],
    radix: 'off',
    semi: ['error', 'never'],
    'sort-imports': [
      'error',
      {
        ignoreCase: true,
        ignoreDeclarationSort: true,
        ignoreMemberSort: true,
        memberSyntaxSortOrder: ['all', 'single', 'multiple', 'none'],
      },
    ],
    'space-before-function-paren': [
      'error',
      {
        anonymous: 'always',
        named: 'never',
        asyncArrow: 'always',
      },
    ],
    strict: 'off',
    'global-require': 'off',
    'no-await-in-loop': 'off',
    'no-param-reassign': 'off',
    'consistent-return': 'off',
    'array-callback-return': 'off',
    'react/no-multi-comp': 'off',
  },
}