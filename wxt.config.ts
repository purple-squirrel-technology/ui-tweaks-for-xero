import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: '.',
  manifest: {
    name: 'Tools for Xero',
    description: 'Bookkeeping tools and shortcuts for the Xero accounting web app.',
    permissions: ['storage'],
    host_permissions: ['https://go.xero.com/*'],
  },
});
