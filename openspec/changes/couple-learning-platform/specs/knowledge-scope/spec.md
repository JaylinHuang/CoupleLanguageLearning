## Purpose

Defines retrieval visibility for shared subject corpora versus couple-private supplements, and guarantees operators cannot read private corpus bodies.

## ADDED Requirements

### Requirement: Shared union couple-private retrieval
For an ACTIVE couple and subject, RAG retrieval MUST return the union of SHARED chunks for that subject and COUPLE chunks owned by that couple for that subject.

#### Scenario: Couple sees shared HSK plus own notes
- **WHEN** the learner chats with subject Chinese
- **THEN** retrieval may include SHARED Chinese chunks and that couple's COUPLE chunks, and MUST NOT include another couple's COUPLE chunks

### Requirement: Private corpus never promotes to shared
COUPLE-scoped knowledge MUST NOT be promoted into SHARED scope by normal product flows.

#### Scenario: Import stays couple-scoped
- **WHEN** a tutor imports training text for their couple
- **THEN** resulting chunks are COUPLE-scoped for that couple only

### Requirement: Operators cannot read private bodies
PLATFORM_ADMIN operations views and APIs MUST NOT expose COUPLE chunk content, import file bodies, or import staging text.

#### Scenario: Ops lists import metadata only
- **WHEN** a platform operator inspects an import job
- **THEN** the operator can see metadata such as status, counts, and timestamps, and MUST NOT receive private text bodies
