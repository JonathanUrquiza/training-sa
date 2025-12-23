'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Spinner, Tabs, Tab, ProgressBar } from 'react-bootstrap';

interface ProgressData {
  workouts: {
    total: number;
    completed: number;
    avg_duration: number | null;
    first_workout: string | null;
    last_workout: string | null;
  };
  components: any;
  goals: {
    total: number;
    completed: number;
    avg_progress: number;
  };
  records: {
    total_prs: number;
  };
  level?: {
    current_level: string;
    next_level: string;
    progress_percentage: number;
    weeks_into_period: number;
    days_until_next_level: number;
  };
}

interface WODComparison {
  wod_id: number;
  wod_name: string;
  wod_type: string;
  times: Array<{ duration: number; date: string; workout_id: number }>;
  stats: {
    count: number;
    best: number;
    worst: number;
    average: number;
    improvement: number;
  } | null;
}

interface WeightComparison {
  exercise_name: string;
  records: Array<{ weight: number; reps: number; sets: number; date: string; workout_id: number }>;
  stats: {
    count: number;
    max_weight: number;
    min_weight: number;
    avg_weight: number;
    improvement: number;
    first_date: string;
    last_date: string;
  };
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [heroWODs, setHeroWODs] = useState<WODComparison[]>([]);
  const [nastyGirlsWODs, setNastyGirlsWODs] = useState<WODComparison[]>([]);
  const [olyWeights, setOlyWeights] = useState<WeightComparison[]>([]);
  const [muscleWeights, setMuscleWeights] = useState<WeightComparison[]>([]);
  const [calendarData, setCalendarData] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const userId = 1;

      // Cargar todos los datos en paralelo
      const [progressRes, heroRes, nastyGirlsRes, olyRes, muscleRes, calendarRes] = await Promise.all([
        fetch(`/api/management/progress?user_id=${userId}`),
        fetch(`/api/management/wod-comparison?user_id=${userId}&type=hero`),
        fetch(`/api/management/wod-comparison?user_id=${userId}&type=nasty_girls`),
        fetch(`/api/management/weight-comparison?user_id=${userId}&type=oly`),
        fetch(`/api/management/weight-comparison?user_id=${userId}&type=muscle`),
        fetch(`/api/management/calendar?user_id=${userId}`)
      ]);

      const progressData = await progressRes.json();
      const heroData = await heroRes.json();
      const nastyGirlsData = await nastyGirlsRes.json();
      const olyData = await olyRes.json();
      const muscleData = await muscleRes.json();
      const calendarDataRes = await calendarRes.json();

      setProgress(progressData);
      setHeroWODs(heroData || []);
      setNastyGirlsWODs(nastyGirlsData || []);
      setOlyWeights(olyData || []);
      setMuscleWeights(muscleData || []);
      setCalendarData(calendarDataRes || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1 className="h3 mb-0">📊 Dashboard de Management</h1>
          <p className="text-muted mb-0">Análisis y seguimiento de tu progreso</p>
        </Col>
      </Row>

      {loading ? (
        <Row>
          <Col className="text-center">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Cargando dashboard...</p>
          </Col>
        </Row>
      ) : (
        <>
          {/* Barra de Progreso de Nivel */}
          {progress && progress.level && (
            <Row className="mb-4">
              <Col>
                <Card style={{
                  background: 'linear-gradient(135deg, rgba(20, 27, 45, 0.9) 0%, rgba(26, 35, 50, 0.9) 100%)',
                  border: '2px solid rgba(0, 240, 255, 0.3)',
                  boxShadow: '0 0 30px rgba(0, 240, 255, 0.4)'
                }}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <Card.Title className="mb-1" style={{ color: 'var(--neon-cyan)' }}>
                          📈 Progreso de Nivel
                        </Card.Title>
                        <div className="d-flex align-items-center gap-3">
                          <Badge bg="info" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                            Nivel Actual: <strong>{progress.level.current_level}</strong>
                          </Badge>
                          <span style={{ color: 'var(--text-secondary)' }}>→</span>
                          <Badge bg="success" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                            Siguiente: <strong>{progress.level.next_level}</strong>
                          </Badge>
                        </div>
                      </div>
                      <div className="text-end">
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--neon-pink)' }}>
                          {progress.level.progress_percentage}%
                        </div>
                        <small style={{ color: 'var(--text-secondary)' }}>
                          {progress.level.days_until_next_level} días restantes
                        </small>
                      </div>
                    </div>
                    <div style={{
                      position: 'relative',
                      height: '35px',
                      backgroundColor: 'rgba(20, 27, 45, 0.6)',
                      border: '2px solid rgba(0, 240, 255, 0.3)',
                      borderRadius: '0.5rem',
                      overflow: 'hidden',
                      boxShadow: 'inset 0 0 20px rgba(0, 240, 255, 0.1)'
                    }}>
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(0, progress.level.progress_percentage))}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, var(--neon-cyan) 0%, var(--neon-pink) 50%, var(--neon-purple) 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          paddingRight: '1rem',
                          color: '#fff',
                          fontWeight: 'bold',
                          fontSize: '0.95rem',
                          textShadow: '0 0 10px rgba(0, 0, 0, 0.9)',
                          boxShadow: '0 0 25px rgba(0, 240, 255, 0.6), inset 0 0 15px rgba(255, 0, 255, 0.3)',
                          transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <span style={{ zIndex: 1 }}>
                          {progress.level.progress_percentage}%
                        </span>
                        {/* Efecto de brillo animado */}
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                          animation: 'shimmer 3s infinite'
                        }}></div>
                      </div>
                      {progress.level.progress_percentage < 100 && (
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: `${progress.level.progress_percentage}%`,
                          transform: 'translate(-50%, -50%)',
                          width: '4px',
                          height: '120%',
                          backgroundColor: 'var(--neon-pink)',
                          boxShadow: '0 0 10px var(--neon-pink)',
                          zIndex: 2
                        }}></div>
                      )}
                    </div>
                    <div className="mt-2 d-flex justify-content-between">
                      <small style={{ color: 'var(--text-secondary)' }}>
                        Semana {progress.level.weeks_into_period + 1} de 2 en el período actual
                      </small>
                      <small style={{ color: 'var(--neon-green)' }}>
                        El nivel cambia cada 2 semanas
                      </small>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* Sección de Progreso General */}
          {progress && (
            <Row className="mb-4">
              <Col xs={12} md={6} lg={3} className="mb-3">
                <Card>
                  <Card.Body>
                    <Card.Title className="h6">💪 Entrenamientos</Card.Title>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h3 className="mb-0">{progress.workouts.total}</h3>
                        <small className="text-muted">Total</small>
                      </div>
                      <div className="text-end">
                        <Badge bg="success">{progress.workouts.completed} completados</Badge>
                      </div>
                    </div>
                    {progress.workouts.avg_duration && (
                      <div className="mt-2">
                        <small>Duración promedio: {formatDuration(progress.workouts.avg_duration)}</small>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={12} md={6} lg={3} className="mb-3">
                <Card>
                  <Card.Body>
                    <Card.Title className="h6">🎯 Objetivos</Card.Title>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h3 className="mb-0">{progress.goals.total}</h3>
                        <small className="text-muted">Total</small>
                      </div>
                      <div className="text-end">
                        <Badge bg={progress.goals.completed === progress.goals.total ? 'success' : 'warning'}>
                          {progress.goals.completed} completados
                        </Badge>
                      </div>
                    </div>
                    {progress.goals.total > 0 && (
                      <div className="mt-2">
                        <small>Progreso promedio: {progress.goals.avg_progress.toFixed(1)}%</small>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={12} md={6} lg={3} className="mb-3">
                <Card>
                  <Card.Body>
                    <Card.Title className="h6">🏆 Récords Personales</Card.Title>
                    <h3 className="mb-0">{progress.records.total_prs}</h3>
                    <small className="text-muted">PRs registrados</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={12} md={6} lg={3} className="mb-3">
                <Card>
                  <Card.Body>
                    <Card.Title className="h6">📅 Actividad</Card.Title>
                    {progress.workouts.first_workout && (
                      <>
                        <div className="mb-1">
                          <small>Primer entrenamiento:</small>
                          <br />
                          <strong>{formatDate(progress.workouts.first_workout)}</strong>
                        </div>
                        {progress.workouts.last_workout && (
                          <div>
                            <small>Último entrenamiento:</small>
                            <br />
                            <strong>{formatDate(progress.workouts.last_workout)}</strong>
                          </div>
                        )}
                      </>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* Comparación de Tiempos WODs */}
          <Row className="mb-4">
            <Col>
              <Card>
                <Card.Body>
                  <Card.Title>⏱️ Comparación de Tiempos - WODs</Card.Title>
                  <Tabs defaultActiveKey="hero" className="mb-3">
                    <Tab eventKey="hero" title={`Hero WODs (${heroWODs.length})`}>
                      {heroWODs.length === 0 ? (
                        <p className="text-muted">No hay datos de Hero WODs aún.</p>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead>
                              <tr>
                                <th>WOD</th>
                                <th>Intentos</th>
                                <th>Mejor Tiempo</th>
                                <th>Peor Tiempo</th>
                                <th>Promedio</th>
                                <th>Mejora</th>
                              </tr>
                            </thead>
                            <tbody>
                              {heroWODs.map((wod) => (
                                <tr key={wod.wod_id}>
                                  <td><strong>{wod.wod_name}</strong></td>
                                  <td>{wod.stats?.count || 0}</td>
                                  <td>{wod.stats ? formatDuration(wod.stats.best) : 'N/A'}</td>
                                  <td>{wod.stats ? formatDuration(wod.stats.worst) : 'N/A'}</td>
                                  <td>{wod.stats ? formatDuration(wod.stats.average) : 'N/A'}</td>
                                  <td>
                                    {wod.stats && wod.stats.improvement !== 0 ? (
                                      <Badge bg={wod.stats.improvement > 0 ? 'success' : 'danger'}>
                                        {wod.stats.improvement > 0 ? '-' : '+'}{formatDuration(Math.abs(wod.stats.improvement))}
                                      </Badge>
                                    ) : (
                                      'N/A'
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </Tab>
                    <Tab eventKey="nasty_girls" title={`Nasty Girls (${nastyGirlsWODs.length})`}>
                      {nastyGirlsWODs.length === 0 ? (
                        <p className="text-muted">No hay datos de Nasty Girls aún.</p>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead>
                              <tr>
                                <th>WOD</th>
                                <th>Intentos</th>
                                <th>Mejor Tiempo</th>
                                <th>Peor Tiempo</th>
                                <th>Promedio</th>
                                <th>Mejora</th>
                              </tr>
                            </thead>
                            <tbody>
                              {nastyGirlsWODs.map((wod) => (
                                <tr key={wod.wod_id}>
                                  <td><strong>{wod.wod_name}</strong></td>
                                  <td>{wod.stats?.count || 0}</td>
                                  <td>{wod.stats ? formatDuration(wod.stats.best) : 'N/A'}</td>
                                  <td>{wod.stats ? formatDuration(wod.stats.worst) : 'N/A'}</td>
                                  <td>{wod.stats ? formatDuration(wod.stats.average) : 'N/A'}</td>
                                  <td>
                                    {wod.stats && wod.stats.improvement !== 0 ? (
                                      <Badge bg={wod.stats.improvement > 0 ? 'success' : 'danger'}>
                                        {wod.stats.improvement > 0 ? '-' : '+'}{formatDuration(Math.abs(wod.stats.improvement))}
                                      </Badge>
                                    ) : (
                                      'N/A'
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </Tab>
                  </Tabs>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Comparación de Pesos */}
          <Row className="mb-4">
            <Col>
              <Card>
                <Card.Body>
                  <Card.Title>🏋️ Comparación de Pesos</Card.Title>
                  <Tabs defaultActiveKey="oly" className="mb-3">
                    <Tab eventKey="oly" title={`Levantamiento Olímpico (${olyWeights.length})`}>
                      {olyWeights.length === 0 ? (
                        <p className="text-muted">No hay datos de levantamiento olímpico aún.</p>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead>
                              <tr>
                                <th>Ejercicio</th>
                                <th>Registros</th>
                                <th>Peso Máximo</th>
                                <th>Peso Mínimo</th>
                                <th>Promedio</th>
                                <th>Mejora</th>
                              </tr>
                            </thead>
                            <tbody>
                              {olyWeights.map((exercise) => (
                                <tr key={exercise.exercise_name}>
                                  <td><strong>{exercise.exercise_name}</strong></td>
                                  <td>{exercise.stats.count}</td>
                                  <td>{exercise.stats.max_weight} kg</td>
                                  <td>{exercise.stats.min_weight} kg</td>
                                  <td>{exercise.stats.avg_weight} kg</td>
                                  <td>
                                    {exercise.stats.improvement !== 0 ? (
                                      <Badge bg={exercise.stats.improvement > 0 ? 'success' : 'danger'}>
                                        {exercise.stats.improvement > 0 ? '+' : ''}{exercise.stats.improvement.toFixed(2)} kg
                                      </Badge>
                                    ) : (
                                      'N/A'
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </Tab>
                    <Tab eventKey="muscle" title={`Musculación (${muscleWeights.length})`}>
                      {muscleWeights.length === 0 ? (
                        <p className="text-muted">No hay datos de musculación aún.</p>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead>
                              <tr>
                                <th>Ejercicio</th>
                                <th>Registros</th>
                                <th>Peso Máximo</th>
                                <th>Peso Mínimo</th>
                                <th>Promedio</th>
                                <th>Mejora</th>
                              </tr>
                            </thead>
                            <tbody>
                              {muscleWeights.map((exercise) => (
                                <tr key={exercise.exercise_name}>
                                  <td><strong>{exercise.exercise_name}</strong></td>
                                  <td>{exercise.stats.count}</td>
                                  <td>{exercise.stats.max_weight} kg</td>
                                  <td>{exercise.stats.min_weight} kg</td>
                                  <td>{exercise.stats.avg_weight} kg</td>
                                  <td>
                                    {exercise.stats.improvement !== 0 ? (
                                      <Badge bg={exercise.stats.improvement > 0 ? 'success' : 'danger'}>
                                        {exercise.stats.improvement > 0 ? '+' : ''}{exercise.stats.improvement.toFixed(2)} kg
                                      </Badge>
                                    ) : (
                                      'N/A'
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </Tab>
                  </Tabs>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Calendario de Entrenamientos */}
          <Row className="mb-4">
            <Col>
              <Card>
                <Card.Body>
                  <Card.Title>📅 Calendario de Entrenamientos</Card.Title>
                  {calendarData.length === 0 ? (
                    <p className="text-muted">No hay entrenamientos registrados este mes.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Fecha</th>
                            <th>Nivel</th>
                            <th>Duración</th>
                            <th>Componentes</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {calendarData.map((workout) => (
                            <tr key={workout.id}>
                              <td>{formatDate(workout.date)}</td>
                              <td><Badge bg="info">{workout.level}</Badge></td>
                              <td>{workout.duration ? formatDuration(workout.duration) : 'N/A'}</td>
                              <td>
                                {workout.components.length > 0 ? (
                                  <div className="d-flex flex-wrap gap-1">
                                    {workout.components.map((comp: any, idx: number) => (
                                      <Badge key={idx} bg="secondary" className="text-capitalize">
                                        {comp.component_type}
                                        {comp.wod_nombre && `: ${comp.wod_nombre}`}
                                        {comp.exercise_name && `: ${comp.exercise_name}`}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  'Sin componentes'
                                )}
                              </td>
                              <td>
                                <Badge bg={workout.completed ? 'success' : 'warning'}>
                                  {workout.completed ? 'Completado' : 'Pendiente'}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
}
