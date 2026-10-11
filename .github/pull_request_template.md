## Pull Request Template

> **Note:** This template is automatically populated when opening a PR via the GitHub UI or `gh pr create` (if the repo has a default template set).  Fill in the sections below; the CI checks will validate the title format.

### 📋 Checklist

- [ ] Lint & typecheck pass (`npm run lint` and `npm run typecheck`)
- [ ] Unit tests pass (`npm run test`)
- [ ] Production build succeeds (`npm run build`)
- [ ] E2E tests pass when `E2E_TEST_AUTH=1` (`npm run test:e2e`)
- [ ] Fail‑closed production guard verified (building with `E2E_TEST_AUTH=1` in `NODE_ENV=production` must fail)
- [ ] No new `console.log`/`debugger` left in source (or explicitly allowed)
- [ ] Sensitive secrets are **not** committed (use placeholders in `.env.example`)
- [ ] Documentation updated if user‑visible behavior changed

### 🧪 Evidence

<!-- Provide any of the following that apply -->
- **Screenshots** of UI changes (use the `image` markdown syntax: `![alt text](url)`)
- **Test output** snippets (lint, typecheck, test, build)
- **Runtime logs** or error messages (redact secrets)
- **Performance numbers** if relevant

### 🔒 Security / RLS checklist (if applicable)

- [ ] Per‑user ownership enforced in server‑side repositories
- [ ] PostgreSQL RLS policies are correct and tested
- [ ] Foreign‑key same‑owner constraints present
- [ ] No `BYPASSRLS` role used

### 📝 Additional context

- **Problem solved / feature description:**
  <!-- Free‑form description of the change -->
- **Breaking changes?** (list any API or schema breaks)
- **Migration notes** (if database changes are included)
- **How has this been tested?** (local commands, CI jobs, manual steps)

--- 

#### Title convention (required by CI)

The PR title **must** follow the conventional‑commit pattern used by the `PR Title` check:

```
^(✨ feat|🐛 fix|🧪 test|♻ refactor|📚 docs|⚙ chore|👷 ci|💄 style|⚡ perf|📦 build|⏪ revert)(\([a-z0-9._/-]+\))?!?: .+
```

**Example acceptable titles**

- `✨ feat: add secret‑free test‑auth adapter`
- `🐛 fix: correct RLS policy for new tables`
- `🧪 test: add unit tests for session seam`
- `♻ refactor: split auth utils into modules`

If your change does not fit one of the above types, either rename the PR title to match or request a temporary exemption from the repository maintainers.