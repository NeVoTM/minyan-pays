# Minyan-Pays Rewrite Blueprint (Alpha -> Beta)

Date: 2026-04-22

## What this document is called

For the rewrite you described, this is typically called a:
- Rewrite blueprint
- Functional specification
- Technical design specification
- Migration and cutover plan

This file combines all four so the next build can be rewritten cleanly from the ground up.

## Rewrite Goal

Build a beta version from scratch that preserves approved behavior while removing duplicate/legacy code and leaving one clean folder/file structure.

## Product Scope (must keep)

### Roles
- Admin
- Rabbi
- Member

### Core member flow
- Create account
- Punch in
- Punch out
- View member balance / payout visibility

### Core rabbi flow
- Approve pending members
- Confirm/reject check-ins
- Manage payout checklist and save paid status
- Manage banner message
- Export weekly payout CSV

### Core admin flow
- Configure location setup
- Configure rabbi setup
- View/edit/delete members under policy rules
- Cross-location supervisory visibility (target)

## Data Model Requirements

### Current critical entities
- Organization (location identity + defaults)
- User (member identity and payout details)
- Attendance (check-in/out records)
- WeeklyPayout
- Rabbi (multiple rabbis per location)

### Required constraints
- One location can have multiple rabbis.
- Phone + PIN identifies member sign-in flow.
- Punch-in/out records remain uniquely identifiable by record ID.
- Check-out is linked to existing check-in (same member + open attendance).

## API Behavior Requirements

### Punch
- Check-in requires location context.
- Check-out defaults to member's linked active check-in location.
- Location dropdown options should use location name + address.

### Admin setup
- Location setup supports view/edit compact mode.
- Rabbi setup supports add/view/edit/delete in a linked list per location.

## UI/UX Requirements

- All footer menu labels uppercase.
- Check-in button visual: large/bold/green.
- Check-out button visual: large/bold/red.
- Condensed mobile forms (single-row where practical).
- US phone mask default `123-456-7890` with international handling where needed.

## Localization Requirements

- Maintain locale parity across: `en`, `he`, `es`, `ru`, `fr`.
- New keys must be added to all locale files in the same change set.

## Code Quality / Architecture Requirements

- Remove duplicated logic between role dashboards and shared flows.
- Keep one canonical API route per responsibility.
- Keep UI state predictable and minimal.
- Add tests for role permissions and attendance lifecycle.

## Beta Rewrite Plan (phased)

1. Freeze current behavior (this spec is source of truth).
2. Define target folder architecture and coding standards.
3. Rebuild API domain-by-domain (auth, punch, admin, rabbi, member).
4. Rebuild web screens role-by-role using shared components.
5. Migrate data model and run compatibility scripts.
6. Execute regression checklist from this document.
7. Cut over to beta branch.
8. Archive and remove old folders/files only after beta passes validation.

## Clean Cutover Rule

Old code is deleted only after:
- Feature parity checklist passes
- Seed/dev scripts are validated
- Role workflows are tested end-to-end
- Backup branch/tag is created

## Deliverables for Rewrite Start

- This blueprint (`REWRITE_BLUEPRINT.md`)
- Updated handoff docs
- API behavior checklist
- UI screen checklist
- Migration checklist
