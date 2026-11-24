import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    name: 'MD for AI',
    description: 'Markdown converter and optimizer for AI prompts and contexts.',
    version: '0.1.0',
    permissions: ['activeTab', 'scripting', 'storage', 'clipboardWrite'],
    action: {
      default_title: 'MD for AI',
    },
  },
  hooks: {
    'build:manifestGenerated': (_wxt, manifest) => {
      delete (manifest as any).host_permissions;
    },
  },
});
