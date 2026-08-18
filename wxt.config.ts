import {defineConfig} from 'wxt';

export default defineConfig({
    modules: ['@wxt-dev/auto-icons'],
    autoIcons: {
        baseIconPath: 'assets/logo.svg'
    },
    srcDir: '.',
    manifest: {
        name: 'Tools for Xero',
        version: '1.0.0-alpha1',
        description: 'Bookkeeping tools and shortcuts for the Xero accounting web app.',
        permissions: ['storage'],
        host_permissions: ['https://go.xero.com/*', 'https://reporting.xero.com/*']
    },
});
