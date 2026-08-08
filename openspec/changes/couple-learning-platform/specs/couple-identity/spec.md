## Purpose

Defines couple-scoped identity: paired registration, unique emails, dual verification, and strict one-tutor one-learner membership with a separate platform operator role.

## ADDED Requirements

### Requirement: Paired registration creates exactly one couple with two accounts
The system MUST allow registration that creates exactly two user accounts and one couple in a single transaction, and MUST require the registrant to designate exactly one TUTOR and one LEARNER.

#### Scenario: Successful paired registration
- **WHEN** a visitor submits two distinct emails, credentials, display names, and role assignments of one TUTOR and one LEARNER
- **THEN** the system creates two users, one couple in PENDING_VERIFY status, and two memberships with those roles

#### Scenario: Duplicate email rejected
- **WHEN** either submitted email already belongs to an existing account
- **THEN** the system rejects the entire registration and creates no orphan user or couple

### Requirement: Email uniqueness
Each email address MUST map to at most one user account.

#### Scenario: Second account with same email
- **WHEN** registration or account creation uses an email already in use
- **THEN** the system rejects the operation

### Requirement: Strict dual email verification before ACTIVE
A couple MUST remain PENDING_VERIFY until both members verify their emails, and MUST NOT unlock learning or tutoring capabilities before ACTIVE.

#### Scenario: Only one side verified
- **WHEN** only one member has verified email
- **THEN** the couple stays PENDING_VERIFY and neither member can access learn, tutor, homework, or corpus-import features

#### Scenario: Both verified
- **WHEN** both members complete email verification
- **THEN** the couple becomes ACTIVE and role-appropriate features unlock

### Requirement: Strict one-to-one membership
Each user MUST belong to at most one couple, and each couple MUST have exactly one TUTOR membership and exactly one LEARNER membership.

#### Scenario: User cannot join second couple
- **WHEN** an already-membered user attempts to register or join another couple
- **THEN** the system rejects the operation

### Requirement: Platform operator is not a couple member
PLATFORM_ADMIN accounts MUST authenticate for operations console access and MUST NOT be required to hold CoupleMembership.

#### Scenario: Operator without couple
- **WHEN** a PLATFORM_ADMIN signs in to the ops console
- **THEN** access is granted based on platform role without couple membership
