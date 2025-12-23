-- Script para agregar campo calories a la tabla workouts
-- Si el campo ya existe, este script no hará nada (usando IF NOT EXISTS)

ALTER TABLE workouts 
ADD COLUMN IF NOT EXISTS calories INT NULL COMMENT 'Calorías totales quemadas en el entrenamiento';

