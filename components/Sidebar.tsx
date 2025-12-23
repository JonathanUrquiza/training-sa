'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { Nav, Button, Dropdown } from 'react-bootstrap';

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [managementOpen, setManagementOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const menuItems = [
    { href: '/', label: 'Inicio', icon: '🏠' },
    { href: '/ejercicios', label: 'Ejercicios', icon: '📋' },
    { href: '/wods', label: 'WODs', icon: '⚡' },
    { href: '/entrenamientos', label: 'Mis Entrenamientos', icon: '📊' },
    { href: '/records', label: 'Récords', icon: '🏆' },
    { href: '/objetivos', label: 'Objetivos', icon: '🎯' },
  ];

  return (
    <>
      {/* Botón hamburguesa para móvil */}
      {isMobile && (
        <Button
          variant="dark"
          className="sidebar-toggle position-fixed"
          onClick={toggleSidebar}
          style={{
            top: '1rem',
            left: '1rem',
            zIndex: 1051,
            borderRadius: '0.5rem',
            padding: '0.5rem 0.75rem',
            fontSize: '1.25rem',
            minWidth: '45px',
            minHeight: '45px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isOpen ? '✕' : '☰'}
        </Button>
      )}

      {/* Overlay para móvil */}
      {isMobile && isOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeSidebar}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1040
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${isOpen ? 'open' : ''} ${isMobile ? 'mobile' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: isOpen ? 0 : (isMobile ? '-280px' : 0),
          height: '100vh',
          width: '280px',
          backgroundColor: 'var(--bg-secondary)',
          zIndex: 1050,
          transition: 'left 0.3s ease',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div className="sidebar-header" style={{ padding: '1.5rem', borderBottom: '2px solid var(--border-color)' }}>
          <h3 style={{ 
            margin: 0, 
            color: 'var(--neon-cyan)',
            textShadow: '0 0 10px rgba(0, 240, 255, 0.5)',
            fontSize: '1.25rem'
          }}>
            💪 Entrenamiento
          </h3>
        </div>

        <Nav className="flex-column" style={{ padding: '1rem 0', flex: 1 }}>
          {menuItems.map((item) => (
            <Nav.Link
              key={item.href}
              as={Link}
              href={item.href}
              onClick={closeSidebar}
              className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
              style={{
                padding: '0.75rem 1.5rem',
                color: pathname === item.href ? 'var(--neon-pink)' : 'var(--text-primary)',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                borderLeft: pathname === item.href ? '3px solid var(--neon-pink)' : '3px solid transparent',
                textShadow: pathname === item.href ? '0 0 10px rgba(255, 0, 255, 0.5)' : 'none',
                display: 'flex',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => {
                if (pathname !== item.href) {
                  e.currentTarget.style.color = 'var(--neon-cyan)';
                  e.currentTarget.style.textShadow = '0 0 5px rgba(0, 240, 255, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (pathname !== item.href) {
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.textShadow = 'none';
                }
              }}
            >
              <span style={{ marginRight: '0.75rem', fontSize: '1.2rem', minWidth: '1.5rem' }}>{item.icon}</span>
              <span>{item.label}</span>
            </Nav.Link>
          ))}

          {/* Dropdown Management */}
          <div style={{ padding: '0.75rem 1.5rem', marginTop: '0.5rem' }}>
            <Dropdown 
              show={managementOpen} 
              onToggle={(isOpen) => setManagementOpen(isOpen)}
            >
              <Dropdown.Toggle
                as={Button}
                variant="link"
                className="w-100 text-start sidebar-link"
                style={{
                  padding: '0.75rem 0',
                  color: pathname?.startsWith('/management') ? 'var(--neon-pink)' : 'var(--text-primary)',
                  textDecoration: 'none',
                  border: 'none',
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  textShadow: pathname?.startsWith('/management') ? '0 0 10px rgba(255, 0, 255, 0.5)' : 'none',
                  borderLeft: pathname?.startsWith('/management') ? '3px solid var(--neon-pink)' : '3px solid transparent',
                }}
              >
                <span style={{ marginRight: '0.75rem', fontSize: '1.2rem', minWidth: '1.5rem' }}>⚙️</span>
                <span style={{ flex: 1 }}>Management</span>
                <span style={{ fontSize: '0.875rem' }}>{managementOpen ? '▼' : '▶'}</span>
              </Dropdown.Toggle>
              <Dropdown.Menu
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '2px solid var(--neon-cyan)',
                  borderRadius: '0.5rem',
                  marginTop: '0.5rem',
                  boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)',
                  padding: '0.5rem 0'
                }}
              >
                <Dropdown.Item
                  as={Link}
                  href="/management/dashboard"
                  onClick={closeSidebar}
                  style={{
                    color: pathname === '/management/dashboard' ? 'var(--neon-pink)' : 'var(--text-primary)',
                    backgroundColor: 'transparent',
                    padding: '0.75rem 1.5rem',
                    textShadow: pathname === '/management/dashboard' ? '0 0 10px rgba(255, 0, 255, 0.5)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (pathname !== '/management/dashboard') {
                      e.currentTarget.style.color = 'var(--neon-cyan)';
                      e.currentTarget.style.textShadow = '0 0 5px rgba(0, 240, 255, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (pathname !== '/management/dashboard') {
                      e.currentTarget.style.color = 'var(--text-primary)';
                      e.currentTarget.style.textShadow = 'none';
                    }
                  }}
                >
                  📊 Dashboard
                </Dropdown.Item>
                <Dropdown.Item
                  as={Link}
                  href="/management/generate-workout"
                  onClick={closeSidebar}
                  style={{
                    color: pathname === '/management/generate-workout' ? 'var(--neon-pink)' : 'var(--text-primary)',
                    backgroundColor: 'transparent',
                    padding: '0.75rem 1.5rem',
                    textShadow: pathname === '/management/generate-workout' ? '0 0 10px rgba(255, 0, 255, 0.5)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (pathname !== '/management/generate-workout') {
                      e.currentTarget.style.color = 'var(--neon-cyan)';
                      e.currentTarget.style.textShadow = '0 0 5px rgba(0, 240, 255, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (pathname !== '/management/generate-workout') {
                      e.currentTarget.style.color = 'var(--text-primary)';
                      e.currentTarget.style.textShadow = 'none';
                    }
                  }}
                >
                  🎲 Generar Entrenamiento
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </Nav>

        <div className="sidebar-footer" style={{ 
          padding: '1.5rem', 
          borderTop: '2px solid var(--border-color)',
          marginTop: 'auto'
        }}>
          <Button
            variant="outline-primary"
            onClick={toggleTheme}
            className="w-100 theme-toggle-sidebar"
            style={{
              borderColor: 'var(--neon-cyan)',
              color: 'var(--neon-cyan)',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem'
            }}
          >
            {theme === 'dark' ? (
              <>
                <span>☀️</span>
                <span>Modo Claro</span>
              </>
            ) : (
              <>
                <span>🌙</span>
                <span>Modo Oscuro</span>
              </>
            )}
          </Button>
        </div>
      </aside>

    </>
  );
}

