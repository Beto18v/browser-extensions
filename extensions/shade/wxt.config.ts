import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/auto-icons'],
  autoIcons: {
    baseIconPath: 'assets/icon.svg',
  },
  manifest: {
    default_locale: 'en',
    name: '__MSG_stExtName__',
    short_name: '__MSG_stExtShortName__',
    description: '__MSG_stExtDescription__',
    version: '1.0.0',
    permissions: ['storage', 'tabs', 'scripting'],
    host_permissions: ['<all_urls>'],
    action: {
      default_title: '__MSG_stExtName__',
    },
    commands: {
      _execute_action: {
        suggested_key: {
          default: 'Alt+Shift+S',
          mac: 'Alt+Shift+S',
        },
        description: '__MSG_stCommandOpen__',
      },
    },
  },
});
