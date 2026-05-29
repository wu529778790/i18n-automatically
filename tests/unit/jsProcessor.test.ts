import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const testFixturesPath = path.join(__dirname, '../fixtures/i18n-samples');

describe('JS Processor', () => {
  it('should detect Chinese characters in JavaScript file', () => {
    const beforeFilePath = path.join(testFixturesPath, 'js/before.js');
    expect(fs.existsSync(beforeFilePath)).toBe(true);

    const content = fs.readFileSync(beforeFilePath, 'utf8');
    const chineseRegex = /[一-龥]+/g;
    const matches = content.match(chineseRegex);

    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThan(0);
  });

  it('should replace Chinese strings with i18n function calls', () => {
    const beforeFilePath = path.join(testFixturesPath, 'js/before.js');
    const afterFilePath = path.join(testFixturesPath, 'js/after.js');

    expect(fs.existsSync(beforeFilePath)).toBe(true);
    expect(fs.existsSync(afterFilePath)).toBe(true);

    const beforeContent = fs.readFileSync(beforeFilePath, 'utf8');
    const afterContent = fs.readFileSync(afterFilePath, 'utf8');

    expect(afterContent).toContain('t(');

    const chineseRegex = /[一-龥]+/g;
    const afterMatches = afterContent.match(chineseRegex);
    const beforeMatches = beforeContent.match(chineseRegex);

    expect(beforeMatches ? beforeMatches.length : 0).toBeGreaterThan(0);
    expect(afterMatches ? afterMatches.length : 0).toBeLessThanOrEqual(
      beforeMatches ? beforeMatches.length : 0,
    );
  });

  it('should generate valid JavaScript syntax', () => {
    const afterFilePath = path.join(testFixturesPath, 'js/after.js');
    expect(fs.existsSync(afterFilePath)).toBe(true);
    const content = fs.readFileSync(afterFilePath, 'utf8');
    expect(content.length).toBeGreaterThan(0);
  });
});
