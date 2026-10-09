---
version: 1
slug: "landings-motion-da-vinti-html"
primary_target: "landings-motion/da-vinti.html"
related_targets: []
---

# Pizzaria Da Vinti demo (landings-motion/da-vinti.html)

Scope: full redesign of the Da Vinti demo landing, saved beside the original (landings/da-vinti.html stays untouched). Visitor mode: Persuade.
Audience: the owner opening a WhatsApp link on a phone; secondarily families in Ana Jacinta ordering dinner. Primary action: online menu (https://whatsmenu.com.br/cardapiopizzariadavinti); WhatsApp (wa.me/5518998207790, "quero fazer um pedido") is secondary.
Proof to lead with: the neighbourhood pizzeria. Open every night since 2017 in Ana Jacinta, a family dining room, motoboys praised for their manners; then the house pizzas (Moda da Vinti with chocolate crust, Catucheddar, Fraldinha no alho), 4,6 / 221 Google reviews, real hours and address.
Photos: only the pizza photos da-vinti-3 and da-vinti-4. Photo 1 (a customer's children) and photo 2 (a TikTok frame) are excluded. The box's green and red are a colour reference only.
Motion level: showcase. Stack: static HTML, Motion (vanilla, CDN) + Lenis, prefers-reduced-motion respected.
Constraints: demo banner, Gabriel Negri credit and noindex; real data only; [confirmar ...] markers stay visible.

## Direction contract

THESIS: Da Vinti is the tear-off calendar hanging in every kitchen in Ana Jacinta. Every sheet is a day, and every day says there is pizza from 18h30. The page refuses the rustic checkered-tablecloth pizzeria with a hero photo over a serif headline.

OWN-WORLD: green card stock printed in the box's green, carrying newsprint sheets with perforated top edges. Exactly two inks on paper, green and red, with no midtone. Day numerals are heavy didone figures, red on Sundays. Labels are condensed caps. Open and closed are shown as pen marks (a circled day, a struck day), never by colour. The decorative border repeats in whole modules. Only the primary action gets the red fill.

STORY: the owner sees their pizzeria as the calendar a neighbour keeps. Today's sheet shows today's date, today's hours and a real review as the thought of the day. A month in which every night is circled proves they open daily. Then come the house pizzas, the reviews and the address. Belief: this sells the habit of "pizza night at Da Vinti". Action: open the menu.

FIRST VIEWPORT: phone portrait. Demo strip, then a slim paper bar with the name and a red "Cardápio" button. Below, the calendar hangs from a nail and string. A green header card holds the pizza photo (da-vinti-4), "Pizzaria Da Vinti", "Ana Jacinta · desde 2017", address and phone. Under the card sits the tear-off block. Today's sheet carries the month and year, a giant didone day number, the weekday, "Aberta hoje · 18h30 às 23h", a thought-of-the-day review, and a red "Pedir pelo cardápio" button printed at its foot. A "puxe para arrancar" cue sits beside the perforation.

FORM: daily tear-off calendar (folhinha de arrancar). Grounded candidate 3 of 7; seed key 42850f61. Signature interaction: drag or tap to tear today's sheet, which falls away with physics to reveal the next day's hours and a different single fact. On load, the sheets riffle up to today. A month grid draws a pen circle around every open night.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
