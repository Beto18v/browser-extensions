import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    name: 'Prompt Vault',
    description: 'Local-first vault for your favorite prompts and snippets.',
    version: '0.1.0',
    permissions: ['storage'],
    action: {
      default_title: 'Prompt Vault',
    },
  },
});
