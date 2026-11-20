# Leonida Legend — the GTA VI Trophy Guide & Tracker

![gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)
![rank](https://make.fun/badge/gta6-trophy-guide-01/Zikri167/makefun-gta6-trophy-guide-01-v4/rank.svg)
![reward](https://make.fun/badge/gta6-trophy-guide-01/Zikri167/makefun-gta6-trophy-guide-01-v4/reward.svg)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI, built for the make.fun bounty [gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01).

**The guide is the product.** Every trophy carries its official name, description and grade, a guide written in our own words (what to do, in what order, and when it can be missed), a verdict on whether it can be missed — *likely*, *possible* or *not missable* — with the reasoning shown, and the sources each fact comes from. Around the guides sit the working parts of a tracker:

- a checklist whose progress (earned ticks and per-trophy counters, e.g. 27 of 42 Shooting Range golds) is saved in the browser and can be exported to a file and imported back;
- filters by kind (story, missable, collectibles, activities, partner/online), by grade, and by search;
- a spoiler shield that hides the names and descriptions of story trophies until they are earned;
- a five-stage roadmap to the platinum (difficulty 5.5/10, an estimated 75–95 hours) and a missables page that explains, from the official descriptions alone, why each verdict was given. Where a description is a riddle, the guide says so and reasons honestly instead of inventing a location or a step.

## Run it

The app is plain static files under `app/` with no build step. Serve the folder with any static file server, for example:

```
node serve.ts        # then open http://localhost:8080
```

It works with the network off and loads nothing from outside `app/`.

## Hand it in

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's vendored `buildDossier`:

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Sources and honesty

Trophy names, descriptions and grades are the official PlayStation list as published via [Exophase](https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/); the progress targets PlayStation tracks are from [PSNProfiles](https://psnprofiles.com/trophies/43531-grand-theft-auto-vi). Everything else — guides, roadmap, missable verdicts — is original work for this entry, reasoned from those official descriptions and labelled as not yet checked in the game. No Rockstar Games logo or artwork is used.

## License

MIT — see `LICENSE`.
