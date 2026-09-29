# Teensurance IP Provenance and Competitive Independence Policy

## Purpose

Teensurance must be developed as an independent product. Competitor products may be studied to understand market categories, but they must never be used as design specifications, source material, implementation templates, or branding references.

## Product boundary

Supervised-driving logging is a supporting evidence capability inside the broader Teensurance journey:

Practice evidence -> readiness -> jurisdiction progress -> Safety & Readiness Passport -> insurance readiness -> coverage.

The driving log is infrastructure. It is not the Teensurance product category.

## Clean-room rules

1. Do not copy competitor source code, APIs, text, graphics, screenshots, information architecture, lesson content, workflows, or distinctive visual presentation.
2. Do not reverse engineer a competitor product to reproduce proprietary behavior.
3. Do not use competitor names or confusingly similar names as Teensurance product branding.
4. Derive jurisdiction rules and licensing requirements from authoritative government or regulator sources, with source URL, effective date, version, and human review status.
5. Derive insurance facts from carriers, regulators, approved data providers, or other authoritative sources. Never infer a discount, eligibility decision, quote, or underwriting outcome from practice evidence alone.
6. Store provenance for educational, regulatory, safety, and insurance content so each material claim can be traced to its independent source.
7. New telematics, trip-detection, scoring, insurer-data-exchange, and readiness-scoring features require an explicit product/legal review before production release.
8. Competitor research may identify user problems and category expectations, but implementation decisions must be justified by Teensurance requirements, safety policy, user research, or authoritative source material.

## Naming rule

"RoadReady" is a third-party product name and must not be used as Teensurance-facing branding.

The existing `roadready` code namespace and routes are legacy technical identifiers created before this policy. They are not product branding and should be migrated to a Teensurance-owned namespace in a controlled refactor. Until that migration is complete:

- UI copy must use **Scout Learning**, **Road Knowledge**, or another approved Teensurance-owned label.
- New files, routes, components, APIs, database objects, tests, and documentation must not introduce new `roadready` identifiers.
- Existing legacy identifiers may be changed only through an intentional migration that preserves compatibility and evidence history.

## Evidence architecture

Practice records must remain evidence, not legal or insurance conclusions.

A practice record may establish facts such as:

- duration entered and verified,
- supervisor identity or relationship,
- day/night indicator,
- practice focus,
- guardian attestation,
- source and timestamp.

It must not by itself establish:

- legal eligibility to test or license,
- official completion of a jurisdiction requirement,
- safe-driver status,
- risk score,
- insurance eligibility,
- premium amount,
- discount entitlement,
- underwriting approval.

Those conclusions require their own authoritative rule or external decision source.

## Review checklist

Before release, reviewers should confirm:

- no competitor branding appears in customer-facing copy;
- new requirements cite independent authoritative sources;
- content provenance is stored and visible to reviewers;
- no copied competitor assets or wording are present;
- practice evidence is separated from legal and insurance determinations;
- any telematics or automated detection feature has consent, privacy, safety, and legal review;
- migrations preserve historical evidence and audit records.
