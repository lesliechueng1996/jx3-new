# Guess Idiom (猜成语)

Helper for the Jianxia 3 four-character idiom minigame. You transcribe each guess and the colored feedback from the game; the tool searches the local idiom corpus for answers that fit every round.

This document is the source of truth for matching rules. Implementation lives in `apps/api/src/domain/model/idiom/` and the UI at `/game-assist/guess-idiom`.

## Workflow

1. Enter exactly four Han characters (成语).
2. The server splits each character into pinyin parts. If the phrase is already in the corpus, those stored parts are used (`词库`); otherwise pinyin is generated (`自动拼音`).
3. Click each part to cycle color: **black → orange → green → black**, matching the screenshot.
4. Click **检索成语**. Candidates must satisfy every round at once.
5. Repeat with a new guess. Maximum **15** rounds.

Starter probes offered in the UI: `漏网之鱼`, `卧薪尝胆`.

Admins can add a missing idiom to the corpus from the same page.

## Cell anatomy

Each of the four positions is one cell. A cell has five independently colored parts:

| Part | UI label | Example (`胆` `dan3`) |
|------|----------|------------------------|
| Glyph | the Han character | `胆` |
| Initial | 声母 | `d` |
| Final | 韵母 | `an` |
| Tone | 声调 | `3` |
| Syllable link | the bar between initial and final (拼音链接) | binds 声母+韵母 as one unit |

Zero-initial syllables (零声母) show initial as `∅` (empty string), e.g. `鹅` `e2`, `耳` `er3`, `一` `yi1`.

Color in the UI:

- **Green** (`text-emerald-600`): correct here.
- **Orange** (`text-orange-500`): present elsewhere, not here. The source game’s yellow maps to orange.
- **Black** (muted gray): no leftover copies after greens and oranges are consumed. The source game’s gray/black maps to this.

Default for every part is **black**.

## Core matching: Wordle-style counts

Black does **not** mean “this value is absent from the whole answer”. It means “after greens and oranges take their copies, none of this value remain”.

For each dimension (glyph, initial, final, tone, syllable pair), one round is checked as follows:

1. **Green**: the answer at this position must equal the guessed value. Consume one copy.
2. **Char-green lock** (phonetic dimensions only): if the *glyph* at a position is green, that answer slot’s phonetic is consumed even though phonetic colors on that cell are ignored. See [Green glyph](#green-glyph).
3. **Orange**: the answer at this position must *not* equal the guessed value, and at least one copy must still remain elsewhere. Consume one copy.
4. **Black**: after the steps above, the remaining multiset must not contain this value.

Greens are consumed before oranges; oranges before blacks. Duplicates in one round are therefore ordered:

- Guess two copies of tone `2`, answer has one: first is orange, second is black. That is consistent with an answer that has exactly one `2`.
- Guess two copies, both orange: the answer must have at least two remaining copies in other positions.

Each round is validated **independently** against a candidate. A candidate must pass every round. There is no merged “global remaining count” across rounds; greens from other rounds still apply via [green locks](#green-locks).

## Color meanings by part

### Glyph (汉字)

- **Green**: this character sits at this position. Locks the slot (see [Green glyph](#green-glyph)).
- **Orange**: this character appears in the answer, but not at this position.
- **Black**: after greens/oranges, no extra copies of this character remain.

### Initial / final / tone (声母 / 韵母 / 声调)

Same Wordle accounting as glyphs, except:

- Cells whose **glyph is green** are skipped for phonetic matching. Their phonetic colors are not constraints.
- Char-green positions still consume the *answer’s* phonetic at that slot before orange/black on other cells.

### Syllable link (拼音链接)

The link is a constraint on the pair `(initial, final)`, not on tone.

- **Green**: this position’s answer has the same initial+final as the guess, but a **different glyph**. (If the glyph were also correct, mark the glyph green; char-green cells are excluded from link matching.)
- **Orange / black**: Wordle accounting on the `(initial, final)` pair, after consuming char-green slots.

If **both** initial and final on a cell are green, the link is treated as green even if the bar was left at default black. A leftover black bar must not contradict “this syllable sits here”.

## Green glyph

When the glyph is green:

- That character is locked at that position.
- Phonetic colors and the syllable link on **that cell** are ignored. They describe the guessed reading of a glyph that is already known to be correct, not extra answer constraints.
- For other cells in the same round, the locked slot still occupies one copy of whatever initial/final/tone/syllable the *answer* has there. Orange/black on the rest of the round cannot reuse that copy.

SQL prefilter follows the same idea: a black phonetic `NOT EXISTS` ignores positions that already have a char-green lock.

## Green locks

All green marks across all rounds are collected as position locks:

- Green glyph → lock `(position, char)`
- Otherwise, green initial / final / tone → lock that field at that position

If two greens lock the same field at the same position to **different** values, the search returns zero results (`约束互相矛盾，请检查绿色标注是否冲突`).

Locks are applied to the whole candidate set before per-round Wordle matching.

## Zero-initial (`∅`)

The source game usually has **no 声母 tile** for zero-initial characters (`鹅`, `耳`, `爱`, …). In this UI the empty initial is still shown as `∅`, and the default color is black.

**A black empty initial or empty final is ignored.** It must not mean “the answer has no zero-initial characters”. Leaving `∅` at default black is the expected transcription when the screenshot has no 声母 to color.

Green or orange on `∅` is still honored: the user clicked it on purpose.

- Green `∅`: this position is zero-initial.
- Orange `∅`: a zero-initial exists in another position.

This is why `鹅行鸭步` with default-black `∅` on `鹅` must **not** exclude `震耳欲聋` (`耳` is also zero-initial). Treating black `∅` as “no empty initials left” was a real bug.

## SQL prefilter vs in-memory match

Search is two-stage:

1. **SQL prefilter** on four-character phrases, using necessary conditions:
   - Green: that field equals the value at that position.
   - Orange: the value exists at some *other* position.
   - Black: the value does not exist (for phonetics: except on char-green positions).
2. **In-memory** Wordle matching on every remaining candidate against every round.

Black SQL is **dropped** when the same field+value is already required by a green or orange anywhere. A `NOT EXISTS` would contradict “it must appear”. Black still means “no extras” in the in-memory pass, not “absent from the answer”.

Empty-string black initials/finals are omitted from SQL as well as from in-memory black checks.

## Pinyin splitting

Parts come from `pinyin-pro` (`toneType: 'num'`). Corpus rows win when the guess already exists.

Typical splits (numeric tone on the syllable, stripped from the final):

| Character | Pinyin | Initial | Final | Tone |
|-----------|--------|---------|-------|------|
| 胆 | `dan3` | `d` | `an` | 3 |
| 鹅 | `e2` | *(empty)* | `e` | 2 |
| 耳 | `er3` | *(empty)* | `er` | 3 |
| 欲 | `yu4` | `y` | `u` | 4 |
| 行 (in 鹅行鸭步) | `xing2` | `x` | `ing` | 2 |
| 震 | `zhen4` | `zh` | `en` | 4 |

`y` + `u` for `yu` is intentional: `步` `bu4` (final `u`) orange-matches `欲` (final `u`).

Auto-pinyin can be wrong for polyphonic characters. Prefer corpus entries, or add/fix the idiom in admin if the split does not match the game.

Tone `0` is allowed in the API schema but generated pinyin requires a non-zero tone.

## Search result

- `total`: how many corpus idioms passed every round (not capped).
- `items`: up to the request `limit` (UI sends 15; API max 50).
- `analysis.isUnique`: exactly one match.
- `analysis.byPosition`: distinct glyphs / initials / finals / tones still possible at each slot (shown when `total > 1`).
- `analysis.suggestedProbes`: up to 5 corpus candidates scored to split remaining glyph options. **Omitted when `total > 30`** (`候选过多，请补充更多绿色或橙色约束后再检索`).
- Empty set: either contradictory greens, or no corpus row matches the colors (`未找到匹配的成语…`).

Clicking a candidate or probe copies it and fills the guess input.

## Limits

| Limit | Value |
|-------|--------|
| Guess length | 4 Han characters |
| Rounds | 1–15 |
| Returned items (UI) | 15 |
| Probe scoring | only if ≤ 30 candidates |
| Suggested probes | up to 5 |

## Worked example: answer `震耳欲聋`

Pinyin: `zhen4 er3 yu4 long2` → `zh/en/4`, `∅/er/3`, `y/u/4`, `l/ong/2`.

### Round 1 — `胆大包天`

- `胆` tone 3 orange, `大` tone 4 orange, everything else black.

Fits: tone 3 is on `耳` (not position 1), tone 4 is on `震`/`欲` (not position 2). No shared glyphs, initials (`d,d,b,t`), or finals (`an,a,ao,ian`).

### Round 2 — `罪魁祸首`

- `罪` tone 4 green, `魁` tone 2 orange, `祸` tone 4 green, `首` tone 3 orange, everything else black.

Fits: positions 1 and 3 are tone 4 (`震`, `欲`). Remaining tones `3` and `2` sit on `耳` and `聋`, not on the orange cells.

### Round 3 — `鹅行鸭步`

- `鹅` tone 2 orange
- `鸭` initial `y` green
- `步` final `u` orange, tone 4 orange
- everything else black, including default `∅` on `鹅`

Fits once black `∅` is ignored: `y` is locked at position 3 (`欲`); `u` and tone `2`/`4` sit elsewhere. `行` also has tone 2, marked black — that is “no *extra* 2 after the orange on `鹅`”, which matches an answer with exactly one tone 2 (`聋`).

If black `∅` were treated as a real initial, `耳` would be rejected (`initial:black-still-present`). That is incorrect for this game.

## Pitfalls

- **Transcribe only what the screenshot colors.** Unmentioned parts stay default black. Do not “fix up” colors from knowledge of the answer.
- **`∅` default black is a no-op.** Click it to orange/green only when the source game actually colored 零声母.
- **Duplicate feedback is a count, not a presence bit.** Orange then black for the same value means “exactly as many copies as the oranges (plus greens), not more”.
- **Green glyph swallows that cell’s pinyin colors.** Do not also encode 声母/韵母/声调 on a green character; they are ignored.
- **Green initial+final already implies a green link.** You do not have to paint the bar.
- **Green link requires a different glyph** at that position with the same reading.
- **Conflicting greens** (same slot, different value) yield zero results. Check the screenshot.
- **Auto-pinyin vs 词库.** A 词库 badge means the split is stored data; 自动拼音 can disagree with the game for 多音字.
- **Missing answer.** If colors look right but the list is empty, the target idiom may not be in the corpus — add it (admin) and search again.
- **Black + orange/green of the same value** is valid Wordle (extras vs required copies). SQL will not emit a contradictory `NOT EXISTS`; in-memory still forbids leftovers *in that round*.

## Code map

| Concern | Location |
|---------|----------|
| Wordle matching, syllable link, empty-initial skip | `apps/api/src/domain/model/idiom/idiom-game-round.ts` |
| Colors, green locks, SQL condition extraction | `apps/api/src/domain/model/idiom/idiom-game-cell.ts` |
| Search pipeline, green-lock conflicts, probes | `apps/api/src/domain/model/idiom/idiom-game.ts` |
| Pinyin parse | `apps/api/src/domain/model/idiom/idiom.ts` |
| HTTP search / pinyin | `apps/api/src/application/service/idiom-service.ts` |
| UI page | `apps/ui/src/routes/_authenticated/game-assist/guess-idiom/` |
| Color cycle / `∅` | `GuessCellComponent.tsx` |
| Round cap | `apps/ui/src/lib/api-client.ts` (`MAX_ROUNDS = 15`) |
