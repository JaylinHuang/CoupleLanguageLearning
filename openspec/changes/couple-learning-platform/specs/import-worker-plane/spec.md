## Purpose

Defines the high-concurrency import worker plane for embedding and upserting tutor corpus jobs with fair per-couple serialization, idempotency, and load-testability via mock embedders.

## ADDED Requirements

### Requirement: Asynchronous import processing
Corpus embedding and persistence MUST run asynchronously after tutor confirmation so user-site requests are not required to hold open for the full import duration.

#### Scenario: Confirm returns quickly
- **WHEN** a tutor confirms an import
- **THEN** the system acknowledges queuing and exposes progress without requiring the HTTP request to remain open until all chunks are embedded

### Requirement: Per-couple serial processing
At most one import for a given couple MUST be actively embedding at a time; additional imports for that couple MUST wait in queue order.

#### Scenario: Second import waits
- **WHEN** couple C already has a running import and another import is confirmed
- **THEN** the second import remains queued until the first reaches a terminal state

### Requirement: Idempotent chunk writes
Retries and lease recovery MUST NOT create duplicate knowledge for the same import chunk index.

#### Scenario: Worker crash mid-batch
- **WHEN** a worker dies after partially completing an import and another worker resumes
- **THEN** the final COUPLE knowledge for that import contains each chunk index at most once

### Requirement: No hash embedding fallback on import
Import embedding failures MUST fail or retry the batch and MUST NOT persist deterministic hash pseudo-vectors as production knowledge.

#### Scenario: Embed API failure
- **WHEN** the embedding provider returns an error for a batch
- **THEN** the system retries according to policy or marks the import failed without writing hash embeddings for those chunks

### Requirement: Mock embedder load testing
The worker plane MUST support a mock embedder mode for load tests that vary worker count and artificial latency without calling the external embedding provider.

#### Scenario: Mock matrix run
- **WHEN** operators run the documented load fixture with mock delay and multiple workers
- **THEN** the system completes imports with zero duplicate chunks and records throughput metrics for comparison
