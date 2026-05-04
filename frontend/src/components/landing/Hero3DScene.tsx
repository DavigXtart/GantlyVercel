import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function GLogoMesh() {
  const meshRef = useRef<THREE.Mesh>(null);

  const shape = useMemo(() => {
    const s = new THREE.Shape();
    // Simplified G shape — a bold arc with crossbar
    s.moveTo(2, 0);
    s.absarc(0, 0, 2, 0, Math.PI * 1.7, false);
    s.lineTo(-0.6, 1.2);
    s.lineTo(-0.6, 0.6);
    s.absarc(0, 0, 1.4, Math.PI * 1.7, 0, true);
    s.lineTo(1.4, 0);
    s.lineTo(1.4, -0.5);
    s.lineTo(0, -0.5);
    s.lineTo(0, 0);
    s.lineTo(2, 0);
    return s;
  }, []);

  const extrudeSettings = useMemo(() => ({
    depth: 0.6,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.05,
    bevelSegments: 3,
  }), []);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={meshRef} position={[0, 0, 0]} scale={0.8}>
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <meshStandardMaterial color="#2E93CC" metalness={0.4} roughness={0.3} />
      </mesh>
    </Float>
  );
}

function Particles() {
  const count = 800;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return arr;
  }, []);

  const ref = useRef<THREE.Points>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.02;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#22D3EE" size={0.04} sizeAttenuation depthWrite={false} opacity={0.6} />
    </Points>
  );
}

export default function Hero3DScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 50 }}
      style={{ position: 'absolute', inset: 0 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1.2} color="#22D3EE" />
      <pointLight position={[-5, -3, 3]} intensity={0.8} color="#F0C930" />
      <GLogoMesh />
      <Particles />
    </Canvas>
  );
}
