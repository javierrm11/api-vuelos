// EarthScene.js

import React, { useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function Earth() {
  const earthRef = useRef();
  const cloudsRef = useRef();

  // Cargar texturas
  const [colorMap, bumpMap, specularMap, cloudMap] = useLoader(THREE.TextureLoader, [
    '/textures/earth/earth_color.jpg',
    '/textures/earth/earth_bump.jpg',
    '/textures/earth/earth_specular.jpg',
    '/textures/earth/earth_clouds.jpg',
  ]);

  // Rotación de la Tierra y las nubes
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

export default function EarthScene() {
  return (
    <div style={{ width: '100%', height: '100vh', background: 'black' }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 3, 5]} intensity={1} />
        <Earth />
        <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}
