'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Modal, Form } from 'react-bootstrap';

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
  id?: number;
  component_type: string;
  wod_id?: number;
  exercise_name?: string;
  duration?: number;
  weight?: number;
  reps?: number;
  sets?: number;
  distance?: number;
  calories?: number;
  notes?: string;
  order: number;
  wod_nombre?: string;
  wod_tipo?: string;
  wod_details?: WODDetails;
}

interface Entrenamiento {
  id: number;
  date: string;
  level: string;
  duration: number;
  exercises: any[];
  components?: WorkoutComponent[];
  completed: boolean;
  notes: string;
  calories?: number;
}

export default function EntrenamientosPage() {
  const [entrenamientos, setEntrenamientos] = useState<Entrenamiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEntrenamiento, setSelectedEntrenamiento] = useState<Entrenamiento | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    level: 'Intermedio',
    duration: '',
    notes: '',
    exercises: [] as any[],
    calories: ''
  });
  const [detailCalories, setDetailCalories] = useState<string>('');

  useEffect(() => {
    fetchEntrenamientos();
  }, []);

  const fetchEntrenamientos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/entrenamientos?user_id=1');
      const data = await res.json();
      setEntrenamientos(data);
    } catch (error) {
      console.error('Error fetching entrenamientos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const url = editingId 
        ? `/api/entrenamientos/${editingId}` 
        : '/api/entrenamientos';
      
      const method = editingId ? 'PUT' : 'POST';
      
      const body = editingId
        ? {
            date: formData.date,
            level: formData.level,
            duration: formData.duration ? parseInt(formData.duration) : null,
            notes: formData.notes,
            exercises: formData.exercises,
            calories: formData.calories ? parseInt(formData.calories) : null,
            completed: true
          }
        : {
            ...formData,
            user_id: 1,
            duration: formData.duration ? parseInt(formData.duration) : null,
            completed: true
          };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(editingId ? 'Entrenamiento actualizado exitosamente' : 'Entrenamiento creado exitosamente');
        setShowModal(false);
        setEditingId(null);
        setFormData({
          date: new Date().toISOString().split('T')[0],
          level: 'Intermedio',
          duration: '',
          notes: '',
          exercises: [],
          calories: ''
        });
        fetchEntrenamientos();
        
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Error al guardar entrenamiento');
      }
    } catch (error: any) {
      console.error('Error saving entrenamiento:', error);
      setError('Error de conexión. Por favor intenta nuevamente.');
    }
  };

  const handleViewDetails = (entrenamiento: Entrenamiento) => {
    setSelectedEntrenamiento(entrenamiento);
    setDetailCalories(entrenamiento.calories?.toString() || '');
    setShowDetailModal(true);
  };

  const handleSaveCalories = async () => {
    if (!selectedEntrenamiento) return;

    try {
      const res = await fetch(`/api/entrenamientos/${selectedEntrenamiento.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calories: detailCalories ? parseInt(detailCalories) : null
        })
      });

      if (res.ok) {
        setSuccess('Calorías actualizadas exitosamente');
        fetchEntrenamientos();
        setTimeout(() => {
          setSuccess(null);
          setShowDetailModal(false);
        }, 2000);
      } else {
        const data = await res.json();
        setError(data.error || 'Error al actualizar calorías');
      }
    } catch (error: any) {
      console.error('Error saving calories:', error);
      setError('Error de conexión. Por favor intenta nuevamente.');
    }
  };

  const handleEdit = (entrenamiento: Entrenamiento) => {
    setEditingId(entrenamiento.id);
    setFormData({
      date: entrenamiento.date.split('T')[0],
      level: entrenamiento.level,
      duration: entrenamiento.duration?.toString() || '',
      notes: entrenamiento.notes || '',
      exercises: entrenamiento.exercises || [],
      calories: entrenamiento.calories?.toString() || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este entrenamiento?')) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/entrenamientos/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setSuccess('Entrenamiento eliminado exitosamente');
        fetchEntrenamientos();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Error al eliminar entrenamiento');
      }
    } catch (error: any) {
      console.error('Error deleting entrenamiento:', error);
      setError('Error de conexión. Por favor intenta nuevamente.');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      level: 'Intermedio',
      duration: '',
      notes: '',
      exercises: [],
      calories: ''
    });
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedEntrenamiento(null);
    setDetailCalories('');
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

  // Agrupar componentes por tipo
  const groupComponentsByType = (components: WorkoutComponent[] = []) => {
    const grouped: { [key: string]: WorkoutComponent[] } = {};
    components.forEach((component) => {
      const type = component.component_type;
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(component);
    });
    return grouped;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <Container>
        <Row className="mb-4">
          <Col>
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">
              <div>
                <h1 className="h3 mb-0">Mis Entrenamientos</h1>
                <p className="text-muted mb-0">Historial de tus entrenamientos</p>
              </div>
              <Button variant="primary" onClick={() => setShowModal(true)} className="w-100 w-sm-auto">
                + Nuevo Entrenamiento
              </Button>
            </div>
          </Col>
        </Row>

        {error && (
          <Row className="mb-3">
            <Col>
              <div className="alert alert-danger alert-dismissible fade show" role="alert">
                {error}
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setError(null)}
                  aria-label="Close"
                ></button>
              </div>
            </Col>
          </Row>
        )}

        {success && (
          <Row className="mb-3">
            <Col>
              <div className="alert alert-success alert-dismissible fade show" role="alert">
                {success}
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setSuccess(null)}
                  aria-label="Close"
                ></button>
              </div>
            </Col>
          </Row>
        )}

        {loading ? (
          <Row>
            <Col className="text-center">
              <p>Cargando entrenamientos...</p>
            </Col>
          </Row>
        ) : (
          <Row>
            {entrenamientos.length === 0 ? (
              <Col>
                <Card>
                  <Card.Body className="text-center">
                    <p>No tienes entrenamientos registrados aún.</p>
                    <Button variant="primary" onClick={() => setShowModal(true)}>
                      Registrar Primer Entrenamiento
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ) : (
              entrenamientos.map((entrenamiento) => (
                <Col xs={12} sm={6} md={6} lg={4} key={entrenamiento.id} className="mb-3">
                  <Card 
                    className="h-100 workout-card"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleViewDetails(entrenamiento)}
                  >
                    <Card.Body>
                      <Card.Title>
                        {formatDate(entrenamiento.date)}
                        {entrenamiento.completed && (
                          <Badge bg="success" className="ms-2">Completado</Badge>
                        )}
                      </Card.Title>
                      <Card.Text>
                        <strong>Nivel:</strong> {entrenamiento.level}
                        <br />
                        {entrenamiento.duration && (
                          <>
                            <strong>Duración:</strong> {formatDuration(entrenamiento.duration)}
                            <br />
                          </>
                        )}
                        {entrenamiento.components && entrenamiento.components.length > 0 && (
                          <>
                            <strong>Componentes:</strong> {entrenamiento.components.length}
                            <br />
                          </>
                        )}
                        {entrenamiento.calories && (
                          <>
                            <strong>Calorías:</strong> {entrenamiento.calories} kcal
                            <br />
                          </>
                        )}
                        {entrenamiento.notes && (
                          <>
                            <strong>Notas:</strong> {entrenamiento.notes.substring(0, 50)}
                            {entrenamiento.notes.length > 50 && '...'}
                            <br />
                          </>
                        )}
                      </Card.Text>
                      <div className="d-flex flex-column flex-sm-row gap-2 mt-3">
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(entrenamiento);
                          }}
                          className="w-100 w-sm-auto"
                        >
                          Editar
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(entrenamiento.id);
                          }}
                          className="w-100 w-sm-auto"
                        >
                          Eliminar
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            )}
          </Row>
        )}
      </Container>

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{editingId ? 'Editar Entrenamiento' : 'Nuevo Entrenamiento'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Fecha</Form.Label>
              <Form.Control
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nivel</Form.Label>
              <Form.Select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              >
                <option value="Principiante">Principiante</option>
                <option value="Intermedio">Intermedio</option>
                <option value="Avanzado">Avanzado</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Duración (minutos)</Form.Label>
              <Form.Control
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Notas</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Calorías Quemadas</Form.Label>
              <Form.Control
                type="number"
                value={formData.calories}
                onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                placeholder="Ej: 500"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editingId ? 'Actualizar' : 'Guardar'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal de Detalles */}
      <Modal 
        show={showDetailModal} 
        onHide={handleCloseDetailModal}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Detalles del Entrenamiento
            {selectedEntrenamiento && (
              <Badge bg="info" className="ms-2">{selectedEntrenamiento.level}</Badge>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEntrenamiento && (
            <>
              <div className="mb-4">
                <strong style={{ color: 'var(--neon-cyan)' }}>Fecha:</strong>{' '}
                {formatDate(selectedEntrenamiento.date)}
                <br />
                {selectedEntrenamiento.duration && (
                  <>
                    <strong style={{ color: 'var(--neon-cyan)' }}>Duración:</strong>{' '}
                    {formatDuration(selectedEntrenamiento.duration)}
                    <br />
                  </>
                )}
                {selectedEntrenamiento.notes && (
                  <>
                    <strong style={{ color: 'var(--neon-cyan)' }}>Notas:</strong>{' '}
                    {selectedEntrenamiento.notes}
                    <br />
                  </>
                )}
              </div>

              {/* Componentes agrupados por tipo */}
              {selectedEntrenamiento.components && selectedEntrenamiento.components.length > 0 ? (
                <div>
                  <h5 className="mb-3" style={{ color: 'var(--neon-pink)' }}>Componentes del Entrenamiento</h5>
                  {Object.entries(groupComponentsByType(selectedEntrenamiento.components)).map(([type, components]) => (
                    <div key={type} className="mb-4">
                      <div 
                        className="category-header mb-2 p-2"
                        style={{
                          backgroundColor: 'rgba(20, 27, 45, 0.8)',
                          border: '2px solid rgba(0, 240, 255, 0.3)',
                          borderRadius: '0.5rem'
                        }}
                      >
                        <strong style={{ color: 'var(--neon-pink)', fontSize: '1rem' }}>
                          <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>
                            {getComponentIcon(type)}
                          </span>
                          {getComponentLabel(type)}
                        </strong>
                      </div>
                      <div className="ms-3">
                        {components.map((component, idx) => (
                          <div 
                            key={idx} 
                            className="mb-2 p-2"
                            style={{
                              backgroundColor: 'rgba(255, 0, 255, 0.05)',
                              borderRadius: '0.25rem',
                              borderLeft: '3px solid var(--neon-pink)'
                            }}
                          >
                            {component.exercise_name && (
                              <div className="mb-1">
                                <strong style={{ color: 'var(--neon-cyan)', fontSize: '0.95rem' }}>
                                  {component.exercise_name}
                                </strong>
                                {component.wod_nombre && (
                                  <Badge bg="primary" className="ms-2">WOD: {component.wod_nombre}</Badge>
                                )}
                              </div>
                            )}
                            
                            {/* Mostrar detalles del WOD si existen */}
                            {component.wod_details && (
                              <div className="mt-2 p-2" style={{
                                backgroundColor: 'rgba(0, 240, 255, 0.05)',
                                borderRadius: '0.25rem',
                                border: '1px solid rgba(0, 240, 255, 0.2)'
                              }}>
                                {component.wod_details.descripcion && (
                                  <div className="mb-2">
                                    <strong style={{ color: 'var(--neon-pink)', fontSize: '0.85rem' }}>Descripción:</strong>{' '}
                                    <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                                      {component.wod_details.descripcion}
                                    </span>
                                  </div>
                                )}
                                {component.wod_details.total_rondas && (
                                  <Badge bg="info" className="mb-2" style={{ fontSize: '0.75rem' }}>
                                    📊 {component.wod_details.total_rondas} rondas
                                  </Badge>
                                )}
                                {component.wod_details.descanso_entre_rondas && (
                                  <Badge bg="secondary" className="mb-2 ms-1" style={{ fontSize: '0.75rem' }}>
                                    ⏸️ {component.wod_details.descanso_entre_rondas}
                                  </Badge>
                                )}
                                {component.wod_details.ejercicios && component.wod_details.ejercicios.length > 0 && (
                                  <div className="mt-2">
                                    <strong style={{ color: 'var(--neon-pink)', fontSize: '0.85rem' }}>Ejercicios:</strong>
                                    {component.wod_details.ejercicios.map((ejercicio: WODExercise, idx: number) => {
                                      const ejercicioNombre = ejercicio.ejercicio || ejercicio.nombre || `Ejercicio ${idx + 1}`;
                                      const repeticiones = ejercicio.repeticiones || ejercicio.repeticiones_por_ronda;
                                      const peso = ejercicio.peso || ejercicio.peso_rx_hombres || ejercicio.peso_rx_mujeres;
                                      
                                      return (
                                        <div 
                                          key={idx} 
                                          className="mt-1 p-2" 
                                          style={{
                                            backgroundColor: 'rgba(255, 0, 255, 0.03)',
                                            borderRadius: '0.25rem',
                                            fontSize: '0.8rem'
                                          }}
                                        >
                                          <strong style={{ color: 'var(--neon-cyan)' }}>{ejercicioNombre}</strong>
                                          <div className="d-flex flex-wrap gap-1 mt-1">
                                            {repeticiones && (
                                              <Badge bg="success" style={{ fontSize: '0.7rem' }}>
                                                {repeticiones} reps
                                              </Badge>
                                            )}
                                            {peso && (
                                              <Badge bg="warning" style={{ fontSize: '0.7rem' }}>
                                                {typeof peso === 'string' ? peso : `${peso} kg`}
                                              </Badge>
                                            )}
                                            {ejercicio.tiempo && (
                                              <Badge bg="info" style={{ fontSize: '0.7rem' }}>
                                                {ejercicio.tiempo}
                                              </Badge>
                                            )}
                                            {ejercicio.distancia && (
                                              <Badge bg="primary" style={{ fontSize: '0.7rem' }}>
                                                {ejercicio.distancia}
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="d-flex flex-wrap gap-1">
                              {component.duration && (
                                <Badge bg="info" style={{ fontSize: '0.75rem' }}>
                                  ⏱️ {formatDuration(component.duration)}
                                </Badge>
                              )}
                              {component.weight && (
                                <Badge bg="warning" style={{ fontSize: '0.75rem' }}>
                                  🏋️ {component.weight} kg
                                </Badge>
                              )}
                              {component.reps && (
                                <Badge bg="success" style={{ fontSize: '0.75rem' }}>
                                  🔢 {component.reps} reps
                                </Badge>
                              )}
                              {component.sets && (
                                <Badge bg="secondary" style={{ fontSize: '0.75rem' }}>
                                  📊 {component.sets} series
                                </Badge>
                              )}
                              {component.distance && (
                                <Badge bg="primary" style={{ fontSize: '0.75rem' }}>
                                  🏃 {component.distance} km
                                </Badge>
                              )}
                              {component.calories && (
                                <Badge bg="danger" style={{ fontSize: '0.75rem' }}>
                                  🔥 {component.calories} kcal
                                </Badge>
                              )}
                            </div>
                            {component.notes && (
                              <div className="mt-1">
                                <small style={{ color: 'var(--text-secondary)' }}>📝 {component.notes}</small>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No hay componentes registrados para este entrenamiento.</p>
              )}

              {/* Campo para editar calorías */}
              <div className="mt-4 p-3" style={{
                backgroundColor: 'rgba(0, 240, 255, 0.05)',
                borderRadius: '0.5rem',
                border: '1px solid rgba(0, 240, 255, 0.2)'
              }}>
                <Form.Group>
                  <Form.Label>
                    <strong style={{ color: 'var(--neon-pink)' }}>🔥 Calorías Quemadas</strong>
                  </Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Control
                      type="number"
                      value={detailCalories}
                      onChange={(e) => setDetailCalories(e.target.value)}
                      placeholder="Ej: 500"
                      style={{ flex: 1 }}
                    />
                    <Button variant="success" onClick={handleSaveCalories}>
                      Guardar
                    </Button>
                  </div>
                  {selectedEntrenamiento.calories && (
                    <small className="text-muted mt-1 d-block">
                      Actual: {selectedEntrenamiento.calories} kcal
                    </small>
                  )}
                </Form.Group>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDetailModal}>
            Cerrar
          </Button>
          {selectedEntrenamiento && (
            <>
              <Button 
                variant="primary" 
                onClick={() => {
                  handleCloseDetailModal();
                  handleEdit(selectedEntrenamiento);
                }}
              >
                Editar Entrenamiento
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
}

