## Purpose

Defines subject-agnostic learning items, Chinese field extensions, generic fallback items for future subjects, global SRS binding, and couple-private lessons.

## ADDED Requirements

### Requirement: Learning items as content atoms
Reviewable content MUST be represented as learning items with a subject, scope (SHARED or COUPLE), and item type.

#### Scenario: Create generic item
- **WHEN** a tutor adds a non-Chinese item with title, primary meaning, and tags
- **THEN** the system stores it as a generic learning item usable by review and retrieval for that subject and scope

### Requirement: Chinese extension fields
Chinese vocabulary items MUST support simplified form, pinyin, and HSK level (or equivalent level label) via a Chinese-specific extension without requiring those fields on generic items.

#### Scenario: Chinese word has extension
- **WHEN** a SHARED or COUPLE Chinese word item is created
- **THEN** Chinese extension fields are stored and generic-only fields remain optional

### Requirement: Global SRS per learner and item
Version-1 spaced repetition MUST track progress per learner user and learning item globally, not per course.

#### Scenario: Same item across two courses
- **WHEN** a learner reviews an item that appears in two enrolled courses
- **THEN** a single review card state is updated for that learner-item pair

### Requirement: Couple-private lessons
A couple MUST be able to own private lessons under a couple-private course that are not part of the shared template catalog.

#### Scenario: Private lesson authoring
- **WHEN** the couple tutor creates a lesson on a couple-private course
- **THEN** only that couple can access the lesson content for learning
