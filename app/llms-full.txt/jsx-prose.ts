const ENTITIES: Record<string, string> = {
  "&quot;": '"',
  "&ndash;": "–",
  "&mdash;": "—",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
};

const MIN_LENGTH = 2000;

function jsxToText(src: string): string {
  return (
    src
      .replace(
        /<Examples\s+good="([^"]*)"\s+avoid="([^"]*)"\s*\/>/g,
        (_m, good, avoid) => `\n\nGood: \`${good}\`\n\nAvoid: \`${avoid}\``,
      )
      .replace(/<Q\s+q=\{`([^`]*)`\}\s*\/>/g, (_m, q) => `\`${q}\``)
      .replace(/<Q\s+q="([^"]*)"\s*\/>/g, (_m, q) => `\`${q}\``)
      .replace(/<Tex\s+inline\s+tex="([^"]*)"\s*\/>/g, (_m, t) => `$${t}$`)
      .replace(/<Tex\s+tex="([^"]*)"\s*\/>/g, (_m, t) => `\n\n$$${t}$$\n\n`)
      .replace(/<Code>([\s\S]*?)<\/Code>/g, (_m, c) => `\`${c.trim()}\``)
      .replace(
        /<Heading[^>]*>([\s\S]*?)<\/Heading>/g,
        (_m, h) => `\n\n### ${h.trim()}\n`,
      )
      .replace(
        /<li>([\s\S]*?)<\/li>/g,
        (_m, inner) =>
          `\n\n- ${inner
            .replace(/<\/?Text[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim()}`,
      )
      .replace(/<\/(?:Text|p|ul|Flex)>/g, "\n\n")
      .replace(/<[^>]*>/g, "")
      .replace(/\{"\s*"\}/g, " ")
      .replace(/&\w+;/g, (e) => ENTITIES[e] ?? e)
      .replace(/^[ \t]+/gm, "")
      .replace(/[ \t]+$/gm, "")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\(\s+(`)/g, "($1")
      .replace(/(`)\s+\)/g, "$1)")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/([^\n])\n(?!\n)/g, "$1 ")
      .trim()
  );
}

function tipSections(src: string): string {
  const start = src.indexOf("const tips");
  if (start === -1) return "";
  const end = src.indexOf("\n];", start);
  if (end === -1) return "";

  const sections: string[] = [];
  const entry = /title:\s*"([^"]*)",\s*body:\s*\(\s*<>([\s\S]*?)<\/>\s*\),/g;
  for (const m of src.slice(start, end).matchAll(entry)) {
    sections.push(`### ${m[1]}\n\n${jsxToText(m[2])}`);
  }
  return sections.join("\n\n");
}

export function extractHowSearchWorks(src: string): string | null {
  const component = src.indexOf("export default function");
  if (component === -1) return null;

  const open = src.indexOf("return (", component);
  const close = src.lastIndexOf(");");
  if (open === -1 || close <= open) return null;
  const body = src.slice(open + "return (".length, close);

  const text = jsxToText(body.replace(/\{tips\.map\([\s\S]*?\)\}/, "\n%%TIPS%%\n"))
    .replace("%%TIPS%%", tipSections(src))
    .replace(/^### .*\n+/, "");

  return text.length < MIN_LENGTH ? null : text;
}
