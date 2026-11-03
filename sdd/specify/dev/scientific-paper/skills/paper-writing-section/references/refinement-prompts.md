# Two-Pass Refinement Prompts

> Adapted from AI-Scientist `perform_writeup.py`; apply `writing-policy.md` first.

## Error Checklist

When refining any section, check for these specific errors:
- Unenclosed math symbols
- Only reference figures that exist in our directory
- LaTeX syntax errors
- Numerical results that do not come from explicit experiments and logs
- Repeatedly defined figure labels
- References missing from the bibliography or unsupported by the source; add new citations only after source verification.
- Unnecessary verbosity or repetition, unclear text
- Result summaries that differ from the latest formal data products or their statistical scope
- Any relevant figures that have not yet been included in the text
- Closing any `\begin{figure}` with a `\end{figure}` and `\begin{table}` with a `\end{table}`, etc.
- Duplicate headers, e.g. duplicated `\section{Introduction}` or `\end{document}`
- Unescaped symbols, e.g. `shakespeare_char` should be `shakespeare\_char` in text
- Incorrect closing of environments, e.g. `</end{figure}>` instead of `\end{figure}`

## Scientific Qualifications and Tone

Retain assumptions, applicability conditions, statistical definitions, and
substantive limitations that affect interpretation. Self-limitation can convey
essential information; it is not inherently defensive. Remove repeated
self-disqualification that adds no necessary fact, rather than removing all
negations. Do not impose a quota of caveats or require a drawback for every
cited method. Keep actual results and uncertainty accurate, and place internal
verification notes in the review record. Synchronize result changes across
the abstract, introduction, results, conclusion, and captions.

## Pass 1: Error Correction

```
Great job! Now criticize and refine only the {section} that you just wrote.
Complete the supported edits and record any missing evidence separately.

Pay particular attention to fixing any errors such as:
[error checklist above]
```

## Pass 2: Compression and Polish

```
Criticize and refine the {section} only. Recall the advice:
{tips for this section}
Complete the supported edits and record any missing evidence separately.

Pay attention to how it fits in with the rest of the paper.
Identify any redundancies (e.g. repeated figures or repeated text), if there are any, decide where in the paper things should be cut.
Identify where we can save space, and be more concise without weakening the message of the text.
Fix any remaining errors as before:
[error checklist above]
```

## Section Generation Prompt Template

For each section, use this pattern:

```
Please fill in the {section} of the writeup. Some tips are provided below:
{per_section_tips[section]}

Be sure to use \cite or \citet where relevant, referring to the works provided in the file.
Use verified entries in references.bib; verify and bind any new sources before citing them.

Place results and figures according to the existing outline and complete their captions.

Use planning comments only when useful for the current task; do not require one per paragraph.
```

## Related Work Sketch (before citation harvesting)

```
Please fill in the Related Work of the writeup. Some tips are provided below:

{per_section_tips["Related Work"]}

For this section, very briefly sketch out the structure of the section, and clearly indicate what papers you intend to include.
Do this all in LaTeX comments using %.
The related work should be concise, only plan to discuss the most relevant work.
Do not modify references.bib to add any new citations, this will be filled in at a later stage.
```
