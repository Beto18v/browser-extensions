# Browser Extensions Suite

Suite de extensiones de productividad para investigadores, desarrolladores y usuarios de IA. 100% local, sin servidores.

[![Manifest V3](https://img.shields.io/badge/Manifest_V3-Chrome_%7C_Edge_%7C_Brave-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/)
[![WXT](https://img.shields.io/badge/WXT-0.21.5-6366f1?logo=vite&logoColor=white)](https://wxt.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-workspace-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Extensiones

| Extensión | Directorio | Descripción | Shortcut | Estado |
|---|---|---|---|---|
| Prompt Drawer | `extensions/prompt-drawer/` | Biblioteca local de prompts para IA | `Alt+Shift+V` | v1.0 publicada |
| Research Vault | `extensions/research-vault/` | Captura y organiza clips de investigación web | `Alt+Shift+R` | En desarrollo |

## Comandos del monorepo

```bash
pnpm install
pnpm run build              # todas las extensiones
pnpm run zip                # todas en ZIP
pnpm --filter <name> test
pnpm --filter <name> run build
```

## Compatibilidad Node.js

En Node.js 22.14.0, el soporte de `zstd` fue introducido parcialmente sin `zlib.createZstdDecompress`, lo que provoca un `TypeError` en `undici` al ejecutar Vitest y JSDOM. El repositorio incluye `patches/undici@8.13.1.patch` (configurado en `pnpm-workspace.yaml`) para proteger contra ese fallo y garantizar la ejecución local de tests en Node 22.14.0.

## Autor

**Nicolas Valenzuela** — *AI & Full-Stack Software Engineer*

- Portfolio: [nival.is-a.dev](https://nival.is-a.dev)
- GitHub: [github.com/Beto18v](https://github.com/Beto18v)
- LinkedIn: [linkedin.com/in/beto18v](https://www.linkedin.com/in/beto18v)
