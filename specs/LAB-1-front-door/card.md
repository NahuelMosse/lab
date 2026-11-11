# LAB-1 · front door

status: proposed
cap: 90 min
sources: the requester's messages in the session (text, no Jira card) and their answers to three questions (scope, hosting, where the widgets live)
not_read: none (no attachments or links)

## Specs

- S1 · "yo queria armar el laboratorio, podria ser el momento de armarlo, lab.nawi.dev"
- S2 · "la idea es no pagar por servidor"
- S3 · "ahi metemos cebador, sonria y miga"
- S4 · "y ademas otras cosas que quiera levantar"
- S5 · "como esta cosa para los svg"
- S6 · "el lab no puede salir de poc"
- S7 · "descarga otros repos y muestra lo ultimo"
- LAB-1-ASM-01 · each experiment keeps its own repository and its own GitHub Pages deploy; lab.nawi.dev/<slug>/ serves it through a Vercel rewrite and /<slug> redirects to /<slug>/, so the lab always shows what each repository's main published, with no copy and no workflow in the lab · S3, S7
- LAB-1-ASM-02 · one file, experiments.json (slug, title, line, origin, repo), lists the experiments; a script writes the rewrites and redirects of vercel.json from it, so adding one is an entry and a run of the script · S4
- LAB-1-ASM-03 · the home at / lists the experiments, each linking to /<slug>/ and to its repository, in the profile README's noir red look, dark and light · S1
- LAB-1-ASM-04 · /api/profile/:path* is a rewrite to the profile-widgets project (its own repository at grade mvp), whose URL is set when it is deployed · S5, S6
- LAB-1-ASM-05 · static files and vercel.json only, no build and no framework, on the requester's Vercel Hobby account with the domain lab.nawi.dev · S2

## Look

- ref: the profile README of NahuelMosse/NahuelMosse (its banner, chapter headers and cards) · LAB-1-ASM-03
- behavior: load · the list enters once with a short stagger; reduced motion shows it at once
- behavior: cursor · each experiment answers hover, focus and press with the red rule of the profile's link chips
- tokens: mood noir, editorial · genre personal lab · the profile's palette and type (THEMES of scripts/build_art.py, Courier Prime) · spacing 4 8 12 16 24 32 · easing out cubic-bezier(.16,1,.3,1) 600 ms
- copy: "lab.nawi.dev" · "Experiments by Nahuel Mosse" · one line per experiment from its README, in English · a link back to nawi.dev

## Log

- L1 · yo queria armar el laboratorio, podria ser el momento de armarlo, lab.nawi.dev, la idea es no pagar por servidor aviso · (answer to "what is lab.nawi.dev") Osea quiero poner ahi mil paginas, tipo ahi metemos cebador, sonria y miga y ademas otras cosas que quiera levantar, como esta cosa para los svg · (answer to "where do we host it for free") Vercel Hobby (Recommended) · el lab no puede salir de poc, tenelo en cuenta · (answer to "where do the widgets live") Repo aparte en mvp (Recommended) · si el lab, descarga otros repos y muestra lo ultimo, hay que armarle actions para que se actualice con los mains de los otros repos
- L2 · 2026-11-11 · kit: capture round fails on brand (no sheet) because the card's first commit has no ## Brand block and a later one is refused
- L3 · 2026-11-11 · kit: the brand check accepts no fixed palette that predates the card in another repository (the profile README); DESIGN.md written in the card counts as invented. Closed at poc with check 7 failed for that reason
