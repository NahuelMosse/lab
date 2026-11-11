// Writes vercel.json and the experiment list of index.html from experiments.json.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const file = (name) => fileURLToPath(new URL(name, root));
const { widgets, experiments } = JSON.parse(readFileSync(file("experiments.json"), "utf8"));

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const vercel = {
  cleanUrls: false,
  redirects: experiments.map((e) => ({ source: `/${e.slug}`, destination: `/${e.slug}/`, permanent: false })),
  rewrites: [
    // `/:path*` does not match the bare trailing slash, so each experiment's root gets its own rule.
    ...experiments.flatMap((e) => [
      { source: `/${e.slug}/`, destination: e.origin },
      { source: `/${e.slug}/:path*`, destination: `${e.origin}:path*` },
    ]),
    { source: "/api/profile/:path*", destination: `https://${widgets}/api/profile/:path*` },
  ],
};
writeFileSync(file("vercel.json"), JSON.stringify(vercel, null, 2) + "\n");

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
