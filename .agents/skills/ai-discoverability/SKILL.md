---
name: ai-discoverability
description: Makes a website discoverable and correctly parseable by AI crawlers/answer engines (ChatGPT, Perplexity, Claude, Gemini, etc.) and traditional search engines — llms.txt, structured data (schema.org/JSON-LD), robots.txt rules for AI bots, canonical URLs, sitemap.xml, Open Graph/meta tags, and server-rendered/prerendered content so crawlers that don't execute JS can still read it. Use when the user asks to make a site "terindeks AI" / discoverable by AI agents, wants basic SEO without a dedicated SEO specialist, or is shipping a new page/route that should be citable by an AI answer engine. Not for visual/UI design (see this repo's UI/UX conventions or template) and not for browser-API-level implementation details (see `modern-web-guidance` for Core Web Vitals, accessibility, forms, and other platform-feature specifics).
license: MIT
metadata:
  category: web-standards
  author: lintang
compatible_with: [claude-code, opencode, antigravity]
---

# AI Discoverability

Makes a site's content reachable, parseable, and citable by AI
crawlers/answer engines and traditional search engines — without touching
visual design. This is the complement to
[`modern-web-guidance`](../modern-web-guidance/SKILL.md): that skill
covers browser-platform implementation details (performance,
accessibility, WebMCP); this skill covers whether outside systems can
*find and understand* the content at all.

## Step 0 — Confirm the content is actually reachable without JS

The single most common reason a site is invisible to AI crawlers: content
that only renders after client-side JS runs. Most AI crawlers (GPTBot,
ClaudeBot, PerplexityBot, Google-Extended, etc.) either don't execute JS
at all, or execute it unreliably/with a timeout budget.

- Check whether the framework/setup renders content server-side (SSR),
  statically (SSG), or via prerendering for crawlers — not client-only
  CSR. `curl` the page (or view source, not devtools-rendered DOM) and
  confirm the actual page content — not just a `<div id="root">` shell —
  is present in the raw HTML response.
- If the stack is CSR-only (e.g. a pure SPA) and switching rendering mode
  is out of scope, at minimum ensure critical pages have a prerendered/
  static fallback (dynamic rendering, a prerender service, or SSG for the
  pages that matter for discoverability) — flag this as a real
  architectural gap rather than silently working around it, since it
  affects every step below.

## Step 1 — `robots.txt`: decide AI bot policy explicitly

Don't leave AI-bot access to `robots.txt` defaults — decide and write it
down.

- Identify the bots relevant to the user's goal: `GPTBot`, `ChatGPT-User`,
  `ClaudeBot`, `Claude-Web`, `PerplexityBot`, `Google-Extended`,
  `Applebot-Extended`, `CCBot`, `Bytespider`, etc. — the exact list
  changes over time, so verify current user-agent names rather than
  hardcoding from memory if precision matters to the user.
- If the goal is "get cited by AI answer engines," explicitly `Allow` the
  relevant bots (don't just rely on the wildcard `User-agent: *` rule,
  since some sites block AI bots by default while allowing generic
  search crawlers).
- If the user wants training-data opt-out but still wants to be citable
  in real-time answers, note that some providers distinguish a training
  crawler from a retrieval/citation crawler under different user-agent
  strings — ask the user which they actually want blocked vs. allowed
  rather than assuming "block AI" means all of them.
- Keep a `Sitemap:` directive in `robots.txt` pointing at `sitemap.xml`.

## Step 2 — `llms.txt`: a machine-readable summary for LLM consumers

Add an `/llms.txt` file at the site root (plain Markdown) that gives an
LLM a concise, curated map of the site — this is a proposed convention
(not a formal web standard), but growing numbers of AI tools look for it.

- Structure: an H1 with the site/product name, a one-line summary
  blockquote, then H2 sections linking to the most important pages
  (docs, pricing, key articles) with a one-line description each.
- Keep it curated, not auto-generated from a full sitemap — the point is
  signal, not an exhaustive dump. A few dozen links, not thousands.
- Optionally add `/llms-full.txt` with fuller inlined content for tools
  that fetch it, if the user wants deeper coverage — but don't default to
  generating this unless asked, since it can get large and stale fast.

## Step 3 — Structured data (schema.org / JSON-LD)

Add JSON-LD `<script type="application/ld+json">` blocks so both search
engines and AI answer engines can extract facts without guessing from
prose.

- Pick schema types that match the actual content: `Article`/`BlogPosting`
  for posts, `Product` for product pages, `FAQPage` for FAQ sections,
  `Organization`/`WebSite` for the site root, `BreadcrumbList` for nav.
  Don't apply a schema type that doesn't match the page's real content
  just to "add structured data."
- Validate with Google's Rich Results Test or the Schema.org validator
  before considering this done — malformed JSON-LD is worse than none,
  since it can get the page penalized rather than helped.
- Keep structured data in sync with visible page content — a mismatch
  (schema claims something the visible page doesn't say) is treated as
  spam by search engines and erodes trust with answer engines that
  cross-check.

## Step 4 — Meta tags, canonical URLs, sitemap

- Every page needs a unique, accurate `<title>` and `<meta
  name="description">` — don't leave these templated/duplicated across
  pages, since that's a top reason engines rank or cite a page poorly.
- Add `<link rel="canonical">` on every page, especially where the same
  content is reachable via multiple URLs (query params, trailing slash,
  http/https, www/non-www) — without it, crawlers may split authority
  across duplicate URLs or index the wrong one.
- Add Open Graph (`og:title`, `og:description`, `og:image`, `og:url`) and
  `twitter:card` tags — several AI answer engines and chat tools use
  these when generating a link preview or summary, not just social media.
- Maintain `sitemap.xml` (or a sitemap index for large sites) listing
  canonical URLs with `lastmod` — regenerate it as part of the build/
  deploy process, not as a one-off manual file that goes stale.

## Step 5 — Semantic HTML and heading structure

- Use one `<h1>` per page matching the actual topic, with a logical
  `h2`/`h3` hierarchy below it — AI summarizers and search engines both
  use heading structure to build an outline of the page; a heading
  structure that jumps around or fakes hierarchy for styling purposes
  hurts both.
- Use semantic elements (`<article>`, `<nav>`, `<main>`, `<time>`,
  `<address>`) over generic `<div>`s where they apply — cheap to do and
  it's exactly what a parser without full JS execution leans on most.
- Write descriptive link text and `alt` text on meaningful images —
  crawlers that can't or don't render images depend on this to know what
  a page links to or shows.

## Step 6 — Verify

- Fetch key pages with `curl -A "GPTBot"` (or the relevant bot
  user-agent) and confirm content, robots rules, and status codes behave
  as intended — don't just trust the browser-rendered view.
- Run the structured data validator and a basic Lighthouse/SEO audit pass
  as a final check before calling this done.

## What this is not

- Not visual/UI design — that's this project's UI/UX team/template's job;
  this skill never suggests layout or component changes.
- Not browser-API-level implementation (Core Web Vitals internals,
  accessibility ARIA patterns, WebMCP tool registration) — see
  [`modern-web-guidance`](../modern-web-guidance/SKILL.md) for that.
- Not a guarantee of ranking or citation — search/AI-engine ranking
  algorithms are opaque and change; this skill makes a site *eligible* to
  be found and cited correctly, not first in results.
