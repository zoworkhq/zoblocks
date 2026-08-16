/**
 * The stylesheet is source, not compiled output — `tsc` will not carry it into
 * dist, and a published package whose `exports["./styles.css"]` points at a file
 * that is not there fails at import time in the consumer's build, not ours.
 */
import { copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
mkdirSync(path.join(root, "dist"), { recursive: true });
copyFileSync(path.join(root, "src/styles.css"), path.join(root, "dist/styles.css"));
console.log("[react] styles.css copied to dist");
