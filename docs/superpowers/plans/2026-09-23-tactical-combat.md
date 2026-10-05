# Tactical Combat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add readable enemy weaknesses, shield-based Break, per-ally Boost, and accurate enemy intent forecasts to the existing local-only chapter.

**Architecture:** Keep enemy profiles and skill damage metadata in `src/game/data.ts`; keep BP, shield, and Broken state inside `Battle`; resolve damage and enemy intent in the pure combat module. The controller and CSS present those results, while save validation only migrates the old defense-down status name.

**Tech Stack:** TypeScript 5.9, Phaser 3.90, Vite 7, Node test runner through `tsx`, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-23-tactical-combat-design.md`

## Global Constraints

- “Keep the three-person party and the existing compact chapter.”
- “Use three damage types: **physical**, **fire**, and **spirit**.”
- “Each ally starts an encounter with 1 Boost Point (BP), can hold up to 3, and keeps BP only for that battle.”
- “Boss thresholds and attack cadence stay the same as the current chapter.”
- “The battle checkpoint remains local-only and resumes from the pre-encounter save after reload.”
- “Do not add external art or remote services for this feature.”

## Review Focus

- Boost values outside `0..3`, above the active ally's BP, or attached to support actions must fail without changing battle state. Pin this in `tests/tactical-combat.test.ts` in Task 2.
- Twin Fang plus Boost must apply its BP bonus once per action, not once per hit. Pin total damage and shield removal in `tests/tactical-combat.test.ts` in Task 2.
- A Bellkeeper hit that both empties its old shield and crosses an HP threshold must enter the new phase with its new shield and weakness, without carrying Broken forward. Pin this in `tests/tactical-combat.test.ts` in Task 3.
- If taunt expires or its owner falls before an enemy acts, the intent preview and executed target must resolve to the same living ally. Pin this in `tests/edge-cases.test.ts` in Task 3.
- Version-1 saves with legacy `break` statuses must normalize to `weakened`; unknown kinds and non-positive durations must still be rejected. Pin both cases in `tests/edge-cases.test.ts` in Task 4.

---

## File Map

- `src/game/types.ts` — shared damage, profile, skill, battle-tactics, and enemy-intent shapes.
- `src/game/data.ts` — typed skill definitions, normal-enemy profiles, and Bellkeeper phase profiles.
- `src/game/combat.ts` — tactical state initialization, typed hit resolution, Boost, Break, phase changes, preview calculations, and the shared intent forecast/resolver.
- `src/game/save.ts` — normalize legacy version-1 `break` statuses and continue rejecting malformed save data.
- `src/game/controller.ts` — show BP, weaknesses, shields, previews, Boost choices, and next enemy intent; pass the chosen Boost level into the combat model.
- `src/ui/styles.css` — readable tactical layout at desktop and mobile widths.
- `tests/tactical-combat.test.ts` — new focused rules tests.
- `tests/combat.test.ts` and `tests/edge-cases.test.ts` — preserve existing combat behavior and add migration/AI regression cases.
- `scripts/smoke.mjs` and `scripts/browser-edges.mjs` — exercise the entire journey and mobile/desktop battle presentation.
- `docs/GAME_DESIGN.md`, `docs/TECHNICAL_DESIGN.md`, and `docs/QA_CHECKLIST.md` — document the shipped battle loop and its verification.

## Interfaces

Task 1 produces these shared data shapes in `src/game/types.ts`:

```ts
export type DamageType = 'physical' | 'fire' | 'spirit';
export interface EnemyProfile {
  weaknesses: DamageType[];
  shields: number;
  phase?: number;
}
export interface BattleTacticState {
  bp?: number;
  shield?: number;
  maxShield?: number;
  broken?: boolean;
  bossPhase?: number;
}
```

`Battle` gains `tactics: Record<string, BattleTacticState>`. Allies have `bp`; enemies have `shield`, `maxShield`, and `broken`; the Bellkeeper also has `bossPhase`. `Skill` gains optional `damageType` and `hits` properties. `data.ts` exports `enemyProfileFor(actor: Actor): EnemyProfile`, ordinary `enemyProfiles`, and `bellkeeperPhases`.

Task 2 produces these pure combat interfaces in `src/game/combat.ts`:

```ts
export interface ActionPreview {
  damageType: DamageType;
  hitCount: number;
  weakness: boolean;
  shieldDamage: number;
  shieldsRemaining: number;
  breaks: boolean;
}

export function actionPreview(
  battle: Battle,
  command: string,
  targetId: string,
  boostLevel?: number,
): ActionPreview | null;

export function act(
  battle: Battle,
  command: string,
  targetId?: string,
  boostLevel?: number,
): boolean;
```

Task 3 produces the single forecast used by both presentation and enemy resolution:

```ts
export type EnemyIntent =
  | { kind: 'brace' | 'skip'; name: string; targetIds: string[] }
  | {
      kind: 'attack';
      name: string;
      targetIds: string[];
      multiplier: number;
      area: boolean;
      weakenTarget?: boolean;
    };

export function enemyIntent(battle: Battle, enemyId: string): EnemyIntent | null;
```

`enemyTurn(battle)` calls `enemyIntent` for its active enemy and executes that returned intent without reselecting a target or recalculating a different action.

## Tasks

### Task 1: Define enemy profiles and battle-only tactical state

**Files:**
- Modify: `src/game/types.ts`
- Modify: `src/game/data.ts`
- Modify: `src/game/combat.ts`
- Create: `tests/tactical-combat.test.ts`

**Interfaces:**
- Consumes: Existing `Actor`, `Skill`, `Battle`, `makeEnemy`, and `createBattle`.
- Produces: `DamageType`, `EnemyProfile`, `BattleTacticState`, `Battle.tactics`, typed skill metadata, `enemyProfileFor(actor)`, and initial BP/shield state.

- [ ] **Step 1: Add failing profile and initialization tests**

Use the following imports at the top of the new test file, then append the assertions below:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, makeEnemy, enemyProfileFor } from '../src/game/data';
import { createBattle } from '../src/game/combat';

test('battle initializes BP and shield state without changing saved actors', () => {
  const party = newGame().party;
  const battle = createBattle(party, [makeEnemy('slime', 0)]);

  assert.equal(battle.tactics.kael.bp, 1);
  assert.equal(battle.tactics.ren.bp, 1);
  assert.equal(battle.tactics.mira.bp, 1);
  assert.equal(battle.tactics['slime-0'].shield, 2);
  assert.equal(battle.tactics['slime-0'].maxShield, 2);
  assert.equal(battle.tactics['slime-0'].broken, false);
  assert.equal(makeEnemy('slime', 0).kind, 'slime');
  assert.equal('bp' in party[0], false);
});

test('enemy profiles and Bellkeeper phases match the design', () => {
  assert.deepEqual(enemyProfileFor(makeEnemy('slime', 0)), { weaknesses: ['fire'], shields: 2 });
  assert.deepEqual(enemyProfileFor(makeEnemy('wolf', 0)), { weaknesses: ['physical'], shields: 3 });
  assert.deepEqual(enemyProfileFor(makeEnemy('wraith', 0)), { weaknesses: ['spirit'], shields: 3 });
  const boss = makeEnemy('boss', 0);
  assert.deepEqual(enemyProfileFor(boss), { weaknesses: ['physical'], shields: 4, phase: 1 });
  boss.hp = 429; // Exactly 66% of the existing 650 HP stays in phase I.
  assert.equal(enemyProfileFor(boss).phase, 1);
  boss.hp = 428;
  assert.deepEqual(enemyProfileFor(boss), { weaknesses: ['fire'], shields: 5, phase: 2 });
  boss.hp = 195; // Exactly 30% stays in phase II.
  assert.equal(enemyProfileFor(boss).phase, 2);
  boss.hp = 194;
  assert.deepEqual(enemyProfileFor(boss), { weaknesses: ['spirit'], shields: 6, phase: 3 });
});
```

- [ ] **Step 2: Run the new test to confirm it fails**

Run: `npx tsx --test tests/tactical-combat.test.ts`
Expected: FAIL because `Battle.tactics`, the profile function, and tactical metadata do not exist.

- [ ] **Step 3: Add shared types and content metadata**

Add the interfaces shown above. In `data.ts`, define Slime as Fire/2 shields, Wolf as Physical/3, Wraith as Spirit/3, and the Bellkeeper phases as Physical/4, Fire/5, and Spirit/6 at the existing `<66%` and `<30%` thresholds. Add `damageType` and `hits` to damaging skills: Kael's Sundering Blow, Ren's Twin Fang and Last Light are Physical; Mira's Spark is Spirit and Emberfall is Fire; Twin Fang has two hits. Keep non-damaging skills without a damage type.

Set the base enemy kind in `makeEnemy` while preserving its unique ID; the battle renderer already uses the ID prefix for enemy textures:

```ts
const enemy = hero(
  `${kind}-${index}`,
  s[0],
  kind === 'boss' ? 'Keeper of the silence' : '',
  s[1],
  0,
  s[2],
  s[3],
  s[4],
  s[5],
);
enemy.kind = kind;
return enemy;
```

Use this content shape so the phase profile comes from one source:

```ts
export const enemyProfiles: Record<string, EnemyProfile> = {
  slime: { weaknesses: ['fire'], shields: 2 },
  wolf: { weaknesses: ['physical'], shields: 3 },
  wraith: { weaknesses: ['spirit'], shields: 3 },
};
export const bellkeeperPhases: Array<{ belowHp: number; profile: EnemyProfile }> = [
  { belowHp: 0.3, profile: { weaknesses: ['spirit'], shields: 6, phase: 3 } },
  { belowHp: 0.66, profile: { weaknesses: ['fire'], shields: 5, phase: 2 } },
  { belowHp: Number.POSITIVE_INFINITY, profile: { weaknesses: ['physical'], shields: 4, phase: 1 } },
];

export function enemyProfileFor(actor: Actor): EnemyProfile {
  if (actor.kind !== 'boss') return enemyProfiles[actor.kind] ?? enemyProfiles.slime;
  const ratio = actor.hp / actor.maxHp;
  return bellkeeperPhases.find((phase) => ratio < phase.belowHp)!.profile;
}
```

Annotate the three profiles with `EnemyProfile` so `weaknesses` is exposed as `DamageType[]`; `bellkeeperPhases` uses the same mutable `EnemyProfile` type. In `createBattle`, initialize each ID once:

```ts
const tactics: Battle['tactics'] = Object.fromEntries([
  ...allies.map((ally) => [ally.id, { bp: 1 }]),
  ...enemies.map((enemy) => {
    const profile = enemyProfileFor(enemy);
    return [enemy.id, {
      shield: profile.shields,
      maxShield: profile.shields,
      broken: false,
      bossPhase: profile.phase,
    }];
  }),
]);
```

In `createBattle`, build a fresh `tactics` record: set each ally to `{ bp: 1 }`; initialize each enemy from `enemyProfileFor` with its current and maximum shield count, `broken: false`, and its current boss phase. Do not add tactical values to `Actor` or `GameData`.

- [ ] **Step 4: Run focused and existing unit tests**

Run: `npx tsx --test tests/tactical-combat.test.ts tests/combat.test.ts tests/edge-cases.test.ts`
Expected: PASS; party save objects retain their existing shape and all four enemy kinds receive a profile.

- [ ] **Step 5: Commit the profile foundation**

```bash
git add src/game/types.ts src/game/data.ts src/game/combat.ts tests/tactical-combat.test.ts
git commit -m 'feat(combat): define tactical battle state'
```

### Task 2: Resolve typed hits, Boost, shields, and Break

**Files:**
- Modify: `src/game/combat.ts`
- Modify: `src/game/data.ts`
- Modify: `tests/tactical-combat.test.ts`
- Modify: `tests/combat.test.ts`

**Interfaces:**
- Consumes: `Battle.tactics`, typed skills, and `enemyProfileFor` from Task 1.
- Produces: `actionPreview(battle, command, targetId, boostLevel?)` and `act(battle, command, targetId?, boostLevel?)` with atomic validation, per-hit events, BP accounting, shield damage, and Break vulnerability.

- [ ] **Step 1: Add failing tests for weakness, per-hit shield damage, and BP**

Extend the existing test imports with `act`, `actionPreview`, and `enemyTurn` from `src/game/combat.ts`.

```ts
test('only a matching damage type removes shield and unboosted actions earn one BP', () => {
  const battle = createBattle(newGame().party, [makeEnemy('slime', 0)]);
  battle.queue = ['mira', 'kael', 'ren', 'slime-0'];
  assert.equal(act(battle, 'attack', 'slime-0'), true); // Mira's Spark is Spirit.
  assert.equal(battle.tactics['slime-0'].shield, 2);
  assert.equal(battle.tactics.mira.bp, 2);

  battle.queue = ['mira', 'kael', 'ren', 'slime-0'];
  assert.equal(act(battle, 'ember', 'slime-0'), true); // Emberfall is Fire.
  assert.equal(battle.tactics['slime-0'].shield, 1);
});

test('BP caps at 3 and a multi-point Boost spends exactly its level', () => {
  const battle = createBattle(newGame().party, [makeEnemy('slime', 0)]);
  battle.tactics.mira.bp = 3;
  battle.queue = ['mira', 'kael', 'ren', 'slime-0'];
  assert.equal(act(battle, 'attack', 'slime-0'), true);
  assert.equal(battle.tactics.mira.bp, 3);
  battle.queue = ['mira', 'kael', 'ren', 'slime-0'];
  assert.equal(act(battle, 'attack', 'slime-0', 2), true);
  assert.equal(battle.tactics.mira.bp, 1);
});

test('Twin Fang applies its two hits and one Boost bonus once per action', () => {
  const battle = createBattle(newGame().party, [makeEnemy('boss', 0)]);
  battle.queue = ['ren', 'kael', 'mira', 'boss-0'];
  const ordinary = structuredClone(battle);
  assert.equal(actionPreview(battle, 'twin', 'boss-0', 1)?.shieldDamage, 3);
  assert.equal(act(ordinary, 'twin', 'boss-0'), true);
  assert.equal(act(battle, 'twin', 'boss-0', 1), true);
  const ordinaryDamage = ordinary.events.reduce((sum, hit) => sum + hit.amount, 0);
  const boostedDamage = battle.events.reduce((sum, hit) => sum + hit.amount, 0);
  assert.ok(boostedDamage > ordinaryDamage);
  assert.ok(boostedDamage < ordinaryDamage * 1.4); // Not boosted once per hit.
  assert.equal(battle.events.length, 2);
  assert.equal(battle.tactics.ren.bp, 0);
  assert.equal(battle.tactics['boss-0'].shield, 1);
  assert.equal(battle.tactics['boss-0'].broken, false);
});
```

- [ ] **Step 2: Add failing tests for invalid Boost and Broken behavior**

```ts
test('invalid Boost does not mutate battle state', () => {
  const battle = createBattle(newGame().party, [makeEnemy('wolf', 0)]);
  battle.queue = ['ren', 'kael', 'mira', 'wolf-0'];
  const before = JSON.stringify(battle);
  assert.equal(act(battle, 'twin', 'wolf-0', 2), false); // Ren has 1 BP.
  assert.equal(JSON.stringify(battle), before);
  battle.tactics.ren.bp = 3;
  const atCap = JSON.stringify(battle);
  assert.equal(act(battle, 'twin', 'wolf-0', -1), false);
  assert.equal(JSON.stringify(battle), atCap);
  assert.equal(act(battle, 'twin', 'wolf-0', 1.5), false);
  assert.equal(JSON.stringify(battle), atCap);
  assert.equal(act(battle, 'twin', 'wolf-0', 4), false);
  assert.equal(JSON.stringify(battle), atCap);
  assert.equal(act(battle, 'potion', 'kael', 1), false);
  assert.equal(JSON.stringify(battle), atCap);
});

test('Broken targets take extra damage, skip one action, and refill shields', () => {
  const battle = createBattle(newGame().party, [makeEnemy('wolf', 0)]);
  const normal = structuredClone(battle);
  const vulnerable = structuredClone(battle);
  vulnerable.tactics['wolf-0'].broken = true;
  vulnerable.tactics['wolf-0'].shield = 0;
  normal.queue = vulnerable.queue = ['kael', 'ren', 'mira', 'wolf-0'];
  act(normal, 'attack', 'wolf-0');
  act(vulnerable, 'attack', 'wolf-0');
  assert.ok(normal.enemies[0].hp - vulnerable.enemies[0].hp > 0);

  battle.queue = ['wolf-0', 'kael', 'ren', 'mira'];
  battle.tactics['wolf-0'].broken = true;
  battle.tactics['wolf-0'].shield = 0;
  const allyHp = battle.allies.map((ally) => ally.hp);
  assert.equal(enemyTurn(battle), true);
  assert.deepEqual(battle.allies.map((ally) => ally.hp), allyHp);
  assert.equal(battle.tactics['wolf-0'].broken, false);
  assert.equal(battle.tactics['wolf-0'].shield, battle.tactics['wolf-0'].maxShield);
});
```

- [ ] **Step 3: Implement typed damage and tactical previews**

Resolve the active ally's attack profile from the skill; map basic `attack` to Physical for Kael/Ren and Spirit for Mira. Resolve Twin Fang as two `.8` potency hits and emit one `Hit` event per hit. To preserve the current action's total damage despite the extra defense calculation that separate hits could introduce, calculate the action's damage once and distribute its integer total across the hit events. Apply Resonance/Overdrive using the existing rules. Implement `actionPreview` from the same profile and shield math used by `act`; preview the base hit count plus one extra shield pip per BP spent when at least one hit matches a weakness. Cap `shieldDamage` to the current shield count; report zero shield damage for a non-weak action or an already Broken enemy.

Use one attack-profile helper so the preview and resolver agree:

```ts
function attackProfile(actor: Actor, command: string) {
  const skill = (skills[actor.id] ?? []).find((entry) => entry.id === command);
  if (skill?.damageType) {
    return { damageType: skill.damageType, hits: skill.hits ?? 1, multiplier: skill.multiplier ?? 1 };
  }
  if (command === 'attack') {
    return { damageType: actor.id === 'mira' ? 'spirit' as const : 'physical' as const, hits: 1, multiplier: 1 };
  }
  return null;
}
```

Validate the actor, living target, side, skill cost, and Boost level before changing resources, statuses, events, BP, HP, or queue. A Boost level must be an integer from 0 to 3, cannot exceed the acting ally's BP, and must be zero for non-damage actions. On a successful unboosted ally action, add one BP capped at 3. A boosted damage action spends exactly its selected BP and applies `1 + 0.25 * boostLevel` to the action's total damage; it earns no BP.

Validate before the first mutation, then resolve hit events from that validated profile:

```ts
const profile = attackProfile(actor, command);
const bp = battle.tactics[actor.id]?.bp ?? 0;
if (!Number.isInteger(boostLevel) || boostLevel < 0 || boostLevel > 3) return false;
if (boostLevel > bp || (!profile && boostLevel !== 0)) return false;
if (profile && !battle.enemies.includes(target)) return false;

if (profile) {
  const boostMultiplier = 1 + 0.25 * boostLevel;
  const brokenMultiplier = battle.enemies.includes(target) && battle.tactics[target.id]?.broken
    ? 1.5
    : 1;
  const total = Math.round(damage(actor, target, profile.multiplier) * boostMultiplier * brokenMultiplier);
  const hits = Array.from({ length: profile.hits }, (_, index) =>
    Math.floor(total / profile.hits) + (index < total % profile.hits ? 1 : 0),
  );
  for (const amount of hits) {
    target.hp = Math.max(0, target.hp - amount);
    battle.events.push({ target: target.id, amount });
  }
}
```

- [ ] **Step 4: Implement shield depletion and Break resolution**

On each matching damage hit, remove one shield pip. After all ordinary hits, remove one additional pip per BP if the action matched a weakness, capped by the remaining shield. At zero, mark the enemy Broken. Apply the 1.5 damage multiplier only to later direct hits while Broken. Do not apply the vulnerability multiplier to the hit that caused Break. If a Bellkeeper phase changes during the same action, process the phase transition after that action's old-phase hits and let the new phase refill its shield and clear Broken.

Keep shield removal capped and prevent extra shield damage while already Broken:

```ts
const state = battle.tactics[target.id];
if (!state.broken && profile && profile.damageType) {
  const weak = enemyProfileFor(target).weaknesses.includes(profile.damageType);
  if (weak) {
    const normalPips = profile.hits;
    state.shield = Math.max(0, (state.shield ?? 0) - normalPips - boostLevel);
    if (state.shield === 0) state.broken = true;
  }
}
```

For the Bellkeeper, compare its saved `bossPhase` with `enemyProfileFor(target).phase` after resolving HP and the old-phase shield hits. A changed phase replaces the shield with the new `maxShield`, updates `bossPhase`, and clears `broken`; otherwise a shield reaching zero sets `broken`.

- [ ] **Step 5: Run the focused combat suite and fix failures**

Run: `npx tsx --test tests/tactical-combat.test.ts tests/combat.test.ts tests/edge-cases.test.ts`
Expected: PASS, including invalid-command immutability, ordinary attacks, MP, healing, guard, death, and victory behavior.

- [ ] **Step 6: Commit the typed combat rules**

```bash
git add src/game/combat.ts src/game/data.ts tests/tactical-combat.test.ts tests/combat.test.ts
git commit -m 'feat(combat): add weakness boost and break'
```

### Task 3: Forecast and execute enemy intent from one result

**Files:**
- Modify: `src/game/combat.ts`
- Modify: `tests/tactical-combat.test.ts`
- Modify: `tests/edge-cases.test.ts`

**Interfaces:**
- Consumes: `EnemyProfile`, battle tactical state, and typed hit resolution from Tasks 1–2.
- Produces: `enemyIntent(battle, enemyId)` and an `enemyTurn` that executes that exact returned action and targets.

- [ ] **Step 1: Add failing forecast/execution tests**

Extend the `tests/tactical-combat.test.ts` import with `enemyIntent`. Put the forecast/phase tests there; put the taunt owner-death and expiry tests in `tests/edge-cases.test.ts`, extending its existing combat import with `enemyIntent` (it already imports `act` and `enemyTurn`).

```ts
test('intent and execution agree for taunt, wolves, wraiths, and Bellkeeper area rounds', () => {
  const battle = createBattle(newGame().party, [makeEnemy('wolf', 0)]);
  battle.queue = ['wolf-0', 'kael', 'ren', 'mira'];
  battle.allies[0].statuses.push({ kind: 'taunt', turns: 2 });
  const intent = enemyIntent(battle, 'wolf-0');
  assert.deepEqual(intent?.targetIds, ['kael']);
  const before = battle.allies.map((ally) => ally.hp);
  enemyTurn(battle);
  assert.ok(battle.allies[0].hp < before[0]);
  assert.equal(battle.allies[1].hp, before[1]);
  assert.equal(battle.allies[2].hp, before[2]);

  const slimeBattle = createBattle(newGame().party, [makeEnemy('slime', 0)]);
  slimeBattle.round = 3;
  slimeBattle.queue = ['slime-0', 'kael', 'ren', 'mira'];
  assert.equal(enemyIntent(slimeBattle, 'slime-0')?.kind, 'brace');
  const partyHp = slimeBattle.allies.map((ally) => ally.hp);
  enemyTurn(slimeBattle);
  assert.deepEqual(slimeBattle.allies.map((ally) => ally.hp), partyHp);
  assert.equal(slimeBattle.enemies[0].guard, true);

  const wraithBattle = createBattle(newGame().party, [makeEnemy('wraith', 0)]);
  wraithBattle.queue = ['wraith-0', 'kael', 'ren', 'mira'];
  const wraithIntent = enemyIntent(wraithBattle, 'wraith-0');
  assert.equal(wraithIntent?.kind, 'attack');
  if (wraithIntent?.kind === 'attack') assert.equal(wraithIntent.weakenTarget, true);

  const bossBattle = createBattle(newGame().party, [makeEnemy('boss', 0)]);
  bossBattle.enemies[0].hp = 350;
  bossBattle.round = 2;
  bossBattle.queue = ['boss-0', 'kael', 'ren', 'mira'];
  assert.deepEqual(enemyIntent(bossBattle, 'boss-0')?.targetIds, ['kael', 'ren', 'mira']);

  const phaseOne = createBattle(newGame().party, [makeEnemy('boss', 0)]);
  phaseOne.round = 2;
  assert.equal(enemyIntent(phaseOne, 'boss-0')?.name, 'Bell Strike');
  assert.equal(enemyIntent(phaseOne, 'boss-0')?.targetIds.length, 1);

  const lastToll = createBattle(newGame().party, [makeEnemy('boss', 0)]);
  lastToll.enemies[0].hp = 150;
  lastToll.round = 2;
  const lastTollIntent = enemyIntent(lastToll, 'boss-0');
  assert.equal(lastTollIntent?.name, 'Last Toll');
  if (lastTollIntent?.kind === 'attack') assert.equal(lastTollIntent.multiplier, 1.4);
});

test('a failed taunt target is not forecast or hit after the owner falls', () => {
  const battle = createBattle(newGame().party, [makeEnemy('wolf', 0)]);
  battle.allies[0].statuses.push({ kind: 'taunt', turns: 2 });
  battle.allies[0].hp = 0;
  battle.queue = ['wolf-0', 'ren', 'mira'];
  const intent = enemyIntent(battle, 'wolf-0');
  assert.deepEqual(intent?.targetIds, ['ren']);
  const before = battle.allies.map((ally) => ally.hp);
  enemyTurn(battle);
  assert.ok(battle.allies[1].hp < before[1]);
});

test('a taunt that expires before a Wolf acts is not forecast or executed', () => {
  const battle = createBattle(newGame().party, [makeEnemy('wolf', 0)]);
  battle.allies[0].statuses.push({ kind: 'taunt', turns: 1 });
  battle.queue = ['kael', 'wolf-0', 'ren', 'mira'];
  act(battle, 'attack', 'wolf-0');
  const intent = enemyIntent(battle, 'wolf-0');
  assert.deepEqual(intent?.targetIds, ['ren']);
  const before = battle.allies.map((ally) => ally.hp);
  enemyTurn(battle);
  assert.equal(battle.allies[0].hp, before[0]);
  assert.ok(battle.allies[1].hp < before[1]);
});
```

- [ ] **Step 2: Add failing phase-change and skip tests**

```ts
test('a Bellkeeper phase change refreshes shields and does not retain Break', () => {
  const boss = makeEnemy('boss', 0);
  const battle = createBattle(newGame().party, [boss]);
  battle.tactics[boss.id].shield = 1;
  battle.queue = ['kael', 'ren', 'mira', boss.id];
  boss.hp = Math.ceil(boss.maxHp * 0.66) + 10;
  act(battle, 'breaker', boss.id);
  assert.deepEqual(enemyProfileFor(boss).weaknesses, ['fire']);
  assert.equal(battle.tactics[boss.id].shield, 5);
  assert.equal(battle.tactics[boss.id].broken, false);
});

test('Broken intent forecasts the skipped enemy turn and refresh', () => {
  const battle = createBattle(newGame().party, [makeEnemy('wolf', 0)]);
  battle.tactics['wolf-0'].broken = true;
  battle.tactics['wolf-0'].shield = 0;
  battle.queue = ['wolf-0', 'kael', 'ren', 'mira'];
  assert.equal(enemyIntent(battle, 'wolf-0')?.kind, 'skip');
  enemyTurn(battle);
  assert.equal(battle.tactics['wolf-0'].broken, false);
  assert.equal(battle.tactics['wolf-0'].shield, 3);
});
```

- [ ] **Step 3: Implement `enemyIntent` as the only target/action selector**

Return `brace` for Slime's current third-round defensive action, `skip` for a Broken enemy, and otherwise return an attack intent with its label, living target IDs, multiplier, area flag, and optional Weakened effect. Preserve Wolf's lowest-HP choice; preserve the existing deterministic target rule for other single-target enemies; let Taunt override single-target moves; never let Taunt redirect area damage. For the Bellkeeper use the existing `<66%`, `<30%`, and even-round area cadence.

Build the intent once from the active battle state; all returned target IDs must be living actors:

```ts
export function enemyIntent(battle: Battle, enemyId: string): EnemyIntent | null {
  const enemy = battle.enemies.find((entry) => entry.id === enemyId && entry.hp > 0);
  if (!enemy) return null;
  const state = battle.tactics[enemy.id];
  if (state?.broken) return { kind: 'skip', name: 'Broken', targetIds: [] };
  if (enemy.kind === 'slime' && battle.round % 3 === 0) {
    return { kind: 'brace', name: 'Brace', targetIds: [] };
  }

  const living = battle.allies.filter((ally) => ally.hp > 0);
  if (!living.length) return null;
  const taunt = living.find((ally) => ally.statuses.some((status) => status.kind === 'taunt'));
  const bossProfile = enemy.kind === 'boss' ? enemyProfileFor(enemy) : null;
  if (bossProfile && bossProfile.phase !== 1 && battle.round % 2 === 0) {
    return {
      kind: 'attack',
      name: bossProfile.phase === 3 ? 'Last Toll' : 'Hollow Peal',
      targetIds: living.map((ally) => ally.id),
      multiplier: bossProfile.phase === 3 ? 1.4 : 1,
      area: true,
    };
  }

  const target = taunt ?? (enemy.kind === 'wolf'
    ? [...living].sort((a, b) => a.hp - b.hp)[0]
    : living[(battle.round + enemy.speed) % living.length]);
  return {
    kind: 'attack',
    name: enemy.kind === 'wraith'
      ? 'Cold Grasp'
      : enemy.kind === 'boss'
        ? 'Bell Strike'
        : enemy.kind === 'wolf'
          ? 'Rending Bite'
          : 'Dew Drop',
    targetIds: [target.id],
    multiplier: 1,
    area: false,
    weakenTarget: enemy.kind === 'wraith',
  };
}
```

- [ ] **Step 4: Make `enemyTurn` execute the forecast and synchronize boss phases**

Have `enemyTurn` call `enemyIntent` once. Resolve the exact target IDs in that value; do not run AI target selection again. Apply Wraith's Weakened effect from the returned intent. For Broken, skip exactly the active enemy action, restore its phase's maximum shield, clear Broken, log the recovery, and call the normal queue/terminal-state finisher. After any Bellkeeper HP change, compare the stored `bossPhase` with the new profile; on change, set the new phase, refill shield, and clear Broken.

The resolver should branch on the returned intent instead of repeating the forecast conditions:

```ts
const intent = enemyIntent(battle, enemy.id);
if (!intent) return false;
if (intent.kind !== 'skip') {
  enemy.guard = false;
  enemy.statuses = enemy.statuses
    .map((status) => ({ ...status, turns: status.turns - 1 }))
    .filter((status) => status.turns > 0);
}
if (intent.kind === 'skip') {
  battle.events = [];
  const profile = enemyProfileFor(enemy);
  battle.tactics[enemy.id] = {
    ...battle.tactics[enemy.id],
    shield: profile.shields,
    maxShield: profile.shields,
    broken: false,
    bossPhase: profile.phase,
  };
  battle.log = `${enemy.name} recovers its shield.`;
  finishTurn(battle);
  return true;
}
if (intent.kind === 'brace') {
  enemy.guard = true;
  battle.events = [];
  battle.log = `${enemy.name} braces.`;
  finishTurn(battle);
  return true;
}

battle.events = [];
for (const targetId of intent.targetIds) {
  const target = battle.allies.find((ally) => ally.id === targetId && ally.hp > 0);
  if (!target) continue;
  const amount = damage(enemy, target, intent.multiplier);
  target.hp = Math.max(0, target.hp - amount);
  battle.events.push({ target: target.id, amount });
  if (intent.weakenTarget && target.hp > 0) {
    target.statuses = target.statuses.filter((status) => status.kind !== 'break');
    target.statuses.push({ kind: 'break', turns: 2 });
  }
}
battle.log = `${enemy.name} uses ${intent.name}.`;
finishTurn(battle);
return true;
```

The completed function resets the turn queue exactly once for each branch. Task 4 replaces the temporary legacy `break` status spelling in the Wraith branch with `weakened`.

- [ ] **Step 5: Run combat and edge-case tests**

Run: `npx tsx --test tests/tactical-combat.test.ts tests/combat.test.ts tests/edge-cases.test.ts`
Expected: PASS for intent/attack agreement, area cadence, taunt and dead-target fallback, phase boundaries, Broken skips, defeat, victory, and queue cleanup.

- [ ] **Step 6: Commit intent forecasting**

```bash
git add src/game/combat.ts tests/tactical-combat.test.ts tests/edge-cases.test.ts
git commit -m 'feat(combat): forecast enemy intent'
```

### Task 4: Rename the defense-down status and preserve old saves

**Files:**
- Modify: `src/game/types.ts`
- Modify: `src/game/combat.ts`
- Modify: `src/game/save.ts`
- Modify: `tests/edge-cases.test.ts`
- Modify: `tests/tactical-combat.test.ts`

**Interfaces:**
- Consumes: shield-based Broken state and intent logs from Tasks 1–3.
- Produces: `weakened` as the defense-down status and version-1 save normalization from `break` to `weakened`.

- [ ] **Step 1: Add failing legacy-save normalization tests**

Extend `tests/edge-cases.test.ts` imports with `decodeSave` from `src/game/save.ts`. Add the Wraith status regression to `tests/tactical-combat.test.ts`:

Place the first two tests in `tests/edge-cases.test.ts`; place the Wraith test in `tests/tactical-combat.test.ts`.

```ts
test('version-1 saves normalize legacy break to weakened', () => {
  const save = newGame();
  save.party[0].statuses = [{ kind: 'break', turns: 2 } as never];
  const loaded = decodeSave(JSON.stringify({ version: 1, data: save }));
  assert.equal(loaded?.party[0].statuses[0].kind, 'weakened');
});

test('save validation still rejects unknown statuses and zero durations', () => {
  const save = newGame();
  save.party[0].statuses = [{ kind: 'not-a-status', turns: 1 } as never];
  assert.equal(decodeSave(JSON.stringify({ version: 1, data: save })), null);
  save.party[0].statuses = [{ kind: 'break', turns: 0 } as never];
  assert.equal(decodeSave(JSON.stringify({ version: 1, data: save })), null);
});

test('Wraith intent applies Weakened to the forecast target', () => {
  const battle = createBattle(newGame().party, [makeEnemy('wraith', 0)]);
  battle.queue = ['wraith-0', 'kael', 'ren', 'mira'];
  const targetId = enemyIntent(battle, 'wraith-0')?.targetIds[0];
  assert.ok(targetId);
  enemyTurn(battle);
  assert.ok(battle.allies.find((ally) => ally.id === targetId)!.statuses.some((status) => status.kind === 'weakened'));
});
```

- [ ] **Step 2: Run the save tests and confirm normalization fails**

Run: `npx tsx --test tests/edge-cases.test.ts tests/tactical-combat.test.ts`
Expected: FAIL because `break` is not normalized, `weakened` is not yet a status kind, and Wraith still applies the legacy status name.

- [ ] **Step 3: Rename the defense-down status in combat**

Replace status checks and applications used for reduced defense with `weakened`: Kael's Sundering Blow applies it to the enemy; Wraith's Cold Grasp applies it to a surviving ally. Update the `Status` union. Keep shield depletion represented only by `Battle.tactics[id].broken`; do not reuse an actor status for it.

- [ ] **Step 4: Normalize and validate saves**

In `decodeSave`, permit the legacy `break` kind during version-1 validation, reject every other unlisted kind and invalid duration, then clone the parsed save and map only legacy `break` statuses to `weakened` before returning it. Continue saving version 1 and keep BP/shield fields out of `GameData`.

Normalize only after the full version-1 shape and every status have passed validation:

```ts
import type { GameData, Status } from './types';

const allowedStatuses = ['break', 'weakened', 'resonance', 'overdrive', 'taunt'];
if (!a.statuses.every((status: any) =>
  status && allowedStatuses.includes(status.kind) && Number.isInteger(status.turns) && status.turns > 0
)) return null;

const normalized = structuredClone(g) as GameData;
normalized.party = normalized.party.map((actor) => ({
  ...actor,
  statuses: actor.statuses.map((status) => {
    const kind = status.kind as string;
    return { ...status, kind: (kind === 'break' ? 'weakened' : kind) as Status['kind'] };
  }),
}));
return normalized;
```

- [ ] **Step 5: Run save, combat, and type checks**

Run: `npx tsx --test tests/edge-cases.test.ts tests/tactical-combat.test.ts tests/combat.test.ts && npm run build`
Expected: PASS with legacy saves accepted, normalized saves returned, and unrelated status behavior preserved.

- [ ] **Step 6: Commit save compatibility**

```bash
git add src/game/types.ts src/game/combat.ts src/game/save.ts tests/edge-cases.test.ts tests/tactical-combat.test.ts
git commit -m 'fix(save): normalize legacy combat status'
```

### Task 5: Present tactical choices and intent in battle UI

**Files:**
- Modify: `src/game/controller.ts`
- Modify: `src/ui/styles.css`

**Interfaces:**
- Consumes: `Battle.tactics`, `actionPreview`, `enemyIntent`, and `enemyProfileFor` from Tasks 1–4.
- Produces: target cards with readable weakness/shield/intent labels; party cards with BP; selectable Boost level passed into `act`.

- [ ] **Step 1: Track the selected Boost level in the controller**

Add a `selectedBoost = 0` controller field. Reset it when battle starts, when the player chooses a different command, after a turn resolves, and when targeting is cancelled. Add a `boost` action that accepts only an integer 0–3 not exceeding the active ally's current BP. Pass `selectedBoost` to `act` in `target()`; keep support commands at zero.

Keep the choice separate from the selected command and validate it before changing controller state:

```ts
private selectedBoost = 0;

private selectBoost(value: string) {
  const level = Number(value);
  const actor = this.battle && activeActor(this.battle);
  const available = actor ? this.battle!.tactics[actor.id]?.bp ?? 0 : 0;
  if (!Number.isInteger(level) || level < 0 || level > 3 || level > available) return;
  this.selectedBoost = level;
  this.render();
}

// In action():
case 'boost': this.selectBoost(value); break;
// In target():
if (act(this.battle, command, id, this.selectedBoost)) this.animateTurn(actor.id, command);
```

- [ ] **Step 2: Render enemy profiles and next intent**

In `battleUI()`, derive each enemy's profile and call `enemyIntent(b, enemy.id)`. Show readable text for `WEAK TO: ...`, `SHIELD: current / max`, and the intent's move plus target names (`Party`, `Brace`, or `Broken · turn skipped`). Add `aria-label` text to shield and intent elements. Add `data-weakness-match="true|false"` and `data-shield-damage` to each enemy target button from `actionPreview`; browser automation will read these rendered values. Do not derive targets separately in controller code.

Render the forecast and tactical profile from the shared helpers:

```ts
const state = b.tactics[enemy.id] ?? {};
const profile = enemyProfileFor(enemy);
const intent = enemyIntent(b, enemy.id);
const intentTarget = intent?.targetIds.map((id) => all.find((actor) => actor.id === id)?.name).join(', ');
const intentLabel = !intent
  ? 'No intent'
  : intent.kind === 'skip'
    ? 'Broken · turn skipped'
    : intent.kind === 'brace'
      ? 'Brace'
      : `${intent.name} → ${intent.area ? 'Party' : intentTarget || 'No target'}`;
const tacticalLabel = `${enemy.name}. Weak to ${profile.weaknesses.join(', ')}. Shield ${state.shield ?? 0} of ${state.maxShield ?? profile.shields}. ${intentLabel}`;
```

Place `tacticalLabel` in the enemy button as visible text and as its `aria-label`; use the forecast only for presentation, leaving damage resolution in `combat.ts`.

- [ ] **Step 3: Render Boost controls and damage previews**

When a selected command has a `damageType`, render Normal plus affordable Boost levels. For each enemy target use `actionPreview` to show damage type, hit count, weakness match, shield pips removed, and whether the action will Break it. Mark the focused/selected Boost level visually and with `aria-pressed`; render non-weak matches with text as well as color. Add a `0–3` BP meter to every party card.

Render only levels the actor can pay for, keeping the default at Normal:

```ts
const availableBp = b.tactics[activeActor(b)!.id]?.bp ?? 0;
const levels = [0, 1, 2, 3].filter((level) => level === 0 || level <= availableBp);
const boostOptions = levels.map((level) =>
  `<button class="boost-option" data-action="boost" data-value="${level}" aria-pressed="${this.selectedBoost === level}">${level === 0 ? 'Normal' : `Boost ${level}`}</button>`,
).join('');
const preview = actionPreview(b, this.selected, enemy.id, this.selectedBoost);
const weaknessLabel = preview?.weakness ? 'WEAKNESS' : preview ? 'No weakness' : '';
const previewLabel = preview
  ? `${preview.damageType} · ${preview.hitCount} hit${preview.hitCount === 1 ? '' : 's'} · ${weaknessLabel} · ${preview.shieldDamage} shield`
  : '';
const bpLabel = (ally: Actor) => `BP ${b.tactics[ally.id]?.bp ?? 0} / 3`;
```

Put `previewLabel` inside the corresponding enemy target button, include `tacticalLabel` as visible text and in an `aria-label` that names the enemy, and put `bpLabel(ally)` in each party card. Escape label text with the existing `esc(...)` helper. Include `aria-pressed="true"` on the selected Boost button.

- [ ] **Step 4: Add responsive styling without replacing existing layout**

Add focused selectors for `.tactical-profile`, `.enemy-intent`, `.shield-pips`, `.boost-options`, `.boost-option[aria-pressed="true"]`, and `.bp-meter`. Keep labels legible over the 2.5D scene, wrap intent text on narrow screens, preserve visible keyboard focus, and keep target/Boost buttons at least 44 CSS pixels high under the existing `max-width:540px` rules.

Add only tactical selectors and responsive overrides:

```css
.tactical-profile,.enemy-intent{font-size:9px;line-height:1.45;color:#d9dfcf}
.shield-pips{letter-spacing:2px;color:#e6c88c}
.boost-options{display:flex;gap:6px;flex-wrap:wrap}
.boost-option{min-height:36px;padding:7px 10px;border:1px solid #86977a55}
.boost-option[aria-pressed="true"]{border-color:var(--gold);color:var(--gold)}
.bp-meter{color:#d9c58c;font-size:8px;letter-spacing:1px}
@media(max-width:540px){.enemy-intent{max-width:180px;overflow-wrap:anywhere}.boost-option,.enemy-target{min-height:44px}}
```

- [ ] **Step 5: Run build and unit tests**

Run: `npm test && npm run build`
Expected: PASS with no UI imports added to the pure combat module and no TypeScript errors in preview/intent rendering.

- [ ] **Step 6: Commit the battle interface**

```bash
git add src/game/controller.ts src/ui/styles.css tests/tactical-combat.test.ts
git commit -m 'feat(ui): show tactical battle choices'
```

### Task 6: Verify the journey and update player/developer guidance

**Files:**
- Modify: `scripts/smoke.mjs`
- Modify: `scripts/browser-edges.mjs`
- Modify: `docs/GAME_DESIGN.md`
- Modify: `docs/TECHNICAL_DESIGN.md`
- Modify: `docs/QA_CHECKLIST.md`

**Interfaces:**
- Consumes: finished battle rules and UI from Tasks 1–5.
- Produces: repeatable desktop/full-journey and mobile tactical-battle QA, plus documentation matching the shipped behavior.

- [ ] **Step 1: Teach the full-journey script to make a tactical move**

Update the smoke battle helper to prefer one matching weakness when affordable: Mira uses Emberfall against Slimes, Ren uses Twin Fang against Wolves, and Mira uses Spark against Wraiths. After selecting a damaging action, read the target button's `data-weakness-match` attribute; choose Boost 1 only when it is `true` and the active ally has BP, otherwise use Normal. Keep the potion threshold and existing victory/action bounds, increasing the 160-action bound only if the new measured damage math requires it.

Use the button preview so the smoke script tests the same type match shown to the player:

```js
const targetButton = page.locator(`[data-action="target"][data-value="${target.id}"]`);
const matchesWeakness = (await targetButton.getAttribute('data-weakness-match')) === 'true';
const bp = s.battle.tactics[actor.id]?.bp ?? 0;
if (matchesWeakness && bp > 0) {
  await page.locator('[data-action="boost"][data-value="1"]').click();
}
await targetButton.click();
```

- [ ] **Step 2: Add mobile/desktop intent and reload assertions**

In `scripts/browser-edges.mjs`, after entering battle at 390×844 and 1280×720, assert the intent, weakness, shield, and BP labels are visible, no horizontal overflow exists, and at least one Boost option can be keyboard-focused and activated when BP permits. Reload mid-battle and verify the app returns to the local pre-encounter world checkpoint with no battle/tactical state restored.

Use the existing page and state helpers for assertions:

```js
assert.equal(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
assert.match(await p.locator('.enemy-intent').first().innerText(), /→|Brace|Broken/);
assert.match(await p.locator('.tactical-profile').first().innerText(), /WEAK TO/i);
assert.match(await p.locator('.shield-pips').first().getAttribute('aria-label'), /shield/i);
assert.match(await p.locator('.bp-meter').first().innerText(), /[0-3] \/ 3/);

await p.locator('[data-action="command"][data-value="attack"]').click();
const boostOne = p.locator('[data-action="boost"][data-value="1"]');
await boostOne.focus();
await p.keyboard.press('Enter');
assert.equal(await boostOne.getAttribute('aria-pressed'), 'true');

await p.reload();
await p.locator('[data-action="continue"]').click();
await p.waitForTimeout(300);
assert.equal((await state()).mode, 'world');
assert.equal((await state()).battle, undefined);
await p.setViewportSize({ width: 1280, height: 720 });
await p.locator('[data-action="interact"]').first().click();
await p.waitForTimeout(500);
assert.equal((await state()).mode, 'battle');
assert.equal(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
assert.ok(await p.locator('.enemy-intent').count());
```

- [ ] **Step 3: Update game and technical documentation**

Document the three damage types, shield Break window, Boost cap/earn/spend rule, and Bellkeeper's phase-specific weakness in `docs/GAME_DESIGN.md`. Document `Battle.tactics`, the shared `enemyIntent` function, and save normalization in `docs/TECHNICAL_DESIGN.md`. Add weakness/intent, mobile layout, legacy-save, and reload checks to `docs/QA_CHECKLIST.md`.

- [ ] **Step 4: Run all unit, build, and browser verification**

Run: `npm test && npm run build`
Run with the local Vite preview available at `http://localhost:5173/`: `node scripts/browser-edges.mjs && node scripts/smoke.mjs`
Expected: PASS; the complete route reaches the ending, no console/page errors occur, and mobile/desktop intent and Boost controls remain usable.

- [ ] **Step 5: Inspect the final diff for local-only scope and regressions**

Run: `git diff --check && git status --short`
Confirm no dependencies, external services, persistent battle fields, or generated QA screenshots are added to the implementation commit.

- [ ] **Step 6: Commit QA and documentation**

```bash
git add scripts/smoke.mjs scripts/browser-edges.mjs docs/GAME_DESIGN.md docs/TECHNICAL_DESIGN.md docs/QA_CHECKLIST.md
git commit -m 'test(combat): verify tactical chapter flow'
```
