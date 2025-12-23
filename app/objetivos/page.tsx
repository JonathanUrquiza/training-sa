'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Modal, Form, ProgressBar } from 'react-bootstrap';

interface Objetivo {
  id: number;
  description: string;
  type: string;
  target_value: number;
  current_value: number;
  deadline: string;
  completed: boolean;
}

export default function ObjetivosPage() {
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    type: 'general',
    target_value: '',
    current_value: '',
    deadline: ''
  });

  useEffect(() => {
    fetchObjetivos();
  }, []);

  const fetchObjetivos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/objetivos?user_id=1');
      const data = await res.json();
      setObjetivos(data);
    } catch (error) {
      console.error('Error fetching objetivos:', error);
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
        ? `/api/objetivos/${editingId}` 
        : '/api/objetivos';
      
      const method = editingId ? 'PUT' : 'POST';
      
      const body = editingId
        ? {
            description: formData.description,
            type: formData.type,
            target_value: parseFloat(formData.target_value),
            current_value: parseFloat(formData.current_value) || 0,
            deadline: formData.deadline || null
          }
        : {
            ...formData,
            user_id: 1,
            target_value: parseFloat(formData.target_value),
            current_value: parseFloat(formData.current_value) || 0,
            deadline: formData.deadline || null,
            completed: false
          };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(editingId ? 'Objetivo actualizado exitosamente' : 'Objetivo creado exitosamente');
        setShowModal(false);
        setEditingId(null);
        setFormData({
          description: '',
          type: 'general',
          target_value: '',
          current_value: '',
          deadline: ''
        });
        fetchObjetivos();
        
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Error al guardar objetivo');
      }
    } catch (error: any) {
      console.error('Error saving objetivo:', error);
      setError('Error de conexión. Por favor intenta nuevamente.');
    }
  };

  const handleEdit = (objetivo: Objetivo) => {
    setEditingId(objetivo.id);
    setFormData({
      description: objetivo.description,
      type: objetivo.type,
      target_value: objetivo.target_value.toString(),
      current_value: objetivo.current_value.toString(),
      deadline: objetivo.deadline ? objetivo.deadline.split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este objetivo?')) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/objetivos/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setSuccess('Objetivo eliminado exitosamente');
        fetchObjetivos();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Error al eliminar objetivo');
      }
    } catch (error: any) {
      console.error('Error deleting objetivo:', error);
      setError('Error de conexión. Por favor intenta nuevamente.');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      description: '',
      type: 'general',
      target_value: '',
      current_value: '',
      deadline: ''
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Sin fecha límite';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  };

  const getProgress = (current: number, target: number) => {
    if (target === 0) return 0;
    const progress = (current / target) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  return (
    <>
      <Container>
        <Row className="mb-4">
          <Col>
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">
              <div>
                <h1 className="h3 mb-0">Objetivos</h1>
                <p className="text-muted mb-0">Establece y monitorea tus metas</p>
              </div>
              <Button variant="primary" onClick={() => setShowModal(true)} className="w-100 w-sm-auto">
                + Nuevo Objetivo
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
              <p>Cargando objetivos...</p>
            </Col>
          </Row>
        ) : (
          <Row>
            {objetivos.length === 0 ? (
              <Col>
                <Card>
                  <Card.Body className="text-center">
                    <p>No tienes objetivos establecidos aún.</p>
                    <Button variant="primary" onClick={() => setShowModal(true)}>
                      Crear Primer Objetivo
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ) : (
              objetivos.map((objetivo) => {
                const progress = getProgress(objetivo.current_value, objetivo.target_value);
                return (
                  <Col xs={12} sm={6} md={6} lg={4} key={objetivo.id} className="mb-3">
                    <Card className="h-100">
                      <Card.Body>
                        <Card.Title>
                          {objetivo.description}
                          {objetivo.completed && (
                            <Badge bg="success" className="ms-2">Completado</Badge>
                          )}
                        </Card.Title>
                        <Card.Text>
                          <strong>Tipo:</strong> {objetivo.type}
                          <br />
                          <strong>Progreso:</strong> {objetivo.current_value} / {objetivo.target_value}
                          <br />
                          <strong>Fecha límite:</strong> {formatDate(objetivo.deadline)}
                        </Card.Text>
                        <ProgressBar
                          now={progress}
                          label={`${Math.round(progress)}%`}
                          variant={objetivo.completed ? 'success' : progress >= 75 ? 'info' : 'warning'}
                          className="mb-3"
                        />
                        <div className="d-flex flex-column flex-sm-row gap-2">
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => handleEdit(objetivo)}
                            className="w-100 w-sm-auto"
                          >
                            Editar
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDelete(objetivo.id)}
                            className="w-100 w-sm-auto"
                          >
                            Eliminar
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })
            )}
          </Row>
        )}
      </Container>

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{editingId ? 'Editar Objetivo' : 'Nuevo Objetivo'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ej: Hacer 100 flexiones en un mes"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tipo</Form.Label>
              <Form.Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="general">General</option>
                <option value="fuerza">Fuerza</option>
                <option value="resistencia">Resistencia</option>
                <option value="peso">Peso</option>
                <option value="entrenamientos">Entrenamientos</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Valor Objetivo</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                value={formData.target_value}
                onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Valor Actual</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                value={formData.current_value}
                onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                placeholder="0"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Fecha Límite</Form.Label>
              <Form.Control
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
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
    </>
  );
}

