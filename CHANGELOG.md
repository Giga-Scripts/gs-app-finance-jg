# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- GitHub issue templates for bug reports and feature requests.
- Open-source docs scaffolding (`CONTRIBUTING.md`, `SECURITY.md`, `LICENSE`).

### Fixed

- Compatibility with the updated `17mov_Phone` app template. The new template calls
  `window.__dispatchAction` inside each external app's iframe; the app now installs that bridge
  (plus `__externalAppReady` / `setExternalRouting`) at startup, fixing the
  `__dispatchAction is not a function` error that broke the phone's render. Inert on other phones.

## [1.0.0] - 2026-02-24

### Added

- Initial public release of `gs-app-finance-jg`.
- Multi-phone bridge support (`lb-phone`, `yseries`, `yphone`, `17mov_Phone`, `gksphone`).
- Framework support for Qbox, QBCore, and ESX.
- Vehicle finance dashboard + details flow (installment and full payoff).
- Locale-aware UI with EN/PT-BR translations and `ui_number_locale` formatting.
- Vehicle image fallback chain (`jg-advancedgarages` -> `jg-dealerships` -> GTA docs).
