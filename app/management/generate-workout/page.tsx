'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, ListGroup, Form } from 'react-bootstrap';
import { useRouter } from 'next/navigation';

interface WODExercise {
  ejercicio?: string;
  nombre?: string;
  repeticiones?: number;
  repeticiones_por_ronda?: string;
  peso?: string | number;
  peso_rx_hombres?: string;
  peso_rx_mujeres?: string;
  tiempo?: string;
  distancia?: string;
  orden?: number;
  nota?: string;
  [key: string]: any;
}

interface WODDetails {
  nombre: string;
  descripcion?: string;
  tipo?: string;
  nivel?: string;
  total_rondas?: number;
  descanso_entre_rondas?: string;
  ejercicios?: WODExercise[];
  metadata?: any;
}

interface WorkoutComponent {
  component_type: string;
  wod_id?: number;
  exercise_name?: string;
  duration?: number;
  weight?: number;
  reps?: number;
  sets?: number;
  distance?: number;
  calories?: number;
  order: number;
  completed?: boolean;
  wod_details?: WODDetails;
}

interface GeneratedWorkout {
  success: boolean;
  level: string;
  components: WorkoutComponent[];
  date: string;
}

const STORAGE_KEY = 'generated_workout_data';

export default function GenerateWorkoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generatedWorkout, setGeneratedWorkout] = useState<GeneratedWorkout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [completedComponents, setCompletedComponents] = useState<Set<number>>(new Set());
  const [wodTime, setWodTime] = useState<{ [key: number]: string }>({}); // Guarda el tiempo por componente WOD (usando order como key)

  // Cargar datos guardados al montar el componente
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setGeneratedWorkout(parsed.workout);
        setCompletedComponents(new Set(parsed.completedComponents || []));
        setWodTime(parsed.wodTime || {});
      }
    } catch (error) {
      console.error('Error loading saved workout data:', error);
    }
  }, []);

  // Guardar datos cuando cambien
  useEffect(() => {
    if (generatedWorkout) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          workout: generatedWorkout,
          completedComponents: Array.from(completedComponents),
          wodTime: wodTime
        }));
      } catch (error) {
        console.error('Error saving workout data:', error);
      }
    }
  }, [generatedWorkout, completedComponents, wodTime]);

  const generateWorkout = async () => {
    setLoading(true);
    setError(null);
    setGeneratedWorkout(null);

    try {
      const res = await fetch('/api/management/generate-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 1 })
      });

      const data = await res.json();

      if (res.ok) {
        setGeneratedWorkout(data);
        setCompletedComponents(new Set()); // Reset checkboxes
        setWodTime({}); // Reset tiempos del WOD
        // Limpiar datos guardados al generar uno nuevo
        localStorage.removeItem(STORAGE_KEY);
      } else {
        setError(data.error || 'Error al generar entrenamiento');
      }
    } catch (err: any) {
      setError('Error de conexión. Por favor intenta nuevamente.');
      console.error('Error generating workout:', err);
    } finally {
      setLoading(false);
    }
  };

  const normalizeTimeFormat = (timeString: string): string | null => {
    if (!timeString || timeString.trim() === '') return null;
    
    const parts = timeString.split(':').map(p => p.trim());
    
    // Si solo tiene un número, asumir que son minutos
    if (parts.length === 1 && /^\d+$/.test(parts[0])) {
      const mins = parseInt(parts[0]);
      return `${mins}:00`;
    }
    
    // Si tiene formato MM:SS o HH:MM:SS válido, retornarlo
    if ((parts.length === 2 && /^\d{1,2}:\d{2}$/.test(timeString)) ||
        (parts.length === 3 && /^\d{1,2}:\d{2}:\d{2}$/.test(timeString))) {
      return timeString;
    }
    
    return null;
  };

  const parseTimeToSeconds = (timeString: string): number | null => {
    if (!timeString || timeString.trim() === '') return null;
    
    // Normalizar primero
    const normalized = normalizeTimeFormat(timeString);
    if (!normalized) return null;
    
    // Formato esperado: MM:SS o HH:MM:SS
    const parts = normalized.split(':').map(Number);
    
    if (parts.length === 2) {
      // MM:SS
      const minutes = parts[0];
      const seconds = parts[1];
      if (seconds >= 60) return null; // Validar segundos
      return minutes * 60 + seconds;
    } else if (parts.length === 3) {
      // HH:MM:SS
      const hours = parts[0];
      const minutes = parts[1];
      const seconds = parts[2];
      if (minutes >= 60 || seconds >= 60) return null; // Validar minutos y segundos
      return hours * 3600 + minutes * 60 + seconds;
    }
    
    return null;
  };

  const saveWorkout = async () => {
    if (!generatedWorkout) return;

    setSaving(true);
    setError(null);

    try {
      // Actualizar componentes con el tiempo del WOD si existe
      const updatedComponents = generatedWorkout.components.map(component => {
        if (component.component_type === 'wod' && wodTime[component.order]) {
          const durationInSeconds = parseTimeToSeconds(wodTime[component.order]);
          return {
            ...component,
            duration: durationInSeconds
          };
        }
        return component;
      });

      const res = await fetch('/api/entrenamientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 1,
          date: generatedWorkout.date,
          level: generatedWorkout.level,
          components: updatedComponents,
          completed: false
        })
      });

      const data = await res.json();

      if (res.ok) {
        // Limpiar datos guardados después de guardar exitosamente
        localStorage.removeItem(STORAGE_KEY);
        router.push('/entrenamientos');
      } else {
        setError(data.error || 'Error al guardar entrenamiento');
      }
    } catch (err: any) {
      setError('Error de conexión. Por favor intenta nuevamente.');
      console.error('Error saving workout:', err);
    } finally {
      setSaving(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getComponentIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      warmup: '🔥',
      calisthenics: '💪',
      oly: '🏋️',
      muscle: '💼',
      wod: '⚡',
      cardio: '🏃'
    };
    return icons[type] || '📋';
  };

  const getComponentLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      warmup: 'Entrada en Calor',
      calisthenics: 'Calistenia',
      oly: 'Levantamiento Olímpico',
      muscle: 'Musculación',
      wod: 'WOD',
      cardio: 'Cardio'
    };
    return labels[type] || type;
  };

  const toggleComponentCompleted = (index: number) => {
    const newCompleted = new Set(completedComponents);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompletedComponents(newCompleted);
  };

  const allComponentsCompleted = () => {
    return generatedWorkout && completedComponents.size === generatedWorkout.components.length;
  };

  // Agrupar componentes por tipo
  const groupComponentsByType = () => {
    if (!generatedWorkout) return {};
    
    const grouped: { [key: string]: WorkoutComponent[] } = {};
    generatedWorkout.components.forEach((component, index) => {
      const type = component.component_type;
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push({ ...component, order: index });
    });
    
    return grouped;
  };

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1 className="h3 mb-0">🎲 Generar Entrenamiento</h1>
          <p className="text-muted mb-0">Genera un entrenamiento personalizado basado en tu nivel y objetivos</p>
        </Col>
      </Row>

      {error && (
        <Row className="mb-3">
          <Col>
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          </Col>
        </Row>
      )}

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body className="text-center">
              <Card.Title>Generar Nuevo Entrenamiento</Card.Title>
              <Card.Text>
                El sistema generará un entrenamiento completo con todos los componentes:
                <br />
                <Badge bg="secondary" className="me-1">Entrada en Calor</Badge>
                <Badge bg="secondary" className="me-1">Calistenia</Badge>
                <Badge bg="secondary" className="me-1">Levantamiento Olímpico</Badge>
                <Badge bg="secondary" className="me-1">Musculación</Badge>
                <Badge bg="secondary" className="me-1">WOD</Badge>
                <Badge bg="secondary">Cardio</Badge>
              </Card.Text>
              <Button 
                variant="primary" 
                size="lg" 
                onClick={generateWorkout}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Generando...
                  </>
                ) : (
                  '🎲 Generar Entrenamiento'
                )}
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {generatedWorkout && (
        <Row>
          <Col>
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <div>
                  <Card.Title className="mb-0">Entrenamiento Generado</Card.Title>
                  <small className="text-muted">
                    Nivel: <Badge bg="info">{generatedWorkout.level}</Badge> | 
                    Fecha: {new Date(generatedWorkout.date).toLocaleDateString('es-ES')}
                  </small>
                  <div className="mt-2">
                    <Alert variant="info" className="mb-0 py-2" style={{ fontSize: '0.85rem' }}>
                      💡 <strong>Tip:</strong> Este entrenamiento se guarda automáticamente. Si refrescas la página, se recuperará automáticamente.
                    </Alert>
                  </div>
                </div>
                <div className="d-flex flex-column gap-2">
                  <Button 
                    variant="success" 
                    onClick={saveWorkout}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Guardando...
                      </>
                    ) : (
                      '💾 Guardar Entrenamiento'
                    )}
                  </Button>
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={() => {
                      if (confirm('¿Estás seguro de que quieres descartar este entrenamiento?')) {
                        setGeneratedWorkout(null);
                        setCompletedComponents(new Set());
                        setWodTime({});
                        localStorage.removeItem(STORAGE_KEY);
                      }
                    }}
                  >
                    🗑️ Descartar
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="workout-components-container">
                  {Object.entries(groupComponentsByType()).map(([type, components]) => {
                    const categoryLabel = getComponentLabel(type);
                    const categoryIcon = getComponentIcon(type);
                    const allCategoryCompleted = components.every(comp => completedComponents.has(comp.order));
                    
                    return (
                      <div key={type} className="mb-4">
                        <div 
                          className="category-header mb-3"
                          style={{
                            padding: '1rem',
                            backgroundColor: 'rgba(20, 27, 45, 0.8)',
                            border: `2px solid ${allCategoryCompleted ? 'var(--neon-green)' : 'rgba(0, 240, 255, 0.3)'}`,
                            borderRadius: '0.5rem',
                            boxShadow: allCategoryCompleted 
                              ? '0 0 20px rgba(0, 255, 136, 0.3)' 
                              : '0 0 15px rgba(0, 240, 255, 0.2)'
                          }}
                        >
                          <h4 className="mb-0" style={{ 
                            color: allCategoryCompleted ? 'var(--neon-green)' : 'var(--neon-pink)',
                            textShadow: allCategoryCompleted 
                              ? '0 0 10px rgba(0, 255, 136, 0.5)' 
                              : '0 0 10px rgba(255, 0, 255, 0.5)'
                          }}>
                            <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>{categoryIcon}</span>
                            {categoryLabel}
                            {allCategoryCompleted && (
                              <Badge bg="success" className="ms-2">✓ Categoría Completada</Badge>
                            )}
                          </h4>
                        </div>
                        <div className="components-list">
                          {components.map((component) => {
                            const index = component.order;
                            const isCompleted = completedComponents.has(index);
                            return (
                              <Card 
                                key={index} 
                                className={`mb-2 workout-component-card ${isCompleted ? 'completed' : ''}`}
                                style={{
                                  backgroundColor: isCompleted ? 'rgba(0, 255, 136, 0.1)' : 'rgba(20, 27, 45, 0.5)',
                                  border: isCompleted ? '2px solid var(--neon-green)' : '2px solid rgba(0, 240, 255, 0.3)',
                                  boxShadow: isCompleted 
                                    ? '0 0 20px rgba(0, 255, 136, 0.3)' 
                                    : '0 0 15px rgba(0, 240, 255, 0.2)',
                                  opacity: isCompleted ? 0.8 : 1,
                                  marginLeft: '1.5rem'
                                }}
                              >
                                <Card.Body className="d-flex justify-content-between align-items-start">
                                  <div className="flex-grow-1">
                                    <div className="d-flex align-items-center mb-2">
                                      <Form.Check
                                        type="checkbox"
                                        checked={isCompleted}
                                        onChange={() => toggleComponentCompleted(index)}
                                        className="me-3"
                                        style={{
                                          minWidth: '20px',
                                          cursor: 'pointer'
                                        }}
                                      />
                                      {component.exercise_name && (
                                        <strong style={{ color: isCompleted ? 'var(--neon-green)' : 'var(--neon-cyan)', fontSize: '1rem' }}>
                                          {component.exercise_name}
                                        </strong>
                                      )}
                                      {component.wod_id && (
                                        <Badge bg="primary" className="ms-2">WOD #{component.wod_id}</Badge>
                                      )}
                                      {isCompleted && (
                                        <Badge bg="success" className="ms-2" style={{ fontSize: '0.8rem' }}>✓</Badge>
                                      )}
                                    </div>
                                    
                                    {/* Detalles del WOD */}
                                    {component.wod_details && (
                                      <div className="ms-5 mb-3" style={{ 
                                        padding: '1rem', 
                                        backgroundColor: 'rgba(0, 240, 255, 0.05)',
                                        borderRadius: '0.5rem',
                                        border: '1px solid rgba(0, 240, 255, 0.2)'
                                      }}>
                                        {component.wod_details.descripcion && (
                                          <div className="mb-2" style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                            <strong style={{ color: 'var(--neon-cyan)' }}>Descripción:</strong> {component.wod_details.descripcion}
                                          </div>
                                        )}
                                        {component.wod_details.total_rondas && (
                                          <div className="mb-2">
                                            <Badge bg="info" style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}>
                                              📊 {component.wod_details.total_rondas} rondas
                                            </Badge>
                                          </div>
                                        )}
                                        {component.wod_details.descanso_entre_rondas && (
                                          <div className="mb-2">
                                            <Badge bg="secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}>
                                              ⏸️ Descanso: {component.wod_details.descanso_entre_rondas}
                                            </Badge>
                                          </div>
                                        )}
                                        {component.wod_details.ejercicios && component.wod_details.ejercicios.length > 0 && (
                                          <div className="mt-3">
                                            <strong style={{ color: 'var(--neon-pink)', fontSize: '0.9rem' }}>Ejercicios del WOD:</strong>
                                            <div className="mt-2">
                                              {component.wod_details.ejercicios.map((ejercicio: WODExercise, idx: number) => {
                                                const ejercicioNombre = ejercicio.ejercicio || ejercicio.nombre || `Ejercicio ${idx + 1}`;
                                                const repeticiones = ejercicio.repeticiones || ejercicio.repeticiones_por_ronda;
                                                const peso = ejercicio.peso || ejercicio.peso_rx_hombres || ejercicio.peso_rx_mujeres;
                                                
                                                return (
                                                  <div 
                                                    key={idx} 
                                                    className="mb-3 p-3" 
                                                    style={{ 
                                                      backgroundColor: 'rgba(255, 0, 255, 0.05)',
                                                      borderRadius: '0.5rem',
                                                      borderLeft: '3px solid var(--neon-pink)',
                                                      border: '1px solid rgba(255, 0, 255, 0.2)'
                                                    }}
                                                  >
                                                    <div style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                                      <div className="mb-2">
                                                        <strong style={{ color: 'var(--neon-cyan)', fontSize: '1rem' }}>
                                                          {ejercicioNombre}
                                                        </strong>
                                                        {ejercicio.orden && (
                                                          <Badge bg="secondary" className="ms-2" style={{ fontSize: '0.7rem' }}>
                                                            #{ejercicio.orden}
                                                          </Badge>
                                                        )}
                                                      </div>
                                                      <div className="d-flex flex-column gap-1">
                                                        {repeticiones && (
                                                          <div>
                                                            <strong style={{ color: 'var(--neon-pink)' }}>Repeticiones:</strong>{' '}
                                                            <Badge bg="success" style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem' }}>
                                                              {repeticiones}
                                                            </Badge>
                                                          </div>
                                                        )}
                                                        {peso && (
                                                          <div>
                                                            <strong style={{ color: 'var(--neon-pink)' }}>Peso:</strong>{' '}
                                                            <Badge bg="warning" style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem' }}>
                                                              {typeof peso === 'string' ? peso : `${peso} kg`}
                                                            </Badge>
                                                            {ejercicio.peso_rx_hombres && ejercicio.peso_rx_mujeres && (
                                                              <div className="ms-2 mt-1">
                                                                <small style={{ color: 'var(--text-secondary)' }}>
                                                                  Hombres: {ejercicio.peso_rx_hombres} | Mujeres: {ejercicio.peso_rx_mujeres}
                                                                </small>
                                                              </div>
                                                            )}
                                                          </div>
                                                        )}
                                                        {ejercicio.tiempo && (
                                                          <div>
                                                            <strong style={{ color: 'var(--neon-pink)' }}>Tiempo:</strong>{' '}
                                                            <Badge bg="info" style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem' }}>
                                                              {ejercicio.tiempo}
                                                            </Badge>
                                                          </div>
                                                        )}
                                                        {ejercicio.distancia && (
                                                          <div>
                                                            <strong style={{ color: 'var(--neon-pink)' }}>Distancia:</strong>{' '}
                                                            <Badge bg="primary" style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem' }}>
                                                              {ejercicio.distancia}
                                                            </Badge>
                                                          </div>
                                                        )}
                                                        {ejercicio.nota && (
                                                          <div className="mt-1">
                                                            <small style={{ color: 'var(--neon-cyan)', fontStyle: 'italic' }}>
                                                              📝 {ejercicio.nota}
                                                            </small>
                                                          </div>
                                                        )}
                                                      </div>
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Input para tiempo del WOD */}
                                        <div className="mt-3 p-3" style={{
                                          backgroundColor: 'rgba(255, 0, 255, 0.1)',
                                          borderRadius: '0.5rem',
                                          border: '2px solid var(--neon-pink)',
                                          boxShadow: '0 0 15px rgba(255, 0, 255, 0.3)'
                                        }}>
                                          <Form.Group>
                                            <Form.Label className="mb-2">
                                              <strong style={{ color: 'var(--neon-pink)', fontSize: '1rem' }}>
                                                ⏱️ Tiempo de Finalización del WOD
                                              </strong>
                                            </Form.Label>
                                            <div className="d-flex flex-column flex-sm-row gap-2 align-items-start align-items-sm-center">
                                              <div className="d-flex align-items-center gap-2" style={{ flex: 1 }}>
                                                <Form.Control
                                                  type="text"
                                                  placeholder="MM:SS (ej: 15:30)"
                                                  value={wodTime[component.order] || ''}
                                                  onChange={(e) => {
                                                    const value = e.target.value;
                                                    // Validar formato MM:SS o HH:MM:SS mientras se escribe
                                                    if (value === '' || 
                                                        /^(\d{0,2})$/.test(value) || 
                                                        /^(\d{1,2}):(\d{0,2})$/.test(value) || 
                                                        /^(\d{1,2}):(\d{2})$/.test(value) ||
                                                        /^(\d{1,2}):(\d{2}):(\d{0,2})$/.test(value) ||
                                                        /^(\d{1,2}):(\d{2}):(\d{2})$/.test(value)) {
                                                      setWodTime({
                                                        ...wodTime,
                                                        [component.order]: value
                                                      });
                                                    }
                                                  }}
                                                  onBlur={(e) => {
                                                    // Normalizar formato al perder foco
                                                    const value = e.target.value.trim();
                                                    if (value) {
                                                      const normalized = normalizeTimeFormat(value);
                                                      if (normalized) {
                                                        setWodTime({
                                                          ...wodTime,
                                                          [component.order]: normalized
                                                        });
                                                      }
                                                    }
                                                  }}
                                                  style={{
                                                    maxWidth: '200px',
                                                    backgroundColor: 'rgba(20, 27, 45, 0.8)',
                                                    border: '1px solid rgba(0, 240, 255, 0.3)',
                                                    color: 'var(--neon-cyan)',
                                                    fontSize: '1rem',
                                                    padding: '0.5rem'
                                                  }}
                                                />
                                                {wodTime[component.order] && parseTimeToSeconds(wodTime[component.order]) && (
                                                  <Badge bg="info" style={{ fontSize: '0.9rem', padding: '0.5rem' }}>
                                                    {formatDuration(parseTimeToSeconds(wodTime[component.order])!)}
                                                  </Badge>
                                                )}
                                              </div>
                                              <small style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                                Formato: MM:SS o HH:MM:SS
                                              </small>
                                            </div>
                                            {wodTime[component.order] && parseTimeToSeconds(wodTime[component.order]) && (
                                              <div className="mt-2">
                                                <Badge bg="success" style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}>
                                                  ✓ Tiempo registrado: {wodTime[component.order]} ({formatDuration(parseTimeToSeconds(wodTime[component.order])!)})
                                                </Badge>
                                              </div>
                                            )}
                                          </Form.Group>
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Detalles generales del componente */}
                                    <div className="ms-5 d-flex flex-wrap gap-2">
                                      {component.duration && (
                                        <Badge bg="info" style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}>
                                          ⏱️ {formatDuration(component.duration)}
                                        </Badge>
                                      )}
                                      {component.weight && (
                                        <Badge bg="warning" style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}>
                                          🏋️ {component.weight} kg
                                        </Badge>
                                      )}
                                      {component.reps && (
                                        <Badge bg="success" style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}>
                                          🔢 {component.reps} reps
                                        </Badge>
                                      )}
                                      {component.sets && (
                                        <Badge bg="secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}>
                                          📊 {component.sets} series
                                        </Badge>
                                      )}
                                      {component.distance && (
                                        <Badge bg="primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}>
                                          🏃 {component.distance} km
                                        </Badge>
                                      )}
                                      {component.calories && (
                                        <Badge bg="danger" style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}>
                                          🔥 {component.calories} kcal
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </Card.Body>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {allComponentsCompleted() && (
                  <Alert variant="success" className="mt-3" style={{
                    backgroundColor: 'rgba(0, 255, 136, 0.2)',
                    borderColor: 'var(--neon-green)',
                    color: 'var(--neon-green)'
                  }}>
                    🎉 ¡Felicidades! Has completado todos los componentes del entrenamiento.
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
}

