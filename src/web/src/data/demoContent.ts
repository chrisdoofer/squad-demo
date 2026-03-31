// Use Vite's glob import to load all demo.md files as raw strings.
// The path is relative to the repo root (two levels up from src/web/).
const demoModules = import.meta.glob('/../../patterns/*/demo.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

// Build a map from pattern id to demo markdown content
export const demoContentMap: Record<string, string> = {};

for (const [path, content] of Object.entries(demoModules)) {
  const match = path.match(/\/patterns\/([^/]+)\/demo\.md$/);
  if (match) {
    demoContentMap[match[1]] = content as string;
  }
}
