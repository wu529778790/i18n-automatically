const { default: traverse } = require("@babel/traverse");
const { generateFileUUID, getPosition } = require("../../utils/index.js");
const { collectChineseText } = require("./collectChineseText.js");

const chineseRegex = /[\u4e00-\u9fa5]/;

/**
 * 遍历脚本
 * @param {object} ast 抽象语法树
 * @param {string} script 脚本内容
 * @param {string} filePath 文件路径
 * @param {string} fileUuid 文件 UUID
 * @param {object} config 配置
 */
exports.traverseScript = (
  ast,
  script,
  filePath,
  fileUuid,
  config,
  index,
  hasI18nUsageInScript,
  hasI18nUsageInScriptSetup
) => {
  let modifiedScript = script;
  let prePath;
  let offset = 0;
  traverse(ast, {
    StringLiteral(path) {
      if (chineseRegex.test(path.node.value)) {
        const uuid = generateFileUUID(filePath, fileUuid, index, config);
        const start = path.node.loc.start;
        const end = path.node.loc.end;
        let startPos = getPosition(modifiedScript, start.line, start.column);
        let endPos = getPosition(modifiedScript, end.line, end.column);
        const replacement = `${config.scriptI18nCall}('${uuid}')`;
        if (prePath && prePath.node.loc.start.line === start.line) {
          const preStartPos = getPosition(
            modifiedScript,
            prePath.node.loc.start.line,
            prePath.node.loc.start.column
          );
          const preEndPos = getPosition(
            modifiedScript,
            prePath.node.loc.end.line,
            prePath.node.loc.end.column
          );
          const lineOffset = replacement.length - (preEndPos - preStartPos);
          startPos += lineOffset;
          endPos += lineOffset;
        }
        modifiedScript =
          modifiedScript.substring(0, startPos) +
          replacement +
          modifiedScript.substring(endPos);
        offset += replacement.length - (endPos - startPos);
        hasI18nUsageInScript = true;
        hasI18nUsageInScriptSetup = true;
        prePath = path;
        index++;
        collectChineseText(uuid, path.node.value);
      }
    },
    TemplateLiteral(path) {
      path.node.quasis.forEach((quasi) => {
        if (chineseRegex.test(quasi.value.raw)) {
          const uuid = generateFileUUID(filePath, fileUuid, index, config);
          const start = quasi.start + offset;
          const end = quasi.end + offset;
          const replacement =
            "${" + `${config.scriptI18nCall}('${uuid}')` + "}";
          modifiedScript =
            modifiedScript.substring(0, start) +
            replacement +
            modifiedScript.substring(end);
          offset += replacement.length - (end - start);
          hasI18nUsageInScript = true;
          hasI18nUsageInScriptSetup = true;
          index++;
          collectChineseText(uuid, quasi.value.raw);
        }
      });
    },
  });
  return modifiedScript;
};
