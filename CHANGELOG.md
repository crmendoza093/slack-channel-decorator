# Changelog

All notable changes to the **Slack Channel Decorator** extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2026-03-04

### Changed
- Improved hover tooltip with channel purpose and type information.

## [0.1.0] - 2026-02-21

### Added
- Inline channel name decorations for Slack Channel IDs.
- Rich hover tooltips with channel name, type, and purpose.
- Dual-layer caching (in-memory + persistent disk).
- Secure token storage via VS Code SecretStorage API.
- Configurable file extensions to scan.
- Commands: `Set Bot Token` and `Clear Cache`.
- Request deduplication to prevent Slack API rate-limiting.
- Throttled decoration updates (500ms debounce).
