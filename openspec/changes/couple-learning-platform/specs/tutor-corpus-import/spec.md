## Purpose

Defines tutor text corpus import for private Agent training: UTF-8 validation, chunking limits, async processing, import history, edit/replace, and full-import rollback.

## ADDED Requirements

### Requirement: Accept text files with UTF-8 validation
The system MUST accept common text uploads for training and MUST reject files that are not valid UTF-8 before any database write of chunk content or embeddings.

#### Scenario: Invalid encoding rejected
- **WHEN** a tutor uploads a file that fails strict UTF-8 decoding
- **THEN** the import is rejected with guidance to re-save as UTF-8 and no COUPLE chunks are created

#### Scenario: Valid UTF-8 proceeds to preview
- **WHEN** a tutor uploads a valid UTF-8 text file within size and chunk limits
- **THEN** the system produces a dry-run chunk preview for confirmation

### Requirement: Private RAG training only
Confirmed imports MUST create COUPLE-scoped knowledge for the tutor's couple and subject, and MUST NOT fine-tune shared model weights as a v1 behavior.

#### Scenario: Confirm import writes couple knowledge
- **WHEN** the tutor confirms a valid preview
- **THEN** the system enqueues processing that results in COUPLE knowledge chunks for that couple

### Requirement: Import history with edit and rollback
Tutors MUST be able to list their couple import history and choose a past import to edit or roll back.

#### Scenario: Rollback removes import artifacts
- **WHEN** the tutor rolls back import I
- **THEN** all COUPLE knowledge produced by I is removed and the import is marked rolled back

#### Scenario: Edit replaces via full import semantics
- **WHEN** the tutor edits import I and confirms new chunking
- **THEN** the system replaces I's artifacts using full-import replace semantics (no partial leftover from the prior revision)

### Requirement: Cancel means full rollback
Canceling an in-progress or queued import MUST fully roll back that import's artifacts and MUST NOT leave a partial corpus from that import.

#### Scenario: Cancel while running
- **WHEN** the tutor cancels import I while processing
- **THEN** processing stops at a safe boundary and all artifacts for I are removed
