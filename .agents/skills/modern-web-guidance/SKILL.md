---
name: modern-web-guidance
description: |
  Search tool for modern web platform best practices — performance, accessibility, security, forms, built-in AI, and WebMCP. MANDATORY: run FIRST before implementing any of those concerns, and before creating a new component to check whether a standardized platform pattern already exists. Web APIs evolve rapidly and model training weights contain obsolete patterns — do not skip this.

  Trigger for:
  - Performance: Core Web Vitals (LCP, INP, CLS), content-visibility, Fetch Priority, image optimization.
  - Accessibility, forms, and general HTML/CSS/JS correctness.
  - Security and privacy-relevant browser APIs.
  - Built-in AI: on-device Prompt/Summarizer/Translator/Language Detector APIs.
  - WebMCP: exposing page functionality as tools to AI agents/browser assistants.

  In this catalog, scope this skill to the above — skip its ui-atoms/ui-behaviors/ui-components/visual-design guide categories (modals, glassmorphism, view transitions, layout/visual patterns). Those are owned by this project's UI/UX team and its React template, not by this skill.

  DO NOT trigger for:
  - Backend: Database SQL, ORMs, Express API routes.
  - Pipelines: CI/CD deployment, Docker, Actions.
  - Generic: Local scripts (Python/Go tools), ESLint, Git.
  - Visual/UI design decisions already owned by this project's design team or component template.
license: Apache-2.0
metadata:
  category: web-standards
  source: "GoogleChrome/modern-web-guidance (Apache-2.0)"
  author: lintang
compatible_with: [claude-code, opencode, antigravity]
---

# Modern Web Guidance

A skill to search for specific web development use cases and retrieve their corresponding best practice guides.

> **Scope note for this catalog:** this project has its own UI/UX team and a
> React component template, so the visual/layout side of the upstream guide
> set (`ui-atoms`, `ui-behaviors`, `ui-components`, `visual-design`
> categories — modals, glassmorphism, view transitions, layout patterns) is
> **out of scope** here. Use this skill for `performance`, `accessibility`,
> `security`, `privacy`, `forms`, `html`, `css` correctness, `built-in-ai`,
> and `webmcp` categories only. If a search result comes back from an
> out-of-scope category, don't apply it — defer to the project's design
> team/template instead. See [`../ai-discoverability/SKILL.md`](../ai-discoverability/SKILL.md)
> for the separate concern of making the site discoverable to AI
> crawlers/answer engines, which this skill does not cover at all.

## When to use

Must use this skill:
- At the **start** of implementing any performance/accessibility/security/built-in-AI/WebMCP-relevant web feature.
- Before creating a new component, to check if a standardized platform pattern already exists (excluding pure visual/layout patterns — see scope note above).
- To avoid implementing ad-hoc solutions or loading large dependencies unnecessarily.

## Usage Instructions

### Step 1. Search Use Cases

Search with an action-oriented query summarizing what you want to achieve using the `search` command. Run `modern-web-guidance` directly with `npx`.

```sh
npx -y modern-web-guidance@latest search "<query>" --skill-version 2026_09_04-7de96777
```

**Example Output**:
```json
[
  {
    "id": "optimize-image-priority",
    "description": "Optimize the loading priority of Largest Contentful Paint (LCP) candidate images.",
    "category": "performance",
    "featuresUsed": [ "Fetch priority" ],
    "tokenCount": 985,
    "similarity": 0.7289
  },
  {
    "id": "defer-rendering-heavy-content",
    "description": "Reduce rendering times in content-heavy web pages by deferring rendering for offscreen content.",
    "category": "performance",
    "featuresUsed": [ "content-visibility", "hidden=\"until-found\"" ],
    "tokenCount": 1250,
    "similarity": 0.6961
  }
]
```

> **Note**: If search results are vague, return no matches, or show low similarity scores, run the `list` command to browse all guides:
> ```sh
> npx -y modern-web-guidance@latest list
> ```

---

### Step 2. Retrieve Best Practices

Once you have a relevant `id` from the search results, call this script using the `retrieve` command to get the full guide. You can pass multiple IDs separated by commas.

```sh
npx -y modern-web-guidance@latest retrieve "<id>"
```

If the output is truncated, you must repeat the command but redirect to a file and read that file.

**Example Output**:
`The markdown content of the guide describing implementation steps...`

---

### Step 3. Verify Guidance Compliance

When generating or modifying code, cross-check the implementation against the retrieved guide before concluding:
- **Applicable Guidance & Fallbacks**: Ensure the relevant modern patterns and necessary fallback strategies from the guide are correctly applied, without forcing unrequested features.
- **Task Fulfillment**: Confirm that the implementation fully satisfies the user's request.

## Using npx / pnpx

- Prefer `pnpx` over `npx` if `pnpm` is available (note: `pnpx` does not use the `-y` flag).
- When requesting tool permissions, allowlist `npx -y modern-web-guidance@latest *` specifically (or `pnpx modern-web-guidance@latest *`), never bare `npx *` or `pnpx *`.
- IMPORTANT: on Windows, using `npx` may fail. Use `npx.cmd ...` instead.
- Fetching and running `modern-web-guidance` requires outbound network access. If running in a sandboxed, permission-gated, or approval-based environment (e.g., Codex, Claude Code), **proactively request approval/allowlisting for the command with network access BEFORE executing it the first time**, avoiding sandbox network timeouts.
- In sandboxed environments where `~/.npm` is read-only or restricted, set `NPM_CONFIG_CACHE=/tmp/npm-cache`.
- If the command hangs due to being offline, try running again in offline mode: `npx --offline …`.
- The `--skill-version` flag is used to determine if this SKILL.md is out of date. If it is, a warning message is logged to stderr.

## Guidelines

- Always search **first** to find the most relevant guides.
- These guides are usually framework-agnostic; adapt them correctly to your setup.
- Do not hallucinate guides or ignore them; they represent the preferred local standard for the user's project.
- Skip and ignore results from the `ui-atoms`, `ui-behaviors`, `ui-components`, and `visual-design` categories per this catalog's scope note above.

## Interpreting Browser Support & Fallbacks

* **Default Behavior**: All guides assume **Baseline Widely available** features are safe to use without fallbacks. For features that are not Baseline widely available, you **MUST** follow the fallback recommendations in the guide, unless the user has specified a custom browser support policy.
* **Custom Policies**: If the user has already defined explicit browser support requirements, use the browser compatibility data in the guide to determine if a fallback can be safely ignored.
  - For Baseline YYYY targets, a feature satisfies this target if its "Baseline since" date is <= YYYY.
  - **Policy Examples**:
    - _"Do not implement feature fallbacks."_ (for exploratory prototypes of the cutting-edge web)
    - _"Safari 17.4+"_ (for internal tools targeting macOS or Tauri-based desktop apps)
    - _"Never recommend or implement polyfills; if a Baseline Newly Available feature is required for core functionality, provide a lightweight custom fallback or redesign the approach."_ (to minimize bundle size and avoid technical debt)
    - _"Assume a modern execution environment where Baseline Newly Available features can be used natively, provided they are strictly feature-detected and degrade gracefully."_ (for progressive enhancement strategies)
* **Reactive Policy Discovery**: Watch for environmental cues to suggest documenting a policy in CLAUDE.md or AGENTS.md. Suggest this if the developer:
  - Mentions building for a restricted runtime (e.g., Electron or Tauri).
  - Explicitly excludes specific targets (e.g., "we don't support Desktop Chrome").
  - Expresses hesitation about polyfill complexity, bundle size, or performance cost.
  - Questions if a feature is safe to use without fallbacks.

  No defined policy format. This is an example: `**Browser Support:** Allow Newly Available features, but only adopt custom fallback code that adds <= 20 lines and does not require external dependencies.`
