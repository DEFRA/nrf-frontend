---
name: quote-journey-page
description: >
  Conventions and file structure for quote journey pages in nrf-frontend. Read before
  creating or modifying any page under src/server/quote/. Covers the standard file
  structure (routes, get-view-model, form-validation, get-next-page), quoteController /
  quotePostController wiring, PRG validation flow, Nunjucks template conventions, Joi
  rules per input type, session cache helpers, and page/accessibility test patterns.
---

## Overview

Every standard quote journey page follows the same structure. The page logic is split
across up to five files in its own directory under `src/server/quote/<page-name>/`:

| File                 | Purpose                                                            |
| -------------------- | ------------------------------------------------------------------ |
| `routes.js`          | Route definitions; spreads controller objects; exports `routePath` |
| `get-view-model.js`  | Builds the template data object from session data                  |
| `form-validation.js` | Returns a Joi schema for the POST payload                          |
| `get-next-page.js`   | Returns the redirect path after a successful POST                  |
| `controller-post.js` | Only needed when POST logic differs from the standard (see below)  |

GET-only pages (no form) omit `form-validation.js`, `get-next-page.js`, and any custom
controller.

---

## Step 1 — Create the directory and files

```
src/server/quote/<page-name>/
  routes.js
  get-view-model.js
  form-validation.js      ← omit for GET-only pages
  get-next-page.js        ← omit for GET-only pages
```

---

## Step 2 — `routes.js`

The routes file is the wiring point. It imports the shared factory controllers and the
page's own logic files, then exports the route array as the default export and the path
as a named export.

```js
import { quoteController } from '../controller-get.js'
import { quotePostController } from '../controller-post.js'
import getViewModel from './get-view-model.js'
import formValidation from './form-validation.js'
import getNextPage from './get-next-page.js'

const routeId = '<page-name>' // must match the Nunjucks template directory
export const routePath = '/quote/<page-name>'

/**
 * @openapi
 * /quote/<page-name>:
 *   get:
 *     tags: [Quote]
 *     summary: <Page title>
 *     responses:
 *       200:
 *         description: HTML form page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *   post:
 *     tags: [Quote]
 *     summary: Submit <page-name>
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required: [<field>]
 *             properties:
 *               <field>:
 *                 type: string
 *     responses:
 *       303:
 *         description: Redirect to next step or back to form on validation failure
 */
export default [
  {
    method: 'GET',
    path: routePath,
    ...quoteController({ routeId, getViewModel })
  },
  {
    method: 'POST',
    path: routePath,
    ...quotePostController({
      routeId,
      formValidation,
      getViewModel,
      getNextPage
    })
  }
]
```

**`routeId` must exactly match the subdirectory name** — `quoteController` uses it to
resolve the Nunjucks template path as `quote/<routeId>/index`.

---

## Step 3 — `index.njk`

See `src/server/quote/start/index.njk` for a content-only page and
`src/server/quote/boundary-type/index.njk` for a page with a form.

The template must:

- Extend `layouts/page.njk`
- Define `{% block pageTitle %}{{pageTitle}}{% endblock %}`
- Define a `{% block beforeContent %}` containing the `backLink` macro with `href: backLinkPath`
- Use `govuk-grid-column-two-thirds-from-desktop` (not `govuk-grid-column-two-thirds`)
- Replace the `<h1>` contents with `{{pageHeading}}`
- Define `{% block content %}` containing the page markup
- Use GOV.UK Design System Nunjucks macros for recognised components (button, radios, checkboxes, error summary, etc.). Check `layouts/page.njk` for already-imported macros before adding new imports to the page file

If the page has a form:

- Remove the `action` attribute so the form posts to the same URL; keep `novalidate`
- Prefix the `{% block pageTitle %}` value with `{% if validationErrors %}Error: {% endif %}`
- Add an error summary macro above the content, wrapped in `{% if validationErrors %}`, using `titleText: "There is a problem"` and `errorList: validationErrors.summary`
- Use `formSubmitData.<fieldName>` (camelCase) for pre-populating field values
- Use `validationErrors.messagesByFormField.<fieldName>` for each field's `errorMessage`
- For radios set `value: formSubmitData.<fieldName>`; for checkboxes set `values: formSubmitData.<fieldName>` (the macro expects an array)
- Do not set `id` on individual radio/checkbox items

---

## Step 4 — `get-view-model.js`

Returns a plain object consumed by the Nunjucks template. Receives the current session
quote data as its argument.

```js
import { getPageTitle } from '../../common/helpers/page-title.js'

export const title = '<Page heading text>'

export default function getViewModel(quoteData = {}) {
  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    backLinkPath: '/quote/<previous-page>'
    // add any page-specific fields here, derived from quoteData
  }
}
```

Always name the function — never `export default function () { ... }`.

---

## Step 5 — `form-validation.js`

Returns a Joi schema factory (a function that returns a schema, not the schema itself —
this matches how `quotePostController` calls it via `formValidation()`).

```js
import joi from 'joi'

const errorMessage = '<User-facing error message>'

export default function formValidation() {
  return joi.object({
    <fieldName>: joi.string().valid(/* values */).required().messages({
      'any.required': errorMessage,
      'any.only': errorMessage
    })
  })
}
```

Rules per input type:

- **Radios / selects**: `joi.string().valid(...allowedValues).required()` — handle both `'any.required'` (nothing selected) and `'any.only'` (unrecognised value) with the same message
- **Checkboxes**: `joi.array().items(joi.string().valid(...allowedValues)).single().required()` — `.single()` is required because one checked box submits a plain string, not an array. Handle `'any.required'` and `'any.only'`; do not add `'array.min'` (unreachable via a normal HTML form)
- **Text inputs (required)**: handle both `'string.empty'` and `'any.required'`
- **Text inputs (optional)**: `joi.string().allow('')` — always include optional fields in the schema or Hapi will reject submissions that include them as unknown fields
- **Email**: text input rules plus `.email({ tlds: { allow: false } })`, handling `'string.email'` with the GOV.UK standard message `'Enter an email address in the correct format, like name@example.com'`
- **Number inputs**: `joi.number().integer().required()` (Hapi converts strings to numbers by default) — handle `'any.required'`, `'number.base'`, and `'number.integer'`

Where the same error message string appears in multiple `.messages()` keys, extract it to a named `const` at the top of the file.

---

## Step 6 — `form-validation.test.js`

See `src/server/quote/boundary-type/form-validation.test.js` for the pattern.

For each field in the schema add tests that:

- Pass for each valid value
- Fail with the correct error message when the field is absent
- Fail with the correct error message when an unrecognised value is submitted (radios/checkboxes)

Extract a `validRequiredData` const at the top for reuse across tests. If the form has optional text fields, add an `optional fields` describe block: passes when all optional fields are absent, passes when all are empty strings, passes when all have values.

---

## Step 7 — `get-next-page.js`

Returns the path string for the next page. Receives the full (merged) quote session data
so it can make conditional routing decisions.

```js
import { routePath as routePathNext } from '../<next-page>/routes.js'

export default function getNextPage(quoteData) {
  // conditional logic if needed, otherwise:
  return routePathNext
}
```

Always import `routePath` from the target routes file — never hard-code path strings.

---

## Step 8 — Register the routes in `quote/index.js`

Add an import and spread the new routes into `server.route([...])`:

```js
import routesMyPage from './<page-name>/routes.js'

// inside register():
server.route([
  // ...existing routes...
  ...routesMyPage
])
```

---

## Step 9 — `page.test.js`

See `src/server/quote/start/page.test.js` (content page) and
`src/server/quote/boundary-type/page.test.js` (form page) for the patterns.

Every page test must assert:

- The `h1` text matches the `pageHeading` from the view model
- `document.title` matches `pageTitle`
- The back link `href` matches `backLinkPath`

If the page has a form, also add:

1. A test that primes the session with a validation error and loads the page, asserting the error message is displayed — use `expectFieldsetError` (radios/checkboxes) or `expectInputError` (text/number inputs) from `src/test-utils/assertions.js`
2. For fields with format validation (e.g. email): a second error test priming an invalid-format error
3. A test that submits valid data and asserts a redirect response with a `location` header
4. A test that submits invalid data and asserts a redirect back to the same URL with validation errors saved to the session
5. A test that confirms the form contains a hidden CSRF token input
6. A test that confirms a previous valid selection is pre-populated on the form

## Step 10 — `accessibility.test.js`

See `src/server/quote/start/accessibility.test.js` (no form) and
`src/server/quote/boundary-type/accessibility.test.js` (with form) for the patterns.

For a page with a form, the test must render the page with a validation error present so
that the error summary and inline errors are included in the accessibility check.

---

## When to use a custom `controller-post.js`

Use `quotePostController` for the vast majority of pages. Write a custom controller only
when the POST handler needs to do something beyond "validate → save to session → redirect",
such as:

- Resolving a display name from a cached lookup before saving (see `waste-water/`)
- Calling a backend API (see `check-your-answers/`)
- Clearing dependent session keys when a value changes

When writing a custom controller, still follow the PRG pattern:

- Validation failure: save flash to session, redirect back with `statusCodes.redirectAfterPost`, `.takeover()`
- Success: redirect forward with `statusCodes.redirectAfterPost`

---

## How `quoteController` (GET) works

`quoteController` in `controller-get.js`:

1. Reads any validation flash (errors + submitted values) from session and clears it
2. Reads current quote session data
3. Calls `getViewModel(quoteData)` and merges in `validationErrors` and `formSubmitData`
4. Renders `h.view('quote/<routeId>/index', viewModel)`

The GET handler re-displays errors that the POST handler saved to the session flash —
this is what makes the PRG pattern work without losing validation state across the redirect.

## How `quotePostController` (POST) works

`quotePostController` in `controller-post.js`:

1. Runs `formValidation()` as the Joi payload schema
2. On failure: maps errors for display, saves flash to session, redirects back (303 + `.takeover()`)
3. On success: merges payload into session via `saveQuoteDataToCache`, calls `getNextPage(quoteData)`, redirects forward (303)

---

## Session cache

Use the helpers in `src/server/quote/helpers/quote-session-cache/`:

```js
import {
  saveQuoteDataToCache,
  getQuoteDataFromCache,
  getCompleteQuoteDataFromCache,
  clearQuoteDataFromCache
} from '../helpers/quote-session-cache/index.js'
```

- `saveQuoteDataToCache(request, partialData)` — merges data and validates against the
  in-progress schema; also clears downstream fields if the boundary changes
- `getQuoteDataFromCache(request)` — returns current data or `{}`
- `getCompleteQuoteDataFromCache(request)` — validates against the complete schema (use
  before submitting to backend)
- `clearQuoteDataFromCache(request)` — wipes the whole quote session (use after submission)

Session keys are camelCase. Never read from `request.yar` directly in a page controller —
always go through these helpers.
