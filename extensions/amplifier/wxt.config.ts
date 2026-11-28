import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/auto-icons'],
  autoIcons: {
    baseIconPath: 'assets/icon.svg',
  },
  manifest: {
    default_locale: 'en',
    name: '__MSG_atExtName__',
    short_name: '__MSG_atExtShortName__',
    description: '__MSG_atExtDescription__',
    version: '1.0.0',
    permissions: ['tabCapture', 'offscreen', 'storage', 'tabs'],
    action: {
      default_title: '__MSG_atExtName__',
    },
    commands: {
      _execute_action: {
        suggested_key: {
          default: 'Alt+Shift+A',
          mac: 'Alt+Shift+A',
        },
        description: '__MSG_atCommandOpen__',
      },
    },
  },
});
