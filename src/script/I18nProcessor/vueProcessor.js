const { parse: parseSfc } = require("@vue/compiler-sfc");
const prettier = require("prettier");
const {
  createI18nProcessor,
  generateKey,
  containsChinese,
  generateCode,
  logger,
} = require("./common");
const { processJsAst } = require("./jsProcessor");

async function processVueAst(context) {
  try {
    context.config.isAutoImportI18n = false;
    const { descriptor } = parseSfc(context.contentSource);
    const templateAst = descriptor.template && descriptor.template.ast.children;
    const scriptAst = descriptor.script && descriptor.script.content;
    const scriptSetupAst =
      descriptor.scriptSetup && descriptor.scriptSetup.content;

    if (!templateAst) {
      logger.warn("No template found, skipping processing.");
      return;
    }

    await processVueTemplate(templateAst, context, descriptor);
    await processVueScript(scriptAst, context, "script");
    await processVueScript(scriptSetupAst, context, "scriptSetup");

    return context.translations.size > 0 ? context : undefined;
  } catch (error) {
    logger.error("Error in processVueAst:", error);
    throw error;
  }
}

async function processVueTemplate(templateAst, context, descriptor) {
  try {
    const processedTemplate = await processTemplate(templateAst, context);
    if (context.translations.size > 0) {
      const template = descriptor.template ? descriptor.template.content : "";
      context.contentChanged = context.contentSource.replace(
        template,
        processedTemplate
      );
      context.contentSource = context.contentChanged;
    }
  } catch (error) {
    logger.error("Error in processVueTemplate:", error);
    throw error;
  }
}

async function processVueScript(scriptAst, context, scriptType) {
  if (scriptAst) {
    try {
      context.config.isAutoImportI18n = true;
      const processedScript = processJsAst(context, scriptAst);
      logger.debug(`${scriptType}Ast`, processedScript);
      context.contentChanged = context.contentSource.replace(
        scriptAst,
        context.contentChanged
      );
      context.contentSource = context.contentChanged;
    } catch (error) {
      logger.error(`Error in process${scriptType}:`, error);
      throw error;
    }
  }
}

function processTemplate(templateAst, context) {
  try {
    const processedHtml = astArrayToTemplate(templateAst, context);
    return formatTemplate(processedHtml);
  } catch (error) {
    logger.error("Error in processTemplate:", error);
    throw error;
  }
}

function astArrayToTemplate(astArray, context) {
  try {
    return astArray.map((node) => astToTemplate(node, context)).join(" ");
  } catch (error) {
    logger.error("Error in astArrayToTemplate:", error);
    return "";
  }
}

function astToTemplate(node, context) {
  try {
    if (typeof node === "string") return node;

    const nodeTypeHandlers = {
      3: () => node.loc.source, // Comment
      2: () => processTextNode(node, context),
      5: () => processInterpolationNode(node, context),
      1: () => processElementNode(node, context),
    };

    return nodeTypeHandlers[node.type]() || "";
  } catch (error) {
    logger.error("Error in astToTemplate:", error);
    return "";
  }
}

function processTextNode(node, context) {
  if (containsChinese(node.content)) {
    const key = generateKey(context);
    context.translations.set(key, node.content);
    return `{{${context.config.templateI18nCall}('${key}')}}`;
  }
  return node.content;
}

function processInterpolationNode(node, context) {
  if (!containsChinese(node.content.content)) return node.loc.source;

  if (node.content.ast) {
    //用js处理
    // const processedJs = processJsAst(context, node.content.ast);
    let result = handlerForJs(node.content, context);
    // context.config.scriptI18nCall   context.config.templateI18nCall;

    return `{{${result.replace(
      new RegExp(context.config.scriptI18nCall, "g"),
      context.config.templateI18nCall
    )}}}`;
  } else {
    return `{{\`${interpolationStr(node.content.content, context)}\`}}`;
  }
}

function processElementNode(node, context) {
  let result = `<${node.tag}`;
  result += processAttributes(node.props, context);

  if (node.isSelfClosing) return result + " />";

  result += ">";
  if (node.children) {
    result += node.children
      .map((child) => astToTemplate(child, context))
      .join(" ");
  }
  return result + `</${node.tag}>`;
}

function processAttributes(props, context) {
  if (!props) return "";

  return props
    .map((prop) => {
      if (prop.type === 6) return processAttribute(prop, context);
      if (prop.type === 7) return processDirective(prop, context);
      return "";
    })
    .join(" ");
}

function processAttribute(prop, context) {
  if (!prop.value) return ` ${prop.name}`;

  if (containsChinese(prop.value.content)) {
    const key = generateKey(context);
    context.translations.set(key, prop.value.content);
    return ` :${prop.name}="${context.config.templateI18nCall}('${key}')"`;
  }

  return ` ${prop.name}="${prop.value.content}"`;
}

function processDirective(prop, context) {
  let directiveName = getDirectiveName(prop);

  if (prop.arg) {
    directiveName += prop.arg.content;
  }

  if (prop.modifiers && prop.modifiers.length > 0) {
    directiveName += prop.modifiers.map((mod) => `.${mod.content}`).join(" ");
  }

  if (!prop.exp) return ` ${directiveName}`;

  // ast: {    type: "MemberExpression",
  // ||
  //   (prop.exp.ast?.type &&
  //     ![
  //       'StringLiteral',
  //       'TemplateElement',
  //       'TemplateLiteral',
  //       'ConditionalExpression',
  //     ].includes(prop.exp.ast?.type))

  if (prop.exp.ast === null) {
    return " " + prop.loc.source;
  }

  if (!containsChinese(prop.exp.content)) {
    return ` ${directiveName}="${prop.exp.content}"`;
  }
  //根据ast类型处理即可
  // TODO 处理script中的中文  新增翻译数据bug
  const result = handlerForJs(prop.exp, context);
  return ` ${directiveName}="${result.replace(
    new RegExp(context.config.scriptI18nCall, "g"),
    context.config.templateI18nCall
  )}"`;
}

function handlerForJs(node, context) {
  let getAst = node.ast;
  const { ast } = processJsAst(context, node.content.trim());
  if (getAst.type === "StringLiteral" && ast.program.body.length === 0) {
    //不是表达式，直接当字符串处理
    if (containsChinese(node.content)) {
      const key = generateKey(context);
      context.translations.set(key, node.content.replace(/'/g, ""));
      return ` ${context.config.templateI18nCall}('${key}')`;
    } else {
      return ` ${node.content}`;
    }
  }
  // processPathAst(context, getAst);
  const code = generateCode(ast, node.content.trim()).replace(
    /[,;](?=[^,;]*$)/,
    ""
  );
  return ` ${code.replace(/"/g, "'")}`;
}

function getDirectiveName(prop) {
  switch (prop.name) {
    case "bind":
      return ":";
    case "on":
      return "@";
    case "slot":
      return "#";
    default:
      return `v-${prop.name}`;
  }
}

function interpolationStr(strContent, context) {
  const parts = splitTemplateString(strContent);
  return parts
    .map((part) => {
      if (containsChinese(part)) {
        const key = generateKey(context);
        context.translations.set(key, part);
        return `\${${context.config.templateI18nCall}('${key}')}`;
      }
      return part;
    })
    .join(" ");
}

function splitTemplateString(str) {
  str = str.replace(/^`|`$/g, "");
  const regex = /(\$\{[^}]*?\})|([^$]+|\$(?!\{))/g;
  return str.match(regex) || [];
}

async function formatTemplate(htmlString) {
  try {
    const formattedHtml = await prettier.format(
      `<template>${htmlString}</template>`,
      { parser: "vue" }
    );
    return formattedHtml.replace(/<template>([\s\S]*)<\/template>/, "$1");
  } catch (e) {
    console.error("Error formatting template:", e);
    return htmlString;
  }
}

const handleVueFile = createI18nProcessor(processVueAst);

module.exports = handleVueFile;
