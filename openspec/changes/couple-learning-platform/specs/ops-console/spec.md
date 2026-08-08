## Purpose

Defines the local-only platform operations console for PLATFORM_ADMIN: global shared content and couple metadata governance without access to private corpus bodies.

## ADDED Requirements

### Requirement: Local ops console for platform admin
The system MUST provide a PLATFORM_ADMIN operations experience intended to run locally against the shared database, and MUST NOT require deploying that console as a public production website.

#### Scenario: Operator uses local ops
- **WHEN** a PLATFORM_ADMIN starts the ops console locally with valid credentials
- **THEN** the operator can perform allowed governance actions without the console being published on the public user-site deployment

### Requirement: Shared catalog governance
PLATFORM_ADMIN MUST be able to manage shared subject catalog materials such as SHARED Chinese HSK resources and official shared course templates.

#### Scenario: Update shared template
- **WHEN** the operator publishes changes to a shared official template
- **THEN** those changes apply to the shared template catalog according to versioning rules and do not rewrite couple-private forks

### Requirement: Couple metadata without private bodies
Ops couple views MUST expose operational metadata needed for support and MUST NOT expose COUPLE private text bodies.

#### Scenario: Support view
- **WHEN** the operator opens a couple record
- **THEN** status, membership emails/usernames as allowed, and import job metadata may be shown, while private import and chunk bodies are withheld
