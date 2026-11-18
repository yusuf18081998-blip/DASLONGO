import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";

const output = new URL("../www/", import.meta.url);
const source = new URL("../", import.meta.url);

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(new URL("index.html", source), new URL("index.html", output));
await cp(new URL("styles.css", source), new URL("styles.css", output));
await cp(new URL("js/", source), new URL("js/", output), { recursive: true });

const indexPath = new URL("index.html", output);
let indexHtml = await readFile(indexPath, "utf8");
const tailwindCdnScript = '  <script src="https://cdn.tailwindcss.com"></script>\n';
const tailwindConfigScript = /  <script>\n    tailwind\.config = \{[^]*?;\n  <\/script>\n/;

if (!indexHtml.includes(tailwindCdnScript) || !tailwindConfigScript.test(indexHtml)) {
  throw new Error("Could not find the Tailwind CDN configuration in index.html.");
}

indexHtml = indexHtml
  .replace(tailwindCdnScript, "")
  .replace(tailwindConfigScript, '  <link rel="stylesheet" href="./tailwind.css">\n');
await writeFile(indexPath, indexHtml);

console.log("DASLONGO web assets copied to www/.");
