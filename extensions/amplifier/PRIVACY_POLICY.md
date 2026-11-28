# Privacy Policy — Amplifier

**Last updated:** November 28, 2026  
**Developer:** Nicolas Valenzuela (Beto18v) — [nival.is-a.dev](https://nival.is-a.dev) | [github.com/Beto18v](https://github.com/Beto18v)  
**Contact:** [nicolasalberto18@hotmail.com](mailto:nicolasalberto18@hotmail.com)

---

## English

**Amplifier** does not collect, store, transmit, sell, or share any personal data, browsing history, or user activity.

- **100% Local Execution:** All audio stream processing, per-site volume memory, tone presets, language settings, and theme preferences operate exclusively in your browser without external servers.
- **Zero Network Requests:** The extension makes no external network calls, uses no analytics, tracking, or telemetry scripts, and connects to no backend databases.
- **Permissions Used:**
  - `tabCapture`: Captures the audio stream of the active tab only when you interact with the volume controls, routing it into the browser's local Web Audio API engine.
  - `offscreen`: Creates an offscreen document required by Chrome Manifest V3 to host the Web Audio API processing graph (`GainNode`, `BiquadFilterNode`, and `DynamicsCompressorNode`).
  - `storage`: Saves per-site volume levels, active presets, limiter toggles, and user preferences locally in your browser using `chrome.storage.local`.
  - `tabs`: Queries the current tab to identify its domain for per-site volume memory and checks which background tabs are playing audio to provide quick-mute controls.

---

## Español

**Amplifier** no recopila, almacena, transmite, vende ni comparte datos personales, historial de navegación ni actividad del usuario.

- **Ejecución 100% Local:** Todo el procesamiento de audio, la memoria de volumen por dominio, los presets de tono, el idioma y el tema funcionan de forma estrictamente local en tu navegador.
- **Cero Peticiones de Red:** La extensión no realiza ninguna petición a servidores externos, no incluye analítica ni telemetría y no se conecta a ninguna base de datos remota.
- **Permisos utilizados:**
  - `tabCapture`: Captura el flujo de audio de la pestaña activa únicamente cuando interactúas con los controles para dirigirlo al motor local de Web Audio API.
  - `offscreen`: Crea un documento offscreen requerido por Manifest V3 para alojar el grafo de procesamiento de Web Audio API (`GainNode`, `BiquadFilterNode` y `DynamicsCompressorNode`).
  - `storage`: Guarda localmente en tu navegador los volúmenes por sitio web, presets seleccionados, estado del limitador y tema mediante `chrome.storage.local`.
  - `tabs`: Consulta el dominio de la pestaña activa para recordar el volumen asignado y detecta pestañas audibles para permitir silenciarlas con un clic.

---

## Português (Brasil)

**Amplifier** não coleta, armazena, transmite, vende ou compartilha dados pessoais, histórico de navegação ou atividade do usuário.

- **Execução 100% Local:** Todo o processamento de áudio, memória de volume por site, predefinições de tom, idioma e tema funcionam estritamente no seu navegador sem servidores externos.
- **Zero Requisições de Rede:** A extensão não realiza chamadas de rede externas, não utiliza scripts de rastreamento, análise ou telemetria e não se conecta a servidores ou bancos de dados remotos.
- **Permissões Utilizadas:**
  - `tabCapture`: Captura o fluxo de áudio da aba ativa apenas quando você interage com os controles para roteá-lo ao motor local da Web Audio API.
  - `offscreen`: Cria um documento offscreen exigido pelo Manifest V3 para hospedar o processamento da Web Audio API (`GainNode`, `BiquadFilterNode` e `DynamicsCompressorNode`).
  - `storage`: Salva níveis de volume por site, predefinições selecionadas, estado do limitador e tema localmente através de `chrome.storage.local`.
  - `tabs`: Consulta o domínio da aba ativa para lembrar o volume atribuído e identifica abas audíveis em segundo plano para controle rápido de mudo.

---

## Français

**Amplifier** ne collecte, ne stocke, ne transmet, ne vend ni ne partage aucune donnée personnelle, historique de navigation ou activité de l'utilisateur.

- **Exécution 100% Locale :** Tout le traitement audio, la mémorisation du volume par site, les préréglages sonores, la langue et le thème fonctionnent exclusivement dans votre navigateur sans serveurs externes.
- **Zéro Requête Réseau :** L'extension n'effectue aucun appel réseau externe, n'utilise aucun outil d'analyse, de traçage ou de télémétrie et ne se connecte à aucune base de données distante.
- **Autorisations Utilisées :**
  - `tabCapture` : Capture le flux audio de l'onglet actif uniquement lors de votre interaction pour le diriger vers le moteur local Web Audio API.
  - `offscreen` : Crée un document offscreen requis par Chrome Manifest V3 pour héberger le traitement de Web Audio API (`GainNode`, `BiquadFilterNode` et `DynamicsCompressorNode`).
  - `storage` : Enregistre les niveaux de volume par site, les préréglages, l'état du limiteur et le thème localement via `chrome.storage.local`.
  - `tabs` : Vérifie le domaine de l'onglet actif pour mémoriser le volume et identifie les onglets diffusant du son pour les couper rapidement en arrière-plan.

---

## Deutsch

**Amplifier** erfasst, speichert, überträgt, verkauft oder teilt keine personenbezogenen Daten, keinen Browserverlauf und keine Benutzeraktivitäten.

- **100% Lokale Ausführung:** Die gesamte Audioverarbeitung, Lautstärkespeicherung pro Website, Tone-Presets, Sprache und Designeinstellungen laufen ausschließlich lokal in Ihrem Browser ohne externe Server.
- **Keine Netzwerkanfragen:** Die Erweiterung führt keine externen Netzwerkaufrufe durch, nutzt keinerlei Tracking-, Analyse- oder Telemetrie-Skripte und verbindet sich mit keinen externen Datenbanken.
- **Verwendete Berechtigungen:**
  - `tabCapture`: Erfasst den Audiostream des aktiven Tabs nur bei Benutzerinteraktion mit den Reglern, um ihn an die lokale Web Audio API weiterzuleiten.
  - `offscreen`: Erstellt ein von Chrome Manifest V3 erforderliches Offscreen-Dokument zur Ausführung des Web Audio API-Graphen (`GainNode`, `BiquadFilterNode`, `DynamicsCompressorNode`).
  - `storage`: Speichert Website-Lautstärken, gewählte Presets, Limiter-Status und Benutzereinstellungen lokal über `chrome.storage.local`.
  - `tabs`: Ermittelt die Domain des aktiven Tabs zur Lautstärkespeicherung und erkennt Hintergrund-Tabs mit Tonwiedergabe für schnelles Stummschalten.

---

## 日本語 (Japanese)

**Amplifier** は、個人データ、閲覧履歴、ユーザーの利用状況を一切収集、保存、送信、販売、共有しません。

- **100% ローカル実行:** 音声処理、サイト別音量記憶、トーンプリセット、言語、テーマ設定はすべて外部サーバーを使用せず、ブラウザ内でローカルに完結します。
- **外部ネットワーク通信ゼロ:** 本拡張機能は外部サーバーへの通信を行わず、分析ツール、トラッキング、テレメトリは一切使用しません。
- **使用する権限:**
  - `tabCapture`: ユーザーが操作した際にアクティブタブの音声をキャプチャし、ローカルの Web Audio API にルーティングするために使用します。
  - `offscreen`: Chrome Manifest V3 の仕様に基づき、Web Audio API（`GainNode`、`BiquadFilterNode`、`DynamicsCompressorNode`）を実行するオフスクリーンドキュメントを作成するために使用します。
  - `storage`: サイト別の音量、選択されたプリセット、リミッター設定、テーマを `chrome.storage.local` を介してローカルに保存するために使用します。
  - `tabs`: サイト別音量記憶のためにドメインを特定し、バックグラウンドで音声が再生されているタブを検出・ミュートするために使用します。
