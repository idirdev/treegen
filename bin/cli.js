#!/usr/bin/env node
'use strict';

/**
 * @fileoverview treegen CLI entry point.
 * @author idirdev
 */

const path = require('path');
const { generateTree, getStats, toJson, toMarkdown } = require('../src/index.js');

const argv = process.argv.slice(2);

if (argv.includes('--help') || argv.includes('-h')) {
  console.log([
    'Usage: treegen [dir] [options]',
    '',
    'Options:',
    '  --depth <n>       Maximum depth (default: unlimited)',
    '  --ignore <list>   Comma-separated names to ignore',
    '  --size            Show file sizes',
    '  --date            Show last-modified dates',
    '  --dirs-first      List directories before files',
    '  --json            Output as JSON',
    '  --markdown        Output as Markdown list',
    '  --stats           Show summary statistics',
    '  --help            Show this help',
  ].join('\n'));
  process.exit(0);
}

function flag(name, def) {
  const idx = argv.indexOf('--' + name);
  if (idx === -1) return def;
  return argv[idx + 1] !== undefined && !argv[idx + 1].startsWith('--')
    ? argv[idx + 1]
    : def;
}

const dir = argv.find(a => !a.startsWith('--')) || process.cwd();
const absDir = path.resolve(dir);

const opts = {
  maxDepth: flag('depth', null) !== null ? parseInt(flag('depth', null), 10) : Infinity,
  ignore: flag('ignore', null) ? flag('ignore', null).split(',') : [],
  showSize: argv.includes('--size'),
  showDate: argv.includes('--date'),
  dirsFirst: argv.includes('--dirs-first'),
};

if (argv.includes('--json')) {
  console.log(JSON.stringify(toJson(absDir, opts), null, 2));
} else if (argv.includes('--markdown')) {
  console.log(toMarkdown(absDir, opts));
} else {
  console.log(generateTree(absDir, opts));
}

if (argv.includes('--stats')) {
  const s = getStats(absDir);
  console.log('\n' + s.dirs + ' directories, ' + s.files + ' files');
}
