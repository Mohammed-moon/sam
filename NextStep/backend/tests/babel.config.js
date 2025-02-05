module.exports = {
    presets: [
      [
        '@babel/preset-env',
        {
          targets: {
            node: 'current',  // This ensures compatibility with the current version of Node.js
          },
          modules: 'commonjs',  // Ensure that modules are transformed to CommonJS (for Jest compatibility)
        },
      ],
    ],
    plugins: [
      '@babel/plugin-transform-modules-commonjs', // This plugin is usually redundant if you set `modules: 'commonjs'`
    ],
  };
  