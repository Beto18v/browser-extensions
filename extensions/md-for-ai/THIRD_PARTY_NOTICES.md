# Third-Party Software Notices & Licenses

This extension (`md-for-ai`) bundles third-party open source packages at runtime. Below is the list of included packages, authors, and license identifiers:

---

## 1. @mozilla/readability
- **Package**: `@mozilla/readability`
- **Version**: `^0.6.0`
- **License**: Apache-2.0
- **Copyright**: Copyright 2010 Mozilla Foundation
- **Repository**: https://github.com/mozilla/readability
- **Purpose**: Article content extraction and cleanup from DOM trees.

---

## 2. turndown
- **Package**: `turndown`
- **Version**: `^7.2.5`
- **License**: MIT
- **Copyright**: Copyright (c) 2017 Dom Christie
- **Repository**: https://github.com/mixmark-io/turndown
- **Purpose**: HTML to Markdown conversion engine.

---

## 3. @joplin/turndown-plugin-gfm
- **Package**: `@joplin/turndown-plugin-gfm`
- **Version**: `^1.0.71`
- **License**: MIT
- **Copyright**: Copyright (c) Laurent Cozic
- **Repository**: https://github.com/laurent22/joplin/tree/dev/packages/turndown-plugin-gfm
- **Purpose**: GitHub Flavored Markdown plugin for Turndown (tables, strikethrough, task lists).

---

## 4. @browser-extensions/shared
- **Package**: `@browser-extensions/shared`
- **License**: MIT
- **Copyright**: (c) Nicolas Valenzuela (Beto18v)
- **Purpose**: Monorepo internal package for i18n translation utilities and shared types.

---

## DevDependencies Verification
The following tools are strictly build-time / test-time developer dependencies (`devDependencies`) and are NOT included in the final extension runtime bundle:
- `@types/*` (type definitions)
- `@wxt-dev/auto-icons` (offline icon generator)
- `sharp` (offline image processing)
- `vitest` (unit testing framework)
- `jsdom` (test environment DOM simulator)
- `typescript` (typechecker and compiler)
- `wxt` (extension build framework)
