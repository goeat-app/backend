# Restaurant Menu Progress

## Status Legend

- not-started
- in-progress
- blocked
- done

## Milestones

| Milestone                 | Status      | Owner | ETA | Notes                                    |
| ------------------------- | ----------- | ----- | --- | ---------------------------------------- |
| Data model and migrations | in-progress | TBD   | TBD | Initial migrations and models scaffolded |
| Admin endpoints           | not-started | TBD   | TBD |                                          |
| Public endpoints          | not-started | TBD   | TBD |                                          |
| Harness and QA readiness  | in-progress | TBD   | TBD | Docs and harness structure started       |
| Documentation and handoff | in-progress | TBD   | TBD | Initial references created               |

## Changelog

### 2026-05-21

- Added initial menu migrations: categories, items, item sizes.
- Added Sequelize models and restaurant menu module wiring.
- Added harness/menu documentation skeleton.

## Risks and Blockers

- Risk: route and payload contracts may change while frontend integration starts.
- Mitigation: freeze DTO contracts before public endpoint implementation.
- Blockers: none.
