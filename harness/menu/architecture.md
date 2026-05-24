# Restaurant Menu Architecture

## Scope

Restaurant menu management for categories, items, and item sizes.

## Domain Components

- Menu category
- Menu item
- Menu item size

## Module Boundaries

- Module: src/modules/restaurant-menu
- Database migrations: src/lib/infra/database/migrations
- Authorization dependency: restaurant-access role guard and service

## High-Level Flow

1. Admin authenticates and passes restaurant role checks.
2. Admin performs category or item mutations.
3. Public clients fetch active menu projection.

## Entity Relationships

- restaurant 1:N menu_categories
- menu_categories 1:N menu_items
- menu_items 1:N menu_item_sizes

## Pending Decisions

- Category deletion policy when active items still exist.
- Item image strategy: image_key on menu_items vs separate item images table.
