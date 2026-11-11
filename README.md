# lab

The home of lab.nawi.dev: a front door that lists Nahuel Mosse's experiments and serves each one under its own path. Static files only, no build and no framework.

## How it works

One Vercel project serves everything and builds the lab itself: its Build Command, `node scripts/assemble.mjs`, downloads the main of every repository in `experiments.json`, copies what each one publishes into `/<slug>/`, adds the home and the profile widgets function (`/api/profile/<name>.svg`) and writes the result as a [Build Output](https://vercel.com/docs/build-output-api) in `.vercel/output` (git-ignored). `/<slug>` redirects to `/<slug>/`. `.lab-sources.json` in the output records the commit of every repository.

A push to the lab's main deploys through the Git integration. When a project's main changes, its repository sends `project-updated` to the lab and the `Assemble` workflow calls a Vercel Deploy Hook, which builds again. Each project keeps its own repository, grade and tests; the lab only copies what they publish. The projects' GitHub Pages deploys are not used by the lab.

## Add an experiment

1. Add an entry to `experiments.json`: `slug`, `title`, `line`, `repo`, and what it publishes: `dir` (a folder copied as is) or `include` and `exclude` globs from the repository root.
2. Run `node scripts/sync-routes.mjs` to render the list in `index.html`.
3. Commit both files. The push to main deploys it.

`functions` lists repositories whose `copy` folders (`api`, `src`) are bundled into the function at `path`, served from `module`.

Each project repository carries this workflow (`.github/workflows/notify-lab.yml`), which redeploys the lab when its main changes. It needs the secret `LAB_DEPLOY_HOOK`: the URL of the lab's Vercel deploy hook, which can only start a deploy.

```yaml
name: notify lab
on:
  push:
    branches: [main]
  workflow_dispatch:
jobs:
  deploy-lab:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger the lab's Vercel deploy hook
        env:
          HOOK: ${{ secrets.LAB_DEPLOY_HOOK }}
        run: curl -fsS -X POST "$HOOK"
```

Test the assembly locally with `node scripts/assemble.mjs <out-dir>` (needs `tar` and Node 22+; `GITHUB_TOKEN` is optional and raises the GitHub rate limit).

## Deploy on Vercel

1. Import this repository in Vercel (Hobby). Framework Preset: "Other". Production branch: `main`.
2. Build Command: `node scripts/assemble.mjs`. Output Directory: empty.
3. Add the environment variable `GITHUB_TOKEN`, used by the build to download the repositories and by the widgets function.
4. Settings → Git → Deploy Hooks: create one on branch `main` and store its URL as the secret `LAB_DEPLOY_HOOK` of every project repository.
5. Add the domain `lab.nawi.dev`.
6. In Porkbun, add a DNS CNAME record: `lab` → `cname.vercel-dns.com`.
