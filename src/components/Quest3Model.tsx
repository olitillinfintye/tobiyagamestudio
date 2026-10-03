import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const MODEL_URL = "/models/quest3.glb";

/** Studio-style reflections without downloading an HDR file. */
function RoomLighting() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

function Headset({ drag }: { drag: React.MutableRefObject<{ x: number; y: number; active: boolean }> }) {
  const { scene } = useGLTF(MODEL_URL);
  const group = useRef<THREE.Group>(null);
  const spin = useRef(0.75);

  // Centre the model and normalise its size so any export fits the stage.
  const model = useMemo(() => {
    const root = scene.clone(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    root.position.sub(box.getCenter(new THREE.Vector3()));
    const pivot = new THREE.Group();
    pivot.add(root);
    pivot.scale.setScalar(2.6 / Math.max(size.x, size.y, size.z));
    return pivot;
  }, [scene]);

  useFrame((state, delta) => {
    if (!group.current) return;
    if (!drag.current.active) spin.current += delta * 0.25;
    const targetY = spin.current + drag.current.x;
    const targetX = 0.12 + drag.current.y;
    group.current.rotation.y += (targetY - group.current.rotation.y) * 0.08;
    group.current.rotation.x += (targetX - group.current.rotation.x) * 0.08;
    group.current.position.y = 0.2 + Math.sin(state.clock.elapsedTime * 1.2) * 0.08;
  });

  return (
    <group ref={group}>
      <primitive object={model} />
    </group>
  );
}

function FitCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const t = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const aspect = size.width / size.height;
    const dist = Math.max(2.1 / t, 1.9 / (t * aspect));
    cam.position.set(0, dist * 0.09, dist);
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

/** Interactive Meta Quest 3 model: auto-rotates, drag to turn, pauses when off-screen. */
export default function Quest3Model() {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const drag = useRef({ x: 0, y: 0, active: false });
  const last = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!wrap.current) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    io.observe(wrap.current);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={wrap}
      className="absolute inset-0 cursor-grab active:cursor-grabbing touch-pan-y"
      style={{ filter: "drop-shadow(0 30px 60px rgba(34,228,240,.25))" }}
      onPointerDown={(e) => {
        drag.current.active = true;
        last.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerMove={(e) => {
        if (!drag.current.active) return;
        drag.current.x += (e.clientX - last.current.x) * 0.01;
        drag.current.y = THREE.MathUtils.clamp(drag.current.y + (e.clientY - last.current.y) * 0.006, -0.6, 0.5);
        last.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={() => (drag.current.active = false)}
      onPointerLeave={() => (drag.current.active = false)}
      aria-hidden="true"
    >
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={[1, 1.75]}
        camera={{ fov: 32, position: [0, 0.9, 9.5] }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      >
        <Suspense fallback={null}>
          <RoomLighting />
          <FitCamera />
          <ambientLight intensity={0.25} />
          <directionalLight position={[3, 4, 5]} intensity={1.6} />
          <pointLight position={[-4, 1, -2]} intensity={30} color="#22e4f0" />
          <pointLight position={[4, -1, -3]} intensity={30} color="#8b5cf6" />
          <Headset drag={drag} />
          <mesh rotation-x={-Math.PI / 2} position-y={-0.85}>
            <ringGeometry args={[1.6, 1.64, 96]} />
            <meshBasicMaterial color="#22e4f0" transparent opacity={0.35} side={THREE.DoubleSide} />
          </mesh>
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload(MODEL_URL);
