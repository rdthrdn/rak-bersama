# QA evidence

- Production TypeScript check and Vite build pass.
- 12 pure combat/save tests cover finite damage, guard, speed initiative, dead actors and targets, healing cap, costs, victory, defeat, taunt, boss area attacks, critical-buff expiry and invalid saves.
- Full Playwright route: new game → movement → NPC → choice → road → slime victory → wolf victory → dungeon → spring → wraith victory → boss dialogue → boss victory → ending → refresh → continue ending.
- Browser edge pass: 390px responsive UI, 1280px laptop, pause blocks movement, sound setting, target cancellation, interrupted battle restores pre-battle checkpoint, invalid future save does not offer Continue.
- Review found stale dialogue callbacks could survive title transitions. Fixed by guarding actions during dialogue, hiding conflicting menu actions, and clearing lines, callback and typing timer on new/title transitions.
- Victory/defeat dialogs cannot be dismissed with Escape; the reward/retry action remains reachable.
- Captured and inspected title, town, dialogue, dungeon, ordinary combat, boss combat, victory and ending screenshots in output/qa.
- Default desktop browser uses WebGL. Automated complete-route testing uses Phaser's actual Canvas fallback due to slow headless WebGL capture on this machine.

## Known limits

Manual playtesting with more people is still needed to validate the estimated 10–15 minute first-play duration and difficulty. This is not a 30–45 minute campaign. Desktop/laptop is the primary presentation target. The 40-second trailer is an edited capture with synthesized background audio.
