import { Canvas, useFrame } from "@react-three/fiber";
import { Float, useGLTF } from "@react-three/drei";
import { useRef, Suspense, useEffect, useState } from "react";
import * as THREE from "three";
import { supabase } from "@/integrations/supabase/client";

function VRHeadsetModel({ modelUrl }: { modelUrl: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(modelUrl);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <group ref={groupRef} scale={2.5} position={[0, -0.5, 0]}>
        <primitive object={scene} />
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

// Preload the default model
useGLTF.preload("/models/vr_headset.glb");

export default function VRHeadset3D() {
  const [modelUrl, setModelUrl] = useState("/models/vr_headset.glb");

  useEffect(() => {
    const fetchModelUrl = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "hero_3d_model")
        .maybeSingle();

      if (data?.value) {
        setModelUrl(data.value);
      }
    };

    fetchModelUrl();
  }, []);

  return (
    <div className="absolute inset-0 z-0 opacity-60">
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} color="#00d4ff" />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#a855f7" />
          <spotLight
            position={[0, 5, 5]}
            angle={0.3}
            penumbra={1}
            intensity={1}
            color="#00d4ff"
          />
          <VRHeadsetModel modelUrl={modelUrl} />
          <Particles />
        </Suspense>
      </Canvas>
    </div>
  );
}
