# Codex Admin Refactor Rules

## Required skills

Before making changes, locate and read the installed SKILL.md files.

Apply the following skills when relevant:

1. redesign-existing-projects
2. design-taste-frontend
3. gpt-taste
4. minimalist-ui
5. full-output-enforcement

Also read:

- ADMIN_UI_REDESIGN.md
- This file

## System protection

- Preserve business logic.
- Preserve API contracts.
- Preserve routing.
- Preserve permission checks.
- Preserve the current data flow.
- Do not replace the existing UI library without a documented technical reason.
- Do not install a new dependency when the current stack can support the requirement.
- Prefer incremental refactoring over full rewrites.
- Do not leave TODO, FIXME, pseudo-code, placeholders, or incomplete output.
- Do not use any to hide TypeScript problems.
- Do not disable lint rules merely to pass checks.
- Do not edit files outside the declared phase scope unless strictly required.

## Required verification

After implementation, run the project’s available commands for:

- Lint
- Type-check
- Tests
- Production build

Review the final git diff before reporting completion.

Do not claim a check passed unless the command was actually executed successfully.

## Design settings

- DESIGN_VARIANCE: 4/10
- MOTION_INTENSITY: 2/10
- VISUAL_DENSITY: 7/10

## Design direction

The admin interface must be:

- Friendly
- Modern
- Readable
- Easy to operate
- Appropriate for a flower store
- Soft but professional
- Optimized for repeated administrative work

Avoid:

- Landing-page-like admin screens
- Unnecessary gradients
- Excessive glassmorphism
- Heavy shadows
- Cards nested inside cards
- Decorative icons without meaning
- Low-contrast pastel text
- Motion that slows down operations

Prioritize:

- Data readability
- Clear hierarchy
- Fast operations
- Responsive behavior
- Accessibility
- Consistent component states