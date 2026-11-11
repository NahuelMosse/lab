# LAB-2 · the lab deploys its projects inside itself

status: proposed
cap: 120 min
sources: the requester's messages in the session (text, no Jira card)
not_read: none (no attachments or links)

## Specs

- S1 · "queria que el lab las desplegara dentro de el, sin tener que levantar mil proyectos"
- S2 · "descarga otros repos y muestra lo ultimo, hay que armarle actions para que se actualice con los mains de los otros repos"
- S3 · "el lab en si es una poc, pero los proyectos de dentro pueden estar en lo que esten"
- LAB-2-ASM-01 · one Vercel project, the lab's, serves everything: the Vercel build of the lab (`node scripts/assemble.mjs`) downloads the main branch of every repository in experiments.json, copies what each one publishes into /<slug>/ and adds the functions of profile-widgets under /api/profile/, as a Build Output; no build artifact is committed · S1
- LAB-2-ASM-02 · each entry of experiments.json says what its repository publishes: `dir` (a folder copied as is) or `include` and `exclude` globs from the root; a `functions` entry copies api/ and src/ of its repository into a function of the deploy · S1, S3
- LAB-2-ASM-03 · the lab's workflow runs by hand and on a `project-updated` repository dispatch that each project sends when its main changes; it only triggers a Vercel Deploy Hook, and a push to the lab's main deploys through the Git integration (the build records the commit of each repository) · S2, L2
- LAB-2-ASM-04 · the proxy rewrites to GitHub Pages and to profile-widgets.vercel.app leave the lab's routing; /<slug> still redirects to /<slug>/ · S1
- LAB-2-ASM-05 · each project keeps its own repository, grade and tests; the lab only copies what they publish · S3

## Look

- plain: the home does not change; only how the projects get inside the lab

## Log

- L1 · bueno no queria eso, queria que el lab las desplegara dentro de el, sin tener que levantar mil proyectos · (earlier) si el lab, descarga otros repos y muestra lo ultimo, hay que armarle actions para que se actualice con los mains de los otros repos · el lab en si es una poc, pero los proyectos de dentro pueden estar en lo que esten, cebador, miga y sonria estan en mvp
- L2 · 2026-11-11 · requester: no 10-minute schedule; the lab rebuilds when a project's main changes (repository_dispatch from each project)
- L3 · 2026-11-11 · owner: no build artifacts committed (no deploy branch); Vercel builds the lab with node scripts/assemble.mjs as Build Output; the workflow only triggers a Vercel Deploy Hook
