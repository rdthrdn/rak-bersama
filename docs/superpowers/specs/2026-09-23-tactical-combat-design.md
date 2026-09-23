# Tactical Combat: Read, Break, and Boost

## Goal

Give each battle a readable tactical loop built around enemy weaknesses, shield breaks, Boost decisions, and enemy attack telegraphs. Keep the three-person party and the existing compact chapter. Battles remain quick to read and resolve in the current 2.5D presentation.

## Current gaps

- Attacks have no damage types and enemies have no weaknesses or shield values.
- The existing `break` status only lowers defense; it does not interrupt an enemy.
- Enemy actions are hidden until they happen. Boss phases are visible, but their next target and attack are not.
- The turn queue is visible and speed-based, so a forecast can build on a system the player already understands.
- Combat is a pure TypeScript model. The local save stores the world before an encounter, not the in-progress battle.

## Battle rules

### Damage types and shields

Use three damage types: **physical**, **fire**, and **spirit**. Kael and Ren's direct attacks and damaging skills are physical. Mira's basic Spark is spirit; Emberfall is fire. Healing, Guard, items, taunt, Overdrive, and Resonance do not deal typed damage.

Each enemy has one or more weaknesses and a shield count. A direct-damage hit matching a weakness removes one shield pip and still deals HP damage. A non-matching hit deals HP damage but does not reduce shields. Multi-hit actions resolve each hit separately, so every matching hit can remove a pip. Boost's extra shield damage is applied after the action's normal hits and cannot reduce shields below zero.

When an enemy reaches zero shield, it becomes **Broken**. It takes 50% more damage from direct attacks while Broken and loses its next scheduled action. When that skipped action comes up, its shield refills to its starting count and the Broken state ends. It cannot be broken again while already Broken. Healing, status actions, and phase transitions never remove shields.

The current defense-down effect must be renamed and displayed as **Weakened**, so it is distinct from the new shield-based Broken state. Version-1 local saves that contain the old `break` status remain loadable by normalizing it to `weakened`; no battle shield or Boost data is written to saves.

### Boost

Each ally starts an encounter with 1 Boost Point (BP), can hold up to 3, and keeps BP only for that battle. After a successful unboosted ally action, that ally gains 1 BP. A boosted action spends the chosen 1–3 BP and grants no BP for that action.

Boost is available on direct-damage actions. Each BP spent adds 25% damage to the action and, if the action hits a weakness, removes one additional shield pip for the action. Boost does not add turns or change the number of hit events. Healing and other support actions remain unboosted in this first implementation. An invalid command, target, or unaffordable action spends neither a turn nor BP.

The battle menu offers Normal, Boost 1, Boost 2, and Boost 3 when available. The player chooses an action and Boost level before confirming an enemy target. The target preview states the damage type, base hit count, and expected shield damage for that chosen action.

### Enemy roster and boss phases

Shield counts and weaknesses are initial balance values for playtesting:

| Enemy | Weakness | Shields | Readable behavior |
| --- | --- | ---: | --- |
| Dew Slime | Fire | 2 | Uses its existing periodic brace; telegraph it as Brace instead of surprising the player with a defensive turn. |
| Briar Wolf | Physical | 3 | Fast and pressures the ally with the lowest current HP. Kael's taunt redirects its single-target attack. |
| Hollow Wraith | Spirit | 3 | Uses a cold attack that applies Weakened to its target. |
| Bellkeeper, phase I (>66% HP) | Physical | 4 | Single-target Bell Strike. |
| Bellkeeper, phase II (<66% and ≥30% HP) | Fire | 5 | Hollow Peal hits the whole party on alternating rounds; otherwise uses Bell Strike. |
| Bellkeeper, phase III (<30% HP) | Spirit | 6 | Last Toll hits the whole party on alternating rounds at the existing amplified damage; otherwise uses Bell Strike. |

Boss thresholds and attack cadence stay the same as the current chapter. Crossing a threshold changes the boss's weakness, restores its phase shield count, clears Broken, and updates its telegraph. A break from the previous phase cannot carry through a transition.

### Enemy intent

Every living enemy shows its next action and intended target during the player's turn. Use plain labels such as `Bite → Kael`, `Cold Grasp → Mira`, `Hollow Peal → Party`, `Brace`, or `Broken · turn skipped`; text and color together convey the information.

Expose one pure `enemyIntent` forecast and use it both for the UI and enemy-turn resolution. It must account for the same queue, boss HP phase, round cadence, current HP ordering, and taunt rules as the attack it predicts. Taunt redirects single-target attacks but not party-wide attacks. Recompute the forecast after any action that can change the target, HP phase, taunt, or Broken state.

## Interface and presentation

- Enemy cards show HP, shield pips, weakness names, and next intent at readable sizes on desktop and mobile.
- Selecting a damaging action previews its type and hit count against each enemy. Weakness matches and projected shield removal use text plus a distinct visual treatment; color alone is insufficient.
- Broken enemies have a clear label and stagger treatment. The combat log explains the break, vulnerability, skipped turn, and shield refill.
- BP appears on each party card as a 0–3 meter. Boost controls expose only levels the active ally can afford.
- Preserve the visible turn order, semantic HTML controls, keyboard focus, and touch-sized targets. Do not add external art or remote services for this feature.

## Data and architecture

Keep enemy tactical definitions in game data and keep per-battle shield, Broken, and BP state in the in-memory `Battle` model. Do not add these values to persistent `Actor` or `GameData` unless implementation shows no clean battle-only alternative. Continue using the pure combat module for validation and resolution; the controller presents state, and the renderer only shows combat feedback. The battle checkpoint remains local-only and resumes from the pre-encounter save after reload.

## Acceptance criteria

1. All four enemy kinds and all Bellkeeper phases expose the documented weakness, shield count, and intent.
2. Typed attacks reduce shields only on a weakness; multi-hit actions resolve each hit; Boost applies its damage and shield bonuses once according to the rules above.
3. Breaking an enemy creates the vulnerability window, skips exactly its next scheduled action, then restores shields. Defeat, victory, and dead-actor queue behavior remain correct.
4. The shown intent always matches the next action, including taunt, target selection, boss area cadence, Brace, Broken, and boss phase changes.
5. Legacy version-1 saves still load, and battle-only tactical state does not persist after leaving or reloading an encounter.
6. Automated combat tests cover the rules above, the existing journey and save checks still pass, and a browser smoke test confirms the tactical labels remain usable at desktop and mobile widths.

## Out of scope

Recruiting new party members, grid movement, formations, equipment, permanent BP progression, additional chapters, random encounters, online accounts, backend services, analytics, or changing the local-only save model.

## Risks to check during playtesting

- Boost plus multi-hit weakness moves may erase shields too quickly; tune shield counts or the 25% bonus using encounter playtests.
- The Bellkeeper's phase-specific weakness and shield refill must feel like a new tactical prompt rather than undoing progress. Keep the phase change visible in the combat log and enemy card.
- Exact intent previews can become stale if the combat model and UI calculate enemy choices separately; the shared forecast is a required part of the design.
- Enemy cards, intent text, and shield pips must fit the existing narrow-screen battle layout without covering the 2.5D action.
