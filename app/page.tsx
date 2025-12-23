'use client';

import { Container, Row, Col, Card } from 'react-bootstrap';
import Link from 'next/link';

export default function Home() {
  return (
    <Container>
        <Row className="mb-4">
          <Col>
            <h1 className="display-4 display-6-md">Bienvenido a tu App de Entrenamiento</h1>
            <p className="lead">
              Registra tus entrenamientos, sigue tu progreso y alcanza tus objetivos.
            </p>
          </Col>
        </Row>

        <Row>
          <Col xs={12} sm={6} md={4} className="mb-4">
            <Card className="h-100">
              <Card.Body>
                <Card.Title>
                  <Link href="/ejercicios" className="text-decoration-none">
                    📋 Ejercicios
                  </Link>
                </Card.Title>
                <Card.Text>
                  Explora más de 700 ejercicios organizados por categorías y niveles.
                  Encuentra ejercicios de calentamiento, calistenia, gimnásticos y más.
                </Card.Text>
                <Link href="/ejercicios" className="btn btn-primary">
                  Ver Ejercicios
                </Link>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} md={4} className="mb-4">
            <Card className="h-100">
              <Card.Body>
                <Card.Title>
                  <Link href="/wods" className="text-decoration-none">
                    ⚡ WODs
                  </Link>
                </Card.Title>
                <Card.Text>
                  Accede a más de 38 WODs incluyendo benchmarks como Fran, Grace,
                  Nasty Girls y muchos más. Desafía tus límites.
                </Card.Text>
                <Link href="/wods" className="btn btn-primary">
                  Ver WODs
                </Link>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} md={4} className="mb-4">
            <Card className="h-100">
              <Card.Body>
                <Card.Title>
                  <Link href="/entrenamientos" className="text-decoration-none">
                    📊 Mis Entrenamientos
                  </Link>
                </Card.Title>
                <Card.Text>
                  Registra y revisa tu historial de entrenamientos. 
                  Lleva un seguimiento detallado de tu progreso.
                </Card.Text>
                <Link href="/entrenamientos" className="btn btn-primary">
                  Ver Entrenamientos
                </Link>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} md={4} className="mb-4">
            <Card className="h-100">
              <Card.Body>
                <Card.Title>
                  <Link href="/records" className="text-decoration-none">
                    🏆 Récords Personales
                  </Link>
                </Card.Title>
                <Card.Text>
                  Registra y visualiza tus récords personales. 
                  Supera tus marcas anteriores y celebra tus logros.
                </Card.Text>
                <Link href="/records" className="btn btn-primary">
                  Ver Récords
                </Link>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} md={4} className="mb-4">
            <Card className="h-100">
              <Card.Body>
                <Card.Title>
                  <Link href="/objetivos" className="text-decoration-none">
                    🎯 Objetivos
                  </Link>
                </Card.Title>
                <Card.Text>
                  Establece y monitorea tus objetivos de entrenamiento. 
                  Mantén la motivación y alcanza tus metas.
                </Card.Text>
                <Link href="/objetivos" className="btn btn-primary">
                  Ver Objetivos
                </Link>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
  );
}

