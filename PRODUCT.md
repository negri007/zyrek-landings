# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML/CSS, one `.html` file per business in `landings/`, no build step. Pages will be hosted (Vercel/Netlify or similar), so shared assets next to the pages are fine; a framework is not wanted.

## Users

Primary: the owner of each local business in Presidente Prudente (SP). They receive the demo unsolicited, usually as a link on WhatsApp opened on a phone, or see it in person on a notebook. Their job in that moment is to decide whether this page is worth paying Gabriel Negri to put live.

Secondary: the business's own customers (people from the city and people passing through). Their conversion is the argument the owner is buying, so the pages must plausibly work for them, but they are not the audience that has to be won first.

## Product Purpose

Speculative demo landing pages that Gabriel Negri builds to prospect local businesses. Each page shows the owner, with their own name, photos, reviews and hours, what a real site for them would look like. Success means the owner replies wanting the site.

## Positioning

Each demo is built from the business's real public footprint (Google Maps and Instagram, collected via Apify): real rating, real review quotes, real address, hours, phone and photos. The owner sees their own business, not a template with a logo swapped in. The redesign gives every business its own visual world rather than a shared themed template.

## Operating Context

- Current set (10 pages, 7/10/2026): Claudio Radiadores (radiator repair), Pizzaria Da Vinti, Firmo Barbearia, Garage Auto Detalhamento, Hulk Hamburgueria, Academia Lobo Fitness, NS Store (clothing), Planet Patas (pet shop), Tamara Ferreira (tattoo, brows, lashes), Zero18 Burger.
- Language: pt-BR throughout.
- Viewing: phone first (WhatsApp link), also notebook in person, and hosted URL.
- `landings/baixar_fotos.py` downloads the photos into `landings/fotos/` (Instagram links expire within days); `landings/LEIA-ME.txt` holds the operator notes.

## Capabilities and Constraints

- Primary action on every page is WhatsApp: a `wa.me` link with a prefilled message naming the business.
- Pages must keep the "Demonstração" banner, the "Página de demonstração feita por Gabriel Negri" credit, and `<meta name="robots" content="noindex, nofollow">`. These are removed only when a page is actually published for the owner.
- Text in `[colchetes]` is unconfirmed and must be verified with the owner; it stays visibly marked.
- Each business gets a bespoke visual identity; there is no shared look across pages.

## Evidence on Hand

- Google ratings and review counts, review quotes, addresses, phones, hours, and service lists in each `landings/*.html`, sourced from Google Maps and Instagram.
- Four photos per business in `landings/fotos/<slug>-1..4.jpg`. Some were taken by customers and must keep their "Foto: <nome> via Google" credit.
- No logos, brand guidelines, prices, or owner-supplied content exist. Do not invent testimonials, prices, awards, services, or claims; anything not in the scraped data is marked `[confirmar]`.

## Product Principles

1. The owner must recognize their own business in the first screen: name, place, rating, real photo.
2. Real data only. Credibility with the owner collapses on one invented fact.
3. Every page has to look like it was made for that business alone.
4. Phone first: the demo is judged on a WhatsApp link opened on a phone.
5. One clear action: talk on WhatsApp.
