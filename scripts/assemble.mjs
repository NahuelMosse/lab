// Builds the deploy tree: node scripts/assemble.mjs <out>
// Clones the main of every repository in experiments.json, copies what each one publishes into <out>/<slug>/
// (functions into <out>/), adds the home and writes vercel.json and .lab-sources.json.
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const outArg = process.argv[2];
if (!outArg) throw new Error("usage: node scripts/assemble.mjs <out>");
const out = resolve(outArg);
const { experiments, functions = [] } = JSON.parse(readFileSync(join(root, "experiments.json"), "utf8"));

const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

// `**` crosses directories, `*` does not.
const globToRegExp = (glob) =>
  new RegExp(
    "^" +
      glob
        .split("**/")
        .map((part) =>
          part
            .split("**")
            .map((p) => p.replace(/[.+^${}()|[\]\?]/g, "\$&").replace(/\*/g, "[^/]*"))
            .join(".*"),
        )
        .join("(?:.*/)?") +
      "$",
  );

const listFiles = (dir, base = "") =>
  readdirSync(join(dir, base), { withFileTypes: true }).flatMap((d) => {
    const rel = base ? `${base}/${d.name}` : d.name;
    if (rel === ".git") return [];
    return d.isDirectory() ? listFiles(dir, rel) : [rel];
  });

const copyFile = (from, to) => {
  mkdirSync(join(to, ".."), { recursive: true });
  cpSync(from, to);
};

const tmp = mkdtempSync(join(tmpdir(), "lab-assemble-"));
const sources = {};
const clones = new Map();

const clone = (repo) => {
  if (clones.has(repo)) return clones.get(repo);
  const dir = join(tmp, repo.replace("/", "__"));
  execFileSync("git", ["clone", "--depth", "1", "--branch", "main", `https://github.com/${repo}.git`, dir], { stdio: "inherit" });
  sources[repo] = git(dir, "rev-parse", "HEAD");
  clones.set(repo, dir);
  return dir;
};

try {
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });

  for (const e of experiments) {
    const dir = clone(e.repo);
    const dest = join(out, e.slug);
    if (e.dir) {
      const from = join(dir, e.dir);
      if (!existsSync(from) || !statSync(from).isDirectory()) throw new Error(`${e.repo}: dir "${e.dir}" is missing`);
      cpSync(from, dest, { recursive: true });
    } else if (e.include) {
      const files = listFiles(dir);
      const exclude = (e.exclude ?? []).map(globToRegExp);
      const kept = new Set();
      for (const glob of e.include) {
        const re = globToRegExp(glob);
        const hits = files.filter((f) => re.test(f) && !exclude.some((x) => x.test(f)));
        if (!hits.length) throw new Error(`${e.repo}: "${glob}" matches no file`);
        hits.forEach((f) => kept.add(f));
      }
      for (const f of kept) copyFile(join(dir, f), join(dest, f));
    } else {
      throw new Error(`${e.slug}: needs "dir" or "include"`);
    }
    if (!existsSync(join(dest, "index.html"))) throw new Error(`${e.slug}: no index.html was published`);
    console.log(`${e.slug}: ${listFiles(dest).length} files`);
  }

  for (const f of functions) {
    const dir = clone(f.repo);
    for (const p of f.copy) {
      const from = join(dir, p);
      if (!existsSync(from)) throw new Error(`${f.repo}: "${p}" is missing`);
      if (existsSync(join(out, p))) throw new Error(`${f.repo}: "${p}" collides with an experiment slug`);
      cpSync(from, join(out, p), { recursive: true });
    }
    console.log(`${f.repo}: ${f.copy.join(", ")}`);
  }

  for (const p of ["index.html", "home.css", "fonts"]) cpSync(join(root, p), join(out, p), { recursive: true });

  const vercel = {
    cleanUrls: false,
    redirects: experiments.map((e) => ({ source: `/${e.slug}`, destination: `/${e.slug}/`, permanent: false })),
  };
  writeFileSync(join(out, "vercel.json"), JSON.stringify(vercel, null, 2) + "\n");

  sources.lab = git(root, "rev-parse", "HEAD");
  writeFileSync(join(out, ".lab-sources.json"), JSON.stringify(sources, null, 2) + "\n");
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
