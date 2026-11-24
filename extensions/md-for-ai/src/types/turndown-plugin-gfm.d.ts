declare module '@joplin/turndown-plugin-gfm' {
  interface TurndownPlugin {
    (service: any): void;
  }
  export const gfm: TurndownPlugin;
  export const tables: TurndownPlugin;
  export const strikethrough: TurndownPlugin;
  export const taskListItems: TurndownPlugin;
  export const highlightedCodeBlock: TurndownPlugin;
}
