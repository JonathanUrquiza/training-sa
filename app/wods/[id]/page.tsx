'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container, Row, Col, Card, Badge, Button, ListGroup } from 'react-bootstrap';

interface WOD {
  id: number;
  nombre: string;
  tipo: string;
  descripcion: string;
  nivel: string;
  total_rondas: number;
  descanso_entre_rondas: string;
  en_honor_a: string;
  ejercicios: any[];
  metadata: any;
  categoria_nombre: string;
}

export default function WODDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [wod, setWOD] = useState<WOD | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchWOD(params.id as string);
    }
  }, [params.id]);

  const fetchWOD = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/wods/${id}`);
      if (res.ok) {
        const data = await res.json();
        setWOD(data);
      }
    } catch (error) {
      console.error('Error fetching WOD:', error);
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

  if (loading) {
    return (
      <Container>
        <p>Cargando WOD...</p>
      </Container>
    );
  }

  if (!wod) {
    return (
      <Container>
        <p>WOD no encontrado</p>
      </Container>
    );
  }

  return (
    <Container>
        <Row className="mb-4">
          <Col>
            <Button variant="outline-secondary" onClick={() => router.back()} className="mb-3">
              ← Volver
            </Button>
            <h1>{wod.nombre}</h1>
            <div className="mb-2">
              <Badge bg={getNivelBadgeVariant(wod.nivel)} className="me-2">
                {wod.nivel}
              </Badge>
              <Badge bg="primary" className="me-2">
                {wod.tipo}
              </Badge>
              {wod.categoria_nombre && (
                <Badge bg="info">{wod.categoria_nombre}</Badge>
              )}
            </div>
          </Col>
        </Row>

        <Row>
          <Col xs={12} md={8}>
            <Card className="mb-4">
              <Card.Body>
                <Card.Title>Descripción</Card.Title>
                <Card.Text>{wod.descripcion || 'Sin descripción'}</Card.Text>
              </Card.Body>
            </Card>

            <Card className="mb-4">
              <Card.Body>
                <Card.Title>Ejercicios</Card.Title>
                <ListGroup variant="flush">
                  {wod.ejercicios && wod.ejercicios.length > 0 ? (
                    wod.ejercicios.map((ejercicio, index) => (
                      <ListGroup.Item key={index}>
                        <div className="d-flex flex-column flex-sm-row flex-wrap align-items-start align-items-sm-center gap-2">
                          <strong>{ejercicio.ejercicio || ejercicio.orden}</strong>
                          {ejercicio.repeticiones && (
                            <span className="ms-sm-2">- {ejercicio.repeticiones} repeticiones</span>
                          )}
                          {ejercicio.repeticiones_por_ronda && (
                            <span className="ms-sm-2">- {ejercicio.repeticiones_por_ronda} repeticiones</span>
                          )}
                          <div className="d-flex flex-wrap gap-2">
                            {ejercicio.peso && (
                              <Badge bg="secondary">{ejercicio.peso}</Badge>
                            )}
                            {ejercicio.peso_rx_hombres && (
                              <Badge bg="primary">RX H: {ejercicio.peso_rx_hombres}</Badge>
                            )}
                            {ejercicio.peso_rx_mujeres && (
                              <Badge bg="danger">RX M: {ejercicio.peso_rx_mujeres}</Badge>
                            )}
                          </div>
                        </div>
                      </ListGroup.Item>
                    ))
                  ) : (
                    <ListGroup.Item>No hay ejercicios definidos</ListGroup.Item>
                  )}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} md={4}>
            <Card>
              <Card.Body>
                <Card.Title>Información</Card.Title>
                {wod.total_rondas && (
                  <p><strong>Total de rondas:</strong> {wod.total_rondas}</p>
                )}
                {wod.descanso_entre_rondas && (
                  <p><strong>Descanso entre rondas:</strong> {wod.descanso_entre_rondas}</p>
                )}
                {wod.en_honor_a && (
                  <p><strong>En honor a:</strong> {wod.en_honor_a}</p>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
  );
}

