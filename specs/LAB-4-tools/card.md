# LAB-4 · the tools page

status: proposed
cap: 60 min
sources: the requester's message in the session (text, no Jira card)
not_read: none

## Specs

- S1 · "hagamos exactamente eso"
- S2 · "creo que toda la gente que me sigue habla espa;ol, pero alguno debe saber ingles"
- LAB-4-ASM-01 · the page is in English, the link every LinkedIn post points to: /tools/ with the demo video, what it finds and how to install each of motion-audit, http-attack and migrations-safe · S1, S2
- LAB-4-ASM-02 · the share images are og/lab.png (the home) and og/tools.png (the page), with Open Graph and Twitter tags on both pages · S1

## Look

- ref: the lab home (home.css) and the social images in D:/Temp/social · LAB-4-ASM-01
- behavior: load · the tool sections enter in the home's stagger, once; none under reduced motion
- behavior: cursor · links answer to hover, press and focus like the home's
- behavior: view · a video plays on the user's click only (preload none, muted)
- tokens: mood noir · genre personal lab · the home's palette, Courier Prime, easing cubic-bezier(.16, 1, .3, 1) 600 ms
- copy: three tools, each with its one-line description and three findings taken from its real demo output

## Log

- L1 · hagamos exactamente eso, creo que toda la gente que me sigue habla espa;ol, pero alguno debe saber ingles
- L2 · 2026-11-12 · capture round r1: /tools/ at 390 and 1440 dark/light; skill install lines were clipped at 390, fixed by wrapping
- L3 · 2026-11-12 · install block uses npm i -D (README) instead of npm i -g: motion-audit resolves Playwright from the project
- L4 · 2026-11-12 · assemble.mjs fails locally on the function repo's sha lookup (fetch failed); static output checked by copying the same files
