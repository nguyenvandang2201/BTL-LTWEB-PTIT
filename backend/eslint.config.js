/**
 * @file eslint.config.js
 * @description Cấu hình ESLint (flat config) cho backend Node.js chạy ESM.
 */

import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    // Bỏ qua các thư mục sinh tự động, không phải mã nguồn do lập trình viên viết.
    ignores: ['node_modules/**', 'src/generated/**', 'prisma/migrations/**'],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2024,
      },
    },
    rules: {
      // Cho phép console.log — backend dùng console để ghi log khởi động/shutdown.
      'no-console': 'off',

      // Báo lỗi biến không dùng, trừ tham số có tiền tố `_`
      // và tham số `next` bắt buộc phải khai báo của error middleware Express.
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_|^next$',
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Khuyến khích dùng const/let thay vì var và ưu tiên const khi không gán lại.
      'no-var': 'error',
      'prefer-const': 'error',

      // Bắt buộc dùng === thay vì ==, ngoại trừ so sánh với null (bắt cả undefined).
      eqeqeq: ['error', 'always', { null: 'ignore' }],
    },
  },
];
