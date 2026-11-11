// Writes the experiment list of index.html from experiments.json.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const file = (name) => fileURLToPath(new URL(name, root));
const { experiments } = JSON.parse(readFileSync(file("experiments.json"), "utf8"));

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const items = experiments
  .map(
    (e, i) => `      <li class="item" style="--i:${i}">
        <h2>${esc(e.title)}</h2>${e.line ? `\n        <p>${esc(e.line)}</p>` : ""}
        <p class="links">
          <a href="/${esc(e.slug)}/">Open<span class="sr"> ${esc(e.title)}</span></a>
          <a href="https://github.com/${esc(e.repo)}">Code<span class="sr"> of ${esc(e.title)}</span></a>
        </p>
      </li>`,
  )
  .join("\n");

const html = readFileSync(file("index.html"), "utf8");
const next = html.replace(
  /(<!-- experiments -->)[\s\S]*?(<!-- \/experiments -->)/,
  `$1\n${items}\n      $2`,
);
writeFileSync(file("index.html"), next);
