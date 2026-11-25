# Research Vault — Agent Guidelines

Reglas específicas para el desarrollo y mantenimiento de **Research Vault** (en desarrollo, aún sin código).

## Identidad

- **Directorio:** `extensions/research-vault/`
- **pnpm filter name:** `research-vault`
- **UI name:** Research Vault
- **Shortcut:** `Alt+Shift+R`

## Arquitectura

- Popup + Content Script + Background service worker + `chrome.storage.local` + `chrome.storage.session`.
- `content.ts` inyectado en `<all_urls>`: escucha `GET_SELECTION`, responde `{ text, url, pageTitle }`.
- `background.ts`: captura `_execute_action` → `GET_SELECTION` → guarda `pendingClip` en session → abre popup.
- `popup/main.ts`: lee session al arrancar → si hay `pendingClip` abre vista Captura, si no abre Biblioteca.

## Storage keys

```ts
STORAGE_CLIPS_KEY = 'rv_clips_v1'
STORAGE_PROJECTS_KEY = 'rv_projects_v1'
```

- `chrome.storage.session` key: `'pendingClip'`
- El proyecto `id='default'` (General) siempre existe y nunca se elimina.
- Al eliminar un proyecto: migrar sus clips a `id='default'` antes de borrarlo.

## Limitación conocida del shortcut

- `chrome.action.openPopup()` solo disponible en Chrome 127+.
- En versiones anteriores el popup abre por clic. No es un bug.
- El shortcut igual captura el texto y lo deja listo en session.

## Tests y verificación

```bash
pnpm --filter research-vault test
pnpm --filter research-vault run compile
pnpm --filter research-vault run build
```
