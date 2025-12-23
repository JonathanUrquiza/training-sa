'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { useTheme } from '@/contexts/ThemeContext';

export default function AppNavbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <Navbar.Brand as={Link} href="/">
          💪 Entrenamiento App
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} href="/" active={pathname === '/'}>
              Inicio
            </Nav.Link>
            <Nav.Link as={Link} href="/ejercicios" active={pathname === '/ejercicios'}>
              Ejercicios
            </Nav.Link>
            <Nav.Link as={Link} href="/wods" active={pathname === '/wods'}>
              WODs
            </Nav.Link>
            <Nav.Link as={Link} href="/entrenamientos" active={pathname === '/entrenamientos'}>
              Mis Entrenamientos
            </Nav.Link>
            <Nav.Link as={Link} href="/records" active={pathname === '/records'}>
              Récords
            </Nav.Link>
            <Nav.Link as={Link} href="/objetivos" active={pathname === '/objetivos'}>
              Objetivos
            </Nav.Link>
          </Nav>
          <Nav>
            <Nav.Link
              as="button"
              className="theme-toggle border-0"
              onClick={toggleTheme}
              aria-label="Cambiar tema"
              style={{ background: 'transparent', cursor: 'pointer' }}
            >
              {theme === 'dark' ? (
                <>
                  <span>☀️</span>
                  <span className="d-none d-md-inline ms-1">Claro</span>
                </>
              ) : (
                <>
                  <span>🌙</span>
                  <span className="d-none d-md-inline ms-1">Oscuro</span>
                </>
              )}
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

