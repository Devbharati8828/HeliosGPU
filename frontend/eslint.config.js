import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      // Use default espree parser with JSX enabled
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        // Browser
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        performance: 'readonly',
        fetch: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        Date: 'readonly',
        Math: 'readonly',
        isFinite: 'readonly',
        isNaN: 'readonly',
        Blob: 'readonly',
        Uint8Array: 'readonly',
        Float32Array: 'readonly',
        ArrayBuffer: 'readonly',
        DataView: 'readonly',
        URL: 'readonly',
        Promise: 'readonly',
        Error: 'readonly',
        Event: 'readonly',
        File: 'readonly',
        // Web Worker / Canvas / Offscreen
        createImageBitmap: 'readonly',
        OffscreenCanvas: 'readonly',
        ImageData: 'readonly',
        // WebGPU
        GPUBufferUsage: 'readonly',
        GPUMapMode: 'readonly',
        // React JSX transform (no import needed in React 17+)
        React: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      'no-console': ['warn', { allow: ['error', 'warn', 'info'] }],
      'no-undef': 'error',
    },
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'public/**',
      'scripts/**',
    ],
  },
];
