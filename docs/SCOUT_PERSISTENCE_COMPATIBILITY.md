# Scout persistence compatibility

The async PostgreSQL/pilot batch and the Scout namespace batch were developed from the same prior commit and reconciled locally. New pilot UI uses Scout Learning. Canonical learning and admin entry points use the Scout namespace. New callers import review through the Scout facade.

The namespace guard has exact, bounded exceptions for the existing CI certification command paths, historical persistence architecture, generated certification reports containing historical test names, the review/catalog facade, the canonical admin facade, aggregate queries over existing evidence kinds, and tests/configuration that exercise those historical records. These references preserve compatibility and audit history; they do not authorize legacy customer-facing branding or new evidence namespaces. Historical migration files and evidence are not renamed.

The guard examines Git-tracked and non-ignored new source files. Generated builds, local database files and downloaded tooling are excluded by Git ignore rules rather than becoming accidental source baselines.

## Release hold

`vercel.json` disables automatic Git deployments only for `mvp-integration-w100`, preserving the hosted-release gate while allowing source backup and CI. Production branch `main` is unchanged. This follows [Vercel Git configuration](https://vercel.com/docs/project-configuration/git-configuration). Remove this branch hold only after hosted persistence, migration review and human content gates are satisfied. No manual deployment is authorized by a successful local check.
