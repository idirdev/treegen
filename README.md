# treegen

> **[EN]** Generate directory tree visualizations from the command line.
> **[FR]** Generer des visualisations d'arborescence de repertoires en ligne de commande.

---

## Features / Fonctionnalites

**[EN]**
- ASCII tree with box-drawing characters (├── └── │)
- Configurable maximum depth
- Ignore patterns (node_modules, .git, dist, etc.)
- Show file sizes and modification dates
- Directories-first sorting option
- JSON and Markdown output formats
- File and directory count statistics

**[FR]**
- Arborescence ASCII avec caracteres de dessin (├── └── │)
- Profondeur maximale configurable
- Motifs d'exclusion (node_modules, .git, dist, etc.)
- Affichage des tailles et dates de modification
- Option de tri dossiers en premier
- Formats de sortie JSON et Markdown
- Statistiques de comptage fichiers et repertoires

---

## Installation

```bash
npm install -g @idirdev/treegen
```

---

## CLI Usage / Utilisation CLI

```bash
# Current directory tree
treegen

# Specific directory with max depth 3
treegen ./src --depth 3

# Ignore patterns
treegen --ignore node_modules,.git,dist

# Show file sizes
treegen --size

# Directories first
treegen --dirs-first

# JSON or Markdown output
treegen --json
treegen --markdown

# Show stats summary
treegen --stats
```

### Example Output / Exemple de sortie

```
$ treegen ./my-project --depth 2

my-project/
├── src/
│   ├── index.js
│   ├── utils.js
│   └── config.js
├── tests/
│   └── index.test.js
├── package.json
└── README.md

3 directories, 5 files
```

---

## API (Programmatic) / API (Programmation)

```js
const { generateTree, getStats, toJson, toMarkdown } = require('treegen');

// Generate ASCII tree
const tree = generateTree('./my-project', {
  maxDepth: 3,
  ignore: ['node_modules', '.git'],
  showSize: true,
  dirsFirst: true
});
console.log(tree);

// Get statistics
const stats = getStats('./my-project');
// => { files: 12, dirs: 4, totalSize: 34567 }

// JSON tree structure
const json = toJson('./src');

// Markdown list
const md = toMarkdown('./src');
```

---

## License

MIT - idirdev
