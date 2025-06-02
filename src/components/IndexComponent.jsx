import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function Earth() {
  const earthRef = useRef();
  const cloudsRef = useRef();

  const { size } = useThree(); // <-- accedemos al tamaño del canvas

  // Cargar texturas
  const [colorMap, bumpMap, specularMap, cloudMap] = useLoader(THREE.TextureLoader, [
    '/textures/earth/earth_color.jpg',
    '/textures/earth/earth_bump.jpg',
    '/textures/earth/earth_specular.jpg',
    '/textures/earth/earth_clouds.jpg',
  ]);

  // Escalado dinámico basado en tamaño del canvas
  useEffect(() => {
    const width = size.width;
    let scale = 1;

    if (width < 640) {
      scale = 0.5;
    } else if (width < 1024) {
      scale = 0.8;
    } else {
      scale = 1;
    }

    if (earthRef.current) earthRef.current.scale.set(scale, scale, scale);
    if (cloudsRef.current) cloudsRef.current.scale.set(scale, scale, scale);
  }, [size]);

  // Rotación
  useFrame(() => {
    if (earthRef.current) earthRef.current.rotation.y += 0.001;
    if (cloudsRef.current) cloudsRef.current.rotation.y += 0.0012;
  });

  return (
    <>
      {/* Tierra */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshPhongMaterial
          map={colorMap}
          bumpMap={bumpMap}
          bumpScale={0.05}
          specularMap={specularMap}
          specular={new THREE.Color('grey')}
          shininess={10}
        />
      </mesh>

      {/* Nubes */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[2.03, 64, 64]} />
        <meshPhongMaterial
          map={cloudMap}
          transparent={true}
          opacity={0.4}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

// Hook para detectar si es móvil o tablet
function useIsMobileOrTablet() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 1024); // 1024px: breakpoint típico de tablet
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

export default function EarthScene() {
  const isMobileOrTablet = useIsMobileOrTablet();

  return (
    <div style={{ minHeight: '100vh', background: 'bg-background' }}>
      {/* Sección del globo, sticky para que no desaparezca al hacer scroll */}
      <div style={{
        height: '100vh',
        width: '100%',
        position: 'relative',
        top: 0,
        left: 0,
        zIndex: 10,
        background: 'bg-background'
      }}>
        <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 3, 5]} intensity={1} />
          <Earth />
          {!isMobileOrTablet && (
            <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.5} />
          )}
        </Canvas>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg text-center mb-4">
            APIones Dashboard
          </h1>
          <p className="text-lg md:text-2xl text-gray-200 text-center max-w-xl drop-shadow">
            Visualiza el impacto ambiental de la aviación en tiempo real
          </p>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce pointer-events-none">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="white">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Sección de información */}
      <section className="bg-secondary py-16 px-4" id="info">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 text-text">¿Qué es APIones?</h2>
          <p className="text-lg text-text mb-6">
            APIones es un dashboard interactivo que monitoriza vuelos en tiempo real y calcula el consumo de combustible y las emisiones de CO₂ de los aviones sobre cada continente.
            Utiliza datos abiertos y modelos físicos para estimar el impacto ambiental de la aviación, ayudando a concienciar sobre la huella ecológica del transporte aéreo.
          </p>
          <div className="grid md:grid-cols-3 gap-8 mt-10">
            <div>
              <h3 className="text-xl font-semibold text-blue-600 mb-2">Datos en tiempo real</h3>
              <p className="text-text">Actualización automática de vuelos y emisiones por región.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-green-600 mb-2">Visualización interactiva</h3>
              <p className="text-text">Gráficas y mapas para comparar el impacto entre continentes.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-red-600 mb-2">Conciencia ambiental</h3>
              <p className="text-text">Promueve la reflexión sobre el papel de la aviación en el cambio climático.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Más contenido extra */}
      <section className="bg-background py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4 text-text">¿Por qué importa?</h2>
          <p className="text-text mb-6">
            La aviación es responsable de una parte significativa de las emisiones globales de gases de efecto invernadero.
            Conocer el impacto de cada vuelo ayuda a tomar decisiones más responsables y a fomentar la innovación hacia un transporte aéreo más sostenible.
          </p>
          <div className="grid md:grid-cols-2 gap-8 mt-10">
            <div>
              <h3 className="text-lg font-semibold text-pink-600 mb-2">Transparencia</h3>
              <p className="text-text">Todos los datos provienen de fuentes abiertas y se procesan en tiempo real.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-amber-600 mb-2">Educación</h3>
              <p className="text-text">El objetivo es informar y concienciar, no solo mostrar cifras.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Aviso legal */}
      <section className="bg-secondary py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-text">
            Toda la información legal y de privacidad está disponible{' '}
            <a href="/Legal" className="text-blue-600 underline hover:text-blue-800">AQUÍ</a>.
          </p>
        </div>
      </section>
    </div>
  );
}