const { customLog, generateFileUUID } = require("../../utils/index.js");
const { collectChineseText } = require("./collectChineseText.js");

const chineseRegex = /[\u4e00-\u9fa5]/;

/**
 * 遍历模板
 * @param {object} ast 抽象语法树
 * @param {string} template 模板内容
 * @param {string} filePath 文件路径
 * @param {string} fileUuid 文件 UUID
 * @param {object} config 配置
 */
exports.traverseTemplate = (
  ast,
  template,
  filePath,
  fileUuid,
  config,
  index
) => {
  let modifiedTemplate = template;
  let offset = 0;
  const traverseNode = (node) => {
    switch (node.type) {
      case 0: // Root Node（根节点）
      case 8: // Slot Node（插槽节点）
      case 10: // For Node（循环节点）
        if (node.children) {
          node.children.forEach(traverseNode);
        }
        break;
      case 1: // Element Node（元素节点）
        if (node.props) {
          node.props.forEach((prop) => {
            // Expression Node（表达式节点）
            if (prop.type === 1) {
              console.log("未适配的prop节点", prop.type, prop);
            }
            // Interpolation Node（插值节点）
            if (prop.type === 2) {
              console.log("未适配的prop节点", prop.type, prop);
            }
            // Text Node（文本节点）
            if (prop.type === 3) {
              console.log("未适配的prop节点", prop.type, prop);
            }
            // Comment Node（注释节点）
            if (prop.type === 4) {
              console.log("未适配的prop节点", prop.type, prop);
            }
            // Attribute Node（属性节点）
            if (
              prop.type === 6 &&
              prop.value &&
              prop.value.content &&
              chineseRegex.test(prop.value.content)
            ) {
              const nameStart = prop.loc.start.offset + offset;
              modifiedTemplate =
                modifiedTemplate.substring(0, nameStart) +
                ":" +
                modifiedTemplate.substring(nameStart);
              offset++;
              const uuid = generateFileUUID(filePath, fileUuid, index, config);
              const start = prop.value.loc.start.offset + offset;
              const end = prop.value.loc.end.offset + offset;
              const replacementText = `"${config.templateI18nCall}('${uuid}')"`;
              modifiedTemplate =
                modifiedTemplate.substring(0, start) +
                replacementText +
                modifiedTemplate.substring(end);
              offset += replacementText.length - (end - start);
              index++;
              collectChineseText(uuid, prop.value.content);
            }
            // Directive Node（指令节点）
            if (
              prop.type === 7 &&
              prop.exp &&
              chineseRegex.test(prop.exp.content)
            ) {
              const content = prop.exp.content;
              const start = prop.exp.loc.start.offset;
              const chineseRegex = /[\u4e00-\u9fa5]+/g;
              let match;
              while ((match = chineseRegex.exec(content))) {
                let matchStart = start + match.index + offset;
                let matchEnd = matchStart + match[0].length;
                // 判断match前后是不是引号
                if (
                  (modifiedTemplate[matchStart - 1] === "'" &&
                    modifiedTemplate[matchEnd + 1] === "'") ||
                  (modifiedTemplate[matchStart - 1] === '"' &&
                    modifiedTemplate[matchEnd + 1] === '"')
                ) {
                  matchStart = matchStart - 1;
                  matchEnd = matchEnd + 1;
                }
                const uuid = generateFileUUID(
                  filePath,
                  fileUuid,
                  index,
                  config
                );
                const replacement =
                  "${" + `${config.templateI18nCall}('${uuid}')` + "}";
                modifiedTemplate =
                  modifiedTemplate.substring(0, matchStart) +
                  replacement +
                  modifiedTemplate.substring(matchEnd);
                offset += replacement.length - (matchEnd - matchStart);
                index++;
                collectChineseText(uuid, match[0]);
              }
            }
          });
        }
        if (node.children) node.children.forEach(traverseNode);
        break;
      case 2:
        if (chineseRegex.test(node.content)) {
          const uuid = generateFileUUID(filePath, fileUuid, index, config);
          const start = node.loc.start.offset + offset;
          const end = node.loc.end.offset + offset;
          const replacementText = `{{ ${config.templateI18nCall}('${uuid}') }}`;
          modifiedTemplate =
            modifiedTemplate.substring(0, start) +
            replacementText +
            modifiedTemplate.substring(end);
          offset += replacementText.length - (end - start);
          index++;
          collectChineseText(uuid, node.content);
        }
        break;
      case 5: // Interpolation Node（插值节点）
        if (chineseRegex.test(node.loc.source)) {
          let content = node.loc.source;
          const start = node.loc.start.offset;
          // 判断是否有插值表达式
          const hasInterpolation = node.loc.source.includes("{{");
          if (hasInterpolation) {
            // 判断是否有`
            const hasPoint = node.loc.source.includes("`");
            if (hasPoint) {
              const chineseRegex = /[\u4e00-\u9fa5]+/g;
              let match;
              while ((match = chineseRegex.exec(content))) {
                const matchStart = start + match.index + offset;
                const matchEnd = matchStart + match[0].length;
                const uuid = generateFileUUID(
                  filePath,
                  fileUuid,
                  index,
                  config
                );
                const replacement =
                  "${" + `${config.templateI18nCall}('${uuid}')` + "}";
                modifiedTemplate =
                  modifiedTemplate.substring(0, matchStart) +
                  replacement +
                  modifiedTemplate.substring(matchEnd);
                offset += replacement.length - (matchEnd - matchStart); // 更新偏移量
                index++;
                collectChineseText(uuid, match[0]);
              }
            } else {
              const chineseRegex = /[\u4e00-\u9fa5]+/g;
              let match;
              while ((match = chineseRegex.exec(content))) {
                let matchStart = start + match.index + offset;
                let matchEnd = matchStart + match[0].length;
                // 判断match前后是不是引号
                if (
                  (modifiedTemplate[matchStart - 1] === "'" &&
                    modifiedTemplate[matchEnd + 1] === "'") ||
                  (modifiedTemplate[matchStart - 1] === '"' &&
                    modifiedTemplate[matchEnd + 1] === '"')
                ) {
                  matchStart = matchStart - 1;
                  matchEnd = matchEnd + 1;
                }
                const uuid = generateFileUUID(
                  filePath,
                  fileUuid,
                  index,
                  config
                );
                const replacement = `${config.templateI18nCall}('${uuid}')`;
                modifiedTemplate =
                  modifiedTemplate.substring(0, matchStart) +
                  replacement +
                  modifiedTemplate.substring(matchEnd);
                offset += replacement.length - (matchEnd - matchStart); // 更新偏移量
                index++;
                collectChineseText(uuid, match[0]);
              }
            }
          } else {
            console.log("没有{{}}", content);
          }
        }
        break;
      case 12: // Interpolation Node（插值节点）
        if (chineseRegex.test(node.loc.source)) {
          const uuid = generateFileUUID(filePath, fileUuid, index, config);
          const start = node.loc.start.offset + offset;
          const end = node.loc.end.offset + offset;
          const replacementText = `{{ ${config.templateI18nCall}('${uuid}') }}`;
          modifiedTemplate =
            modifiedTemplate.substring(0, start) +
            replacementText +
            modifiedTemplate.substring(end);
          offset += replacementText.length - (end - start);
          index++;
          collectChineseText(uuid, node.loc.source);
        }
        break;
      case 9:
        if (node.branches) node.branches.forEach(traverseNode);
        break;
      default:
        customLog(config.debug, "未适配的node节点", node.type);
        break;
    }
  };
  traverseNode(ast);
  return modifiedTemplate;
};
