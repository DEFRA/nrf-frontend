---
name: Recurring patterns from GTM PR review
description: Issues and patterns first spotted in the NRF2-358-gtm PR — CSP freezing, Nunjucks JS-string context XSS, assertion quality
type: feedback
---

## Pattern 1 — CSP config frozen at module load time

`content-security-policy.js` reads config at the top level (module scope), meaning the CSP is fixed when the module is first imported. Tests must use `vi.resetModules()` + dynamic `import()` to observe different configs. Flag any future code that reads config at module level when the value may change at runtime or between tests.

**Why:** Convict config can be mutated at test time, but module-level reads are cached. This pattern makes integration harder and requires `vi.resetModules()` workarounds.

**How to apply:** In future CSP or similar plugin reviews, check whether config is read inside a function (safe) or at module scope (frozen).

## Pattern 2 — Nunjucks autoescape does not protect JS string context

When `{{ variable }}` appears inside a JS string literal in a `<script>` block, Nunjucks `autoescape: true` HTML-encodes the output (e.g., `<` → `&lt;`). This does NOT prevent JavaScript injection — a value like `');alert(1);//` would still break out of the JS string. Values rendered inside JS string literals must be validated to a strict allowlist (e.g., `/^GTM-[A-Z0-9]+$/`) before being passed to the template, OR use `| dump` filter to JSON-encode.

**Why:** HTML escaping ≠ JS escaping. The GTM head partial renders `{{ gtmId }}` inside a JS IIFE string argument.

**How to apply:** Flag any `{{ variable }}` inside `<script>` tag body. Require either allowlist validation or `| dump` filter.

## Pattern 3 — Use toBeInTheDocument() not toBeTruthy() for DOM assertions

`getByTestId(...)` throws if the element is absent, so `expect(...).toBeTruthy()` is always true for present elements — it adds no assertion value. Prefer `toBeInTheDocument()` from `@testing-library/jest-dom`, which is explicit and readable.

**Why:** `toBeTruthy()` passes even for non-null objects that are falsy in other ways; `toBeInTheDocument()` is the idiomatic DOM testing library assertion.

**How to apply:** In test reviews, flag `expect(getByTestId(...)).toBeTruthy()` and suggest `toBeInTheDocument()`.
