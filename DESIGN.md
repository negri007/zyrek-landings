---
name: Firmo Barbearia (Capa synth)
description: "Scoped visual world for landings-motion/firmo.html only: a 1986 arcade title screen, banded sun on a receding cyan grid. Not a project-wide system."
colors:
  void: "#05050c"
  night: "#0b0f2b"
  nebula: "#2a0f4f"
  purple: "#4b1e72"
  horizon-rose: "#8e1f73"
  magenta: "#ff2d95"
  magenta-deep: "#c8126f"
  cyan: "#00e5ff"
  orange: "#ff9a3c"
  yellow: "#ffe15a"
  ink: "#f3efff"
  soft: "#c9c2ea"
  mute: "#9a92c4"
  cab-ink: "#12021f"
  line: "rgba(0,229,255,.28)"
  line-strong: "rgba(0,229,255,.6)"
  open-green: "#3dff9a"
typography:
  display:
    fontFamily: "Tektur, Saira, sans-serif"
    fontSize: "clamp(84px, 25vw, 232px)"
    fontWeight: 900
    lineHeight: 0.86
    letterSpacing: "0.01em"
  score:
    fontFamily: "Tektur, Saira, sans-serif"
    fontSize: "clamp(110px, 30vw, 210px)"
    fontWeight: 900
    lineHeight: 0.8
    letterSpacing: "-0.02em"
    fontFeature: "\"tnum\" 1"
  headline:
    fontFamily: "Tektur, Saira, sans-serif"
    fontSize: "clamp(38px, 8.4vw, 80px)"
    fontWeight: 900
    lineHeight: 1.02
    letterSpacing: "-0.01em"
    fontVariation: "\"wdth\" 90"
  hook:
    fontFamily: "Tektur, Saira, sans-serif"
    fontSize: "clamp(24px, 6.4vw, 40px)"
    fontWeight: 700
    lineHeight: 1.08
    fontVariation: "\"wdth\" 88"
  title:
    fontFamily: "Tektur, Saira, sans-serif"
    fontSize: "clamp(18px, 2.6vw, 24px)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "0.01em"
    fontVariation: "\"wdth\" 88"
  body:
    fontFamily: "Saira, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
    fontVariation: "\"wdth\" 100"
  button:
    fontFamily: "Saira, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    letterSpacing: "0.16em"
    fontVariation: "\"wdth\" 118"
  label:
    fontFamily: "Saira, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    letterSpacing: "0.32em"
    fontVariation: "\"wdth\" 125"
rounded:
  none: "0px"
spacing:
  gutter: "16px"
  container: "1180px"
  hud: "60px"
  control-min: "44px"
  cta-min: "56px"
  chip-gap: "8px"
  section-top: "clamp(88px, 12vw, 148px)"
  section-bottom: "clamp(64px, 9vw, 110px)"
  head-gap: "clamp(36px, 5vw, 56px)"
components:
  button-primary:
    backgroundColor: "{colors.magenta-deep}"
    textColor: "#ffffff"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: "0 28px"
    height: "{spacing.cta-min}"
  button-primary-small:
    backgroundColor: "{colors.magenta-deep}"
    textColor: "#ffffff"
    rounded: "{rounded.none}"
    padding: "0 18px"
    height: "{spacing.control-min}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.cyan}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: "0 28px"
    height: "{spacing.cta-min}"
  button-ghost-hover:
    textColor: "{colors.ink}"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.soft}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "{spacing.control-min}"
  chip-selected:
    backgroundColor: "{colors.cyan}"
    textColor: "{colors.void}"
  select-slot:
    backgroundColor: "{colors.night}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "16px 14px 18px"
  select-slot-selected:
    backgroundColor: "{colors.purple}"
    textColor: "{colors.ink}"
  readout:
    backgroundColor: "{colors.void}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "16px 18px"
  status-pill:
    backgroundColor: "{colors.void}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "8px 14px 7px"
  hud-bar:
    backgroundColor: "{colors.void}"
    textColor: "{colors.soft}"
    height: "{spacing.hud}"
  map-pin:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.cab-ink}"
    size: "34px"
  map-pin-active:
    backgroundColor: "{colors.magenta}"
    textColor: "{colors.cab-ink}"
---

<!-- WORLDS INDEX -->
> **Worlds in this file.** PRODUCT.md gives every business page its own bespoke visual world; there is no shared look. This file holds one world per business page, each in its own clearly marked part with its own tokens:
>
> | World | Governs | Tokens |
> |---|---|---|
> | Firmo Barbearia, "Capa synth: grade e sol" | `landings-motion/firmo.html` | the YAML frontmatter at the top of this file |
> | Pizzaria Da Vinti, "Folhinha de arrancar" | `landings-motion/da-vinti.html` | the fenced `yaml` token block inside the Da Vinti part |
> | Planet Patas, "Painel xadrez" | `landings-motion/planet-patas.html` | the fenced `yaml` token block inside the Planet Patas part |
> | Garage Auto Detalhamento, "Do fosco ao brilho" | `landings-motion/garage.html` | the fenced `yaml` token block inside the Garage part |
>
> Worlds must not be mixed. A rule, token, texture or motion from one world never applies to another page, and a new business page starts its own world. Where a world's text says "this file", read "this world". The sidecar `.impeccable/design.json` mirrors this: Firmo at its root, Da Vinti under `scopedWorlds["landings-motion/da-vinti.html"]`, Planet Patas under `scopedWorlds["landings-motion/planet-patas.html"]`, Garage under `scopedWorlds["landings-motion/garage.html"]`, all listed in `worldsIndex`.


# Design System: Firmo Barbearia (Capa synth)

> **Scope.** This file governs `landings-motion/firmo.html` only. PRODUCT.md requires every business page to have its own bespoke visual world, with no shared look across the ten landings. Nothing here (palette, type, chamfers, grid, motion) is a project-wide default; other business pages must not inherit it. A new business page starts its own world.

## Overview

**Creative North Star: "Capa synth: grade e sol"**

Firmo is the title screen of a 1986 arcade cartridge. The page is night: an indigo-to-void sky, a neon magenta horizon, a banded yellow-to-magenta sun sitting on a cyan wireframe grid that runs toward the viewer, black mountain ridges with a magenta rim at the edges. Everything else is read as game UI on that night: booking is PRESS START, services are a player-select screen, reviews are the high-score table, the closing call is CONTINUE? with a countdown.

Density is low and theatrical. Each section is one game screen with one dominant object (the CRT photo, the select grid, the giant score, the facade), separated by horizon dividers that redraw the sun's horizon line over a short strip of rolling grid. Light comes from the neon itself: magenta glows, cyan lines, yellow signals. Surfaces are void or night; nothing is a pale card.

Motion is part of the world, not decoration on top of it. The grid's forward speed follows scroll velocity, the sun sets as the title scrolls away, and every section enters with its own game verb (CRT boot, pins dropping, players sliding in, scores counting up, rows printing). With reduced motion the page is complete and still. The world refuses the dark-leather-and-brass barbershop with a split hero and a row of service cards.

**Key Characteristics:**
- Void and night surfaces lit only by magenta, cyan and yellow neon.
- Extruded italic display caps: Tektur 900, skewed, with a continuous 1px stepped depth ramp.
- Wide Saira body and tracked wide cyan caps for labels.
- Corners are chamfered, never rounded; markers are diamonds.
- The receding cyan grid recurs: canvas hero floor, horizon dividers, the CONTINUE floor.
- Photos are always shown through a screen: chamfered gradient frame plus CRT scanlines.
- Selection lights magenta; score, today and focus light yellow.

## Colors

A synthwave night: three neon voices (magenta, cyan, yellow, with orange as the sun's middle band) over a stack of near-black indigos.

### Primary
- **Neon Magenta** (`magenta`): the horizon line, the chosen state (pressed pin, active legend row, checked service slot edge, nav underline), the highlighted word in section titles, the CTA glow.
- **Deep Magenta** (`magenta-deep`): start of the primary button gradient (running at 100deg into a violet `#8a22b8`); the only filled button color.

### Secondary
- **Grid Cyan** (`cyan`): the grid, every hairline, labels and table heads, ghost buttons, links, selected day/period chips (filled cyan with void text), slot glyphs at rest.
- **Grid Line** (`line`) and **Lit Line** (`line-strong`): cyan at 28% and 60%; the 1px dividers and inset frames at rest and on hover.

### Tertiary
- **Score Yellow** (`yellow`): the score numeral, rating stars, the today row in the hours table, the INSIRA A FICHA coin, the demo strip, the focus ring, map pins and the P1 tag.
- **Sun Orange** (`orange`): the sun's middle band and horizon divider center; the `[confirmar]` marker background.
- **Open Green** (`open-green`): the status LED when the shop is open; single semantic use.

### Neutral
- **Void** (`void`): page base, readout and status fills, text on cyan and yellow fills.
- **Night** (`night`) and **Nebula** (`nebula`): sky stops and section gradients; night at 72% to 90% opacity fills slots and the console.
- **Purple** (`purple`): radial glow behind the select screen, the selected-slot gradient, the scrollbar thumb end.
- **Horizon Rose** (`horizon-rose`): the last sky stop before the magenta horizon, in the hero and CONTINUE skies.
- **Ink** (`ink`): headings and primary text. **Soft** (`soft`): paragraphs and secondary text. **Mute** (`mute`): footer, fine print, closed hours.
- **Cabinet Ink** (`cab-ink`): dark text on yellow and magenta fills (pins, P1, skip link, selection).

### Named Rules
**The Neon On Void Rule.** Surfaces are void, night or a dark indigo gradient. Neon colors are light sources: lines, glows, text, small fills. The only large neon fields are the sky gradient and the sun.

**The Magenta Means Chosen Rule.** The active or selected element lights magenta along its full width (a slot's edge and gradient, a legend row's sweep, a pressed pin). Do not use magenta for passive decoration of controls.

**The Yellow Is Score Rule.** Yellow marks what the game wants you to notice: the score, today, the coin cue, keyboard focus, pins. Keep it off body copy and large surfaces other than the demo strip.

## Typography

**Display Font:** Tektur (with Saira, sans-serif), variable width 75 to 100 and weight 400 to 900
**Body Font:** Saira (with system-ui, sans-serif), variable width 75 to 125 and weight 400 to 800

**Character:** Tektur gives squared, cartridge-label caps at heavy weights; Saira carries body and every label, stretched wide (112% to 125%) for the tracked HUD voice. Width is set with `font-stretch`, so both families must be loaded as variable fonts with their `wdth` axis.

### Hierarchy
- **Display** (Tektur 900, clamp(84px, 25vw, 232px), 0.86, skewX(-9deg)): the FIRMO logotype only. A depth layer in violet carries a 10-step 1px ramp (`#a443e0` to `#2e0d57`) plus a soft drop; the face is a pink-to-magenta-to-violet gradient clipped to text with a 1px pale stroke.
- **Score** (Tektur 900, clamp(110px, 30vw, 210px), 0.8, skewX(-7deg), tabular): the 4,9 in yellow with an 11-step ramp through orange and magenta to violet. The CONTINUE countdown uses the same yellow-to-violet idea, unskewed, with a 6-step ramp at clamp(64px, 16vw, 120px).
- **Headline** (Tektur 900, width 90%, clamp(38px, 8.4vw, 80px), 1.02, uppercase, skewX(-6deg)): section titles in ink with a 6-step violet ramp; one word in magenta. CONTINUE? runs at clamp(52px, 14vw, 150px) with a magenta ramp.
- **Hook** (Tektur 700, width 88%, clamp(24px, 6.4vw, 40px), 1.08): the hero hook line, max 22ch on phones and 30ch from 900px; one phrase in yellow.
- **Title** (Tektur 800, width 88% to 92%, 18px to 30px, uppercase): slot names, perks, FAQ questions.
- **Body** (Saira 400, 17px, 1.6): paragraphs in soft; section intros 16px to 19px at max 58ch; list items 15.5px; quotes 17px to 20px in ink.
- **Button** (Saira 700, width 118%, 15px, 0.16em, uppercase): every button; 12.5px at 0.14em in the small HUD button.
- **Label** (Saira 600, width 125%, 12px, 0.32em, uppercase, cyan): fieldset legends, table captions, readout heading. Siblings in the same voice: the hero subtitle (11.5px to 17px at 0.42em), nav links (13px, 0.18em, width 112%), score line and table heads.

### Named Rules
**The Extruded Title Rule.** Display, headline and score type gets depth from a continuous text-shadow ramp stepping 1px per layer, light to dark along one hue family, closed by one soft blurred drop. Never a single hard offset.

**The Skew Rule.** Only extruded display type is skewed, between -6deg and -9deg. Body, labels and buttons stay upright.

**The Wide Label Rule.** Labels are Saira at width 112% to 125%, tracked 0.14em to 0.42em, uppercase, cyan by default (yellow inside the readout).

## Layout

One centered column: `min(1180px, 100% - 32px)`. Sections are full-bleed bands with their own background (void, night gradient, purple radial) and padding of `section-top` / `section-bottom`; the section head sits `head-gap` above content. The 60px HUD bar is sticky at the top.

The title screen fills `max(640px, 100svh - 90px)` (720px from 900px). Its horizon sits at 64% of the height, 50% on phones; the sky gradient, sun, ridges and grid canvas all key off that one `--hz` value. The copy stacks on the center axis: logotype at the upper third, the hook, score line, CTA and coin cue pinned to the bottom over a void scrim.

Breakpoints are 599/600px and 900px. Under 600px the subtitle stacks, the high-score table drops its source column and the rank spans two rows. From 600px the score table has three columns (64px / 1fr / 110px). From 900px the HUD nav appears, the floating dock disappears, the waiting room becomes 1.65fr / 1fr, perks go to three columns, service slots go from 2 to 4 columns, the booking console splits into two columns, the high-score board becomes 0.9fr / 1.4fr with a sticky score, and the address block goes 1.1fr / 1fr.

On phones a fixed dock carries the primary CTA 12px from the edges, hidden while any other start button is on screen.

## Elevation & Depth

There are no cards lifted by shadows. Depth comes from three sources: the perspective of the grid (canvas floor, rotated CSS grids at 260px and 320px perspective), extrusion ramps on display type, and blurred neon glow under lit objects. Panels separate from the page by hairline frames and darker fills, not by shadow.

### Shadow Vocabulary
- **CTA glow** (`filter: drop-shadow(0 10px 28px rgba(255,45,149,.38))`): on the wrapper of every primary button outside the HUD.
- **Dock lift** (`filter: drop-shadow(0 10px 26px rgba(0,0,0,.6))`): the phone dock only.
- **Sun glow** (`filter: drop-shadow(0 -6px 40px rgba(255,120,80,.45))`): the sun only.
- **LED glow** (`box-shadow: 0 0 12px <state color>`): the status light.
- **Extrusion ramps** (stacked `text-shadow` 1px steps plus one soft drop): see The Extruded Title Rule.

### Named Rules
**The Glow Not Lift Rule.** Boxes never get offset shadows. A lit object glows with a blurred drop-shadow in its own neon color; everything else is flat and framed.

## Shapes

Corners are cut, not rounded: border-radius is zero everywhere except the sun's half-disc. Buttons chamfer the bottom-right corner (14px, 10px when small) with `clip-path`; service slots cut the top-right (16px) and draw the diagonal with a gradient line so the frame stays continuous; the photo screen cuts two opposite corners (22px outer, 17px inner); the facade cuts the bottom-right (22px). Markers are diamonds (pins, legend numbers). Frames are 1px to 1.5px inset lines, or a 10px gradient bezel from cyan to magenta for the CRT screen. The sun is a half disc masked into seven horizontal bands that thin toward the horizon.

### Named Rules
**The Chamfer Rule.** Any frame or control that needs a corner gets a 45-degree cut sized 10px to 22px, never a radius.

## Components

### Buttons
Arcade start buttons: loud, wide-tracked, cut.
- **Shape:** bottom-right chamfer (`--chamfer`, 14px; 10px small), no radius.
- **Primary:** gradient at 100deg from deep magenta to violet `#8a22b8`, white text, 56px min height, 28px side padding, chat icon 20px. Wrapped in the CTA glow.
- **Small:** 44px high, 18px padding, 12.5px text; used in the HUD.
- **Ghost:** transparent, cyan 1.5px inset line, cyan text, no chamfer; hover turns line and text ink. Secondary actions only (Google Maps).
- **Hover / Focus / Press:** hover brightens (`brightness(1.12) saturate(1.1)`); focus is the global 2px yellow outline offset 4px; press springs to 0.95 and rebounds with bounce 0.6.

### Chips
- **Style:** 44px tall, 16px padding, Saira 600 width 115% 14px uppercase in soft, 1px cyan line inset.
- **State:** hover lights the line and turns text ink; selected fills cyan with void text. Used for day and period in the booking console.

### Cards / Containers
- **Corner Style:** chamfered per The Chamfer Rule; no radius.
- **Background:** night at 72% to 90%, or void.
- **Shadow Strategy:** none; see The Glow Not Lift Rule.
- **Border:** 1px cyan inset line; the console uses a 1.5px cyan-to-magenta gradient border.
- **Internal Padding:** 16px to 22px; the console clamp(22px, 4vw, 36px).

### Navigation
The HUD bar: void at 96%, 1px cyan line below, sun mark (a banded gradient half-disc) plus FIRMO in Tektur 800 tracked 0.24em on the left, the small primary button on the right. From 900px a nav of four links appears in soft, tracked uppercase; hover turns text ink and draws a 1px magenta underline from the left.

### Player Select (service slots)
Two columns on phones, four from 900px, each tile at least 200px (290px desktop) tall. A slot is a radio: cyan line glyph in a 16:10 inset frame, Tektur title, soft description. Hover lights the frame and wiggles the glyph. Checked: magenta inset edge and diagonal, magenta-to-purple gradient fill, yellow glyph and frame, and a yellow P1 tag that springs in with a slight rotation. Slots enter from alternating sides (70px) on a spring.

### Booking Console
The panel under the select screen that composes the WhatsApp message. Day and period chip groups with label legends, a readout (void fill, 1px yellow line at 35%, yellow label, Tektur 700 output text) that flickers in from the left on every change, then the primary CTA whose `wa.me` link is rewritten live, and a fine-print line in mute.

### High-Score Table
A giant extruded 4,9 with /5 in ink and the review count beneath, counting up from zero on entry. Beside it, ranked rows: cyan Tektur rank numerals (1º yellow), quote in ink, source in tracked mute caps with a yellow star. The first row carries a magenta-to-purple gradient between two yellow rules; even rows take a night tint. Rows print left to right with a clip sweep and the ranks blink on.

### CRT Screen and Pins
Photos sit inside a 10px cyan-to-magenta bezel with two cut corners, under a scanline overlay (1px dark line every 3px) and a vignette. Numbered yellow diamond pins with a pulsing diamond ring mark objects in the photo; pressing one lights it and its legend row magenta. On entry the screen boots from a horizontal line, overexposed and desaturated, then pins drop in on a spring. A bar under the screen carries two tracked captions in void.

### Horizon Divider
A strip between sections (70px to 120px): a 2px line fading in from the sides through magenta and orange, over a cyan grid in perspective that rolls toward the viewer and fades out within 40% of its height.

### Title Screen Grid
A canvas floor below the horizon: 16 rows spaced on a 2.2 power curve, brightening and thickening as they approach, plus vanishing lines converging to the center, over a violet-to-void fill with a magenta glow at the horizon. Base speed 0.55 rows per second; scroll velocity adds boost (capped at 5) that decays by 0.92 per frame. It renders only while visible and draws a single still frame under reduced motion.

### Status and Hours
A status pill (void, lit cyan line, square LED) reads open or closed from São Paulo time; green glow when open, magenta when closed, blinking once on entry. The hours table uses tabular figures, 1px cyan rules at 16%, today's row in yellow, closed rows in mute.

## Do's and Don'ts

### Do:
- **Do** treat this file as the Firmo world only; start any other business page from its own world.
- **Do** key the sky, sun, ridges and grid to one horizon value (64%, 50% under 600px).
- **Do** build display depth as a 1px-per-step ramp in one hue family plus one blurred drop, as on the logotype, section titles, score and countdown.
- **Do** cut corners with `clip-path` at 45 degrees (10px to 22px) on buttons, slots and photo frames.
- **Do** show every photo through the bezel or chamfered frame with scanlines over it.
- **Do** give each section its own entrance verb with springs or the `cubic-bezier(.16,1,.3,1)` ease-out, and keep content visible with no JavaScript or reduced motion.
- **Do** keep touch targets at 44px minimum and primary CTAs at 56px.

### Don't:
- **Don't** apply this palette, type pairing or grid motif to another business's landing page.
- **Don't** round corners on controls or frames; the sun is the only curve.
- **Don't** give boxes, cards or buttons offset shadows; lit objects glow, everything else is framed.
- **Don't** fill large areas with neon or put body copy in yellow or magenta.
- **Don't** skew body text, labels or buttons.
- **Don't** drift toward the dark-leather-and-brass barbershop: no brass, wood, leather textures or serif signage.


---

<!-- WORLD: landings-motion/da-vinti.html -->

# Design System: Pizzaria Da Vinti (Folhinha de arrancar)

> **Scope.** This part governs `landings-motion/da-vinti.html` only. Its tokens, inks, type, calendar objects and motion are not project-wide defaults and must not be mixed with the Firmo world above or carried to any other business page. The token block below is normative for this world; the file's YAML frontmatter belongs to Firmo and does not apply here.

```yaml
name: Pizzaria Da Vinti (Folhinha de arrancar)
description: "Scoped visual world for landings-motion/da-vinti.html only: a daily tear-off calendar on green card stock, newsprint sheets printed in two inks, green and red. Not a project-wide system."
governs: landings-motion/da-vinti.html
colors:
  card: "#0e6b37"
  card-deep: "#0a5229"
  paper: "#f5f2e9"
  paper-edge: "#e6e1d2"
  green: "#0b4a27"
  green-ink: "#0e6b37"
  red: "#d02a1e"
  red-deep: "#a81f15"
  soft: "#285c3d"
  on-card: "#f5f2e9"
  on-card-soft: "#cfe3d4"
typography:
  day-numeral:
    fontFamily: "Abril Fatface, Times New Roman, serif"
    fontSize: "clamp(108px, 31vw, 146px)"
    fontWeight: 400
    lineHeight: 0.86
    fontFeature: "\"lnum\" 1"
  score:
    fontFamily: "Abril Fatface, Times New Roman, serif"
    fontSize: "clamp(110px, 26vw, 190px)"
    fontWeight: 400
    lineHeight: 0.8
    fontFeature: "\"lnum\" 1"
  display:
    fontFamily: "Abril Fatface, Times New Roman, serif"
    fontSize: "clamp(56px, 6vw, 88px)"
    fontWeight: 400
    lineHeight: 0.95
  headline:
    fontFamily: "Abril Fatface, Times New Roman, serif"
    fontSize: "clamp(40px, 8.5vw, 76px)"
    fontWeight: 400
    lineHeight: 0.98
  name:
    fontFamily: "Abril Fatface, Times New Roman, serif"
    fontSize: "clamp(36px, 10.4vw, 48px)"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "-0.005em"
  title:
    fontFamily: "Abril Fatface, Times New Roman, serif"
    fontSize: "clamp(26px, 4.6vw, 36px)"
    fontWeight: 400
    lineHeight: 1.05
  condensed-title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "0.02em"
    fontVariation: "\"wdth\" 78"
  weekday:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 800
    letterSpacing: "0.2em"
    fontVariation: "\"wdth\" 75"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
  button:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 800
    letterSpacing: "0.06em"
    fontVariation: "\"wdth\" 82"
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    letterSpacing: "0.12em"
    fontVariation: "\"wdth\" 72"
rounded:
  leaf: "1px"
  sheet: "2px"
  stamp: "3px"
  card: "5px"
spacing:
  gutter: "16px"
  container: "1120px"
  folha-gutter: "12px"
  folha-gap: "46px"
  bar: "58px"
  hang-width: "440px"
  cta-min: "54px"
  control-small: "42px"
components:
  button-primary:
    backgroundColor: "{colors.red}"
    textColor: "{colors.paper}"
    typography: "{typography.button}"
    rounded: "{rounded.stamp}"
    padding: "0 24px"
    height: "{spacing.cta-min}"
  button-primary-hover:
    backgroundColor: "#b8241a"
  button-primary-small:
    backgroundColor: "{colors.red}"
    textColor: "{colors.paper}"
    rounded: "{rounded.stamp}"
    padding: "0 16px"
    height: "{spacing.control-small}"
  button-ink:
    backgroundColor: "transparent"
    textColor: "{colors.green}"
    typography: "{typography.button}"
    rounded: "{rounded.stamp}"
    padding: "0 24px"
    height: "{spacing.cta-min}"
  button-ink-hover:
    backgroundColor: "{colors.green}"
    textColor: "{colors.paper}"
  button-ink-on-card:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
  button-ink-on-card-hover:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.green}"
  paper-bar:
    backgroundColor: "{colors.card-deep}"
    textColor: "{colors.on-card}"
    height: "{spacing.bar}"
  calendar-card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.on-card}"
    rounded: "{rounded.card}"
    padding: "26px 16px 20px"
  tear-sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.green}"
    rounded: "{rounded.leaf}"
    padding: "22px 18px 16px"
  folha:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.green}"
    rounded: "{rounded.sheet}"
    padding: "46px clamp(18px, 4vw, 56px) clamp(36px, 5vw, 60px)"
  note:
    backgroundColor: "#fbf9f3"
    textColor: "{colors.green}"
    rounded: "{rounded.leaf}"
    padding: "22px 22px 18px"
  today-tag:
    backgroundColor: "{colors.red}"
    textColor: "{colors.paper}"
    padding: "0 4px"
  confirm-marker:
    backgroundColor: "{colors.red}"
    textColor: "{colors.paper}"
    padding: "0 6px"
```

## Overview

**Creative North Star: "Folhinha de arrancar"**

Da Vinti is the tear-off calendar that hangs in every kitchen in Ana Jacinta. The page is the wall: green card stock in the pizza box's green, printed with a fine dot screen, carrying newsprint sheets. At the top the calendar hangs from a nail on a string: a green header card with the pizza photo set in a paper border, the name in a heavy didone, and under it a stapled pad of day sheets. Today's sheet shows the date, the weekday, today's hours and a review as the thought of the day. Every later section is another sheet (folha) pinned to the card stock, with a perforated top edge and a printed border strip.

Everything printed on paper uses two inks, green and red. Green carries text, rules and headings; red carries the big answer figures, Sundays, pen marks and the one stamped action. Open and closed are never a colour: a day is circled in red pen when open and struck through when closed, the way someone marks a real calendar. The month grid proves the habit with a pen circle around every night.

Motion is the calendar behaving like an object. It swings onto its nail on load, the past days' sheets riffle off the pad until today shows, the top sheet tears away under a drag or tap and falls with weight, the calendar sways on its nail with scroll velocity, and each folha is pinned on with a small spring. Pen strokes draw themselves. With reduced motion the calendar hangs still, the sheets are already on today, a tear swaps the sheet instantly, and every section is visible. The world refuses the rustic checkered-tablecloth pizzeria with a hero photo under a serif headline.

**Key Characteristics:**
- Green card stock (with grain and a 6px dot screen) carrying newsprint paper sheets.
- Two inks on paper: green and red, nothing else.
- Abril Fatface didone for names, headings and giant numerals; Archivo for body; Archivo condensed caps (72% to 82% width) for labels and buttons.
- A printed module border of red and green triangles, repeated in whole modules only.
- Perforated top edges on every paper sheet; staples, nail and string, stacked pad edges, torn stubs.
- Authored red pen marks: a loop for open, a strike for closed, an underline for Saturday's late close.
- One red printed stamp for the menu action; secondary actions are ink outlines.

## Colors

A wall calendar in two inks: deep box green and print red on warm newsprint, mounted on green card stock.

### Primary
- **Print Red** (`red`): the stamped primary button, Sunday numerals and weekdays, the score figure, the menu numbers, the "Tem." answer, every pen mark (loops, strikes, underlines), the grip cue, the emphasis word in folha headings, the today row in the hours table, the focus ring, text selection and the scrollbar thumb.
- **Deep Red** (`red-deep`): link hover on paper.

### Secondary
- **Box Green Ink** (`green-ink`): folha headings, condensed labels and table heads on paper, the dashed rules (`1px dashed`, thought divider, demo strip), the 2px rules that open the ways list and the FAQ; at 25% to 50% alpha it draws every hairline (`rgba(14,107,55,.25 | .3 | .5)`). Same value as `card`: the card is printed in the same green.
- **Dark Green** (`green`): body text and day numerals on paper, the ink button's line and fill on hover.
- **Pale Green Impression** (`soft`): secondary text on paper (ledes, descriptions, captions, citations, legends). A lighter impression of the green ink, not a third hue.

### Neutral
- **Card Stock** (`card`): the page ground and the calendar's header card, both carrying grain; the page adds a `rgba(0,0,0,.09)` dot every 6px.
- **Deep Card** (`card-deep`): the sticky paper bar, the nail socket, the sheet perforation holes, the scrollbar track.
- **Newsprint** (`paper`): every sheet, the demo strip, the photo border, and text on red. **Note Paper** (`#fbf9f3`) is a slightly whiter leaf used only for review notes.
- **Paper Edge** (`paper-edge`): the visible thickness of paper (folha bottom edge, the pad underlay), the photo frame fill. The pad deepens in three steps: `#d8d2c0`, `#cdc6b2`, `#c2bba6`. Torn stubs are `#ebe6d8`.
- **On Card** (`on-card`) and **On Card Soft** (`on-card-soft`): heading and secondary text on the green card and in the paper bar.
- **Metal** (not ink): staples run `#e9ecea` to `#9aa39c` to `#6f7873`; the nail head is `#9aa39c` with a `#dfe5e0` highlight; the string is `#e9e3cf`.

### Named Rules
**The Two Inks Rule.** Anything printed on paper is green (`green`, `green-ink`, or its pale impression `soft`) or red (`red`, `red-deep`). No third hue, no tint of red, no gradient on paper. Paper tones and metal are material, not ink.

**The Red Stamp Rule.** A red-filled block at button size is the menu action only ("Cardápio", "Pedir pelo cardápio"). WhatsApp and Google Maps are ink outlines. The only other red fills are small: the "hoje" tag in the month grid and the `[confirmar ...]` markers.

**The Pen Not Colour Rule.** Open, closed and "every night" are said with red pen marks drawn from authored paths, never with a status colour, dot or badge: a loop circles an open day, a double strike crosses a closed one, a short underline marks Saturday's later close.

## Typography

**Display Font:** Abril Fatface (with Times New Roman, serif), single weight 400
**Body Font:** Archivo (with system-ui, sans-serif), variable width 62 to 125 and weight 400 to 900

**Character:** Abril Fatface is the calendar printer's didone: fat stems, hairline serifs, lining figures for day numbers. Archivo does the reading at normal width and, squeezed to 70% to 82% with `font-stretch`, the condensed caps of a printed calendar's month line, weekday and labels. Archivo must load as a variable font with its `wdth` axis.

### Hierarchy
- **Day Numeral** (Abril 400, clamp(108px, 31vw, 146px), 0.86, lining): the date on each tear-off sheet; dark green, red on Sundays. The hero's static fallback sheet prints "18h30" in the same slot.
- **Score** (Abril 400, clamp(110px, 26vw, 190px), 0.8, lining): the 4,6 in red. The closing "Tem." is the same voice at clamp(90px, 22vw, 180px), 0.9.
- **Display** (Abril 400, clamp(56px, 6vw, 88px), 0.95): the side headline beside the calendar from 900px, paper on card, its emphasis underlined 4px at a 10px offset.
- **Headline** (Abril 400, clamp(40px, 8.5vw, 76px), 0.98): folha headings in `green-ink` with one word in red.
- **Name** (Abril 400, clamp(36px, 10.4vw, 48px), 0.95): "Pizzaria Da Vinti" on the header card in paper; the bar wordmark is the same face at 24px. The month-grid caption uses it at clamp(24px, 4vw, 34px) in red, capitalised.
- **Title** (Abril 400, clamp(26px, 4.6vw, 36px), 1.05): house pizza names; their counters are red Abril at 44px.
- **Condensed Title** (Archivo 800, width 78%, 22px, 1.15, uppercase): the ways list. FAQ questions use width 80%, clamp(18px, 2.6vw, 22px).
- **Weekday** (Archivo 800, width 75%, 19px, 0.2em, uppercase): under the day numeral.
- **Body** (Archivo 400, 17px, 1.6): paragraphs; ledes clamp(16.5px, 2vw, 19px) at max 58ch in `soft`; review quotes clamp(17px, 2.2vw, 19.5px), 1.5.
- **Button** (Archivo 800, width 82%, 17px, 0.06em, uppercase): every button; 14px in the small bar button.
- **Label** (Archivo 700, width 72%, 13px, 0.12em, uppercase): the sheet month line, "Ana Jacinta · desde 2017", table captions, "Pensamento do dia" (11.5px, red). Siblings: grip cue (800, 72%, 11.5px, 0.14em, red), month-grid heads (800, 72%), "hoje" tag (800, 70%, 10.5px), bar nav (600, 80%, 14px, 0.08em).

### Named Rules
**The Didone Figure Rule.** Abril Fatface is for names, headings and figures only, never under 24px and never for body, labels or buttons. Big figures that answer a question (Sundays, the score, the menu numbers, "Tem.") print red; ordinary days print green.

**The Condensed Caps Rule.** Every label, weekday, button and small heading is Archivo uppercase at width 70% to 82%, weight 700 to 800, tracked 0.02em to 0.2em. Body text stays at normal width.

## Layout

The page is a wall of card stock. Content sits in `min(1120px, 100% - 32px)`; each folha is a paper sheet `min(1120px, 100% - 24px)` wide, centered, 46px apart, with padding `46px clamp(18px, 4vw, 56px) clamp(36px, 5vw, 60px)`. The sticky paper bar is 58px tall.

The hero hangs the calendar at `min(100%, 440px)` centered, 58px from the bar (the nail and string rise 40px above it), with 64px below. The tear-off block's height is measured from its tallest sheet so tearing never reflows the page.

There is one breakpoint, 900px. Below it everything stacks in one column and a fixed dock 12px from the edges carries "Pedir pelo cardápio", hidden while the hero or the closing stamp is on screen. From 900px: the bar nav appears and the dock goes; the hero becomes 440px calendar plus 1fr side copy (gap 72px, padding 70px / 90px); the ways list becomes three columns each opened by a 2px rule; house pizzas split 1.15fr / 0.85fr with a 4:5 photo; reviews split 0.8fr / 1.6fr with notes in two columns rotated -1deg, 0.8deg and 0.4deg (the third spans both at 76%); the address block splits 1fr / 1fr.

The month grid is a fixed seven-column table, Sunday first, cells clamp(46px, 9vw, 74px) tall with a 1px green rule on top.

## Elevation & Depth

Depth is physical paper: sheets sit on the card with soft blurred drops, and paper shows its thickness as solid edges in paper tones. The calendar hangs forward of the wall; folhas, notes and photos sit a little proud of it. There are no glows, no hard black offsets, and no lifted controls other than the stamp's soft drop.

### Shadow Vocabulary
- **Hanging calendar** (`box-shadow: 0 1px 0 rgba(255,255,255,.12) inset, 0 24px 40px -18px rgba(0,0,0,.75)`): the header card.
- **Folha** (`box-shadow: 0 3px 0 var(--paper-edge), 0 20px 36px -22px rgba(0,0,0,.65)`): every section sheet.
- **Pad edges** (`box-shadow: 0 3px 0 #d8d2c0, 0 6px 0 #cdc6b2, 0 9px 0 #c2bba6`): the underlay below the tear-off sheets, showing the pad's depth.
- **Note** (`box-shadow: 0 1px 0 var(--paper-edge), 0 10px 22px -16px rgba(0,0,0,.55)`): review notes.
- **Photo** (`0 6px 12px -8px rgba(0,0,0,.6)` on the card; `0 2px 0 var(--paper-edge), 0 18px 30px -18px rgba(0,0,0,.6)` on a folha).
- **Stamp drop** (`box-shadow: 0 8px 18px -8px rgba(0,0,0,.45)`): every red button; the dock uses `0 14px 28px -10px rgba(0,0,0,.7)`.
- **Bar** (`box-shadow: 0 6px 16px -10px rgba(0,0,0,.6)`).
- **Nail socket** (`inset 0 2px 3px rgba(0,0,0,.6)`): the punched hole at the card's top center.

### Named Rules
**The Paper Edge Rule.** A zero-blur offset is allowed only directly under paper, in paper-edge tones (`paper-edge` and the three pad steps), to show the thickness of a sheet or pad. Never in black, never on buttons or controls.

## Shapes

Paper is almost square: sheets and notes round 1px to 2px, the header card 5px, the stamp 3px, the photo border 2px. Round forms belong only to real objects: the nail head, the nail socket, the perforation holes.

Every paper sheet has a perforated top edge: a row of half-holes punched in the colour of what lies behind it (folha: `card` holes 2.6px on a 12px pitch; tear-off sheet: `card-deep` holes 2.2px on 10px at 80%; note: `paper` holes 1.8px on 8px). The module border strip (`--module`: a 28x14 SVG of one red and one green triangle) runs 8px tall along the top of the header card and 22px inside the top of each folha, with `background-repeat: round` so it always ends on a whole module. Staples (26x7px, 2px radius, metal gradient) pin the pad at 22% from each side. After each tear a torn stub (a jagged 9px paper fringe, `#ebe6d8`) is left on the perforation; the last three stay.

### Named Rules
**The Whole Module Rule.** The border strip repeats in whole modules only (`background-repeat: round`); a cut triangle at either end is a defect.

**The Perforated Top Rule.** Every paper sheet (folha, tear-off sheet, note) carries perforation along its top edge, holes coloured by the surface behind it.

## Components

### Buttons
Printed red stamps: flat ink on paper, pressed like a rubber stamp.
- **Shape:** gently squared (3px), no ledge, no outline.
- **Primary (stamp):** `red` fill, `paper` text, 54px min height, 24px side padding, menu icon 20px, the Button type. Soft stamp drop beneath.
- **Hover / Focus / Press:** hover darkens to `#b8241a`; focus is the global 2.5px `red` outline offset 4px (`paper` on the card); press springs to scale 0.96 with a -0.6deg twist (bounce 0) and releases with bounce 0.55, like a stamp landing.
- **Small:** 42px high, 16px padding, 14px text; the bar's "Cardápio".
- **Ink:** transparent with a 2px inset `green` line and `green` text; hover fills `green` with `paper` text. On the green card it inverts: `paper` line and text, hover fills `paper` with `green` text. Used for WhatsApp and Google Maps.

### Paper Bar
Sticky, 58px, `card-deep`: the Abril wordmark "Da Vinti" at 24px with "Pizzaria" in condensed caps, the small stamp on the right. From 900px four nav links in condensed caps (`on-card-soft`) whose hover draws a 1.5px `paper` underline from the left over 0.35s.

### Hanging Calendar (signature)
The hero object. A nail and two strings (SVG) rise from a punched socket at the card's top center; the card carries grain, a faint light-to-dark sheen at 160deg and the module strip along its top. Inside: the photo in a 5px `paper` border at 16:9 (it drifts up 8% with scroll), the name and "Ana Jacinta · desde 2017", an address line under a 1.5px paper rule, then the tear-off block, then the stamp and a line of two paper links (WhatsApp, Como chegar).

### Tear-Off Sheet
A newsprint leaf with grain and a perforated top. From top: the month line (month and year, "Hoje" / "Amanhã") in `green-ink` caps; the giant day numeral with its pen mark; the weekday; the hours line (Archivo 700, 15.5px); and at the foot, under a dashed `green-ink` rule, the thought of the day (a red caps label, a review or fact, a `soft` citation). The upper 42% is the grip: a "Puxe para arrancar" cue with a down arrow on a paper chip in red caps; it is the only focusable control on the pad, and after the last sheet it reads "Voltar para hoje". Seven sheets are stocked from today; each shows a different fact.

### Pen Marks (signature)
Hand-drawn red strokes from authored paths in a 100x64 box, each drawn as two passes for pen pressure (main stroke 2.3px to 3.4px, second pass 1px to 1.3px at 0.75 to 0.8 opacity), round caps and joins. Four loop variants circle a figure (picked by day number so neighbours differ, and tilted between -5deg and 5deg in the month grid); a double strike crosses a closed day; a short line underlines Saturday. The status line in the address sheet uses the same loop when open and the strike when closed.

### Month Grid
The current month as a seven-column table with condensed caps heads (D S T Q Q S S), Sunday's column in red. Each day is an Abril figure (clamp(20px, 4.4vw, 34px)) circled by a pen loop; today's loop is heavier (3.4px) with a small red "hoje" tag; Saturdays carry the red underline. A legend under it explains loop and line. The caption is the month name in red Abril.

### Folha
Each section is a paper sheet pinned on the card: perforated top, module strip inside the top edge, folha shadow, Abril headline with one red word, `soft` lede. Lists inside rule off with 1px `green-ink` hairlines at 30% (dashed at 50% for the house pizzas); the ways list and FAQ open with a 2px `green-ink` rule.

### Review Notes
Smaller torn leaves (`#fbf9f3`, 1px radius, perforated top) holding a quote and a `soft` source line; slightly rotated on desktop.

### Hours and Status
A table with tabular figures, `soft` day names, bold `green` times and 1px hairlines; today's row prints red. The status line carries a pen mark (loop or strike) and the open or closed sentence computed from São Paulo time.

### Motion Grammar

Motion 12.43.0 drives every animation; Lenis 1.3.26 smooths scroll (lerp 0.11, anchor offset -64px). The default ease is `cubic-bezier(.16,1,.3,1)`.

- **Hang swing:** on load the calendar swings in from -5deg on a spring (bounce 0.5, visual duration 1s), pivoting 34px above its top edge.
- **Riffle:** four past-day sheets are stacked over today and flip off the pad one by one (perspective 600px, rotateX 0 to 75deg, up 20px, fading), 0.26s each, 0.15s apart from 0.55s, until today shows. The grip cue nudges down 4px three times from 1.6s; today's pen mark draws at 1.35s.
- **Tear:** dragging the grip follows the finger (60% of downward travel, 12% upward, 40% sideways, a 0.04deg tilt per pixel). Past 70px down or 110px sideways, or on tap or keyboard, the sheet lifts 14px, then falls 90% of the viewport height, slides 120px and spins to 26deg toward the drag side, fading, over 0.9s (`ease [0.3,0,0.7,1]`). The calendar kicks on its nail (rotate 0, -2, 1, 0deg) and a torn stub is left behind. A drag released short springs back (bounce 0.45). After the last sheet the pad restocks and today drops in (spring, bounce 0.3).
- **Scroll sway:** while the hero is within 1.2 viewports, Lenis scroll velocity (x0.012, capped at ±0.6) kicks a damped pendulum (stiffness 0.06, damping 0.9) that rotates the calendar.
- **Folha entrance:** each folha starts 60px low, tilted ±1.2deg alternately and transparent, and springs into place on view (bounce 0.25, visual duration 0.7s).
- **Pen-stroke draws:** month-grid loops draw by dash offset (0.35s each, 35ms apart, second pass fades to 0.75), then the "hoje" tag pops (spring, bounce 0.5); status marks draw in 0.45s, 0.15s apart.
- **Section verbs:** ways rise 24px with a 0.1s stagger; menu items slide in from -24px; the pizza photo is taped on (rotate 6 to -1.5deg, scale 0.94 to 1, spring 0.35) with an 8% parallax; review notes are dealt from above with ±8deg (spring 0.35, 0.14s apart); "Tem." is stamped from scale 1.8 and -8deg to -3deg (spring 0.3); FAQ answers fade down 8px.
- **Reduced motion:** a class set before paint (`calm`, also applied if Motion fails to load) disables every CSS animation and transition, skips Lenis, the swing, riffle, sway and all entrances, so every section is visible by default. Tearing still works: the sheet is removed instantly and the next day shows. The phone dock still hides and shows, without transition.

## Do's and Don'ts

### Do:
- **Do** treat this part as the Da Vinti world only; start any other business page from its own world.
- **Do** print everything on paper in two inks: green (`green`, `green-ink`, `soft`) and red (`red`, `red-deep`).
- **Do** reserve the red stamp fill for the menu action and use the ink outline for WhatsApp and Maps.
- **Do** mark open, closed and every night with authored red pen paths drawn in two passes, never with a colour or badge.
- **Do** set names, headings and numerals in Abril Fatface, labels and buttons in Archivo condensed caps (width 72% to 82%).
- **Do** give every paper sheet a perforated top edge and repeat the module strip in whole modules (`background-repeat: round`).
- **Do** show paper thickness with solid offsets in paper-edge tones only (folha edge, pad edges).
- **Do** keep the calendar physical: swing, riffle, tear with weight, sway with scroll, and keep a working, instant tear under reduced motion.

### Don't:
- **Don't** mix this world with Firmo or any other page's world: no neon, no chamfers, no extruded type here, and no card stock, two inks or pen marks there.
- **Don't** introduce a third ink, a tint of red, or a gradient on paper.
- **Don't** give buttons a ledge or a hard offset shadow; the stamp sits on a soft blurred drop.
- **Don't** set Abril Fatface under 24px or use it for body text.
- **Don't** use green or red dots, pills or fills to say open or closed.
- **Don't** drift toward the rustic checkered-tablecloth pizzeria with a hero photo under a serif headline.

---

# Design System: Planet Patas (Painel xadrez)

> **Scope.** This part governs `landings-motion/planet-patas.html` (and its single-file copy `celular/planet-patas.html`) only. Nothing here applies to Firmo, Da Vinti or any other business page.

```yaml
name: Planet Patas (Painel xadrez)
description: "Scoped visual world for landings-motion/planet-patas.html only: the store's blue-and-white checkered photo backdrop and its logo globe, royal blue fields with paw wallpaper, white bands with red subtitles. Not a project-wide system."
governs: landings-motion/planet-patas.html
colors:
  blue: "#0A4C9E"
  post: "#14508C"
  deep: "#073A7A"
  red: "#D2232E"
  red-deep: "#B01A24"
  orange: "#F07A3C"
  sky: "#E8F2FD"
  sky-2: "#CFE3FA"
  ink: "#0B2A55"
  ink-soft: "#3A5680"
  white: "#FFFFFF"
  lilac: "#B9A3EE"
  yellow: "#FFD23F"
  confirm-bg: "#FFF3B8"
typography:
  hero:
    fontFamily: "Baloo 2, Arial Rounded MT Bold, system-ui, sans-serif"
    fontSize: "clamp(42px, 11.5vw, 92px); clamp(56px, 5vw, 76px) from 1000px"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Baloo 2, system-ui, sans-serif"
    fontSize: "clamp(34px, 8.6vw, 62px)"
    fontWeight: 800
    lineHeight: 0.98
  band:
    fontFamily: "Baloo 2, system-ui, sans-serif"
    fontSize: "clamp(18px, 4.2vw, 24px)"
    fontWeight: 800
    lineHeight: 1.15
  title:
    fontFamily: "Baloo 2, system-ui, sans-serif"
    fontSize: "24px to 32px"
    fontWeight: 800
    lineHeight: 1.02
  score:
    fontFamily: "Baloo 2, system-ui, sans-serif"
    fontSize: "clamp(110px, 30vw, 190px)"
    fontWeight: 800
    lineHeight: 0.8
  body:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
  button:
    fontFamily: "Baloo 2, system-ui, sans-serif"
    fontSize: "18px (16px small)"
    fontWeight: 800
rounded:
  pill: "999px"
  card: "18px to 22px"
  band: "8px to 12px"
  polaroid: "4px"
spacing:
  container: "1180px"
  gutter: "16px"
  section-top: "clamp(72px, 10vw, 120px)"
  section-bottom: "clamp(64px, 9vw, 104px)"
  cta-min: "52px"
  control-min: "44px"
components:
  button-primary: { backgroundColor: "{colors.red}", textColor: "{colors.white}", shape: pill }
  button-secondary: { backgroundColor: "{colors.orange}", textColor: "{colors.ink}", shape: pill }
  button-on-blue: { backgroundColor: "{colors.white}", textColor: "{colors.blue}", shape: pill }
  band: { backgroundColor: "{colors.white}", textColor: "{colors.red}", rotate: "-1deg to -1.2deg" }
  band-on-light: { backgroundColor: "{colors.red}", textColor: "{colors.white}" }
  polaroid: { backgroundColor: "{colors.white}", padding: "9px 9px 0", caption: "Baloo 2 800 in blue with a red paw" }
  confirm-mark: { backgroundColor: "{colors.confirm-bg}", textColor: "#5A4300" }
```

## Overview

**Creative North Star: "Painel xadrez"**

Planet Patas photographs every pet after the bath on a blue grooming table in front of a step-and-repeat backdrop: blue squares with the logo, white squares with "Planet Patas" in blue. The page is built from that backdrop and from the logo itself. Royal blue fields carry the logo's own paw wallpaper; headlines copy the store's Instagram posts (huge white rounded title, a white band with a red subtitle); photos are polaroids with a red paw; the gallery sits on the checkered backdrop drawn at full strength. The mascots exist only inside the logo file: never redrawn, never animated as characters.

## Colors

- **Royal Blue** (`blue`): hero, section fields, the blue squares of the checker. **Post Blue** (`post`) is the backdrop square and the gallery ground. **Deep** (`deep`) is the taxi route card and the title shadow.
- **Red** (`red`): primary buttons, the subtitle band text, paw stamps. Never as text on blue (contrast).
- **Orange** (`orange`): the secondary CTA only (from the facade stripe), always with ink text.
- **Sky** (`sky`, `sky-2`): light section grounds, inputs, placeholders.
- **Lilac and Yellow**: small decorative paws only (orbit, trail). Yellow is also the focus ring.
- **Confirm** (`confirm-bg`): every `[confirmar]` / `[consultar]` marker.

## Typography

Baloo 2 ExtraBold (rounded and heavy, like the logo lettering and the post titles) for every heading, band, button and number; Nunito for body. Fonts ship as local woff2 in `landings-motion/fontes/` and are embedded as data URIs in the celular copy.

## Components and motifs

- **Post head:** white headline plus a rotated white band with red text on blue; blue headline plus a red band with white text on light grounds.
- **Checker grid:** services alternate blue and white tiles like the backdrop (1, 2 and 3 columns keep the checker).
- **Polaroids:** hero fan, before/after cards and the gallery; rotation uses the CSS `rotate` property so Motion transforms never overwrite it.
- **Painel:** inline SVG pattern (logo.png in the blue squares, "Planet / Patas" in the white squares) behind the gallery.

## Motion

The logo spins in once while six paws orbit on a tilted ellipse, passing in front of and behind it; a paw trail is stamped along the page edge as you scroll; foam bubbles rise in the banho section; scissors cut the divider before the packages; a car follows the taxi route with scroll; 4,8 and 120 count up. Signature: "Dar banho" springs bubbles over the before card, flips it, then pops them one by one. Reduced motion: no motion, and "Dar banho" becomes an opacity fade. Without Motion the page is complete and static.

## Named Rules

**The Logo Is The Only Mascot Rule.** Dogs and cats appear only as the logo file or in real photos.

**The Post Format Rule.** Every section head is a big Baloo title plus one band; no eyebrow labels above titles.

**The Real Photo Rule.** Only real Google photos of the store; missing material is a labelled block, never stock, and never an edited fake "before".

---

# Design System: Garage Auto Detalhamento (Do fosco ao brilho)

> **Scope.** This part governs `landings-motion/garage.html` (and `celular/garage.html`) only.

```yaml
name: Garage Auto Detalhamento (Do fosco ao brilho)
description: "Scoped visual world for landings-motion/garage.html only: graphite paint and chrome; the page starts matte and desaturated and gets polished to a mirror as you scroll. Not a project-wide system."
governs: landings-motion/garage.html
colors:
  graphite: "#0F1113"
  paint: "#07080A"
  panel: "#17191C"
  panel-2: "#1E2125"
  matte: "#2B2D30"
  chrome: "#D7DCE1"
  chrome-2: "#AEB5BD"
  chrome-dim: "#8A929B"
  mirror: "#ECEFF2"
  mirror-2: "#DCE1E6"
  mirror-ink: "#111417"
  ink: "#F1F3F5"
  soft: "#B9C0C8"
  mute: "#8D959E"
  blue: "#8EB0D3"
  blue-hi: "#B8D1EA"
  blue-deep: "#3E6286"
typography:
  display:
    fontFamily: "Archivo Expanded (Archivo instanced at wdth 125), Arial Black, sans-serif"
    fontSize: "clamp(58px, 15vw, 150px)"
    fontWeight: 900
    lineHeight: 0.86
    textTransform: uppercase
  headline:
    fontFamily: "Archivo Expanded"
    fontSize: "clamp(28px, 7vw, 70px)"
    fontWeight: 800
    lineHeight: 0.95
    textTransform: uppercase
  body:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "17.5px"
    fontWeight: 400
    lineHeight: 1.6
  button:
    fontFamily: "Archivo Expanded"
    fontSize: "15px (13px under 600px)"
    fontWeight: 800
    letterSpacing: "0.04em"
rounded:
  control: "6px"
  panel: "10px"
components:
  button-primary: { background: "chrome plate gradient #FFF → #DCE1E6 → #B4BCC5 → #E9ECEF", textColor: "{colors.paint}", sheen: "white highlight sweeps on hover" }
  button-dark: { background: "#2A2E33 → #121417", textColor: "#FFFFFF" }
  title: { fill: "chrome gradient clipped to text", motion: "a light reflection sweeps across once when it enters" }
  confirm-mark: { backgroundColor: "#3A3420", textColor: "#F4DE8A" }
```

## Overview

**Creative North Star: "Do fosco ao brilho"**

The page is a polishing job. It opens matte: the hero photo (a black Mustang with the sky in its paint) is desaturated and soft, and a polisher's swirl spirals out from the panel as you scroll until the whole photo is a mirror. Every photo starts matte and gains colour and contrast as it reaches the middle of the screen. Titles are chrome, and a reflection sweeps across each one once. The dark graphite sections give way, from the gallery onward, to light mirror-silver sections: the paint is finished.

## Signature interactions

- **Diagonal before/after:** the cut runs at the angle of a polisher pass, with a chrome knob and a glint travelling along the cut line; tabs Pintura · Rodas · Ponteira · Motor · Bancos. Touch: the knob drags; a horizontal swipe on the frame drags; a vertical swipe scrolls the page (`touch-action: pan-y`).
- **Headlight lens:** a chrome-rimmed circular lens reveals the clear headlight over the yellowed one. It follows the finger only when the touch starts on the lens or moves horizontally; vertical swipes scroll.
- **Vitrificação:** water drops slide down the glossy panel and run away from the cursor or finger ("Água repelindo, pintura protegida").
- Count-ups for 253 reviews and 10,6 mil followers; brand names light up one by one.

Reduced motion: no motion, photos at full gloss, the hero fully polished. Without Motion the page is complete.

## Named Rules

**The Real Pair Rule.** Before/after shows only real pairs of the same vehicle; until the owner sends them, the mechanism runs on neutral labelled blocks.

**The Chrome Is Earned Rule.** Chrome gradient text is reserved for titles, the score and the brand name; body copy is never chrome.
