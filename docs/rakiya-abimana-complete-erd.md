# Rakiya-Abimana Complete Proposed ERD

This document explains the complete Sprint 01 database proposal in [rakiya-abimana-complete-erd.dbml](./rakiya-abimana-complete-erd.dbml). The DBML is designed for import into dbdiagram.io and targets PostgreSQL.

## Scope and evidence

The design was derived from the repository README, the current Prisma schema, Prisma migrations, seed data, routes, permissions, services, and frontend pages. The implementation is an MVP, so the diagram deliberately distinguishes:

- **Existing**: already represented by the current Prisma schema or directly implemented in the application.
- **Proposed**: normalized or future Sprint 01 extensions that are not currently implemented and must not be applied to the database without a separate migration and implementation plan.

The DBML uses green table headers for existing entities and gold table headers for proposed entities.

## Existing modules and entities

### Accounts, roles, and administration

- `users` stores authentication identity, password hash, personal details, active/verified flags, preferred language, consent timestamp, and approximate location.
- `roles` and `user_roles` represent the seven current roles: Admin, Verifier, JobSeeker, Entrepreneur, Employer, Funder, and TrainingProvider. The current application uses a Prisma enum and a junction model; the proposed reference table makes role metadata and self-registration policy data-driven.
- `languages` is a proposed reference table for the supported English (`en`), Sinhala (`si`), and Tamil (`ta`) codes.
- `system_settings` stores settings such as matching radius, translation enablement, upload size, and verification stub mode.
- `audit_logs` records administrator and verification actions, including actor, target, details, IP address, and timestamp.

### Sri Lankan location and master data

- `districts` contains the 25 seeded Sri Lankan districts, province, coordinates, and English/Sinhala/Tamil names.
- `job_categories` and `trades` contain the multilingual employment taxonomy.
- `sectors` contains the multilingual entrepreneurship/funding sectors.

The current implementation uses multilingual columns for stable master data. This is appropriate for the fixed three-language scope and keeps common reads simple. The `languages` table is included as a proposed foreign-key reference for user/content language codes.

### Role-specific profiles

The current schema has one-to-zero-or-one profile rows for each role-specific profile:

- `job_seeker_profiles`: worker category, free-text skills, trade, experience, bio, education, preferences, and expected salary.
- `employer_profiles`: company information, registration number, industry, address, contact, and website.
- `entrepreneur_profiles`: business idea, stage, category, experience, and funding requirement.
- `funder_profiles`: funder type, organization details, interests, focus districts/sectors, and directory visibility.
- `training_provider_profiles`: institution, courses, categories, accreditation, location, contact, and website.
- `training_courses`, `course_skills`, `training_enrollments`, and `training_certificates` are proposed extensions for a future training directory and learner workflow. They are separate from the provider profile so a provider can publish multiple courses and learners can enroll in each course once.

The current job seeker skills and funder focus values are stored as text. The proposed `skills`, `user_skills`, `businesses`, and `business_members` tables provide a normalized path for scalable search and multi-member businesses. They are not replacements to apply automatically.

### Employment

- `jobs` stores employer-owned postings, location, wage, source language, status, and description.
- `job_applications` is the many-to-many junction between users and jobs, with application status and notes. The unique `(job_id, applicant_id)` constraint prevents duplicate applications.
- `job_skills` is proposed for structured job-to-skill requirements.
- `application_status_history` is proposed to preserve status changes for review and reporting.
- `saved_jobs` is a proposed bookmark feature and is explicitly marked as an assumption because it is not present in the current code.

### Entrepreneurship and funding

- `pitches` is the existing funding request/proposal entity. It belongs to an entrepreneur and optionally references a sector and district. It supports draft, review, approval, and rejection states, plus grant or micro-loan intent.
- `pitch_interests` is the existing funder expression/pledge entity. It is informational only; the README explicitly states that the platform performs no financial intermediation.
- `funding_programs`, `funding_program_sectors`, and `funding_program_districts` are proposed for future funder-created grant or micro-loan programs.
- `funding_applications` is proposed for a formal application workflow linked to a funding program and optionally to an existing pitch. It intentionally has no bank account, payment, transaction, or disbursement table.

### Identity and business verification

- `verification_requests` is existing and supports encrypted NIC data, NIC format, automated date-of-birth match, uploaded proof URLs, checklist data, reviewer, status, rejection reason, and timestamps.
- `verification_documents` is proposed to normalize the current three document URL columns into one row per document.
- `external_verification_checks` is proposed for the documented future government/DRP integration. It stores provider state and a safe summary, not secrets or raw credentials.

The current README requires AES-256-GCM encryption for NIC data and restricts raw identity documents to Verifier and Admin roles. Those controls remain application/security responsibilities in this ERD; the database design does not expose or duplicate plaintext NIC values.

### Messaging, translation, and notifications

- `conversations` and `messages` are existing. Conversations support job application, pitch interest, and direct contexts; messages retain sender, receiver, original language, and content.
- `translation_cache` is existing and supports the mock and Google translation providers. It stores source/target language and translated content while avoiding duplicate provider calls.
- `notifications` is existing for verification, application, message, pledge, and system notifications.
- `message_translations` is proposed as an optional materialized per-message translation table. The current service can continue using the general cache until a dedicated persistence strategy is needed.
- `voice_assets` is proposed because the README describes voice-first navigation, transcription, and audio playback as future integrations. Its polymorphic related-entity fields are intentionally marked as an assumption; a later implementation should replace them with specific foreign keys once the supported audio use cases are finalized.

## Relationship and cardinality summary

| Relationship | Cardinality | Meaning |
|---|---:|---|
| District → Users | 1 to 0..many | A district may contain many users; a user may omit a district. |
| User ↔ Role | many to many | Implemented through `user_roles`; one user can have multiple roles. |
| User → Each role profile | 1 to 0..1 | A profile is optional and unique per user. |
| Job employer → Jobs | 1 to many | An employer may publish many jobs. |
| Job ↔ Applicant | many to many | Implemented through `job_applications`, with one application per pair. |
| Job ↔ Skill | many to many | Proposed structured requirements through `job_skills`. |
| Entrepreneur → Pitches | 1 to many | An entrepreneur may submit multiple pitches. |
| Pitch ↔ Funder | many to many | Implemented through `pitch_interests`; each row is a non-binding expression. |
| User → Verification request | 1 to 0..1 | Current workflow keeps one active/current request record per user. |
| Verification request → Documents | 1 to many | Proposed normalized document storage. |
| Conversation → Messages | 1 to many | A conversation contains ordered messages. |
| User → Notifications | 1 to many | Notifications belong to one recipient. |
| User → Consents | 1 to many | Proposed versioned acceptance history. |
| Training provider → Courses | 1 to many | A provider may publish multiple courses. |
| Course ↔ Skill | many to many | Proposed skills taught by a course through `course_skills`. |
| Course ↔ Learner | many to many | Proposed enrollment junction with one enrollment per learner/course pair. |
| Enrollment → Certificate | 1 to 0..1 | A completed enrollment may receive one certificate. |

## Normalization decisions

The proposal is designed for approximately Third Normal Form:

1. Each table represents one subject or relationship.
2. Many-to-many relationships use junction tables with composite primary keys (`user_roles`, `user_skills`, `job_skills`, `saved_jobs`, and funding-program targeting tables).
3. Repeated master data is moved to reference tables (`roles`, `languages`, `districts`, categories, trades, sectors, and skills).
4. Repeated status changes are moved to history tables rather than storing multiple status values in the same row.
5. Profile tables separate optional role-specific attributes from the core user record.

The current implementation contains a few denormalized text fields for compatibility with the MVP (`Job.category`, `JobSeekerProfile.skills`, funder focus fields, and verification document URLs). They are retained in the existing portion of the ERD and paired with explicitly proposed normalized alternatives.

## Multilingual design

The supported language scope is English, Sinhala, and Tamil. Stable master data stores all three display names in one row, while user-generated content stores its source language and can receive translations through `translation_cache` or the proposed `message_translations` table. User preference is stored as a two-character language code. No translation table should overwrite original user content.

## Design assumptions and exclusions

The following are clearly proposed assumptions rather than confirmed requirements:

- Structured skills, worker experience, education, certificates, and job skill matching will be needed for a fuller employment marketplace.
- Training courses, enrollments, and certificates are included as a proposed expansion of the documented TrainingProvider directory role.
- A business may eventually have multiple users/members, so `businesses` and `business_members` are included as a scalable future model.
- Funders may publish reusable funding programs and entrepreneurs may formally apply to them.
- Users may save/bookmark jobs.
- Policy documents and consent history may need versioned storage for academic and production auditability.
- Voice/audio assets may be attached to messages or other platform content after the voice-first scope is finalized.

The following are deliberately excluded:

- Payment transactions, bank accounts, loan disbursements, contracts, or financial settlement tables. The README states that the platform has zero financial intermediation.
- Raw government API credentials or plaintext NIC values.
- A separate translation table for every entity before the provider and caching requirements justify it.

## Implementation boundary

This is documentation only. Creating the DBML and this explanation does not modify the current Prisma schema, migrations, PostgreSQL database, seed data, or application code. Any future adoption should be handled as an incremental migration plan with data mapping, backward compatibility, authorization review, and tests.
