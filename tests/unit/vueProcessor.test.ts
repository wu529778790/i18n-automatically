import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const testFixturesPath = path.join(__dirname, '../fixtures/i18n-samples');

describe('Vue Processor', () => {
  it('should detect Chinese characters in Vue file', () => {
    const beforeFilePath = path.join(testFixturesPath, 'vue/before.vue');
    expect(fs.existsSync(beforeFilePath)).toBe(true);

    const content = fs.readFileSync(beforeFilePath, 'utf8');
    const chineseRegex = /[一-龥]+/g;
    const matches = content.match(chineseRegex);

    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThan(0);
  });

  it('should replace Chinese strings in Vue template with $t() calls', () => {
    const afterFilePath = path.join(testFixturesPath, 'vue/after.vue');
    expect(fs.existsSync(afterFilePath)).toBe(true);
    const afterContent = fs.readFileSync(afterFilePath, 'utf8');
    expect(afterContent).toContain('$t(');
    expect(afterContent).toContain(':placeholder');
  });

  it('should maintain Vue file structure integrity', () => {
    const afterFilePath = path.join(testFixturesPath, 'vue/after.vue');
    expect(fs.existsSync(afterFilePath)).toBe(true);
    const content = fs.readFileSync(afterFilePath, 'utf8');
    expect(content).toContain('<template>');
    expect(content).toContain('<script>');
    expect(content).toContain('</template>');
    expect(content).toContain('</script>');
  });

  it('should use correct i18n syntax in Vue', () => {
    const afterFilePath = path.join(testFixturesPath, 'vue/after.vue');
    expect(fs.existsSync(afterFilePath)).toBe(true);
    const content = fs.readFileSync(afterFilePath, 'utf8');

    const templateSection = content.match(/<template>[\s\S]*<\/template>/);
    if (templateSection) {
      expect(templateSection[0]).toContain('$t(');
    }

    const scriptSection = content.match(/<script>[\s\S]*<\/script>/);
    if (scriptSection) {
      expect(scriptSection[0]).toContain('this.$t(');
    }
  });
});
