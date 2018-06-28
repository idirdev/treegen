'use strict';

/**
 * @fileoverview Tests for treegen.
 * @author idirdev
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { generateTree, getStats, formatSize, toJson, toMarkdown, DEFAULT_IGNORE } = require('../src/index.js');

let tmpDir;

before(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'treegen-test-'));
  fs.mkdirSync(path.join(tmpDir, 'a'));
  fs.writeFileSync(path.join(tmpDir, 'a', 'b.txt'), 'hello');
  fs.writeFileSync(path.join(tmpDir, 'c.txt'), 'world');
  fs.mkdirSync(path.join(tmpDir, 'node_modules'));
  fs.writeFileSync(path.join(tmpDir, 'node_modules', 'ignored.js'), '');
  fs.mkdirSync(path.join(tmpDir, 'deep', 'nested'), { recursive: true });
  fs.writeFileSync(path.join(tmpDir, 'deep', 'nested', 'file.txt'), 'deep');
});

after(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('generateTree', () => {
  it('returns a string containing box-drawing chars', () => {
    const out = generateTree(tmpDir);
    assert.ok(typeof out === 'string');
    assert.ok(out.includes('├──') || out.includes('└──'));
  });

  it('includes expected file and directory names', () => {
    const out = generateTree(tmpDir);
    assert.ok(out.includes('c.txt'));
    assert.ok(out.includes('a'));
  });

  it('ignores node_modules by default', () => {
    const out = generateTree(tmpDir);
    assert.ok(!out.includes('ignored.js'));
  });

  it('respects maxDepth', () => {
    const out = generateTree(tmpDir, { maxDepth: 1 });
    assert.ok(!out.includes('b.txt'));
  });

  it('respects custom ignore list', () => {
    const out = generateTree(tmpDir, { ignore: ['a'] });
    assert.ok(!out.includes('b.txt'));
  });
});

describe('getStats', () => {
  it('returns files, dirs, totalSize', () => {
    const stats = getStats(tmpDir);
    assert.ok(typeof stats.files === 'number');
    assert.ok(typeof stats.dirs === 'number');
    assert.ok(typeof stats.totalSize === 'number');
    assert.ok(stats.files >= 2);
    assert.ok(stats.dirs >= 1);
  });
});

describe('formatSize', () => {
  it('formats bytes correctly', () => {
    assert.strictEqual(formatSize(500), '500 B');
    assert.strictEqual(formatSize(2048), '2.0 KB');
    assert.ok(formatSize(2 * 1024 * 1024).includes('MB'));
  });
});

describe('toJson', () => {
  it('returns an object with name and type', () => {
    const json = toJson(tmpDir);
    assert.strictEqual(json.type, 'directory');
    assert.ok(typeof json.name === 'string');
    assert.ok(Array.isArray(json.children));
  });

  it('does not include ignored dirs', () => {
    const json = toJson(tmpDir);
    assert.ok(!JSON.stringify(json).includes('ignored.js'));
  });

  it('respects maxDepth', () => {
    const json = toJson(tmpDir, { maxDepth: 1 });
    const aDir = json.children.find(c => c.name === 'a');
    assert.ok(aDir);
    assert.deepEqual(aDir.children, []);
  });
});

describe('toMarkdown', () => {
  it('returns a markdown string with expected names', () => {
    const md = toMarkdown(tmpDir);
    assert.ok(typeof md === 'string');
    assert.ok(md.includes('c.txt'));
  });

  it('bolds directory names', () => {
    const md = toMarkdown(tmpDir);
    assert.ok(md.includes('**'));
  });
});

describe('DEFAULT_IGNORE', () => {
  it('contains expected defaults', () => {
    assert.ok(Array.isArray(DEFAULT_IGNORE));
    assert.ok(DEFAULT_IGNORE.includes('node_modules'));
    assert.ok(DEFAULT_IGNORE.includes('.git'));
  });
});
