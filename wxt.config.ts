// noinspection JSUnusedGlobalSymbols

import {defineConfig} from 'wxt';

export default defineConfig({
    modules: ['@wxt-dev/auto-icons'],
    autoIcons: {
        baseIconPath: 'assets/logo.svg'
    },
    srcDir: 'src',
    manifest: {
        name: 'Tools for Xero',
        description: 'UI shortcuts and improvements for the Xero accounting web app.',
        permissions: ['storage'],
        host_permissions: ['https://go.xero.com/*', 'https://reporting.xero.com/*'],
        content_security_policy: {
            extension_pages: "script-src 'self'; object-src 'self';"
        },
        browser_specific_settings: {
            gecko: {
                id: 'tools-for-xero@purplesquirreltechnology.com',
                data_collection_permissions: {
                    required: ['none']
                },
                strict_min_version: '128.0'
            }
        }
    },
    zip: {
        excludeSources: ['todos.txt', '*.txt'],
    }
});
