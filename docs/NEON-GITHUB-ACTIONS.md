# Neon pull-request database branches

`.github/workflows/neon_workflow.yml` creates or reuses a Neon branch when a PR opens, reopens, or receives commits. Closing or merging the PR deletes that same branch. Names include the repository ID and PR number so repositories sharing a Neon project do not collide.

## Repository configuration

In GitHub → Settings → Secrets and variables → Actions, configure:

| Setting | Type | Required | Value |
| --- | --- | --- | --- |
| `NEON_API_KEY` | Secret | Yes | Neon API key with access to the intended project |
| `NEON_PROJECT_ID` | Variable | Yes | Dedicated Teensurance Neon project ID |
| `NEON_PARENT_BRANCH` | Variable | No | Parent branch name or ID; omitted means project default |
| `NEON_DATABASE` | Variable | No | Existing database; defaults to `neondb` |
| `NEON_DATABASE_ROLE` | Variable | No | Existing database role; defaults to `neondb_owner` |

The Neon GitHub integration may provision the required secret and variable. No credentials belong in this workflow or a committed environment file.

Merge the workflow into the repository's default/base branch to enable the trusted `pull_request_target` event. Then open a PR and check its branch in the Neon Console. Close the PR and confirm deletion. Reopening creates a fresh branch; synchronizing an open PR reuses the existing branch without resetting it.

## Scope and security

- Schema-only branches intentionally omit parent data, including household/minor records. Compute suspends after 300 seconds of inactivity.
- The workflow supports fork PRs but never checks out PR code, runs migrations, installs PR dependencies, or exposes connection strings to PR jobs. Do not add untrusted-code execution to this secret-bearing workflow.
- Actions are pinned to immutable commits. Creation and deletion share a per-PR concurrency group, and running jobs are not cancelled midway through provisioning.
- This manages Neon branch lifecycle only. It does not migrate application persistence, configure preview deployment URLs, apply migrations, or seed fixtures.
- Missing configuration fails with an explicit error. Live creation/deletion requires GitHub/Neon configuration and is not established by local YAML validation.

References: [Neon GitHub integration](https://neon.com/docs/guides/neon-github-app), [create branch action](https://github.com/neondatabase/create-branch-action), [delete branch action](https://github.com/neondatabase/delete-branch-action).
