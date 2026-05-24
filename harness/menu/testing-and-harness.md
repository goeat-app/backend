# Restaurant Menu Testing and Harness

## Target Test Areas

- Category CRUD
- Item CRUD
- Size rules and updates
- Reorder operations
- Availability toggles
- Soft delete visibility rules
- Public menu projection

## Planned Harness Scripts

- npm run menu:integration
- npm run menu:smoke
- npm run menu:seed:dev

## Fixture Strategy

- Reuse auth and restaurant seed helpers from test/helpers
- Add menu-specific builders for category, item, and size payloads

## Smoke Scenarios

1. Create category
2. Create item with sizes
3. Reorder categories and items
4. Toggle availability
5. Soft delete item
6. Fetch public menu and assert visibility

## CI Expectations

- Deterministic tests
- Isolated restaurant data per test suite
- Clear error snapshots for contract regressions
