import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/auto-icons'],
  autoIcons: {
    baseIconPath: 'assets/icon.svg',
  },
  manifest: {
    default_locale: 'es',
    name: '__MSG_pvExtName__',
    short_name: '__MSG_pvExtShortName__',
    description: '__MSG_pvExtDescription__',
    version: '1.0.0',
    permissions: ['storage', 'clipboardWrite'],
    action: {
      default_title: 'Prompt Vault',
    },
    commands: {
      _execute_action: {
        suggested_key: {
          default: 'Alt+Shift+V',
          mac: 'Alt+Shift+V',
        },
        description: '__MSG_pvCommandOpen__',
      },
    },
  },
});
