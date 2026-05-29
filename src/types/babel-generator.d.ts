declare module '@babel/generator' {
  interface Options {
    retainLines?: boolean;
    jsonCompatibleStrings?: boolean;
    flowCommaSeparator?: boolean;
    quotes?: 'single' | 'double';
    jsescOption?: {
      wrap?: boolean;
    };
  }

  function generate(ast: any, options?: Options, code?: string): { code: string };
  export default generate;
}
