-- Script para crear la tabla workout_components
-- Esta tabla almacena los componentes individuales de cada entrenamiento

CREATE TABLE IF NOT EXISTS workout_components (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workout_id INT NOT NULL,
  component_type ENUM('warmup', 'calisthenics', 'oly', 'muscle', 'wod', 'cardio') NOT NULL,
  wod_id INT NULL,
  exercise_name VARCHAR(255) NULL,
  duration INT NULL COMMENT 'Duración en segundos',
  weight DECIMAL(10,2) NULL COMMENT 'Peso en kg',
  reps INT NULL,
  sets INT NULL,
  distance DECIMAL(10,2) NULL COMMENT 'Distancia en km',
  calories INT NULL COMMENT 'Calorías quemadas',
  notes TEXT NULL,
  `order` INT NOT NULL DEFAULT 0 COMMENT 'Orden del componente en el entrenamiento',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
  FOREIGN KEY (wod_id) REFERENCES wods(id) ON DELETE SET NULL,
  INDEX idx_workout_id (workout_id),
  INDEX idx_component_type (component_type),
  INDEX idx_wod_id (wod_id),
  INDEX idx_workout_type (workout_id, component_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

