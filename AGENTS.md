# Rules (v2.0 - Concise)

## Workflow

- Use volta for node/yarn versions
- Yarn for packages, bun for standalone TS
- Plan → Execute → Verify (lint, typecheck, test)
- Always run `npx prettier --write` on changed files before committing
- Fix all issues immediately, no suppressions

## Code Style

- British English, no title case
- Small focused modules, single responsibility
- Domain-driven structure (not technical layers)
- Pure functions, immutable state where possible
- Document with JSDoc and light comments

## Writing

- Don't use the word "AI" when it's not necessary. For example, "AI coding agents" should simply be
  "coding agents". Only use "AI" when it adds meaningful distinction or clarity.
- Follow the writing style in ~/WRITING_STYLE.md
- When adding a new blog post, update the "Latest posts" card in src/components/Home/index.tsx

## Testing

- Use type-safe test utilities from src/test/test-utils.tsx
- Behavior-focused: `it('handles X')` not `test('should...')`
- Arrange-Act-Assert pattern
- Mock sparingly, use test utilities for type safety
- Never use `any` without reason, prefer typed mocks
- Tests must run < 200ms

## Git

- No co-authoring, no local dependency commits

## Security & Ethics

- Validate inputs, handle errors safely
- Follow GDPR, WCAG, inclusive design
- No dark patterns, respect licenses

## Key Reminders

- Do only what's asked
- Edit existing files over creating new
- No proactive docs/README creation

## IMPORTANT: Keep rules concise to preserve context window!
