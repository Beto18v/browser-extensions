import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/auto-icons'],
  autoIcons: {
    baseIconPath: 'assets/icon.svg',
  },
  manifest: {
    default_locale: 'es',
    name: '__MSG_extName__',
    short_name: '__MSG_extShortName__',
    description: '__MSG_extDescription__',
    version: '1.0.0',
    permissions: ['activeTab', 'scripting', 'storage', 'clipboardWrite'],
    action: {
      default_title: '__MSG_extShortName__',
    },
    commands: {
      _execute_action: {
        suggested_key: {
          default: 'Alt+Shift+M',
          mac: 'Alt+Shift+M',
        },
        description: '__MSG_commandOpen__',
      },
    },
  },
  hooks: {
    'build:manifestGenerated': (_wxt, manifest) => {
      delete (manifest as any).host_permissions;
    },
  },
});
