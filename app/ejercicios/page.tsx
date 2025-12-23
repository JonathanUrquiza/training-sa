'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Badge, InputGroup } from 'react-bootstrap';

interface Ejercicio {
  id: number;
  nombre: string;
  grupo_muscular: string;
  nivel: string;
  categoria_nombre: string;
  subcategoria_nombre: string;
  metadata: string;
}

interface Categoria {
  id: number;
  name: string;
}

interface Subcategoria {
  id: number;
  name: string;
}

export default function EjerciciosPage() {
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    categoria_id: '',
    subcategoria_id: '',
    nivel: '',
    search: ''
  });

  useEffect(() => {
    fetchCategorias();
  }, []);

  useEffect(() => {
    if (filtros.categoria_id) {
      fetchSubcategorias(filtros.categoria_id);
    } else {
      setSubcategorias([]);
    }
  }, [filtros.categoria_id]);

  useEffect(() => {
    fetchEjercicios();
  }, [filtros]);

  const fetchCategorias = async () => {
    try {
      const res = await fetch('/api/categorias');
      const data = await res.json();
      setCategorias(data);
    } catch (error) {
      console.error('Error fetching categorias:', error);
    }
  };

  const fetchSubcategorias = async (categoriaId: string) => {
    try {
      const res = await fetch(`/api/subcategorias?categoria_id=${categoriaId}`);
      const data = await res.json();
      setSubcategorias(data);
    } catch (error) {
      console.error('Error fetching subcategorias:', error);
    }
  };

  const fetchEjercicios = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtros.categoria_id) params.append('categoria_id', filtros.categoria_id);
      if (filtros.subcategoria_id) params.append('subcategoria_id', filtros.subcategoria_id);
      if (filtros.nivel) params.append('nivel', filtros.nivel);
      if (filtros.search) params.append('search', filtros.search);

      const res = await fetch(`/api/ejercicios?${params.toString()}`);
      const data = await res.json();
      setEjercicios(data);
    } catch (error) {
      console.error('Error fetching ejercicios:', error);
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
            <h1>Ejercicios</h1>
            <p className="text-muted">Explora más de 700 ejercicios disponibles</p>
          </Col>
        </Row>

        <Row className="mb-4">
          <Col xs={12}>
            <Card>
              <Card.Body>
                <Row>
                  <Col xs={12} sm={6} md={3} className="mb-3 mb-md-0">
                    <Form.Group>
                      <Form.Label>Buscar</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Nombre o grupo muscular..."
                        value={filtros.search}
                        onChange={(e) => setFiltros({ ...filtros, search: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} sm={6} md={3} className="mb-3 mb-md-0">
                    <Form.Group>
                      <Form.Label>Categoría</Form.Label>
                      <Form.Select
                        value={filtros.categoria_id}
                        onChange={(e) => setFiltros({ ...filtros, categoria_id: e.target.value, subcategoria_id: '' })}
                      >
                        <option value="">Todas</option>
                        {categorias.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col xs={12} sm={6} md={3} className="mb-3 mb-md-0">
                    <Form.Group>
                      <Form.Label>Subcategoría</Form.Label>
                      <Form.Select
                        value={filtros.subcategoria_id}
                        onChange={(e) => setFiltros({ ...filtros, subcategoria_id: e.target.value })}
                        disabled={!filtros.categoria_id}
                      >
                        <option value="">Todas</option>
                        {subcategorias.map(sub => (
                          <option key={sub.id} value={sub.id}>{sub.name}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col xs={12} sm={6} md={3}>
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
              <p>Cargando ejercicios...</p>
            </Col>
          </Row>
        ) : (
          <Row>
            {ejercicios.length === 0 ? (
              <Col>
                <Card>
                  <Card.Body className="text-center">
                    <p>No se encontraron ejercicios con los filtros seleccionados.</p>
                  </Card.Body>
                </Card>
              </Col>
            ) : (
              ejercicios.map((ejercicio) => (
                <Col xs={12} sm={6} md={6} lg={4} key={ejercicio.id} className="mb-3">
                  <Card className="h-100">
                    <Card.Body>
                      <Card.Title>{ejercicio.nombre}</Card.Title>
                      <div className="mb-2">
                        <Badge bg={getNivelBadgeVariant(ejercicio.nivel)} className="me-1">
                          {ejercicio.nivel}
                        </Badge>
                        {ejercicio.categoria_nombre && (
                          <Badge bg="info" className="me-1">
                            {ejercicio.categoria_nombre}
                          </Badge>
                        )}
                      </div>
                      <Card.Text>
                        <strong>Grupo muscular:</strong> {ejercicio.grupo_muscular || 'N/A'}
                        <br />
                        {ejercicio.subcategoria_nombre && (
                          <>
                            <strong>Subcategoría:</strong> {ejercicio.subcategoria_nombre}
                          </>
                        )}
                      </Card.Text>
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

