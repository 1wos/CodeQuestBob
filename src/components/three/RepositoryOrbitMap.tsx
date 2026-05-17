import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { Html, Line, OrbitControls } from '@react-three/drei';
import type { Group, Mesh } from 'three';
import type { GrowthQuest } from '../../domain/types';
import './RepositoryOrbitMap.css';

type RepositoryOrbitMapProps = {
  quests: GrowthQuest[];
  completedQuestIds: string[];
  onSelectQuest: (questId: string) => void;
};

type QuestNodeProps = {
  quest: GrowthQuest;
  index: number;
  total: number;
  completed: boolean;
  onSelect: () => void;
};

function RepositoryCore() {
  const groupRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = clock.elapsedTime * 0.25;
    groupRef.current.position.y = Math.sin(clock.elapsedTime * 0.8) * 0.08;
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <boxGeometry args={[1.18, 1.18, 1.18]} />
        <meshStandardMaterial
          color="#0f62fe"
          emissive="#0f62fe"
          emissiveIntensity={0.18}
          roughness={0.32}
          metalness={0.24}
        />
      </mesh>
      <mesh scale={1.18}>
        <boxGeometry args={[1.12, 1.12, 1.12]} />
        <meshBasicMaterial color="#78a9ff" wireframe transparent opacity={0.32} />
      </mesh>
      <mesh scale={1.45} rotation={[0.42, 0.2, 0.76]}>
        <octahedronGeometry args={[1.05, 0]} />
        <meshBasicMaterial color="#33b1ff" wireframe transparent opacity={0.18} />
      </mesh>
      <Html center position={[0, -1.35, 0]} distanceFactor={7}>
        <div className="orbit-core-label">
          <span>repo core</span>
          <strong>IBM Bob context</strong>
        </div>
      </Html>
    </group>
  );
}

function QuestNode({ quest, index, total, completed, onSelect }: QuestNodeProps) {
  const meshRef = useRef<Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);
  const angle = useMemo(() => (index / total) * Math.PI * 2 - Math.PI / 2, [index, total]);
  const radius = 2.55;
  const position: [number, number, number] = [
    Math.cos(angle) * radius,
    index % 2 === 0 ? 0.28 : -0.28,
    Math.sin(angle) * radius,
  ];

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = clock.elapsedTime * 0.8;
    meshRef.current.position.y = Math.sin(clock.elapsedTime + index) * 0.08;
  });

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setIsHovered(true);
    document.body.style.cursor = 'pointer';
    if (meshRef.current) {
      meshRef.current.scale.setScalar(1.12);
    }
  };

  const handlePointerOut = () => {
    setIsHovered(false);
    document.body.style.cursor = '';
    if (meshRef.current) {
      meshRef.current.scale.setScalar(1);
    }
  };

  return (
    <group position={position}>
      <Line
        points={[[0, 0, 0], [-position[0], -position[1], -position[2]]]}
        color={completed ? '#42be65' : '#78a9ff'}
        lineWidth={1}
        transparent
        opacity={0.32}
      />
      <mesh
        ref={meshRef}
        onClick={onSelect}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[0.42, 48, 32]} />
        <meshStandardMaterial
          color={completed ? '#24a148' : quest.color}
          emissive={completed ? '#0e6027' : quest.color}
          emissiveIntensity={0.24}
          roughness={0.34}
          metalness={0.18}
        />
      </mesh>
      <mesh scale={1.18}>
        <sphereGeometry args={[0.42, 24, 16]} />
        <meshBasicMaterial
          color={completed ? '#42be65' : '#78a9ff'}
          wireframe
          transparent
          opacity={0.28}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.7, 0.012, 12, 80]} />
        <meshBasicMaterial color={completed ? '#24a148' : '#78a9ff'} transparent opacity={0.6} />
      </mesh>
      <Html center position={[0, 0.84, 0]} distanceFactor={8.6}>
        <button
          type="button"
          className={`orbit-node-label ${isHovered ? 'is-active' : ''} ${
            completed ? 'is-completed' : ''
          }`}
          onClick={onSelect}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onFocus={() => setIsHovered(true)}
          onBlur={() => setIsHovered(false)}
        >
          <span>Level {quest.level}</span>
          <strong>{quest.title}</strong>
          <em>
            +{quest.xpReward} XP · {quest.difficulty}
          </em>
        </button>
      </Html>
    </group>
  );
}

function DataConstellation() {
  const points = useMemo(() => {
    return Array.from({ length: 72 }, (_, index) => {
      const angle = index * 2.399963;
      const radius = 3.2 + (index % 9) * 0.22;
      const height = ((index % 7) - 3) * 0.33;
      return [
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius,
      ] as [number, number, number];
    });
  }, []);

  return (
    <group>
      {points.map((point, index) => (
        <mesh key={`${point.join('-')}-${index}`} position={point}>
          <boxGeometry args={[0.035, 0.035, 0.035]} />
          <meshBasicMaterial color={index % 3 === 0 ? '#78a9ff' : '#525252'} transparent opacity={0.74} />
        </mesh>
      ))}
    </group>
  );
}

function RepositorySlabs() {
  const slabs = useMemo(
    () => [
      { position: [-3.1, -1.12, -0.8] as [number, number, number], width: 1.18, color: '#0f62fe' },
      { position: [-1.52, -1.22, 1.15] as [number, number, number], width: 0.92, color: '#4589ff' },
      { position: [1.36, -1.18, -1.34] as [number, number, number], width: 1.06, color: '#78a9ff' },
      { position: [3.08, -1.1, 0.92] as [number, number, number], width: 1.26, color: '#0f62fe' },
    ],
    [],
  );

  return (
    <group rotation={[0, 0.18, 0]}>
      {slabs.map((slab, index) => (
        <group key={slab.color + index} position={slab.position} rotation={[0, index * 0.38, 0]}>
          <mesh>
            <boxGeometry args={[slab.width, 0.08, 0.42]} />
            <meshStandardMaterial
              color={slab.color}
              emissive={slab.color}
              emissiveIntensity={0.14}
              roughness={0.4}
              metalness={0.2}
            />
          </mesh>
          <mesh position={[0, 0.07, 0]}>
            <boxGeometry args={[slab.width * 0.78, 0.012, 0.46]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.18} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function OrbitScene({ quests, completedQuestIds, onSelectQuest }: RepositoryOrbitMapProps) {
  const completedSet = useMemo(() => new Set(completedQuestIds), [completedQuestIds]);

  return (
    <>
      <color attach="background" args={['#080d18']} />
      <fog attach="fog" args={['#080d18', 8, 16]} />
      <ambientLight intensity={0.58} />
      <directionalLight position={[3, 5, 4]} intensity={1.4} />
      <pointLight position={[-4, 2, -3]} intensity={2.4} color="#78a9ff" />
      <pointLight position={[4, -1, 3]} intensity={1.2} color="#0f62fe" />

      <group rotation={[0.18, 0, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.55, 0.012, 12, 180]} />
          <meshBasicMaterial color="#78a9ff" transparent opacity={0.34} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, Math.PI / 4]}>
          <torusGeometry args={[1.64, 0.009, 12, 160]} />
          <meshBasicMaterial color="#0f62fe" transparent opacity={0.28} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, -Math.PI / 6]}>
          <torusGeometry args={[3.16, 0.006, 12, 220]} />
          <meshBasicMaterial color="#525252" transparent opacity={0.26} />
        </mesh>
        <DataConstellation />
        <RepositorySlabs />
        <RepositoryCore />
        {quests.map((quest, index) => (
          <QuestNode
            key={quest.id}
            quest={quest}
            index={index}
            total={quests.length}
            completed={completedSet.has(quest.id)}
            onSelect={() => onSelectQuest(quest.id)}
          />
        ))}
      </group>

      <OrbitControls
        autoRotate
        autoRotateSpeed={0.62}
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 3.2}
        maxPolarAngle={Math.PI / 1.8}
      />
    </>
  );
}

export function RepositoryOrbitMap({ quests, completedQuestIds, onSelectQuest }: RepositoryOrbitMapProps) {
  return (
    <section className="repository-orbit-shell" aria-label="Interactive 3D repository quest map">
      <div className="repository-orbit-copy">
        <span>Interactive Repository Orbit</span>
        <p>
          IBM Bob turns the repository core into a quest path: setup, exploration, improvement,
          and first PR packaging.
        </p>
        <div className="repository-orbit-stats" aria-label="3D map status">
          <strong>{quests.length}</strong>
          <span>quest nodes</span>
        </div>
      </div>
      <div className="repository-orbit-canvas">
        <Canvas
          camera={{ position: [0, 4.1, 8.4], fov: 40 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
        >
          <OrbitScene
            quests={quests}
            completedQuestIds={completedQuestIds}
            onSelectQuest={onSelectQuest}
          />
        </Canvas>
      </div>
    </section>
  );
}
