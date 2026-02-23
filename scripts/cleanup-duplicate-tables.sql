-- Script para limpar tabelas duplicadas e preparar para re-migração

-- Dropar tabelas na ordem correta (respeitando foreign keys)
DROP TABLE IF EXISTS restaurant_food_types CASCADE;
DROP TABLE IF EXISTS restaurant_place_types CASCADE;
DROP TABLE IF EXISTS restaurant_images CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;
DROP TABLE IF EXISTS food_types CASCADE;
DROP TABLE IF EXISTS place_types CASCADE;

-- Limpar a tabela de migrations para as migrations duplicadas
DELETE FROM "SequelizeMeta" WHERE name IN (
  '20260203021638-create-food-types',
  '20260203021754-create-place-types',
  '20260203021900-create-restaurants',
  '20260203021955-create-restaurant-food-types',
  '20260203022044-create-restaurant-place-types',
  '20260203022128-create-restaurant-images'
);
