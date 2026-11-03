# PRA Writing Style (language, not formatting)

Source: 15 PRA quantum-computing papers (2021–2026) in `tmp-pra-style`
plus APS official guides. Formatting (REVTeX class, floats, length) lives in
`pra-notes.md` / `pra-figures.md`; this file is **wording and argument moves only**.
Corpus patterns are optional examples, not APS requirements or sentence quotas.
Apply `../../paper-writing-section/references/writing-policy.md` when revising prose.

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

Official criteria, checked 2026-11-03:
[PRA referee guidelines](https://journals.aps.org/pra/referees/guidelines-for-referees)
ask whether models and approximations are justified, conclusions are supported,
and presentation is clear, concise, and sufficiently comprehensive.
The [author guidelines](https://journals.aps.org/pra/authors) also require relevant
literature context. Neither page prescribes a quota of self-limiting sentences;
the prose guidance below is an editorial interpretation of those criteria.

## Core voice rule

Own work = active `we`. Literature / textbook facts = passive or impersonal.
Choose verbs by what the work establishes: `prove` for a proof,
`propose / introduce` for a construction, `find / observe` for reported results.
Use `suggest / may / might / could` when an interpretation is actually tentative.
Word frequencies in this small corpus do not justify a banned-word list or
mechanically hedging a supported result.

Examples from corpus:
`We propose a general framework...` / `We resolve this issue by demonstrating...`
/ `Here we prove this conjecture false.` / `We point out a simple mechanism...`
vs `where it is shown how noise-scaling can enhance...` /
`it is evident that the noise power...` / `has been studied / observed / implemented`.

## Abstract: possible moves

Use only the moves needed for the actual result; sentence count and order are flexible.

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

## Introduction: possible moves

1. Broad background (importance, 1 para).
2. Define the relevant techniques and compare their assumptions, methods, and results.
   Include a drawback when it explains the research question; each citation does
   not need a drawback or a statement that its method was not adopted.
3. Gap sentence — pick one template:
   `While its main idea is rather simple, the full potential... has not been uncovered` /
   `have been primarily investigated under the assumption of...` /
   `It remains an open question whether...` / `Here we prove this conjecture false.`
4. Contribution (`In this work, we extend / propose / introduce...` +
   `Our findings indicate that...` / `Our approach extends... while accounting for...`).
   `Here we` is rare in PRA (2 hits / 5 methods papers); prefer `In this work`.
5. Roadmap (`The paper is organized as follows. / In the following, we first... Next... We then...` +
   `The reader who is already familiar with... could directly jump to Sec. IV`).
   Adapt paragraph count and order to the argument. End the roadmap without hype.

## Tense

Present for claims and definitions (`We show / is defined / converges to...` as $\epsilon\to0$).
Past only for completed procedures and figure lines
(`was performed / was measured / is shown by a dashed line`).
Experimental setup: past (`The pulses used were 50 ns long`).
Never switch mid-paragraph by accident; time switch marks function change.

## Precision without naked numbers

Identify the object, metric, uncertainty, and material conditions of a reported improvement.
State shared conditions in definitions or methods rather than repeating a caveat
after every number; keep a key condition in the abstract if its omission would
change how the result is read. Possible conditions include:
`in the presence of time-correlated noise / for arbitrary circuits / for small errors` /
`under a unified PEC protocol / below the hardware level` /
`without requiring previous characterization / on current quantum hardware / on average` /
`ranging from purely Markovian to non-Markovian`.
Use the relevant estimator, bias, variance, or confidence interval, with symbols
defined; for example, $\epsilon\in[0,1]$.
Report a quality metric (`overlap / fidelity / residual energy / distance`),
scaling when established (for example, $O(n^{-4})$), and the relevant system
size or sampling budget (for example, $N=8$ to $24$, or $8192$ shots).

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
Captions start `FIG. X.`; theory captions short (for example, Richardson extrapolation with $n=3$);
experiment captions long (device name + panel enumeration).
Explain every figure line in text (`dashed horizontal line`, `blue/grey = unmitigated`).
After formulas add one plain sentence: `In other words, ...` / `That is, ...` /
`Specifically, we consider...` — every dense derivation gets a paraphrase.

## Transitions, scientific scope, and limitations

`However` every paper (3–19×); `Moreover` = parallel contribution,
`Furthermore` = deeper derivation, `In contrast` = method comparison,
`Notably / In particular` = special-case emphasis. Mid-sentence `..., however, ...` allowed.
Scientific qualifications supply assumptions, applicability conditions, statistical
scope, or substantive limitations that affect interpretation. Keep them where
the argument needs them. A precise restriction can be essential information;
self-limitation is not synonymous with defensive wording.

Defensive wording adds repeated self-disqualification without necessary new
information, often through generic `does not prove / does not guarantee` sentences
after the relevant conditions have already been stated. Revise by meaning, not
by deleting all negations or all limitations. Preserve actual negative findings.
There is no required number of self-limiting sentences and no reason to append
an unused-method disclaimer to every technical paragraph.

Distinguish proof, numerical evidence, measured results, and conjecture by their
actual content. These are different kinds of support, not a fixed verb hierarchy.

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

- Generic hedging or repeated self-disqualification; numbers with an unclear metric or scope.
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
The common writing policy and the actual scientific content take precedence
over corpus-derived templates.
