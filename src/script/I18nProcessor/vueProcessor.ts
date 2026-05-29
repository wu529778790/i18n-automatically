import { parse as parseSfc } from '@vue/compiler-sfc';
import { baseParse } from '@vue/compiler-dom';
import {
  createI18nProcessor,
  generateKey,
  containsChinese,
  generateCode,
  stringWithDom,
} from './common';
import { processJsAst, handlerDomNode } from './jsProcessor';
import type { ProcessorContext } from '../../types';

/**
 * 处理Vue AST
 * @param context - 处理上下文
 */
async function processVueAst(context: ProcessorContext): Promise<ProcessorContext | undefined> {
  try {
    context.config.autoImportI18n = false;
    const { descriptor } = parseSfc(context.contentSource);
    const scriptAst = descriptor.script && descriptor.script.content;
    const scriptSetupAst =
      descriptor.scriptSetup && descriptor.scriptSetup.content;

    // 解析模板 AST：优先使用 SFC 提供的 ast；缺失时用 compiler-dom 降级解析
    let templateAst: any = null;
    if (descriptor.template) {
      if (descriptor.template.ast && descriptor.template.ast.children) {
        templateAst = descriptor.template.ast.children;
      } else if (descriptor.template.content) {
        try {
          templateAst = baseParse(descriptor.template.content).children;
        } catch (e) {
          console.error('Error parsing vue template with compiler-dom:', e);
        }
      }
    }
    if (
      templateAst &&
      descriptor.template &&
      !(descriptor.template.attrs && descriptor.template.attrs.lang === 'pug')
    ) {
      await processVueTemplate(templateAst, context, descriptor);
    }

    // 存储模板变更的变量
    context.templateSize = context.translations.size;
    await processVueScripts(scriptAst, scriptSetupAst, context);

    // 如果模板缺失但脚本有变化，也返回 context
    return context.translations.size > 0 ? context : undefined;
  } catch (error) {
    console.error('Error in processVueAst:', error);
    throw error;
  }
}

/**
 * 处理Vue模板
 * @param templateAst - 模板AST
 * @param context - 处理上下文
 * @param descriptor - Vue文件描述符
 */
async function processVueTemplate(templateAst: any, context: ProcessorContext, descriptor: any): Promise<void> {
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
    console.error('Error in processVueTemplate:', error);
    throw error;
  }
}

/**
 * 处理Vue脚本
 * @param scriptAst - 脚本AST
 * @param scriptSetupAst - setup脚本AST
 * @param context - 处理上下文
 */
async function processVueScripts(scriptAst: string | null | undefined, scriptSetupAst: string | null | undefined, context: ProcessorContext): Promise<void> {
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
 * @param scriptAst - 脚本AST
 * @param context - 处理上下文
 * @param scriptType - 脚本类型
 */
async function processVueScript(scriptAst: string, context: ProcessorContext, scriptType: string): Promise<void> {
  try {
    // 仅对脚本片段做 JS 处理，并使用该片段的生成结果做字符串替换
    const prevChanged = context.contentChanged;
    processJsAst(context, scriptAst);
    const scriptChanged = context.contentChanged;
    context.contentChanged = prevChanged;
    if (scriptChanged) {
      const replaced = context.contentSource.replace(scriptAst, scriptChanged);
      context.contentChanged = replaced;
      context.contentSource = replaced;
    }
  } catch (error) {
    console.error(`Error in process ${scriptType}:`, error);
    throw error;
  }
}

/**
 * 处理模板
 * @param templateAst - 模板AST
 * @param context - 处理上下文
 * @returns {string} 处理后的模板字符串
 */
function processTemplate(templateAst: any, context: ProcessorContext): string {
  try {
    return astArrayToTemplate(templateAst, context);
  } catch (error) {
    console.error('Error in processTemplate:', error);
    throw error;
  }
}

/**
 * 将AST数组转换为模板字符串
 * @param astArray - AST数组
 * @param context - 处理上下文
 * @returns {string} 模板字符串
 */
function astArrayToTemplate(astArray: any[], context: ProcessorContext): string {
  try {
    return astArray.map((node) => astToTemplate(node, context)).join(' ');
  } catch (error) {
    console.error('Error in astArrayToTemplate:', error);
    return '';
  }
}

/**
 * 将单个AST节点转换为模板字符串
 * @param node - AST节点
 * @param context - 处理上下文
 * @returns {string} 模板字符串
 */
function astToTemplate(node: any, context: ProcessorContext): string {
  try {
    if (typeof node === 'string') return node;

    const nodeTypeHandlers: Record<number, () => string> = {
      3: () => node.loc.source, // Comment
      2: () => processTextNode(node, context),
      5: () => processInterpolationNode(node, context),
      1: () => processElementNode(node, context),
    };

    return (nodeTypeHandlers[node.type] && nodeTypeHandlers[node.type]()) || '';
  } catch (error) {
    console.error('Error in astToTemplate:', error);

    return '';
  }
}

/**
 * 处理文本节点
 * @param node - 文本节点
 * @param context - 处理上下文
 * @returns {string} 处理后的文本
 */
function processTextNode(node: any, context: ProcessorContext): string {
  if (containsChinese(node.content)) {
    const key = generateKey(context, node.content);
    context.translations.set(key, node.content.trim());
    return `{{${context.config.templateI18nCall}('${key}')}}`;
  }
  return node.content;
}

/**
 * 处理插值节点
 * @param node - 插值节点
 * @param context - 处理上下文
 * @returns {string} 处理后的插值
 */
function processInterpolationNode(node: any, context: ProcessorContext): string {
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
 * @param node - 元素节点
 * @param context - 处理上下文
 * @returns {string} 处理后的元素字符串
 */
function processElementNode(node: any, context: ProcessorContext): string {
  let result = `<${node.tag}`;
  result += processAttributes(node.props, context);

  if (node.isSelfClosing) return result + ' />';

  result += '>';
  if (node.children) {
    result += node.children
      .map((child: any) => astToTemplate(child, context))
      .join(' ');
  }
  return result + `</${node.tag}>`;
}

/**
 * 处理属性
 * @param props - 属性数组
 * @param context - 处理上下文
 * @returns {string} 处理后的属性字符串
 */
function processAttributes(props: any[], context: ProcessorContext): string {
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
 * @param prop - 属性对象
 * @param context - 处理上下文
 * @returns {string} 处理后的属性字符串
 */
function processAttribute(prop: any, context: ProcessorContext): string {
  if (!prop.value) return `\n${prop.name}`;

  if (containsChinese(prop.value.content)) {
    if (stringWithDom(prop.value.content)) {
      const result = handlerDomNode(prop.value.content, context);
      return `\n:${prop.name}="\`${replaceForI18nCall(result, context)}\`"`;
    } else {
      const key = generateKey(context, prop.value.content);
      context.translations.set(key, prop.value.content.trim());
      return `\n:${prop.name}="${context.config.templateI18nCall}('${key}')"`;
    }
  }

  // 无中文：保持原值，但要安全地包裹引号
  const raw = prop.value.content;
  const needsDouble = raw.indexOf('"') === -1;
  if (needsDouble) {
    return `\n${prop.name}="${raw}"`;
  }
  // 若包含双引号但不含单引号，则用单引号包裹
  if (raw.indexOf("'") === -1) {
    return `\n${prop.name}='${raw}'`;
  }
  // 同时包含单双引号：转义双引号为实体，避免破坏属性
  const escaped = raw.replace(/\"/g, '"').replace(/"/g, '&quot;');
  return `\n${prop.name}="${escaped}"`;
}

/**
 * 处理指令
 * @param prop - 指令对象
 * @param context - 处理上下文
 * @returns {string} 处理后的指令字符串
 */
function processDirective(prop: any, context: ProcessorContext): string {
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
  let result: string;
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
 * @param str - 输入字符串
 * @param context - 处理上下文
 * @returns {string} 替换后的字符串
 */
function replaceForI18nCall(str: string, context: ProcessorContext): string {
  return str.replace(
    new RegExp(context.config.scriptI18nCall, 'g'),
    context.config.templateI18nCall,
  );
}

/**
 * 处理JS内容
 * @param node - AST节点
 * @param context - 处理上下文
 * @returns {string} 处理后的JS代码
 */

/**
 * 处理JS内容
 * @param node - AST节点
 * @param context - 处理上下文
 * @returns {string} 处理后的JS代码
 */
function handlerForJs(node: any, context: ProcessorContext): string {
  try {
    const { ast } = processJsAst(context, node.content.trim());
    if (ast) {
      return handleAstResult(ast, node, context);
    } else {
      return handleNonAstResult(node, context);
    }
  } catch (e: any) {
    console.error(`handlerForJs: ${e.message}`);
    return `\n${node.content}`;
  }
}

/**
 * 处理有AST结果的情况
 * @param ast - AST对象
 * @param node - 原始节点
 * @param context - 处理上下文
 * @returns {string} 处理后的JS代码
 */
function handleAstResult(ast: any, node: any, context: ProcessorContext): string {
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
 * @param node - 原始节点
 * @param context - 处理上下文
 * @returns {string} 处理后的字符串
 */
function handleStringLiteral(node: any, context: ProcessorContext): string {
  if (containsChinese(node.content)) {
    const key = generateKey(context, node.content);
    context.translations.set(key, node.content.replace(/'/g, '').trim());
    return `\n${context.config.templateI18nCall}('${key}')`;
  }
  return `\n${node.content}`;
}

/**
 * 处理没有AST结果的情况 （异常情况，vue属性赋值="{a:constA,b:'测试中文'}"，babel无法单转，需要"(代码)"可转ast，简单处理使用字符串处理）
 * @param node - 原始节点
 * @param context - 处理上下文
 * @returns {string} 处理后的JS代码
 */
function handleNonAstResult(node: any, context: ProcessorContext): string {
  const changeBefore = context.index;
  const getResult = replaceChineseWithI18nKey(node.content.trim(), context);
  return context.index > changeBefore ? getResult : `\n${node.content}`;
}

/**
 * 字符串处理替换，ast结果异常的情况下使用
 * @param str - 源代码字符串
 * @param context - 绑定的上下文
 * @returns {string} 返回替换后的字符串
 */
function replaceChineseWithI18nKey(str: string, context: ProcessorContext): string {
  return str.replace(/('[^']*[一-龥]+[^']*')/g, (match) => {
    const chineseContent = match.slice(1, -1); // 去掉引号
    if (containsChinese(chineseContent)) {
      const key = generateKey(context, chineseContent);
      context.translations.set(key, chineseContent.trim());
      return `${context.config.templateI18nCall}('${key}')`;
    }
    return match;
  });
}

/**
 * 获取指令名称
 * @param prop - 属性对象
 * @returns {string} 指令名称
 */
function getDirectiveName(prop: any): string {
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
 * @param strContent - 字符串内容
 * @param context - 处理上下文
 * @returns {string} 处理后的插值字符串
 */
function interpolationStr(strContent: string, context: ProcessorContext): string {
  const parts = splitTemplateString(strContent);
  return parts
    .map((part) => {
      if (containsChinese(part)) {
        const key = generateKey(context, part);
        context.translations.set(key, part.trim());
        return `\${${context.config.templateI18nCall}('${key}')}`;
      }
      return part;
    })
    .join(' ');
}

/**
 * 分割模板字符串
 * @param str - 输入字符串
 * @returns {Array} 分割后的字符串数组
 */
function splitTemplateString(str: string): string[] {
  str = str.replace(/^`|`$/g, '');
  const regex = /(\$\{[^}]*?\})|([^$]+|\$(?!\{))/g;
  return str.match(regex) || [];
}

export const handleVueFile = createI18nProcessor(processVueAst);
export { processVueAst, processVueTemplate, processVueScripts, processTemplate, astArrayToTemplate, astToTemplate, processTextNode, processInterpolationNode, processElementNode, processAttributes, processAttribute, processDirective, replaceForI18nCall, handlerForJs, handleAstResult, handleStringLiteral, handleNonAstResult, replaceChineseWithI18nKey, getDirectiveName, interpolationStr, splitTemplateString };
