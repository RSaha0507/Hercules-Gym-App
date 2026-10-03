import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useGym } from '../context/GymContext';

interface Global3DSceneProps {
  className?: string;
  intensity?: number;
}

export const Global3DScene: React.FC<Global3DSceneProps> = ({
  className = 'fixed inset-0 pointer-events-none z-0',
  intensity = 1,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { selectedCenter, currentAtmosphere } = useGym();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let isDisposed = false;
    let animationFrameId: number;

    // 1. Scene & Depth Atmosphere
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050508, 0.038);

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
    camera.position.set(0, 0, 10);

    // 2. WebGL Renderer with Alpha Blending
    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
      });
    } catch (e) {
      console.warn('WebGL initialization fallback', e);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    const canvas = renderer.domElement;

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };

    const handleContextRestored = () => {
      if (!isDisposed && renderer) {
        animate();
      }
    };

    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

    // 3. Dynamic Center Color Light Setup
    const ambientLight = new THREE.AmbientLight(0x18181b, 1.2 * intensity);
    scene.add(ambientLight);

    // Center theme color mapping
    let lightColor1 = 0xe11d48; // crimson for Ranaghat
    let lightColor2 = 0xf59e0b; // gold
    let gridColor = 0xe11d48;

    if (selectedCenter === 'Chakdah') {
      lightColor1 = 0xf59e0b; // amber
      lightColor2 = 0xeab308; // yellow
      gridColor = 0xd97706;
    } else if (selectedCenter === 'Madanpur') {
      lightColor1 = 0xa3e635; // lime
      lightColor2 = 0x10b981; // emerald
      gridColor = 0x84cc16;
    }

    if (currentAtmosphere?.id === 'dawn') {
      lightColor1 = 0xfb923c;
      lightColor2 = 0x38bdf8;
    } else if (currentAtmosphere?.id === 'midday') {
      lightColor1 = 0xef4444;
      lightColor2 = 0xf59e0b;
    } else if (currentAtmosphere?.id === 'golden_hour') {
      lightColor1 = 0xf97316;
      lightColor2 = 0xa855f7;
    } else if (currentAtmosphere?.id === 'prismatic') {
      lightColor1 = 0xd946ef;
      lightColor2 = 0x06b6d4;
    } else if (currentAtmosphere?.id === 'midnight') {
      lightColor1 = 0x6366f1;
      lightColor2 = 0x38bdf8;
    }

    const primaryPointLight = new THREE.PointLight(lightColor1, 4.2 * intensity, 32);
    primaryPointLight.position.set(-8, 5, 3);
    scene.add(primaryPointLight);

    const secondaryPointLight = new THREE.PointLight(lightColor2, 3.8 * intensity, 32);
    secondaryPointLight.position.set(8, -4, 4);
    scene.add(secondaryPointLight);

    const topRimLight = new THREE.DirectionalLight(0xffffff, 0.9 * intensity);
    topRimLight.position.set(0, 10, -5);
    scene.add(topRimLight);

    // 4. Floating 3D Apparatus Group
    const objectsGroup = new THREE.Group();
    scene.add(objectsGroup);

    // High-performance shared materials
    const titaniumMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      metalness: 0.88,
      roughness: 0.22,
    });

    const primaryAccentMat = new THREE.MeshStandardMaterial({
      color: lightColor1,
      metalness: 0.92,
      roughness: 0.18,
      emissive: lightColor1,
      emissiveIntensity: 0.2,
    });

    const secondaryAccentMat = new THREE.MeshStandardMaterial({
      color: lightColor2,
      metalness: 0.95,
      roughness: 0.14,
      emissive: lightColor2,
      emissiveIntensity: 0.18,
    });

    // Helper: Create Olympic Weight Plate
    const createFloatingPlate = (radius: number, thickness: number, mat: THREE.Material) => {
      const group = new THREE.Group();
      const disc = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, thickness, 36),
        mat
      );
      disc.rotation.x = Math.PI / 2;
      group.add(disc);

      const innerBevel = new THREE.Mesh(
        new THREE.TorusGeometry(radius * 0.86, 0.025, 16, 36),
        secondaryAccentMat
      );
      group.add(innerBevel);

      const centerHoleRing = new THREE.Mesh(
        new THREE.TorusGeometry(radius * 0.22, 0.02, 16, 24),
        titaniumMat
      );
      group.add(centerHoleRing);
      return group;
    };

    // Helper: Create Hex Dumbbell Nut
    const createHexNut = (size: number, mat: THREE.Material) => {
      const geo = new THREE.CylinderGeometry(size, size, size * 0.65, 6);
      return new THREE.Mesh(geo, mat);
    };

    // Spawn Floating Gym Artefacts in 3D Depth
    const floatingItems: {
      mesh: THREE.Object3D;
      rotSpeed: { x: number; y: number; z: number };
      floatSpeed: number;
      initialY: number;
      phase: number;
    }[] = [];

    const spawnConfigs = [
      { x: -7.5, y: 3.5, z: -4, scale: 1.35, type: 'plate-primary' },
      { x: 7.2, y: 2.8, z: -3, scale: 1.25, type: 'plate-titanium' },
      { x: -6.0, y: -3.8, z: -5, scale: 1.5, type: 'hex' },
      { x: 6.8, y: -3.2, z: -4, scale: 1.3, type: 'plate-secondary' },
      { x: -3.5, y: 5.5, z: -6, scale: 1.1, type: 'hex' },
      { x: 4.2, y: 6.0, z: -7, scale: 1.45, type: 'plate-primary' },
      { x: -8.0, y: 0.2, z: -6, scale: 1.25, type: 'ring' },
      { x: 8.5, y: -0.5, z: -5, scale: 1.2, type: 'hex' },
      { x: 0.0, y: -6.5, z: -8, scale: 1.8, type: 'ring' },
    ];

    spawnConfigs.forEach((cfg, idx) => {
      let itemMesh: THREE.Object3D;
      if (cfg.type === 'plate-primary') {
        itemMesh = createFloatingPlate(0.9, 0.16, primaryAccentMat);
      } else if (cfg.type === 'plate-secondary') {
        itemMesh = createFloatingPlate(0.75, 0.14, secondaryAccentMat);
      } else if (cfg.type === 'plate-titanium') {
        itemMesh = createFloatingPlate(1.0, 0.18, titaniumMat);
      } else if (cfg.type === 'hex') {
        itemMesh = createHexNut(0.65, titaniumMat);
      } else {
        const ringGeo = new THREE.TorusGeometry(1.2, 0.03, 16, 48);
        itemMesh = new THREE.Mesh(ringGeo, idx % 2 === 0 ? primaryAccentMat : secondaryAccentMat);
      }

      itemMesh.scale.set(cfg.scale, cfg.scale, cfg.scale);
      itemMesh.position.set(cfg.x, cfg.y, cfg.z);
      objectsGroup.add(itemMesh);

      floatingItems.push({
        mesh: itemMesh,
        rotSpeed: {
          x: (Math.random() - 0.5) * 0.012,
          y: (Math.random() - 0.5) * 0.015,
          z: (Math.random() - 0.5) * 0.008,
        },
        floatSpeed: 0.45 + Math.random() * 0.45,
        initialY: cfg.y,
        phase: Math.random() * Math.PI * 2,
      });
    });

    // 5. Floor Cyber-Grid Perspective
    const gridHelper = new THREE.GridHelper(50, 50, gridColor, 0x1f1f23);
    gridHelper.position.y = -7.5;
    gridHelper.position.z = -5;
    scene.add(gridHelper);

    // 6. Rising Spark & Ember Particles
    const particleCount = 110;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds: number[] = [];

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 24;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 18 - 2;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 14;
      particleSpeeds.push(0.015 + Math.random() * 0.025);
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(particlePositions, 3)
    );

    const particleMaterial = new THREE.PointsMaterial({
      color: lightColor2,
      size: 0.075,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 7. Interactive Parallax Physics
    let targetMouseX = 0;
    let targetMouseY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const onMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 1.5;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * -1.2;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // Responsive Window Resize
    const onResize = () => {
      if (!renderer || isDisposed) return;
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);

    // 8. Perpetual Render Loop
    let clock = new THREE.Clock();

    const animate = () => {
      if (isDisposed || !renderer) return;
      animationFrameId = requestAnimationFrame(animate);

      const time = clock.getElapsedTime();

      // Smooth mouse interpolation with gentle damping
      mouseX += (targetMouseX - mouseX) * 0.035;
      mouseY += (targetMouseY - mouseY) * 0.035;

      camera.position.x = mouseX * 1.5;
      camera.position.y = mouseY * 1.2;
      camera.lookAt(0, 0, 0);

      // Animate floating gym artefacts
      for (let i = 0; i < floatingItems.length; i++) {
        const item = floatingItems[i];
        item.mesh.rotation.x += item.rotSpeed.x;
        item.mesh.rotation.y += item.rotSpeed.y;
        item.mesh.rotation.z += item.rotSpeed.z;
        item.mesh.position.y =
          item.initialY + Math.sin(time * item.floatSpeed + item.phase) * 0.35;
      }

      // Animate rising ember particles
      const posAttr = particleGeometry.attributes.position as THREE.BufferAttribute;
      const array = posAttr.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        array[i * 3 + 1] += particleSpeeds[i];
        if (array[i * 3 + 1] > 9) {
          array[i * 3 + 1] = -7.5;
          array[i * 3] = (Math.random() - 0.5) * 24;
        }
      }
      posAttr.needsUpdate = true;

      // Lights dynamic breathing
      primaryPointLight.intensity = (4.0 + Math.sin(time * 1.4) * 0.6) * intensity;
      secondaryPointLight.intensity = (3.5 + Math.cos(time * 1.1) * 0.5) * intensity;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);

      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);

      if (container.contains(canvas)) {
        container.removeChild(canvas);
      }
      if (renderer) {
        renderer.dispose();
      }
      particleGeometry.dispose();
      particleMaterial.dispose();
      titaniumMat.dispose();
      primaryAccentMat.dispose();
      secondaryAccentMat.dispose();
    };
  }, [intensity, selectedCenter, currentAtmosphere?.id]);

  return <div ref={containerRef} className={className} aria-hidden="true" />;
};
