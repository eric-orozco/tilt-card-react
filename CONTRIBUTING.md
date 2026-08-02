# Contributing to @eao/tilt-card

Thanks for your interest in contributing! This document covers everything you need to get set up.

## Development setup

```bash
git clone <repo-url>
cd tilt-card-react
pnpm install
```

## Development workflow

```bash
pnpm build        # build ESM + CJS bundles
pnpm test         # run unit tests
pnpm storybook    # open Storybook for visual testing
pnpm lint         # ESLint + knip dependency check
```

## Making a change

1. **Create a branch** from `main` for your feature or fix.
2. **Write tests** — new behavior needs new tests. Existing tests must pass.
3. **Run `pnpm build`** — if the build fails, your change won't ship.
4. **Update the changelog** — add an entry under `## [Unreleased]` in `CHANGELOG.md`.
5. **Open a pull request** — describe what changed and why.

## Commit conventions

We use conventional commits:

```
feat: add parallax depth animation
fix: resolve glare spring inconsistency
docs: update README API table
chore: update motion peer dep to v12
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`.

## Releasing

This project uses [changesets](https://github.com/changesets/changesets).

```bash
npx changeset        # describe your changes
npx changeset version  # bump version, update changelog
```

A maintainer will publish to npm after merge.

## Code of conduct

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## Security

See [SECURITY.md](./SECURITY.md).
