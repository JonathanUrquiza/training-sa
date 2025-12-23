'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Modal, Form, Table } from 'react-bootstrap';

interface Record {
  id: number;
  exercise: string;
  type: string;
  value: number;
  notes: string;
  is_pr: boolean;
  date: string;
}

export default function RecordsPage() {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    exercise: '',
    type: 'repeticiones',
    value: '',
    notes: '',
    is_pr: false,
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/records?user_id=1');
      const data = await res.json();
      setRecords(data);
    } catch (error) {
      console.error('Error fetching records:', error);
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
        ? `/api/records/${editingId}` 
        : '/api/records';
      
      const method = editingId ? 'PUT' : 'POST';
      
      const body = editingId
        ? {
            exercise: formData.exercise,
            type: formData.type,
            value: parseFloat(formData.value),
            notes: formData.notes,
            is_pr: formData.is_pr,
            date: formData.date
          }
        : {
            ...formData,
            user_id: 1,
            value: parseFloat(formData.value)
          };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(editingId ? 'Récord actualizado exitosamente' : 'Récord creado exitosamente');
        setShowModal(false);
        setEditingId(null);
        setFormData({
          exercise: '',
          type: 'repeticiones',
          value: '',
          notes: '',
          is_pr: false,
          date: new Date().toISOString().split('T')[0]
        });
        fetchRecords();
        
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Error al guardar récord');
      }
    } catch (error: any) {
      console.error('Error saving record:', error);
      setError('Error de conexión. Por favor intenta nuevamente.');
    }
  };

  const handleEdit = (record: Record) => {
    setEditingId(record.id);
    setFormData({
      exercise: record.exercise,
      type: record.type,
      value: record.value.toString(),
      notes: record.notes || '',
      is_pr: record.is_pr,
      date: record.date.split('T')[0]
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este récord?')) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/records/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setSuccess('Récord eliminado exitosamente');
        fetchRecords();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Error al eliminar récord');
      }
    } catch (error: any) {
      console.error('Error deleting record:', error);
      setError('Error de conexión. Por favor intenta nuevamente.');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      exercise: '',
      type: 'repeticiones',
      value: '',
      notes: '',
      is_pr: false,
      date: new Date().toISOString().split('T')[0]
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  };

  return (
    <>
      <Container>
        <Row className="mb-4">
          <Col>
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">
              <div>
                <h1 className="h3 mb-0">Récords Personales</h1>
                <p className="text-muted mb-0">Tus mejores marcas y logros</p>
              </div>
              <Button variant="primary" onClick={() => setShowModal(true)} className="w-100 w-sm-auto">
                + Nuevo Récord
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
              <p>Cargando récords...</p>
            </Col>
          </Row>
        ) : (
          <Row>
            {records.length === 0 ? (
              <Col>
                <Card>
                  <Card.Body className="text-center">
                    <p>No tienes récords registrados aún.</p>
                    <Button variant="primary" onClick={() => setShowModal(true)}>
                      Registrar Primer Récord
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ) : (
              <Col>
                <Card>
                  <Card.Body>
                    <div className="table-responsive">
                      <Table striped hover>
                      <thead>
                        <tr>
                          <th>Ejercicio</th>
                          <th>Tipo</th>
                          <th>Valor</th>
                          <th>Fecha</th>
                          <th>Notas</th>
                          <th>PR</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((record) => (
                          <tr key={record.id}>
                            <td>{record.exercise}</td>
                            <td>{record.type}</td>
                            <td><strong>{record.value}</strong></td>
                            <td>{formatDate(record.date)}</td>
                            <td>{record.notes || '-'}</td>
                            <td>
                              {record.is_pr && (
                                <Badge bg="danger">PR</Badge>
                              )}
                            </td>
                            <td>
                              <div className="d-flex flex-column flex-sm-row gap-2">
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  onClick={() => handleEdit(record)}
                                  className="w-100 w-sm-auto"
                                >
                                  Editar
                                </Button>
                                <Button 
                                  variant="outline-danger" 
                                  size="sm"
                                  onClick={() => handleDelete(record.id)}
                                  className="w-100 w-sm-auto"
                                >
                                  Eliminar
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            )}
          </Row>
        )}
      </Container>

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{editingId ? 'Editar Récord' : 'Nuevo Récord'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Ejercicio</Form.Label>
              <Form.Control
                type="text"
                value={formData.exercise}
                onChange={(e) => setFormData({ ...formData, exercise: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tipo</Form.Label>
              <Form.Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="repeticiones">Repeticiones</option>
                <option value="peso">Peso (kg)</option>
                <option value="tiempo">Tiempo (min)</option>
                <option value="distancia">Distancia (km)</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Valor</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                required
              />
            </Form.Group>
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
              <Form.Label>Notas</Form.Label>
              <Form.Control
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Récord Personal (PR)"
                checked={formData.is_pr}
                onChange={(e) => setFormData({ ...formData, is_pr: e.target.checked })}
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

