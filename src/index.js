'use strict';

/**
 * @fileoverview treegen - Generate directory tree visualizations.
 * @module treegen
 * @author idirdev
 */

const fs = require('fs');
const path = require('path');

/**
 * Default directories and files to ignore when walking the tree.
 * @type {string[]}
 */
const DEFAULT_IGNORE = ['node_modules', '.git', 'dist', 'coverage'];

/**
 * Formats a byte count into a human-readable string.
 * @param {number} bytes - Number of bytes.
 * @returns {string} Formatted size string.
 */
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

/**
 * Returns statistics about a directory.
 * @param {string} dir - Directory path.
 * @returns {{ files: number, dirs: number, totalSize: number }}
 */
function getStats(dir) {
  let files = 0;
  let dirs = 0;
  let totalSize = 0;

  function walk(current) {
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        dirs++;
        walk(full);
      } else {
        files++;
        try {
          totalSize += fs.statSync(full).size;
        } catch { /* skip */ }
      }
    }
  }

  walk(dir);
  return { files, dirs, totalSize };
}

/**
 * @typedef {Object} TreeOptions
 * @property {number}   [maxDepth=Infinity] - Maximum depth to traverse.
 * @property {string[]} [ignore]            - Extra patterns to ignore.
 * @property {boolean}  [showSize=false]    - Show file sizes.
 * @property {boolean}  [showDate=false]    - Show last-modified dates.
 * @property {boolean}  [dirsFirst=false]   - List directories before files.
 * @property {boolean}  [filesOnly=false]   - Show only files.
 * @property {boolean}  [dirsOnly=false]    - Show only directories.
 */

/**
 * Builds the ASCII tree lines for a directory.
 * @param {string}      dir     - Absolute directory path.
 * @param {TreeOptions} opts    - Options.
 * @param {string}      prefix  - Current line prefix.
 * @param {number}      depth   - Current depth.
 * @param {string[]}    ignored - Combined ignore list.
 * @returns {string[]} Array of tree lines.
 */
function buildLines(dir, opts, prefix, depth, ignored) {
  if (depth > (opts.maxDepth != null ? opts.maxDepth : Infinity)) return [];

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  entries = entries.filter(e => !ignored.includes(e.name));

  if (opts.filesOnly) entries = entries.filter(e => !e.isDirectory());
  if (opts.dirsOnly) entries = entries.filter(e => e.isDirectory());

  if (opts.dirsFirst) {
    entries = [
      ...entries.filter(e => e.isDirectory()),
      ...entries.filter(e => !e.isDirectory()),
    ];
  }

  const lines = [];

  entries.forEach((entry, i) => {
    const isLast = i === entries.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const childPrefix = prefix + (isLast ? '    ' : '│   ');
    const full = path.join(dir, entry.name);

    let label = entry.name;

    if (opts.showSize && !entry.isDirectory()) {
      try {
        const stat = fs.statSync(full);
        label += ' (' + formatSize(stat.size) + ')';
      } catch { /* skip */ }
    }

    if (opts.showDate) {
      try {
        const stat = fs.statSync(full);
        label += ' [' + stat.mtime.toISOString().slice(0, 10) + ']';
      } catch { /* skip */ }
    }

    lines.push(prefix + connector + label);

    if (entry.isDirectory()) {
      const subLines = buildLines(full, opts, childPrefix, depth + 1, ignored);
      lines.push(...subLines);
    }
  });

  return lines;
}

/**
 * Generates an ASCII tree string for the given directory.
 * @param {string}      dir       - Directory path to visualise.
 * @param {TreeOptions} [opts={}] - Options.
 * @returns {string} The ASCII tree.
 */
function generateTree(dir, opts = {}) {
  const absDir = path.resolve(dir);
  const ignored = [...DEFAULT_IGNORE, ...(opts.ignore || [])];
  const name = path.basename(absDir);
  const lines = buildLines(absDir, opts, '', 1, ignored);
  return [name, ...lines].join('\n');
}

/**
 * Builds a JSON representation of the directory tree.
 * @param {string}      dir       - Directory path.
 * @param {TreeOptions} [opts={}] - Options.
 * @returns {Object} Nested JSON tree object.
 */
function toJson(dir, opts = {}) {
  const absDir = path.resolve(dir);
  const ignored = [...DEFAULT_IGNORE, ...(opts.ignore || [])];

  function walk(current, depth) {
    const name = path.basename(current);
    let stat;
    try { stat = fs.statSync(current); } catch { return { name, type: 'unknown' }; }

    if (stat.isDirectory()) {
      if (depth > (opts.maxDepth != null ? opts.maxDepth : Infinity)) {
        return { name, type: 'directory', children: [] };
      }
      let entries = [];
      try { entries = fs.readdirSync(current, { withFileTypes: true }); } catch { /* skip */ }
      entries = entries.filter(e => !ignored.includes(e.name));
      if (opts.filesOnly) entries = entries.filter(e => !e.isDirectory());
      if (opts.dirsOnly) entries = entries.filter(e => e.isDirectory());
      return {
        name,
        type: 'directory',
        children: entries.map(e => walk(path.join(current, e.name), depth + 1)),
      };
    }

    const node = { name, type: 'file' };
    if (opts.showSize) node.size = stat.size;
    if (opts.showDate) node.modified = stat.mtime.toISOString().slice(0, 10);
    return node;
  }

  return walk(absDir, 1);
}

/**
 * Returns a Markdown list representation of the directory tree.
 * @param {string}      dir       - Directory path.
 * @param {TreeOptions} [opts={}] - Options.
 * @returns {string} Markdown bullet list.
 */
function toMarkdown(dir, opts = {}) {
  const absDir = path.resolve(dir);
  const ignored = [...DEFAULT_IGNORE, ...(opts.ignore || [])];

  function walk(current, depth) {
    const indent = '  '.repeat(depth);
    const name = path.basename(current);
    let stat;
    try { stat = fs.statSync(current); } catch { return indent + '- ' + name; }

    if (stat.isDirectory()) {
      if (depth > (opts.maxDepth != null ? opts.maxDepth : Infinity)) {
        return indent + '- **' + name + '/**';
      }
      let entries = [];
      try { entries = fs.readdirSync(current, { withFileTypes: true }); } catch { /* skip */ }
      entries = entries.filter(e => !ignored.includes(e.name));
      if (opts.filesOnly) entries = entries.filter(e => !e.isDirectory());
      if (opts.dirsOnly) entries = entries.filter(e => e.isDirectory());
      const children = entries.map(e => walk(path.join(current, e.name), depth + 1));
      return [indent + '- **' + name + '/**', ...children].join('\n');
    }

    return indent + '- ' + name;
  }

  return walk(absDir, 0);
}

module.exports = {
  generateTree,
  getStats,
  formatSize,
  toJson,
  toMarkdown,
  DEFAULT_IGNORE,
};
