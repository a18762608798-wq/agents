# PRA Writing Style (language, not formatting)

Source: 15 PRA quantum-computing papers (2021–2026) in `tmp-pra-style`
plus APS official guides. Formatting (REVTeX class, floats, length) lives in
`pra-notes.md` / `pra-figures.md`; this file is **wording and argument moves only**.

## Corpus (evidence base)

Error mitigation (5): 10.1103/PhysRevA.104.052607, 10.1103/PhysRevA.106.052406,
10.1103/PhysRevA.106.062436, 10.1103/PhysRevA.109.062617,
10.1103/PhysRevA.110.042625.
Variational / trainability (5): 10.1103/PhysRevA.104.L010401,
10.1103/PhysRevA.103.032607, 10.1103/PhysRevA.106.L060401,
10.1103/PhysRevA.111.012441, 10.1103/PhysRevA.104.L050401.
Benchmarking / tomography / metrology (5): 10.1103/PhysRevA.103.042604,
10.1103/PhysRevA.103.022607, 10.1103/PhysRevA.107.042403,
10.1103/PhysRevA.109.042406, 10.1103/PhysRevA.109.062406.

APS: Journals Style Guide, `journals.aps.org/authors/style-basics`
(main text targets a general readership; proofread; paper must stand alone
without Supplement), REVTeX 4.2 Author's Guide appendix on active voice
(prefer active; passive leaves "who did it?" open).
Borrowed (ideas only, nothing installed): `academic-paper` Style Calibration
(learn voice from past papers) + Writing Quality Check (vague terms,
throat-clearing, sentence shape); `latex-paper-en` low-friction module router
+ de-AI editing; `nature-polishing` manifest router (adapted to PRA axes below).

## Core voice rule

Own work = active `we`. Literature / textbook facts = passive or impersonal.
`claim` is banned (0/15 papers use it for own results).
Ladder: `show / demonstrate / propose / introduce / find / observe` for own
contributions; `suggest` only for genuinely tentative readings (2/15 papers);
`may / might / could / typically / likely / nearly / almost` form the closed
hedging set — never `maybe / perhaps`.

Examples from corpus:
`We propose a general framework...` / `We resolve this issue by demonstrating...`
/ `Here we prove this conjecture false.` / `We point out a simple mechanism...`
vs `where it is shown how noise-scaling can enhance...` /
`it is evident that the noise power...` / `has been studied / observed / implemented`.

## Abstract: 5–9 sentences, fixed moves

1. Domain endorsement (1): `X has become a cornerstone / dominates / is a central topic`.
2. Gap (1–2): `while empirically observed, ... have not been defined` /
   `has typically been studied under the ideal approximation that...` /
   `depends non-trivially on the choice of...`.
3. Contribution (1–2), always `In this work / In this article, we + extend / propose / introduce / perform` or `The aim of this work is to...`. Letters may use `Here we prove / We found`.
4. Method sketch (1–2): `by appending to it the inverted circuit and measuring...` / `by leveraging transferability...`.
5. Result, qualitative unless the number IS the result (1–2):
   `more accurate / significant improvement / sufficiently reliable / holistic view`.
   Methods/theory abstracts in corpus carry zero numbers; experimental abstracts
   add the number with its condition (`seven-qubit Clifford circuit`, `95% confidence`).
6. Optional: byproduct (`may be of independent interest`) or forward look
   (`will be a crucial tool...`), one sentence max. Single paragraph.

## Introduction: five moves, fixed order

1. Broad background (importance, 1 para).
2. Specific technique definition with 3–5 named citations, each with a drawback
   (`yields satisfactory results, however, it requires...` /
   `only applicable in the case of...` / `has been determined by trial and error`).
3. Gap sentence — pick one template:
   `While its main idea is rather simple, the full potential... has not been uncovered` /
   `have been primarily investigated under the assumption of...` /
   `It remains an open question whether...` / `Here we prove this conjecture false.`
4. Contribution (`In this work, we extend / propose / introduce...` +
   `Our findings indicate that...` / `Our approach extends... while accounting for...`).
   `Here we` is rare in PRA (2 hits / 5 methods papers); prefer `In this work`.
5. Roadmap (`The paper is organized as follows. / In the following, we first... Next... We then...` +
   `The reader who is already familiar with... could directly jump to Sec. IV`).
   5–8 paragraphs, 90–180 words each. End roadmap without hype; save significance for Abstract.

## Tense

Present for claims and definitions (`We show / is defined / converges to... for epsilon->0`).
Past only for completed procedures and figure lines
(`was performed / was measured / is shown by a dashed line`).
Experimental setup: past (`The pulses used were 50 ns long`).
Never switch mid-paragraph by accident; time switch marks function change.

## Precision without naked numbers

Every improvement carries its condition, not a bare percent:
`in the presence of time-correlated noise / for arbitrary circuits / for small errors` /
`under a unified PEC protocol / below the hardware level` /
`without requiring previous characterization / on current quantum hardware / on average` /
`ranging from purely Markovian to non-Markovian`.
Uncertainty in formulas (`Var[...]`, `bias`, `fidelity`, `epsilon in [0,1]`), not chatty percents.
Quantum triple for conclusions: quality metric (`overlap / fidelity / infidelity / residual energy / distance`) + scaling (`O(1/n^4) / O(b^{-n}) / exponentially close`) + system size (`n=17 / N=8->24 / up to 5 qubits, 11 layers / 8192 shots`).

## Equations and references

Formula followed by punctuation + `where X is/denotes/represents...` (`where` 6–44×/paper).
Cite verbs are fixed collocations: `according to / defined in / replace X into Y` /
`Taking a closer look at the bias in Eq. (7)...` / `as in Eq. (6) with rescaled...` /
`see / cf. Eq. (x)`. Never let an equation number stand as a sentence alone.
Citations: sentence-final `[x]` dominates; narrative `Ref. [x]` only for method attribution
(`described in Ref. [66]`, `has been analyzed in Ref. [15]`).
`Eq. (x)` 12–135× in theory papers; experiment main text may push derivations to appendices.

## Figures

Postposed / parenthetical dominates; fronted `Fig. X shows` is rare (≤1× in 13/15):
`As schematically shown in Fig. 1, ...` / `The results are reported in Fig. 3` /
`is shown in Fig. 1` / `(see Fig. 1)` / `In Fig. 3(f) we observe that...` /
`Experimental results are shown in Fig. 2(d)`.
Captions start `FIG. X.`; theory captions short (`Example for Richardson extrapolation with n=3`);
experiment captions long (device name + panel enumeration).
Explain every figure line in text (`dashed horizontal line`, `blue/grey = unmitigated`).
After formulas add one plain sentence: `In other words, ...` / `That is, ...` /
`Specifically, we consider...` — every dense derivation gets a paraphrase.

## Transitions and caveats (PRA fingerprint)

`However` every paper (3–19×); `Moreover` = parallel contribution,
`Furthermore` = deeper derivation, `In contrast` = method comparison,
`Notably / In particular` = special-case emphasis. Mid-sentence `..., however, ...` allowed.
Every paper carries 1–2 self-limiting sentences:
`only feasible for no more than 4 noise levels` /
`only applicable in the case of...` / `does not necessarily improve with larger n` /
`can be applied only for phase estimation`.
Grade claims: `show` (proven) > `demonstrate` (experimental) > `observe` (numerical) >
`argue / conjecture` (unproven: `we show existence of approximate... and conjecture exact...`).
Never present numerics as proof (`cross verified numerically`, `works for almost every...`).

## Theory vs experiment tracks

Experiment: past-tense apparatus, sigma/error-bar language
(`from 43 sigma to 1987 sigma down to 0.3–2.7 sigma`; `Error bars (95% confidence)... smaller than...`),
`We demonstrate N×`, data-first figure sentences.
Theory: `We consider / We assume` openings (5–9×), `Theorem / Lemma / Proof` chain,
complexity language (`scales exponentially / polynomially many measurements / poly(n)`).
Methods/theory bridge: `with an ansatz of the form: (1)`, `The goal is to minimize... (9)`,
`Step 1... Step 2... (1)(2)(3)`.

## Borrowed checks (PRA-adapted)

From Writing Quality Check, run on every draft: kill vague `very / clearly / obviously`
unless followed by a number; kill throat-clearers (`It is worth noting that` → state it);
one idea per paragraph; short `Thus/Hence` for formula conclusions only.
From de-AI editing: replace generic `delve / unlock / showcase / leverage-as-decoration`
with corpus verbs (`employ / construct / suppress to / lift the requirement`).
From Style Calibration: when 3+ prior PRA papers exist, mirror their Abstract rhythm
before drafting (soft guide; venue rules win).

## Anti-patterns (reject)

- `claim` for own results; `maybe / perhaps`; bare percents without conditions.
- `Here we show` in every paragraph (PRA uses it ≤2×/paper).
- Fronted `Fig. X shows` chains; unpunctuated equations; `where`-less symbol dumps.
- Numbers as proof (`Theorem` without proof, numerics called `proof`).
- Supplement-dependent main text (APS: paper must stand alone).
- Hype adjectives (`groundbreaking / unprecedented`) — corpus superlatives are positional
  (`encompasses both PEC and ZNE as particular cases`, `from unitary-only to dynamic circuits`), not adjectival.

## Use

`paper-latex-formatting`: load this file alongside `pra-notes.md` whenever the task is
wording (abstract/intro/captions), not just class options.
`paper-writing-section`: Section Tips give the skeleton; this file gives the PRA voice.
When both apply, skeleton first, voice second, refinement checklist last.
