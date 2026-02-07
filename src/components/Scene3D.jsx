import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars, Grid } from '@react-three/drei';
import * as THREE from 'three';

// Quantum Data Cube (Rotating Core) - Optimized
function DataCube({ position, color, speed = 1 }) {
    const meshRef = useRef();
    const [hovered, setHover] = useState(false);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.x += 0.005 * speed; // Slower for smoother feel
            meshRef.current.rotation.y += 0.01 * speed;
            const targetScale = hovered ? 1.2 : 1;
            meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
            <group position={position}>
                {/* Wireframe Box */}
                <mesh ref={meshRef} onPointerOver={() => setHover(true)} onPointerOut={() => setHover(false)}>
                    <boxGeometry args={[1.2, 1.2, 1.2]} />
                    <meshBasicMaterial color={color} wireframe transparent opacity={0.4} />
                </mesh>
                {/* Inner Core - Low Poly */}
                <mesh>
                    <octahedronGeometry args={[0.5, 0]} />
                    <meshBasicMaterial color={color} wireframe={false} />
                </mesh>
            </group>
        </Float>
    );
}

// Optimized Particle Field (Reduced Count)
function ParticleField() {
    const count = 150; // Drastically reduced from 400 for performance
    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 35;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
        }
        return pos;
    }, []);

    const pointsRef = useRef();

    useFrame((state) => {
        if (pointsRef.current) {
            pointsRef.current.rotation.y = state.clock.elapsedTime * 0.03;
        }
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.15} // Slightly larger to compensate for fewer count
                color="#00f3ff"
                transparent
                opacity={0.5}
                sizeAttenuation
            />
        </points>
    );
}

// Holographic Floor Grid
function HoloGrid() {
    return (
        <Grid
            position={[0, -5, 0]}
            args={[40, 40]}
            cellSize={2}
            cellThickness={1}
            cellColor="#3b0764"
            sectionSize={10}
            sectionThickness={1.5}
            sectionColor="#a855f7"
            fadeDistance={30}
            fadeStrength={1}
            infiniteGrid
        />
    );
}

export default function Scene3D({ variant = 'home' }) {
    return (
        <div className="canvas-container">
            <Canvas
                camera={{ position: [0, 0, 14], fov: 45 }}
                // dpr={[1, 1.5]} // Limit pixel ratio for performance
                gl={{ antialias: true, alpha: true }}
                style={{ background: 'transparent' }}
            >
                {/* No heavy post-processing effects here anymore */}

                {/* Lights */}
                <ambientLight intensity={0.6} />
                <pointLight position={[10, 10, 10]} intensity={1.5} color="#00f3ff" />
                <pointLight position={[-10, -5, -10]} intensity={1} color="#d946ef" />

                {/* Environment */}
                <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={0.5} />

                <HoloGrid />

                {/* Floating Elements */}
                {variant === 'home' && (
                    <>
                        <DataCube position={[-5, 2, -2]} color="#00f3ff" speed={0.8} />
                        <DataCube position={[5, -2, -3]} color="#d946ef" speed={1} />
                        <DataCube position={[-3, -4, 1]} color="#8b5cf6" speed={0.6} />
                        <DataCube position={[6, 3, -4]} color="#22d3ee" speed={1.2} />
                    </>
                )}

                <ParticleField />
            </Canvas>
        </div>
    );
}
