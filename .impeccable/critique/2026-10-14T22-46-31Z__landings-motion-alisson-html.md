---
target: landings-motion/alisson.html v1
total_score: 22
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 2
target_identity: "file:C:\\Users\\User\\Desktop\\zyrek-landings\\landings-motion\\alisson.html"
target_fingerprint: "sha256:93c02e34e38553f15cc06fe677320cd0eda5848b0fe9e236c2dc7d732b335ac5"
target_path: "C:\\Users\\User\\Desktop\\zyrek-landings\\landings-motion\\alisson.html"
timestamp: 2026-10-14T22-46-31Z
slug: landings-motion-alisson-html
---
⚠️ DEGRADED: single-context (sub-agents not authorized in this session; A finished before B was read)

## Design Health Score (Persuade; 7 and 10 n/a)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | "Plantão 24h" is static text; nothing shows it is available right now. Video load-on-click is stated. |
| 2 | Match System / Real World | 3 | Plain language in the 5 steps and FAQ; "Tribuno do Júri" is insider jargon. |
| 3 | User Control and Freedom | 3 | Accordion, native video controls, Escape on the floating menu. |
| 4 | Consistency and Standards | 3 | One button system, one rule system. |
| 5 | Error Prevention | 3 | tel:/wa.me links carry prefilled text; no forms to fail. |
| 6 | Recognition Rather Than Recall | 3 | Clear nav labels; phone number only visible as text at the very end. |
| 7 | Flexibility and Efficiency | n/a | Landing page. |
| 8 | Aesthetic and Minimalist Design | 2 | Mustard blocks, uniform section shells, filler crops (crucifix, robe cuffs). |
| 9 | Error Recovery | 3 | Instagram fallback for videos; offline map link. |
| 10 | Help and Documentation | n/a | Landing page. |
| **Total** | | **22/32** | **Acceptable: works, reads as the category default** |

## Design Specificity Verdict

LLM assessment: category-interchangeable. Black ground, mustard gold, Cinzel caps and Cormorant titles with gold hairlines is the "dark luxury law firm" every model ships; swap the name and it serves any criminal lawyer. The skeleton is the template: split hero (copy left, portrait right), a grid of equal bordered cards, uniform dark section shells, FAQ, contact. The one asset that belongs to Alisson, the arc of his ASC monogram, appears once at 130px and never becomes a system. Photos sit in hard rectangles. The urgent content (24h plantão, phone) sits below the fold on desktop (band starts at 1077px of 900) and the phone number only appears as text at the end.

Deterministic scan (`impeccable detect --json`, 31 findings): cramped-padding 19, gray-on-color 6, tight-leading 2, tiny-text 1, all-caps-body 1, clipped-overflow-container 1, overused-font 1. Verified: gray-on-color (#A8A6A1 on #14213D, 6.5:1, passes AA but reads washed out on navy: real but minor); overused-font Inter (brief-pinned). False positives: cramped-padding (sections carry 96–168px padding; static scan without layout), tight-leading (display h1/h2 at 1.02–1.04 by design), clipped-overflow-container (body overflow-x:clip with a fixed, not absolute, button).

Visual overlays: not available. `impeccable live-server --background` produced no port within 90 s; stopped, no injection.

## Overall Impression
Correct, compliant and calm, but it looks like the category, not like ASC. Biggest opportunity: make the monogram's arc the page's architecture and move the emergency information into the first viewport.

## What's Working
- The 5-step "Alguém da família foi preso?" guide: plain language, big numerals, ends on two working actions.
- OAB discipline: no results, no names, neutral captions, pending items marked in yellow; videos load only on click.
- Motion restraint: slow fades, drawn rules, full reduced-motion fallback.

## Priority Issues
- [P1] Category-default palette: gold used as large blocks (plantão band, primary buttons) reads mustard and promotional. Fix: 60-30-10 with gold as accent only (lines, numerals, outlines, icons); champagne/brass gold; off-white primary button; navy plantão band with a hairline; one light editorial section. Command: /impeccable colorize, /impeccable quieter.
- [P1] Emergency information below the fold on desktop and phone number not visible as text up top. Fix: plantão with Ligar/WhatsApp, quick facts line and phone inside the hero; compact 5 steps right after; summarized contact early. Command: /impeccable layout.
- [P2] Template skeleton: split hero + equal card grid + identical section shells; monogram arc unused. Fix: arch frames (semicircular top + offset gold thread) for the portrait and featured media; chapter numerals in Cinzel; vary section density and ground. Command: /impeccable bolder.
- [P2] Weak imagery: crucifix and robe-cuff crops are filler; flat rectangles. Fix: drop both, rebuild gallery around the plenary photo; arch frame on featured photos, 4–6px radius plus thread on small ones. Command: /impeccable distill.
- [P3] Flat editorial rhythm: every h2 the same size, same left alignment, same spacing. Fix: chapter numbering (I, II, III), larger display titles, line-by-line mask reveals. Command: /impeccable typeset, /impeccable animate.

## Persona Red Flags
- Casey (distracted mobile, a relative at 2 a.m.): sees face and title, but has to scroll to find "Ligar" and never sees the number as text until the end.
- Jordan (first-timer): "Tribuno do Júri" and "sustentação oral" are unexplained until deep in the page.
- Sam (accessibility): solid focus rings and reduced motion; secondary gray on navy is the weakest contrast pair.

## Minor Observations
- Video posters are bright white walls; they fight the dark page.
- "Outros trechos" column leaves dead space beside the 9:16 main video.

## Questions to Consider
- What if the arch of the monogram were the window every important thing is seen through?
- What if the plantão read like a live status ("Agora: 19:42 · plantão disponível") instead of an ad band?

Questions skipped: the user's brief for this run already answered priority (identity + info on top), tone (sober, editorial) and scope (all items).
