import { defineConfig } from 'astro/config';

const site = process.env.SITE_URL || 'https://digiplain.invalid';

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto'
  }
});
