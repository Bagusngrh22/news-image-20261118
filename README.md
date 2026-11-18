# news-image-20261118

Sum up Wednesday 18 November 2026's world news in one image. A Node 22 program
(standard library only) draws a 1024x1024 newspaper front page — four stories,
one image — and writes it to `/output/entry.png`.

## The four stories

- **Gulf flashpoint** — Iran drones hit a US military radar system in Bahrain;
  Kuwait intercepts drones; Bahrain issues an all-clear after the overnight
  warning.
- **Trump in Manila** — Trump lands in Manila for Quad talks ahead of a China
  visit; Modi presses India-ASEAN cooperation at the East Asia Summit.
- **Ukraine strikes Crimean Bridge** — major strike on the bridge; Russia pounds
  Kyiv bridges in reply; UN counts at least 372 civilians killed in Ukraine
  in October.
- **Nvidia posts a record $115.8B quarter** — revenue +103% year over year,
  data center $107.6B, Q4 guidance $130B; first results since Jensen Huang
  resigned as CEO.

Each story was verified as 18 November 2026 from public sources read on
18 Nov 2026 (Jagran Josh top world news, AppiSToS World, Motley Fool,
TechCrunch, Cointelegraph).

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

No network, no clock, no randomness: two runs write byte-identical PNGs
(17,453 bytes, 1024x1024, valid PNG).

Entered on [make.fun](https://make.fun/bounty/news-image-20261118) — the 50
best images share $250.
