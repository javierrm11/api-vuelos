import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

function Earth() {
  const earthRef = useRef();
  const cloudsRef = useRef();
  const glowRef = useRef();

  const { size } = useThree();

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

      {/* Nubes (smaller size) */}
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

function useIsMobileOrTablet() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 1024);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

const FeatureCard = ({ title, description, color }) => {
  return (
    <div className="p-6 rounded-xl backdrop-blur-sm bg-white/5 dark:bg-primary/5 border border-secondary/20 dark:border-accent/20 shadow-lg transition-all duration-300 hover:-translate-y-1">
      <h3 className={`text-xl mb-2 font-semibold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
        {title}
      </h3>
      <p className="text-text dark:text-light">{description}</p>
    </div>
  );
};

export default function EarthScene() {
  const isMobileOrTablet = useIsMobileOrTablet();

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background text-text dark:text-light transition-colors duration-300">
      {/* Hero Section */}
      <div className="h-[90dvh] w-full relative overflow-hidden bg-gradient-to-b from-secondary/10 to-primary/10 dark:from-primary/20 dark:to-background/50">
        <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <directionalLight position={[5, 3, 5]} intensity={1.5} />
          <Earth />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          {!isMobileOrTablet && (
            <OrbitControls 
              enablePan={false} 
              enableZoom={false} 
              autoRotate 
              autoRotateSpeed={0.5} 
              minPolarAngle={Math.PI / 3}
              maxPolarAngle={Math.PI / 3}
            />
          )}
        </Canvas>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-center px-[20%] animate-fade-in-up">
            <h1 className="text-4xl md:text-6xl font-bold text-light mb-4">
              <span className='text-accent dark:text-accent underline decoration-primary'>
                APIones
              </span>{' '}
              Dashboard
            </h1>
            <p className={`text-lg md:text-2xl text-white dark:text-light max-w-xl ${isMobileOrTablet ? 'mx-4' : 'mx-auto'}`}>
              Visualiza el impacto ambiental de la aviación en tiempo real con datos globales
            </p>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none animate-bounce">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-primary dark:text-accent">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Content Sections */}
      <div className="relative z-20">
        {/* About Section */}
        <section className="py-20 px-4 max-w-6xl mx-auto" id="about">
          <div className="mb-16 text-center animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-primary dark:text-accent mb-4">
              ¿Qué es <span className="text-primary dark:text-accent">APIones</span>?
            </h2>
            <div className="w-24 h-1 bg-primary dark:bg-accent mx-auto mb-6"></div>
            <p className="text-lg text-text/80 dark:text-light/80 max-w-3xl mx-auto">
              APIones es un dashboard interactivo que monitoriza vuelos en tiempo real y calcula el consumo de combustible y las emisiones de CO₂ de los aviones sobre cada continente.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              title="Datos en tiempo real"
              description="Actualización automática de vuelos y emisiones por región con información precisa."
              color="from-red-400 to-pink-500"
            />
            <FeatureCard
              title="Visualización interactiva"
              description="Gráficas 3D y mapas para comparar el impacto entre continentes y países."
              color="from-purple-400 to-indigo-500"
            />
            <FeatureCard
              title="Conciencia ambiental"
              description="Promovemos la reflexión sobre el papel de la aviación en el cambio climático."
              color="from-amber-400 to-orange-500"
            />
          </div>
        </section>

        {/* Why It Matters Section */}
        <section className="py-20 px-4 bg-secondary/10 dark:bg-primary/20">
          <div className="max-w-6xl mx-auto">
            <div className="mb-16 animate-fade-in-left">
              <h2 className="text-3xl md:text-4xl font-bold text-primary dark:text-accent mb-4">
                ¿Por qué es <span className="text-primary dark:text-accent">importante</span>?
              </h2>
              <div className="w-24 h-1 bg-primary dark:bg-accent mb-6"></div>
              <p className="text-lg text-text/80 dark:text-light/80 max-w-3xl">
                La aviación es responsable de aproximadamente el 2-3% de las emisiones globales de CO₂.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="p-8 bg-white/5 shadow-lg dark:bg-primary/5 rounded-xl border border-secondary/20 dark:border-accent/20 transition-all duration-300 hover:scale-[1.02]">
                <h3 className="text-2xl font-semibold text-primary dark:text-accent mb-4">Transparencia de datos</h3>
                <p className="text-text/80 dark:text-light/80 mb-6">
                  Todos los datos provienen de fuentes abiertas y se procesan con algoritmos verificados.
                </p>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-green-500 dark:text-green-400">Datos en vivo</span>
                </div>
              </div>

              <div className="p-8 bg-white/5 shadow-lg dark:bg-primary/5 rounded-xl border border-secondary/20 dark:border-accent/20 transition-all duration-300 hover:scale-[1.02]">
                <h3 className="text-2xl font-semibold text-primary dark:text-accent mb-4">Educación ambiental</h3>
                <p className="text-text/80 dark:text-light/80 mb-6">
                  Más que mostrar cifras, nuestro objetivo es educar sobre el impacto real.
                </p>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse"></div>
                  <span className="text-blue-500 dark:text-blue-400">Actualizado cada 5 minutos</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-primary dark:text-accent mb-6">
              Únete a la conversación sobre <span className="text-primary dark:text-accent">aviación sostenible</span>
            </h2>
            <p className="text-lg text-text/80 dark:text-light/80 mb-8">
              Explora los datos y ayuda a crear conciencia sobre el impacto ambiental.
            </p>
            <a href="/Spain"className="px-8 py-3 bg-gradient-to-r from-primary to-accent dark:from-accent dark:to-primary text-white rounded-lg font-medium shadow-lg hover:opacity-90 transition-opacity">
              Explorar Dashboard
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}