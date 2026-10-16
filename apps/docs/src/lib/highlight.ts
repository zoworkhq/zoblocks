/**
 * A small, dependency-free highlighter for the code on component pages.
 *
 * Not a parser. It colours what a reader scans for — keywords, strings, JSX
 * tags, prop names, CSS custom properties — and leaves everything else as
 * text. A real grammar (Shiki, Prism) would be a few hundred kilobytes of
 * client JavaScript to colour snippets that are rarely longer than twenty
 * lines, and every token class here maps to one scoped colour in
 * `highlight.css`, so a wrong guess costs a colour, never the text.
 */

export type Lang = "tsx" | "css" | "sh";

export type TokenKind = "kw" | "str" | "tag" | "attr" | "num" | "fn" | "com" | "p" | "t" | "type";

export interface Token {
  v: string;
  k: TokenKind;
}

export interface Line {
  n: number;
  toks: Token[];
}

const KEYWORDS = new Set(
  "import from export default function return const let var if else true false null undefined new type interface as async await".split(
    " ",
  ),
);

const TOKEN =
  /(\/\/.*$|\/\*.*?\*\/)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(<\/?)([A-Za-z][\w.]*)|(--[\w-]+)|(\d+(?:\.\d+)?)|([A-Za-z_$][\w$-]*)|(\s+)|(.)/g;

function shell(line: string): Token[] {
  const toks: Token[] = [];
  line.split(/(\s+)/).forEach((word, index) => {
    if (!word) return;
    let k: TokenKind = "t";
    if (/^\s+$/.test(word)) k = "t";
    else if (index === 0) k = "fn";
    else if (word.startsWith("-")) k = "attr";
    else if (word.startsWith("@")) k = "str";
    else if (word === "add" || word === "install" || word === "init") k = "kw";
    toks.push({ v: word, k });
  });
  return toks;
}

function code(line: string, lang: Lang): Token[] {
  const toks: Token[] = [];
  const re = new RegExp(TOKEN.source, "g");
  let prev = "";
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m[1]) toks.push({ v: m[1], k: "com" });
    else if (m[2]) toks.push({ v: m[2], k: "str" });
    else if (m[3]) {
      toks.push({ v: m[3], k: "p" });
      toks.push({ v: m[4]!, k: "tag" });
    } else if (m[5]) toks.push({ v: m[5], k: "attr" });
    else if (m[6]) toks.push({ v: m[6], k: "num" });
    else if (m[7]) {
      const word = m[7];
      const rest = line.slice(re.lastIndex);
      const next = rest.trimStart()[0];
      let k: TokenKind = "t";
      if (KEYWORDS.has(word)) k = "kw";
      else if (
        next === "=" &&
        rest.trimStart()[1] !== ">" &&
        rest.trimStart()[1] !== "=" &&
        !["const", "let", "var"].includes(prev)
      )
        k = "attr";
      else if (next === "(") k = "fn";
      else if (lang === "css" && next === ":") k = "attr";
      else if (/^[A-Z]/.test(word)) k = "type";
      toks.push({ v: word, k });
      prev = word;
    } else if (m[8]) toks.push({ v: m[8], k: "t" });
    else toks.push({ v: m[9]!, k: "p" });
  }
  return toks;
}

export function tokenize(source: string, lang: Lang): Line[] {
  const lines = source.replace(/\n$/, "").split("\n");
  return lines.map((line, index) => ({
    n: index + 1,
    toks: lang === "sh" ? shell(line) : code(line, lang),
  }));
}

/**
 * Line numbers earn their width only past a handful of lines. A three-line
 * install command with a gutter reads as a listing to be cited by line, which
 * nobody does.
 */
export function showLineNumbers(source: string, numbered = true): boolean {
  return numbered && source.replace(/\n$/, "").split("\n").length > 4;
}

/**
 * A JSX element as a reader would write it: on one line when it fits, one
 * attribute a line when it does not. With `children`, an opening and closing
 * tag around them, on lines of their own.
 */
export function jsxElement(
  name: string,
  attrs: readonly string[],
  indent = "",
  children?: string,
): string {
  if (children !== undefined) {
    // An element with a body always breaks: the body goes on its own line.
    const open =
      attrs.length === 0
        ? `<${name}>`
        : `<${name}\n${attrs.map((a) => `${indent}  ${a}`).join("\n")}\n${indent}>`;
    return `${open}\n${indent}  ${children}\n${indent}</${name}>`;
  }
  const one = `<${name}${attrs.map((a) => ` ${a}`).join("")} />`;
  if (one.length + indent.length <= 64 || attrs.length === 0) return one;
  return `<${name}\n${attrs.map((a) => `${indent}  ${a}`).join("\n")}\n${indent}/>`;
}

/** One prop as JSX source: `size="sm"`, `disabled`, `count={3}`. */
export function jsxAttr(prop: string, value: unknown, asIdentifier = false): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (value === true) return prop;
  if (asIdentifier && typeof value === "string") return `${prop}={${value}}`;
  if (typeof value === "string") return `${prop}=${JSON.stringify(value)}`;
  return `${prop}={${JSON.stringify(value)}}`;
}
