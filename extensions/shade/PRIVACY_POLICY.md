# Privacy Policy — Shade

**Effective Date:** November 28, 2026  
**Developer:** Nicolas Valenzuela (Beto18v)  
**Contact Email:** [nicolasalbertov18@gmail.com](mailto:nicolasalbertov18@gmail.com)  
**Website:** [nival.is-a.dev](https://nival.is-a.dev)  
**Issue Tracker:** [github.com/Beto18v/browser-extensions/issues](https://github.com/Beto18v/browser-extensions/issues)

---

## English (`en`)

### 1. 100% Local-First & Zero Telemetry
**Shade** operates entirely locally inside your browser. It does **not** collect, transmit, sell, or share any personal data, browsing history, page contents, or usage analytics. There are zero remote servers, zero third-party SDKs, and zero telemetry beacons.

### 2. Data Stored Locally
All preferences (selected theme, UI language, and per-domain brightness, contrast, warmth, preset, and canvas settings) are stored exclusively on your device via `chrome.storage.local` (`st_domains_v1` and `st_settings_v1`).

### 3. Justification for Requested Permissions
- **`storage`**: Persists your per-domain calibration profiles and UI preferences locally on your device.
- **`tabs`**: Reads the active tab's URL hostname solely to match your per-domain profile and update the extension badge (`ON`). No browsing history is logged or transmitted.
- **`scripting`**: Injects the local style controller into already-open tabs when you enable Shade, so you never have to reload a page.
- **`<all_urls>`**: Required so the `document_start` content script can inject your local `<style id="shade-engine">` CSS rules before page paint, preventing white flashes on websites you opt into.

---

## Español (`es`)

### 1. 100% Local-First y Cero Telemetría
**Shade** funciona completamente de forma local en tu navegador. **No** recopila, transmite, vende ni comparte datos personales, historial de navegación, contenido de páginas ni analíticas de uso. No existen servidores remotos, SDKs de terceros ni telemetría.

### 2. Datos Almacenados Localmente
Todas tus preferencias (tema, idioma de la interfaz y calibración por dominio de brillo, contraste, calidez, perfil óptico y lienzo) se guardan exclusivamente en tu dispositivo mediante `chrome.storage.local` (`st_domains_v1` y `st_settings_v1`).

### 3. Justificación de los Permisos Solicitados
- **`storage`**: Almacena localmente en tu dispositivo los perfiles por dominio y las preferencias de la interfaz.
- **`tabs`**: Lee el dominio de la pestaña activa únicamente para aplicar tu perfil guardado y actualizar la insignia (`ON`). No se registra ni transmite el historial.
- **`scripting`**: Inyecta el controlador de estilos local en pestañas que ya estaban abiertas al activar Shade, evitando tener que recargar la página.
- **`<all_urls>`**: Necesario para que el script de contenido en `document_start` inyecte la etiqueta local `<style id="shade-engine">` antes del renderizado y evite destellos blancos en los sitios que actives.

---

## Português do Brasil (`pt_BR`)

### 1. 100% Local-First e Zero Telemetria
O **Shade** opera totalmente de forma local no seu navegador. Ele **não** coleta, transmite, vende ou compartilha dados pessoais, histórico de navegação, conteúdo de páginas ou métricas de uso. Não há servidores remotos, SDKs de terceiros nem telemetria.

### 2. Dados Armazenados Localmente
Todas as preferências (tema, idioma da interface e perfis por domínio de brilho, contraste, temperatura, predefinição e tela) são armazenadas exclusivamente no seu dispositivo via `chrome.storage.local` (`st_domains_v1` e `st_settings_v1`).

### 3. Justificativa das Permissões Solicitadas
- **`storage`**: Salva seus perfis de calibração por domínio e preferências da interface localmente no seu dispositivo.
- **`tabs`**: Lê o domínio da aba ativa apenas para corresponder ao seu perfil salvo e atualizar o emblema (`ON`). Nenhum histórico é registrado ou enviado.
- **`scripting`**: Injeta o controlador de estilos local em abas já abertas quando você ativa o Shade, sem precisar recarregar a página.
- **`<all_urls>`**: Necessário para que o script de conteúdo em `document_start` injete o `<style id="shade-engine">` local antes da pintura da página, evitando flashes brancos nos sites ativados.

---

## Français (`fr`)

### 1. 100% Local-First et Zéro Télémétrie
**Shade** fonctionne entièrement en local dans votre navigateur. L’extension ne collecte, ne transmet, ne vend et ne partage **aucune** donnée personnelle, historique de navigation, contenu de page ou statistique d’utilisation. Il n’y a aucun serveur distant, aucun SDK tiers et aucune télémétrie.

### 2. Données Stockées Localement
Toutes vos préférences (thème, langue de l’interface et profils par domaine : luminosité, contraste, chaleur, préréglage et canevas) sont enregistrées exclusivement sur votre appareil via `chrome.storage.local` (`st_domains_v1` et `st_settings_v1`).

### 3. Justification des Permissions Demandées
- **`storage`** : Enregistre localement sur votre appareil vos profils de calibration par domaine et vos préférences d’interface.
- **`tabs`** : Lit le nom d’hôte de l’onglet actif uniquement pour appliquer votre profil et mettre à jour le badge (`ON`). Aucun historique n’est conservé ni transmis.
- **`scripting`** : Injecte le contrôleur de style local dans les onglets déjà ouverts lorsque vous activez Shade, sans avoir besoin de recharger la page.
- **`<all_urls>`** : Requis pour que le script de contenu exécuté à `document_start` injecte la balise locale `<style id="shade-engine">` avant l’affichage afin d’éviter tout flash blanc sur les sites activés.

---

## Deutsch (`de`)

### 1. 100% Local-First & Keine Telemetrie
**Shade** arbeitet vollständig lokal in Ihrem Browser. Es werden **keine** personenbezogenen Daten, Browserverläufe, Seiteninhalte oder Nutzungsstatistiken erfasst, übertragen, verkauft oder geteilt. Es gibt keine Remote-Server, keine Drittanbieter-SDKs und keine Telemetrie.

### 2. Lokal Gespeicherte Daten
Alle Einstellungen (Design, Sprache der Benutzeroberfläche sowie domänenspezifische Werte für Helligkeit, Kontrast, Wärme, Profil und Canvas) werden ausschließlich lokal auf Ihrem Gerät über `chrome.storage.local` (`st_domains_v1` und `st_settings_v1`) gespeichert.

### 3. Begründung der Angeforderten Berechtigungen
- **`storage`**: Speichert Ihre domänenspezifischen Kalibrierungsprofile und UI-Einstellungen lokal auf Ihrem Gerät.
- **`tabs`**: Liest den Hostnamen des aktiven Tabs ausschließlich, um Ihr gespeichertes Profil zuzuordnen und das Badge (`ON`) zu aktualisieren. Es wird kein Verlauf protokolliert oder übertragen.
- **`scripting`**: Fügt den lokalen Stil-Controller in bereits geöffnete Tabs ein, wenn Sie Shade aktivieren, sodass kein Neuladen erforderlich ist.
- **`<all_urls>`**: Erforderlich, damit das Content-Script bei `document_start` das lokale `<style id="shade-engine">` vor dem Seitenaufbau injizieren kann, um weißes Aufblitzen auf aktivierten Websites zu verhindern.

---

## 日本語 (`ja`)

### 1. 100% ローカルファースト＆テレメトリなし
**Shade** はブラウザ内で完全にローカル動作します。個人情報、閲覧履歴、ページ内容、利用状況の分析データを収集、送信、販売、共有することは**一切ありません**。外部サーバー、サードパーティSDK、テレメトリは使用していません。

### 2. ローカルに保存されるデータ
すべての設定（テーマ、UI言語、ドメインごとの明るさ、コントラスト、暖色フィルタ、プリセット、キャンバス設定）は、お使いのデバイス上の `chrome.storage.local`（`st_domains_v1` および `st_settings_v1`）にのみ保存されます。

### 3. 要求する権限の理由
- **`storage`**: ドメイン別のキャリブレーション設定とUI設定をデバイス上にローカル保存するため。
- **`tabs`**: アクティブなタブのホスト名のみを読み取り、保存されたプロファイルの一致確認とバッジ（`ON`）の更新を行うため。閲覧履歴の記録や送信は行いません。
- **`scripting`**: すでに開いているタブでShadeを有効にした際、ページを再読み込みせずにローカルのスタイル制御スクリプトを挿入するため。
- **`<all_urls>`**: 有効化したサイトで白いフラッシュを防ぐため、`document_start` でローカルの `<style id="shade-engine">` をページ描画前に挿入するために必要です。
