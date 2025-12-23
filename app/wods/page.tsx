'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Badge, Button } from 'react-bootstrap';
import Link from 'next/link';

interface WOD {
  id: number;
  nombre: string;
  tipo: string;
  descripcion: string;
  nivel: string;
  total_rondas: number;
  descanso_entre_rondas: string;
  ejercicios: any[];
  categoria_nombre: string;
}

export default function WODsPage() {
  const [wods, setWods] = useState<WOD[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    nivel: '',
    search: ''
  });

  useEffect(() => {
    fetchWODs();
  }, [filtros]);

  const fetchWODs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtros.nivel) params.append('nivel', filtros.nivel);
      if (filtros.search) params.append('search', filtros.search);

      const res = await fetch(`/api/wods?${params.toString()}`);
      const data = await res.json();
      setWods(data);
    } catch (error) {
      console.error('Error fetching WODs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNivelBadgeVariant = (nivel: string) => {
    switch (nivel) {
      case 'Principiante': return 'success';
      case 'Intermedio': return 'warning';
      case 'Avanzado': return 'danger';
      default: return 'secondary';
    }
  };

  return (
    <Container>
        <Row className="mb-4">
          <Col>
            <h1>WODs (Workouts of the Day)</h1>
            <p className="text-muted">Más de 38 WODs incluyendo benchmarks famosos</p>
          </Col>
        </Row>

        <Row className="mb-4">
          <Col xs={12}>
            <Card>
              <Card.Body>
                <Row>
                  <Col xs={12} sm={6} className="mb-3 mb-sm-0">
                    <Form.Group>
                      <Form.Label>Buscar WOD</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Nombre del WOD..."
                        value={filtros.search}
                        onChange={(e) => setFiltros({ ...filtros, search: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Form.Group>
                      <Form.Label>Nivel</Form.Label>
                      <Form.Select
                        value={filtros.nivel}
                        onChange={(e) => setFiltros({ ...filtros, nivel: e.target.value })}
                      >
                        <option value="">Todos</option>
                        <option value="Principiante">Principiante</option>
                        <option value="Intermedio">Intermedio</option>
                        <option value="Avanzado">Avanzado</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {loading ? (
          <Row>
            <Col className="text-center">
              <p>Cargando WODs...</p>
            </Col>
          </Row>
        ) : (
          <Row>
            {wods.length === 0 ? (
              <Col>
                <Card>
                  <Card.Body className="text-center">
                    <p>No se encontraron WODs con los filtros seleccionados.</p>
                  </Card.Body>
                </Card>
              </Col>
            ) : (
              wods.map((wod) => (
                <Col xs={12} sm={6} md={6} lg={4} key={wod.id} className="mb-3">
                  <Card className="h-100">
                    <Card.Body>
                      <Card.Title>{wod.nombre}</Card.Title>
                      <div className="mb-2">
                        <Badge bg={getNivelBadgeVariant(wod.nivel)} className="me-1">
                          {wod.nivel}
                        </Badge>
                        <Badge bg="primary">{wod.tipo}</Badge>
                      </div>
                      <Card.Text>
                        <strong>Descripción:</strong> {wod.descripcion || 'N/A'}
                        <br />
                        {wod.total_rondas && (
                          <>
                            <strong>Rondas:</strong> {wod.total_rondas}
                            <br />
                          </>
                        )}
                        {wod.descanso_entre_rondas && (
                          <>
                            <strong>Descanso:</strong> {wod.descanso_entre_rondas}
                            <br />
                          </>
                        )}
                        <strong>Ejercicios:</strong> {wod.ejercicios?.length || 0}
                      </Card.Text>
                      <Link href={`/wods/${wod.id}`}>
                        <Button variant="primary" size="sm">
                          Ver Detalles
                        </Button>
                      </Link>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            )}
          </Row>
        )}
      </Container>
  );
}

