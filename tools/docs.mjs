// Original minimal checker for this lab, not a translation-quality validator.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

function structure(text) {
  return {
    headings: [...text.matchAll(/^(#+) /gm)].map(match => match[1].length),
    code: [...text.matchAll(/^```[^\n]*\n([\s\S]*?)^```/gm)].map(match => match[1]),
    inline: [...text.matchAll(/(?<!`)`([^`\n]+)`(?!`)/g)].map(match => match[1]).sort(),
    bullets: [...text.matchAll(/^[-*] /gm)].length
  };
}

try {
  for (const name of ['README', 'CHANGELOG']) {
    const en = readFileSync(`${name}.md`, 'utf8');
    const zh = readFileSync(`${name}.zh-TW.md`, 'utf8');
    assert.deepEqual(structure(en), structure(zh), `${name}: bilingual structure/code mismatch`);
  }
  console.log('DOCS_SYNC_PASSED: structure/code only; translation needs human review');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
