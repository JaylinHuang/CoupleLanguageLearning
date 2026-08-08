## Purpose

Defines subjects, courses, parallel enrollments per couple, owner-editable templates with stable IDs, pinned-version citation by other tutors, and fork-on-edit isolation.

## ADDED Requirements

### Requirement: Parallel course enrollment per couple
An ACTIVE couple MUST be able to enroll in multiple courses at the same time across one or more subjects.

#### Scenario: Two active enrollments
- **WHEN** a couple enrolls in a shared Chinese course and another course concurrently
- **THEN** both enrollments remain ACTIVE and appear in the couple learning context

### Requirement: Shared templates and couple-private courses
The system MUST support courses that are shared templates and courses that are private to one couple.

#### Scenario: Private course visibility
- **WHEN** couple A owns a private course
- **THEN** couple B MUST NOT see or enroll in that private course unless a separate citation or share flow grants access per template rules

### Requirement: Template ownership and independent ID
Each tutor-owned template MUST have an independent template ID, and ONLY the owning tutor MUST be allowed to edit that template.

#### Scenario: Non-owner edit rejected
- **WHEN** a tutor who does not own template T attempts to modify T
- **THEN** the system rejects the modification and T is unchanged

### Requirement: Cite by template ID with pinned version
A tutor MUST be able to cite another tutor template by searching its template ID, and the citation MUST pin a specific template version.

#### Scenario: Pin version on cite
- **WHEN** tutor B cites template T at version k
- **THEN** B's enrollment or course link uses (T, k) and does not automatically move when T publishes version k+1

#### Scenario: Owner updates do not rewrite citers
- **WHEN** owner A publishes a new version of T after B cited version k
- **THEN** B continues on version k until B explicitly upgrades the citation

### Requirement: Fork required before editing cited content
If a citing tutor wants to change cited material, the system MUST create a new template owned by that tutor (fork) and MUST NOT write changes back to the original owner's template.

#### Scenario: Edit after cite forks
- **WHEN** tutor B, who cited (T, k), chooses to edit the material
- **THEN** the system creates template T' owned by B, optionally records forkedFrom (T, k), and subsequent edits affect only T'
