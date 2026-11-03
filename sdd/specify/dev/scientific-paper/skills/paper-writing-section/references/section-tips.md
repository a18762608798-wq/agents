# Per-Section Writing Tips

> Adapted from AI-Scientist (`perform_writeup.py`) and AgentLaboratory (`papersolver.py`).
> Use the relevant tips with `writing-policy.md`; these are not a mandatory section checklist.

## Abstract
- TL;DR of the paper
- What are we trying to do and why is it relevant?
- Why is this hard?
- How do we solve it (i.e. our contribution!)
- How do we verify that we solved it (e.g. Experiments and results)
- This must only be a single paragraph, not more.
- Please make sure the abstract reads smoothly and is well-motivated. This should be one continuous paragraph with no breaks between the lines.

## Introduction
- Longer version of the Abstract, i.e. of the entire paper
- What are we trying to do and why is it relevant?
- Why is this hard?
- How do we solve it (i.e. our contribution!)
- How do we verify that we solved it (e.g. Experiments and results)
- State the contributions in the form that best fits the argument; bullet points are optional.

## Related Work
- Academic siblings of our work, i.e. alternative attempts in literature at trying to solve the same problem.
- Compare relevant assumptions, methods, and results. Explain a restriction when it matters to the comparison; do not require an applicability disclaimer for every cited method. Missing experimental comparisons are research needs to assess, not results to invent.
- Note: Just describing what another paper is doing is not enough. We need to compare and contrast.

## Background
- Academic Ancestors of our work, i.e. all concepts and prior work that are required for understanding our method.
- Usually includes a subsection, Problem Setting, which formally introduces the problem setting and notation (Formalism) for our method. Highlights any specific assumptions that are made that are unusual.
- Make sure to use mathematical notation when necessary.
- Note: If our paper introduces a novel problem setting as part of its contributions, it's best to have a separate Section.

## Methods
- What we do. Why we do it. All described using the general Formalism introduced in the Problem Setting and building on top of the concepts / foundations introduced in Background.
- Make sure you clearly report precise mathematical equations in the methods section and the precise methodology.

## Experimental Setup
- How do we test that our stuff works? Introduces a specific instantiation of the Problem Setting and specific implementation details of our Method for this Problem Setting.
- Do not imagine unknown hardware details.
- Includes a description of the dataset, evaluation metrics, important hyperparameters, and implementation details.

## Results
- Shows the results of running Method on our problem described in Experimental Setup.
- Includes statements on hyperparameters and other potential issues of fairness.
- Only includes results that have actually been run and saved in the logs. Do not hallucinate results that don't exist.
- Make sure you clearly and numerically report experimental results in the results section.
- If results exist: compares to baselines and includes statistics and confidence intervals.
- If results exist: includes ablation studies to show that specific parts of the method are relevant.
- Explain substantive limitations where they affect interpretation, or when the venue explicitly requires them. Preserve informative scientific qualifications without adding a fixed number of self-limiting sentences or repeated defensive evaluations.
- Select the results and figures needed for the paper's argument; retain their actual values, uncertainty, and statistical scope.

## Discussion / Conclusion
- Brief recap of the entire paper.
- Keep result summaries consistent with the latest formal products and with the abstract, introduction, and captions.
- To keep going with the analogy, you can think of future work as (potential) academic offspring.
