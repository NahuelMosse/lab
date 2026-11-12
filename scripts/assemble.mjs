// Builds the lab's Vercel Build Output (v3): node scripts/assemble.mjs [out]   (default .vercel/output)
// Downloads the main of every repository in experiments.json, copies what each one publishes into static/<slug>/,
// builds the functions, adds the home and writes config.json and .lab-sources.json.
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const out = resolve(process.argv[2] ?? join(root, ".vercel/output"));
const staticDir = join(out, "static");
const { experiments, functions = [] } = JSON.parse(readFileSync(join(root, "experiments.json"), "utf8"));

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
    return d.isDirectory() ? listFiles(dir, rel) : [rel];
  });

const copyFile = (from, to) => {
  mkdirSync(join(to, ".."), { recursive: true });
  cpSync(from, to);
};

const tmp = mkdtempSync(join(tmpdir(), "lab-assemble-"));
const sources = {};
const downloads = new Map();

// The sha is a record only: an answer of the API that fails (rate limit) does not fail the build.
const mainSha = async (repo, headers) => {
  const res = await fetch(`https://api.github.com/repos/${repo}/commits/main`, { headers: { ...headers, Accept: "application/vnd.github.sha" } });
  if (res.ok) return (await res.text()).trim();
  console.warn(`${repo}: sha lookup answered ${res.status}`);
  return "unknown";
};

const download = async (repo) => {
  if (downloads.has(repo)) return downloads.get(repo);
  const headers = process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {};
  const res = await fetch(`https://codeload.github.com/${repo}/tar.gz/refs/heads/main`, { headers });
  if (!res.ok) throw new Error(`${repo}: main download answered ${res.status}`);
  const name = repo.replace("/", "__");
  const base = join(tmp, name);
  mkdirSync(base, { recursive: true });
  writeFileSync(`${base}.tar.gz`, Buffer.from(await res.arrayBuffer()));
  // relative paths: GNU tar reads "D:" of an absolute Windows path as a host
  execFileSync("tar", ["-xzf", `${name}.tar.gz`, "-C", name], { cwd: tmp });
  const [top] = readdirSync(base);
  sources[repo] = await mainSha(repo, headers);
  const dir = join(base, top);
  downloads.set(repo, dir);
  return dir;
};

const labSha = () => {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA;
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
};

// Node launcher entry: turns the Web-standard handlers (GET, POST, ...) of the repository into a (req, res) handler.
const entry = (path, module) => `import * as handlers from "./${module}";

export default async function handler(req, res) {
  const url = new URL(req.url, "http://localhost");
  const name = url.searchParams.get("name") ?? url.pathname.split("/").at(-1);
  url.searchParams.delete("name");
  url.pathname = \`/${path}/\${encodeURIComponent(name)}\`;
  const run = handlers[req.method];
  const answer = run ? await run(new Request(url, { method: req.method })) : new Response("Method Not Allowed", { status: 405 });
  res.statusCode = answer.status;
  answer.headers.forEach((value, key) => res.setHeader(key, value));
  res.end(req.method === "HEAD" ? undefined : Buffer.from(await answer.arrayBuffer()));
}
`;

try {
  rmSync(out, { recursive: true, force: true });
  mkdirSync(staticDir, { recursive: true });

  for (const e of experiments) {
    const dir = await download(e.repo);
    const dest = join(staticDir, e.slug);
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

  const routes = [...experiments.map((e) => e.slug), "tools"].map((slug) => ({ src: `^/${slug}$`, status: 307, headers: { Location: `/${slug}/` } }));
  const functionRoutes = [];
  for (const f of functions) {
    const dir = await download(f.repo);
    const func = join(out, "functions", `${f.path}.func`);
    for (const p of f.copy) {
      if (!existsSync(join(dir, p))) throw new Error(`${f.repo}: "${p}" is missing`);
      cpSync(join(dir, p), join(func, p), { recursive: true });
    }
    if (!existsSync(join(func, f.module))) throw new Error(`${f.repo}: "${f.module}" is missing`);
    writeFileSync(join(func, "index.mjs"), entry(f.path, f.module));
    writeFileSync(join(func, "package.json"), JSON.stringify({ type: "module" }, null, 2) + "\n");
    writeFileSync(
      join(func, ".vc-config.json"),
      JSON.stringify({ runtime: "nodejs24.x", handler: "index.mjs", launcherType: "Nodejs", shouldAddHelpers: false }, null, 2) + "\n",
    );
    functionRoutes.push({ src: `^/${f.path}/([^/]+?)(?:\\.svg)?$`, dest: `/${f.path}?name=$1` });
    console.log(`${f.repo}: ${f.copy.join(", ")} -> ${f.path}`);
  }

  for (const p of ["index.html", "home.css", "favicon.svg", "fonts", "tools", "og"]) cpSync(join(root, p), join(staticDir, p), { recursive: true });

  writeFileSync(
    join(out, "config.json"),
    JSON.stringify({ version: 3, routes: [...routes, { handle: "filesystem" }, ...functionRoutes] }, null, 2) + "\n",
  );

  sources.lab = labSha();
  writeFileSync(join(staticDir, ".lab-sources.json"), JSON.stringify(sources, null, 2) + "\n");
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
