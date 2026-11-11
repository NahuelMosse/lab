# lab

The home of lab.nawi.dev: a front door that lists Nahuel Mosse's experiments and serves each one under its own path. Static files and `vercel.json` only, no build and no framework.

## How it works

Each experiment keeps its own repository and its own GitHub Pages deploy. The lab proxies it with a Vercel rewrite: `lab.nawi.dev/<slug>/` serves the experiment's Pages site, and `/<slug>` redirects to `/<slug>/`. Nothing is copied into the lab, so each experiment updates itself whenever its repository's main publishes.

`/api/profile/:path*` is a rewrite to the profile widgets project; its host is the `widgets` field of `experiments.json`.

## Add an experiment

1. Add an entry to `experiments.json` (`slug`, `title`, `line`, `origin` ending in `/`, `repo`).
2. Run `node scripts/sync-routes.mjs`. It rewrites `vercel.json` and the list in `index.html`.
3. Commit both generated files with the entry.

## Deploy on Vercel

1. Import this repository in Vercel (Hobby).
2. Framework Preset: "Other". No build command. Output directory: the project root.
3. Add the domain `lab.nawi.dev`.
4. In Porkbun, add a DNS CNAME record: `lab` → `cname.vercel-dns.com`.

Rewrites only run on Vercel: locally, `/<slug>/` returns 404.
