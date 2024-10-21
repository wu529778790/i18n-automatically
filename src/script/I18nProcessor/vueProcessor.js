const { parse: parseSfc } = require('@vue/compiler-sfc');
const {
  createI18nProcessor,
  generateKey,
  containsChinese,
  generateCode,
  stringWithDom,
} = require('./common');
const customConsole = require('../../utils/customConsole.js');
const { processJsAst, handlerDomNode } = require('./jsProcessor');

/**
 * 处理Vue AST
 * @param {Object} context - 处理上下文
 */
async function processVueAst(context) {
  try {
    context.config.autoImportI18n = false;
    const { descriptor } = parseSfc(context.contentSource);
    const templateAst = descriptor.template && descriptor.template.ast.children;
    const scriptAst = descriptor.script && descriptor.script.content;
    const scriptSetupAst =
      descriptor.scriptSetup && descriptor.scriptSetup.content;

    if (!templateAst) {
      customConsole.warn('No template found, skipping processing.');
      return;
    }
    if (
      !(descriptor.template.attrs && descriptor.template.attrs.lang === 'pug')
    ) {
      await processVueTemplate(templateAst, context, descriptor);
    }

    // 存储模板变更的变量
    context.templateSize = context.translations.size;
    await processVueScripts(scriptAst, scriptSetupAst, context);

    return context.translations.size > 0 ? context : undefined;
  } catch (error) {
    customConsole.error('Error in processVueAst:', error);
    throw error;
  }
}

/**
 * 处理Vue模板
 * @param {Array} templateAst - 模板AST
 * @param {Object} context - 处理上下文
 * @param {Object} descriptor - Vue文件描述符
 */
async function processVueTemplate(templateAst, context, descriptor) {
  try {
    const processedTemplate = processTemplate(templateAst, context);
    if (context.translations.size > 0) {
      const template =
        (descriptor.template && descriptor.template.content) || '';
      context.contentChanged = context.contentSource.replace(
        template,
        processedTemplate,
      );
      context.contentSource = context.contentChanged;
    }
  } catch (error) {
    customConsole.error('Error in processVueTemplate:', error);
    throw error;
  }
}

/**
 * 处理Vue脚本
 * @param {string} scriptAst - 脚本AST
 * @param {string} scriptSetupAst - setup脚本AST
 * @param {Object} context - 处理上下文
 */
async function processVueScripts(scriptAst, scriptSetupAst, context) {
  context.config.autoImportI18n = true;
  if (scriptAst && containsChinese(scriptAst, true)) {
    await processVueScript(scriptAst, context, 'script');
  }
  if (scriptSetupAst && containsChinese(scriptSetupAst, true)) {
    await processVueScript(scriptSetupAst, context, 'scriptSetup');
  }
}

/**
 * 处理单个Vue脚本
 * @param {string} scriptAst - 脚本AST
 * @param {Object} context - 处理上下文
 * @param {string} scriptType - 脚本类型
 */
async function processVueScript(scriptAst, context, scriptType) {
  try {
    const processedScript = processJsAst(context, scriptAst);
    customConsole.log(`${scriptType}Ast`, processedScript);
    if (context.contentChanged) {
      context.contentChanged = context.contentSource.replace(
        scriptAst,
        context.contentChanged,
      );
      context.contentSource = context.contentChanged;
    }
  } catch (error) {
    customConsole.error(`Error in process ${scriptType}:`, error);
    throw error;
  }
}

/**
 * 处理模板
 * @param {Array} templateAst - 模板AST
 * @param {Object} context - 处理上下文
 * @returns {string} 处理后的模板字符串
 */
function processTemplate(templateAst, context) {
  try {
    return astArrayToTemplate(templateAst, context);
  } catch (error) {
    customConsole.error('Error in processTemplate:', error);
    throw error;
  }
}

/**
 * 将AST数组转换为模板字符串
 * @param {Array} astArray - AST数组
 * @param {Object} context - 处理上下文
 * @returns {string} 模板字符串
 */
function astArrayToTemplate(astArray, context) {
  try {
    return astArray.map((node) => astToTemplate(node, context)).join(' ');
  } catch (error) {
    customConsole.error('Error in astArrayToTemplate:', error);
    return '';
  }
}

/**
 * 将单个AST节点转换为模板字符串
 * @param {Object} node - AST节点
 * @param {Object} context - 处理上下文
 * @returns {string} 模板字符串
 */
function astToTemplate(node, context) {
  try {
    if (typeof node === 'string') return node;

    const nodeTypeHandlers = {
      3: () => node.loc.source, // Comment
      2: () => processTextNode(node, context),
      5: () => processInterpolationNode(node, context),
      1: () => processElementNode(node, context),
    };

    return (nodeTypeHandlers[node.type] && nodeTypeHandlers[node.type]()) || '';
  } catch (error) {
    customConsole.error('Error in astToTemplate:', error);

    return '';
  }
}

/**
 * 处理文本节点
 * @param {Object} node - 文本节点
 * @param {Object} context - 处理上下文
 * @returns {string} 处理后的文本
 */
function processTextNode(node, context) {
  if (containsChinese(node.content)) {
    const key = generateKey(context);
    context.translations.set(key, node.content.trim());
    return `{{${context.config.templateI18nCall}('${key}')}}`;
  }
  return node.content;
}

/**
 * 处理插值节点
 * @param {Object} node - 插值节点
 * @param {Object} context - 处理上下文
 * @returns {string} 处理后的插值
 */
function processInterpolationNode(node, context) {
  if (!containsChinese(node.content.content)) return node.loc.source;

  if (node.content.ast) {
    let result = handlerForJs(node.content, context);
    return `{{${replaceForI18nCall(result, context)}}}`;
  } else {
    return `{{\`${interpolationStr(node.content.content, context)}\`}}`;
  }
}

/**
 * 处理元素节点
 * @param {Object} node - 元素节点
 * @param {Object} context - 处理上下文
 * @returns {string} 处理后的元素字符串
 */
function processElementNode(node, context) {
  let result = `<${node.tag}`;
  result += processAttributes(node.props, context);

  if (node.isSelfClosing) return result + ' />';

  result += '>';
  if (node.children) {
    result += node.children
      .map((child) => astToTemplate(child, context))
      .join(' ');
  }
  return result + `</${node.tag}>`;
}

/**
 * 处理属性
 * @param {Array} props - 属性数组
 * @param {Object} context - 处理上下文
 * @returns {string} 处理后的属性字符串
 */
function processAttributes(props, context) {
  if (!props) return '';

  return props
    .map((prop) => {
      if (prop.type === 6) return processAttribute(prop, context);
      if (prop.type === 7) return processDirective(prop, context);
      return '';
    })
    .join(' ');
}

/**
 * 处理普通属性
 * @param {Object} prop - 属性对象
 * @param {Object} context - 处理上下文
 * @returns {string} 处理后的属性字符串
 */
function processAttribute(prop, context) {
  if (!prop.value) return `\n${prop.name}`;

  if (containsChinese(prop.value.content)) {
    if (stringWithDom(prop.value.content)) {
      const result = handlerDomNode(prop.value.content, context);
      return `\n:${prop.name}="\`${replaceForI18nCall(result, context)}\`"`;
    } else {
      const key = generateKey(context);
      context.translations.set(key, prop.value.content.trim());
      return `\n:${prop.name}="${context.config.templateI18nCall}('${key}')"`;
    }
  }

  return `\n${prop.name}="${prop.value.content}"`;
}

/**
 * 处理指令
 * @param {Object} prop - 指令对象
 * @param {Object} context - 处理上下文
 * @returns {string} 处理后的指令字符串
 */
function processDirective(prop, context) {
  let directiveName = getDirectiveName(prop);

  // if (prop.arg && !directiveName.includes(prop.arg.content)) {
  //   directiveName += prop.arg.content;
  // }

  // if (prop.modifiers && prop.modifiers.length > 0) {
  //   directiveName += prop.modifiers.map((mod) => `.${mod.content}`).join(' ');
  // }

  if (!prop.exp) return `\n${directiveName}`;

  if (prop.exp.ast === null) {
    return ' ' + prop.loc.source;
  }

  if (!containsChinese(prop.exp.content)) {
    return `\n${directiveName}="${prop.exp.content}"`;
  }

  //处理dom节点
  let result;
  if (stringWithDom(prop.exp.content)) {
    //去掉字符串本身前后的单/双引号/模版符号，处理完成最后统一换成模版字符串符号``
    const handlerContent = prop.exp.content
      .trim()
      .replace(/^[\s\n]*[`'"]|[`'"][\s\n]*$/gm, '');
    // .replace(/^[`'"]|[`'"]$/g, '');

    result = handlerDomNode(handlerContent, context);
    return `\n${directiveName}="\`${replaceForI18nCall(result, context)}\`"`;
  } else {
    result = handlerForJs(prop.exp, context);
    return `\n${directiveName}="${replaceForI18nCall(result, context)}"`;
  }
}

/**
 * 替换I18n调用
 * @param {string} str - 输入字符串
 * @param {Object} context - 处理上下文
 * @returns {string} 替换后的字符串
 */
function replaceForI18nCall(str, context) {
  return str.replace(
    new RegExp(context.config.scriptI18nCall, 'g'),
    context.config.templateI18nCall,
  );
}

/**
 * 处理JS内容
 * @param {Object} node - AST节点
 * @param {Object} context - 处理上下文
 * @returns {string} 处理后的JS代码
 */

/**
 * 处理JS内容
 * @param {Object} node - AST节点
 * @param {Object} context - 处理上下文
 * @returns {string} 处理后的JS代码
 */
function handlerForJs(node, context) {
  try {
    const { ast } = processJsAst(context, node.content.trim());
    if (ast) {
      return handleAstResult(ast, node, context);
    } else {
      return handleNonAstResult(node, context);
    }
  } catch (e) {
    customConsole.error(`handlerForJs: ${e.message}`);
    return `\n${node.content}`;
  }
}

/**
 * 处理有AST结果的情况
 * @param {Object} ast - AST对象
 * @param {Object} node - 原始节点
 * @param {Object} context - 处理上下文
 * @returns {string} 处理后的JS代码
 */
function handleAstResult(ast, node, context) {
  if (node.ast.type === 'StringLiteral' && ast.program.body.length === 0) {
    return handleStringLiteral(node, context);
  }
  const code = generateCode(ast, node.content.trim()).replace(
    /[,;](?=[^,;]*$)/,
    '',
  );
  return `\n${code.replace(/"/g, "'")}`;
}

/**
 * 处理字符串字面量
 * @param {Object} node - 原始节点
 * @param {Object} context - 处理上下文
 * @returns {string} 处理后的字符串
 */
function handleStringLiteral(node, context) {
  if (containsChinese(node.content)) {
    const key = generateKey(context);
    context.translations.set(key, node.content.replace(/'/g, '').trim());
    return `\n${context.config.templateI18nCall}('${key}')`;
  }
  return `\n${node.content}`;
}

/**
 * 处理没有AST结果的情况 （异常情况，vue属性赋值="{a:constA,b:'测试中文'}"，babel无法单转，需要"(代码)"可转ast，简单处理使用字符串处理）
 * @param {Object} node - 原始节点
 * @param {Object} context - 处理上下文
 * @returns {string} 处理后的JS代码
 */
function handleNonAstResult(node, context) {
  const changeBefore = context.index;
  const getResult = replaceChineseWithI18nKey(node.content.trim(), context);
  return context.index > changeBefore ? getResult : `\n${node.content}`;
}

/**
 * 字符串处理替换，ast结果异常的情况下使用
 * @param {string} str - 源代码字符串
 * @param {Object} context - 绑定的上下文
 * @returns {string} 返回替换后的字符串
 */
function replaceChineseWithI18nKey(str, context) {
  return str.replace(/('[^']*[\u4e00-\u9fa5]+[^']*')/g, (match) => {
    const chineseContent = match.slice(1, -1); // 去掉引号
    if (containsChinese(chineseContent)) {
      const key = generateKey(context);
      context.translations.set(key, chineseContent.trim());
      return `${context.config.templateI18nCall}('${key}')`;
    }
    return match;
  });
}

/**
 * 获取指令名称
 * @param {Object} prop - 属性对象
 * @returns {string} 指令名称
 */
function getDirectiveName(prop) {
  if (prop.rawName) {
    //保持原有名称
    return prop.rawName;
  }
  switch (prop.name) {
    case 'bind':
      return ':';
    case 'on':
      return '@';
    case 'slot':
      return '#';
    default:
      return `v-${prop.name}`;
  }
}

/**
 * 处理插值字符串
 * @param {string} strContent - 字符串内容
 * @param {Object} context - 处理上下文
 * @returns {string} 处理后的插值字符串
 */
function interpolationStr(strContent, context) {
  const parts = splitTemplateString(strContent);
  return parts
    .map((part) => {
      if (containsChinese(part)) {
        const key = generateKey(context);
        context.translations.set(key, part.trim());
        return `\${${context.config.templateI18nCall}('${key}')}`;
      }
      return part;
    })
    .join(' ');
}

/**
 * 分割模板字符串
 * @param {string} str - 输入字符串
 * @returns {Array} 分割后的字符串数组
 */
function splitTemplateString(str) {
  str = str.replace(/^`|`$/g, '');
  const regex = /(\$\{[^}]*?\})|([^$]+|\$(?!\{))/g;
  return str.match(regex) || [];
}

const handleVueFile = createI18nProcessor(processVueAst);

module.exports = {
  handleVueFile,
  processVueAst,
  processVueTemplate,
  processVueScripts,
  processTemplate,
  astArrayToTemplate,
  astToTemplate,
  processTextNode,
  processInterpolationNode,
  processElementNode,
  processAttributes,
  processAttribute,
  processDirective,
  replaceForI18nCall,
  handlerForJs,
  handleAstResult,
  handleStringLiteral,
  handleNonAstResult,
  replaceChineseWithI18nKey,
  getDirectiveName,
  interpolationStr,
  splitTemplateString,
};
