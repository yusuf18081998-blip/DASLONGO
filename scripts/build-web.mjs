import { cp, mkdir, rm } from "node:fs/promises";

const output = new URL("../www/", import.meta.url);
const source = new URL("../", import.meta.url);

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(new URL("index.html", source), new URL("index.html", output));
await cp(new URL("styles.css", source), new URL("styles.css", output));
await cp(new URL("js/", source), new URL("js/", output), { recursive: true });

console.log("DASLONGO web assets copied to www/.");
