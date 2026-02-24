# Contributing

Thanks for contributing to `gs-app-finance-jg`.

## Scope

- Keep changes scoped to this resource only.
- Avoid repo-wide formatting or unrelated refactors.

## Local Workflow

1. Make your code changes.
2. If you touched UI source (`ui/src` or `ui/public`), run:

```bash
cd ui
npm install
npm run build
```

3. Validate the app in-game (open app, fetch vehicles, payment flow, notifications).
4. Include validation notes in your PR.

## Code Guidelines

- Keep app-facing text in locale files (`locales/*.json`).
- Keep system/console logs in English.
- Preserve bridge priority behavior (first started supported phone wins).
- Do not commit secrets or environment credentials.

## Pull Requests

- Use clear PR titles and descriptions.
- Reference related issue IDs when applicable.
- List exactly what was tested and on which framework/phone combination.
