---
name: view-from-prototype
description: Create a Nunjucks view file by parsing a GOV.UK prototype page. Use when converting a prototype URL into a local index.njk view that follows GOV.UK Design System conventions with Nunjucks macros.
---

## Parameters

1. **Prototype URL** - the URL of a prototype page, e.g. `https://nrf-prototypes.ext-test.cdp-int.defra.cloud/nrf-estimate-4/start`
2. **Target folder** - a folder path relative to the project root, e.g. `src/server/quote/start/`

## Steps

1. **Fetch the prototype HTML** using Claude chrome.
2. **Extract only the `<main>` element content** from the fetched HTML. Ignore everything outside `<main>` (header, footer, nav, phase banners, etc.) as these are handled by the layout template.
3. **Generate a Nunjucks view file** at `{target folder}/index.njk` following the rules below.

## Output file structure

The generated `index.njk` must:

- Extend `layouts/page.njk`
- Define a `{% block pageTitle %}` with the page title text followed by ` - GOV.UK`
- Define a `{% block content %}` containing the converted markup
- Use GOV.UK Design System Nunjucks macros for recognised components (see Component Mapping below)
- Keep all other GOV.UK Frontend CSS classes as-is in the HTML (headings, body text, grid classes, lists, etc.)
- Replace all `href` values in links with `#` (except `mailto:` links which should be kept as-is)

## Reference view

Use `src/server/quote/start/index.njk` as an example of the target output format and conventions.

## Component mapping

When the prototype HTML contains elements matching these patterns, convert them to the corresponding Nunjucks macro.

For each matched component, fetch the reference URL (without JavaScript) and locate the Nunjucks code example to determine the correct import statement and macro call syntax.

| CSS class pattern | Component | Macro reference                                                                 |
| ----------------- | --------- | ------------------------------------------------------------------------------- |
| `govuk-button`    | Button    | https://design-system.service.gov.uk/components/button/#button-example-nunjucks |

### Macro import placement

Place all `{% from ... %}` imports at the top of the file, immediately after the `{% extends %}` line and before any blocks.

## What NOT to do - will be added later

- Do not add forms, CSRF tokens, or form handling - this will be added later
- Do not use template variables - use hardcoded text content from the prototype
- Do not add error handling or validation markup
- Do not add code comments
