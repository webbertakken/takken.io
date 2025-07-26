# Rules (v2.0 - Concise)

## Workflow

- Use volta for node/yarn versions
- Yarn for packages, bun for standalone TS
- Plan → Execute → Verify (lint, typecheck, test)
- Fix all issues immediately, no suppressions

## Code Style

- British English, no title case
- Small focused modules, single responsibility
- Domain-driven structure (not technical layers)
- Pure functions, immutable state where possible
- Document with JSDoc and light comments

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

## IMPORTANT: Keep Claude rules concise to preserve context window!
