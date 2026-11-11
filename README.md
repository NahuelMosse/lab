# lab

The home of lab.nawi.dev: a front door that lists Nahuel Mosse's experiments and serves each one under its own path. Static files only, no build and no framework.

## How it works

One Vercel project serves everything. Its production branch is `deploy`, a build artifact that the `Assemble` workflow rewrites as a single commit: it clones the main of every repository in `experiments.json`, copies what each one publishes into `/<slug>/`, adds the home and the profile widgets functions (`/api/profile/`), and force-pushes the result. It runs on every push to the lab's main, by hand, and on a `project-updated` repository dispatch that each project sends when its main changes. The deploy branch records the commit of every repository in `.lab-sources.json`.

`/<slug>` redirects to `/<slug>/` (generated `vercel.json`). Each project keeps its own repository, grade and tests; the lab only copies what they publish. The projects' GitHub Pages deploys are not used by the lab.

## Add an experiment

1. Add an entry to `experiments.json`: `slug`, `title`, `line`, `repo`, and what it publishes: `dir` (a folder copied as is) or `include` and `exclude` globs from the repository root.
2. Run `node scripts/sync-routes.mjs` to render the list in `index.html`.
3. Commit both files. The workflow publishes it on the push.

`functions` lists repositories whose `copy` folders (`api`, `src`) go to the root of the deploy.

Each project repository carries this workflow (`.github/workflows/notify-lab.yml`) to tell the lab when its main changes. It needs the secret `LAB_DISPATCH_TOKEN`: a fine-grained token with access to only `NahuelMosse/lab` and permission Contents: read and write.

```yaml
name: Notify lab

on:
  push:
    branches: [main]

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - run: gh api repos/NahuelMosse/lab/dispatches -f event_type=project-updated
        env:
          GH_TOKEN: ${{ secrets.LAB_DISPATCH_TOKEN }}
```

Test the assembly locally with `node scripts/assemble.mjs <out-dir>` (needs git and Node 22+).

## Deploy on Vercel

1. Import this repository in Vercel (Hobby). Framework Preset: "Other". No build command.
2. Settings → Environments → Production → Branch Tracking = `deploy`.
3. Add the environment variable `GITHUB_TOKEN`, used by the widgets functions.
4. Add the domain `lab.nawi.dev`.
5. In Porkbun, add a DNS CNAME record: `lab` → `cname.vercel-dns.com`.
