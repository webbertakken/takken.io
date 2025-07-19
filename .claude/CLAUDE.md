# Rules

<!-- Webber's concise LLM rules for web development (v1.5) -->

## Workflow

- Use volta to automatically use the correct version of node and yarn
- Prefer bun for running standalone ts scripts
- Don't use the build command to verify it works, unless you can't find the issue
- Use Yarn as the package manager and define scripts in package.json
- Plan before execution, and fix errors immediately
- Use non-interactive commands where possible
- Run dev server in background, monitor output
- Verify after every change: lint, format, typecheck, test, etc. - fix until clean
- Make sure all console output from tests is fixed - do not suppress globally
- Always verify changes before saying what you've implemented

## General practices

- Use British English
- Do not capitalise the first letter of each word in titles

## Git Practices

- Never use co-authoring from Claude
- Never commit local dependency resolution; publish first

## Code quality

- Keep docs clear, concise, and current
- Use JSDoc for functions, and explain complex logic
- Document domain concepts where they live
- Write small, reusable functions with descriptive names
- Add light comments to clarify intent in non-obvious areas

## Structure

- Keep modules small and focused — `single responsibility`.
- Prefer explicitness to cleverness or abstraction.
- Co-locate logic with the data it operates on.
- Write for readability first, then performance.
- Favour composition over inheritance or deep trees.

## Domain Driven Design

- Organise around domain concepts, not technical layers.
- Prefer cohesive, meaningful structure over convention.
- Make error states explicit and easy to trace.
- Create domain-specific types, interfaces, and error types.
- Avoid vague folders/names like `utils`, `services`, `helpers`, `process`, etc.

## Functional Programming

- Write pure functions where possible.
- Separate side effects from business logic.
- Use function composition.
- Avoid mutating state.

## Testing

- Write tests in a descriptive, behavior-focused manner
- Focus on behavior and outcomes rather than implementation details
- Follow the Arrange-Act-Assert pattern
- Use `it('handles utf-8...'` instead of `test('it should handle utf-8...'` and so on
- Mock dependencies effectively, but avoid over-mocking
- Keep types practical. For example implicit any is fine for tests.
- Use fake timers for time-dependent tests
- Each test must pass in under 200ms

## Ethics

- Privacy – Collect minimal data, follow GDPR, anonymise, give user control
- Accessibility – Follow WCAG, support assistive tech
- Inclusivity – Use inclusive language, avoid bias, design for diversity
- Sustainability – Optimise performance, minimise resource use
- Integrity – Respect licenses, credit contributions, contribute responsibly

## Human-Centred Design

- User-Centric Design – Empower users with clear feedback, no dark patterns
- Transparency – Explain data use and features clearly; offer user control
- Security – Protect data with secure practices and regular updates
- Responsiveness – Optimise for all devices and input types
- Feedback – Listen, analyse, and iterate based on real user input

## Security

- Validate inputs – Use types, sanitize at boundaries
- Handle errors safely – Show clean messages, log details internally
- Auth – Use OAuth/JWT, apply RBAC, secure tokens
- Protect data – Encrypt in transit/at rest, enforce HTTPS
- Stay up to date – Audit dependencies, use lock-files, set security headers
