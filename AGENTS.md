# Project Overview

This repository contains a small full-stack Cohort Viewer for customer-experience teams. The application allows an operator to filter a mortgage-consumer dataset, inspect the resulting cohort, review product-category coverage, and preview recovery communications before they are sent.

The project is intended to demonstrate an end-to-end, production-minded implementation. Changes should favor clear boundaries, predictable behavior, and code that can be explained and maintained easily.

## Core Goals

- Provide a useful interface for querying and previewing consumer cohorts.
- Keep access rules and product mappings configurable rather than embedded in business logic.
- Handle missing, malformed, disallowed, and unmapped data deliberately.
- Maintain an auditable record of cohort queries.
- Design data access with datasets much larger than the supplied sample in mind.
- Make operational states and guardrails visible to the user.

## Technology Stack

The repository is organized as a monorepo with two applications:

- `frontend/`: React, TypeScript, and Vite.
- `backend/`: Python 3.12+ and FastAPI, managed with `uv`.

Data and runtime behavior are driven by CSV input, JSON configuration, and environment variables. The frontend communicates with the backend over HTTP.

## Engineering Guidelines

- Keep frontend presentation, API behavior, data access, configuration, and audit concerns appropriately separated.
- Prefer simple, explicit implementations over unnecessary abstractions.
- Treat configuration as external input and validate it at clear boundaries.
- Preserve meaningful error information across the API and user interface.
- Account for performance and memory use when working with consumer data.
- Add tests around important behavior and edge cases as features are introduced.
- Keep documentation aligned with the commands and behavior that actually ship.

## Product Principles

- Consumer data should be exposed only for allowed firms.
- Unmapped or incomplete data should remain visible rather than being silently discarded.
- User-facing controls should accurately reflect the filters sent to the API.
- Audit output should be structured enough for later operational analysis.
- The interface should make loading, empty, warning, and error states understandable.

## Quality Gates

Treat the following as acceptance criteria for relevant changes. A feature is not complete merely because its primary path works.

- **Scalable data access:** Do not implement cohort queries by loading the complete dataset into application memory. Designs and tests should reflect that the production-equivalent dataset may contain millions of rows.
- **Runtime mapping updates:** Changes to the product-mapping configuration must affect subsequent requests without an application restart. Verify this behavior explicitly.
- **Queryable audit trail:** Record each query as structured data with enough context to determine, from the audit log alone, which firms were queried during a time window, their query frequency, and the result count for each query.
- **Configuration boundaries:** Firm access rules and product mappings must remain external to business logic. Changing either configuration must not require a Python code change.
- **Deliberate error handling:** Cover disallowed firms, missing session timestamps, unmapped product types, malformed parameters, invalid configuration, and relevant empty states. API errors should be specific, and the frontend should present actionable states where applicable.

Prefer automated tests for these guarantees. When a behavior cannot be enforced automatically, document the verification procedure and the associated trade-off.
