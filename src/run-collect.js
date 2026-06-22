// Lance la collecte (Node, déterministe) et écrit items.json à la racine.
import { writeFile } from "node:fs/promises";
import { collectAll } from "./collect.js";

const items = await collectAll();
await writeFile("items.json", JSON.stringify(items, null, 2));
console.log(`[run-collect] ${items.length} items -> items.json`);
