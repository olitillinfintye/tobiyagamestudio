import { Canvas, useFrame } from "@react-three/fiber";
import { Float, useGLTF, OrbitControls } from "@react-three/drei";
import { useRef, Suspense, useEffect, useState } from "react";
import * as THREE from "three";

function PreviewModel({ modelUrl }: { modelUrl: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const [scene, setScene] = useState<THREE.Group | null>(null);
  
  useEffect(() => {
    const loader = new THREE.ObjectLoader();
    useGLTF.preload(modelUrl);
  }, [modelUrl]);

  const { scene: loadedScene } = useGLTF(modelUrl);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <group ref={groupRef} scale={1.5} position={[0, 0, 0]}>
        <primitive object={loadedScene.clone()} />
      </group>
    </Float>
  );
}

interface Model3DPreviewProps {
  modelUrl: string;
  className?: string;
}

export default function Model3DPreview({ modelUrl, className = "" }: Model3DPreviewProps) {
  const [hasError, setHasError] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    setHasError(false);
    setKey(prev => prev + 1);
  }, [modelUrl]);

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-muted/20 rounded-lg ${className}`}>
        <p className="text-sm text-muted-foreground">Failed to load 3D model</p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg overflow-hidden bg-gradient-to-br from-background to-muted/30 ${className}`}>
      <Canvas 
        key={key}
        camera={{ position: [0, 0, 4], fov: 50 }}
        onError={() => setHasError(true)}
      >
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
          <PreviewModel modelUrl={modelUrl} />
          <OrbitControls enableZoom={true} enablePan={false} />
        </Suspense>
      </Canvas>
    </div>
  );
}
