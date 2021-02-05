// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'main.js',
  output: {
    file: 'build/scraper.js',
    format: 'cjs'
  },
  plugins: [ resolve() ]
};
