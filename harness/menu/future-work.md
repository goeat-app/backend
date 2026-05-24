# Restaurant Menu Future Work

## Deferred Capabilities

- Modifiers and add-ons
- Inventory and stock controls
- Scheduled availability windows
- Multilingual menu content
- Multi-image gallery per item
- Menu analytics and ranking metrics

## Candidate Enhancements

- Bulk import/export for menu data
- Category-level availability windows
- Automatic slug transliteration and collision diagnostics
- Audit trail for menu changes
- Performance cache for public menu payloads

## Decision Gates

- Add modifiers only after stable item-size flow in production.
- Add inventory only when order pipeline requires stock locking.
- Add analytics after baseline usage telemetry is available.
