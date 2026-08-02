# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- `sheenOpacity` spring now uses `SHEEN_SPRING` (was `SCALE_SPRING`) for consistent glare feel
- `PX_PER_DEG` constant moved to module scope to avoid per-render allocation
- Sheen overlay `z-index` reduced from `9999` to `1` to avoid intercepting pointer events
- Removed dead `pointerEvents: 'auto'` from perspective wrapper
