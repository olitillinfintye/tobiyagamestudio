import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import { useRef, Suspense } from "react";
import * as THREE from "three";

function VRHeadsetModel() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <group ref={groupRef} scale={1.8}>
        {/* Main headset body */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2, 1, 1.2]} />
          <MeshDistortMaterial
            color="#1a1a2e"
            roughness={0.3}
            metalness={0.8}
            distort={0.1}
            speed={2}
          />
        </mesh>

        {/* Front visor/lens area */}
        <mesh position={[0, 0, 0.55]}>
          <boxGeometry args={[1.9, 0.9, 0.15]} />
          <meshStandardMaterial
            color="#00d4ff"
            emissive="#00d4ff"
            emissiveIntensity={0.5}
            roughness={0.1}
            metalness={0.9}
          />
        </mesh>

        {/* Left lens */}
        <mesh position={[-0.45, 0, 0.65]}>
          <cylinderGeometry args={[0.3, 0.3, 0.1, 32]} />
          <meshStandardMaterial
            color="#0a0a1a"
            emissive="#00d4ff"
            emissiveIntensity={0.3}
            roughness={0}
            metalness={1}
          />
        </mesh>

        {/* Right lens */}
        <mesh position={[0.45, 0, 0.65]}>
          <cylinderGeometry args={[0.3, 0.3, 0.1, 32]} />
          <meshStandardMaterial
            color="#0a0a1a"
            emissive="#00d4ff"
            emissiveIntensity={0.3}
            roughness={0}
            metalness={1}
          />
        </mesh>

        {/* Head strap - left */}
        <mesh position={[-1.1, 0, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.3, 0.15, 0.8]} />
          <meshStandardMaterial color="#2a2a4e" roughness={0.5} metalness={0.5} />
        </mesh>

        {/* Head strap - right */}
        <mesh position={[1.1, 0, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.3, 0.15, 0.8]} />
          <meshStandardMaterial color="#2a2a4e" roughness={0.5} metalness={0.5} />
        </mesh>

        {/* Top accent */}
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[1.5, 0.1, 0.8]} />
          <meshStandardMaterial
            color="#00d4ff"
            emissive="#00d4ff"
            emissiveIntensity={0.3}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>

        {/* Side accents */}
        <mesh position={[-1.02, 0, 0]}>
          <boxGeometry args={[0.05, 0.6, 0.6]} />
          <meshStandardMaterial
            color="#00d4ff"
            emissive="#00d4ff"
            emissiveIntensity={0.4}
          />
        </mesh>
        <mesh position={[1.02, 0, 0]}>
          <boxGeometry args={[0.05, 0.6, 0.6]} />
          <meshStandardMaterial
            color="#00d4ff"
            emissive="#00d4ff"
            emissiveIntensity={0.4}
          />
        </mesh>
      </group>
    </Float>
  );
}

function Particles() {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 100;

  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 15;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 15;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
  }

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#00d4ff" transparent opacity={0.6} />
    </points>
  );
}

export default function VRHeadset3D() {
  return (
    <div className="absolute inset-0 z-0 opacity-60">
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.3} />
          <pointLight position={[10, 10, 10]} intensity={1} color="#00d4ff" />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#a855f7" />
          <spotLight
            position={[0, 5, 5]}
            angle={0.3}
            penumbra={1}
            intensity={1}
            color="#00d4ff"
          />
          <VRHeadsetModel />
          <Particles />
        </Suspense>
      </Canvas>
    </div>
  );
}
