import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Global3DSceneProps {
  className?: string;
  intensity?: number;
}

export const Global3DScene: React.FC<Global3DSceneProps> = ({
  className = 'fixed inset-0 pointer-events-none z-0',
  intensity = 1,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let isDisposed = false;
    let animationFrameId: number;

    // 1. Scene & Atmosphere Fog
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050507, 0.04);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, 10);

    // 2. Renderer with Context Loss Protection
    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'default',
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
    renderer.toneMappingExposure = 1.15;
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

    // 3. Cinematic Studio Lighting
    const ambientLight = new THREE.AmbientLight(0x27272a, 1.4 * intensity);
    scene.add(ambientLight);

    const crimsonLight = new THREE.PointLight(0xe11d48, 4.0 * intensity, 30);
    crimsonLight.position.set(-8, 5, 3);
    scene.add(crimsonLight);

    const goldLight = new THREE.PointLight(0xf59e0b, 3.5 * intensity, 30);
    goldLight.position.set(8, -4, 4);
    scene.add(goldLight);

    const centerRim = new THREE.DirectionalLight(0xffffff, 0.8 * intensity);
    centerRim.position.set(0, 10, -5);
    scene.add(centerRim);

    // 4. Floating 3D Gym Objects Group
    const objectsGroup = new THREE.Group();
    scene.add(objectsGroup);

    // High-performance shared materials
    const titaniumMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      metalness: 0.85,
      roughness: 0.25,
    });

    const goldAccentMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0x78350f,
      emissiveIntensity: 0.25,
    });

    const crimsonAccentMat = new THREE.MeshStandardMaterial({
      color: 0xbe123c,
      metalness: 0.88,
      roughness: 0.2,
      emissive: 0x4c0519,
      emissiveIntensity: 0.3,
    });

    // Helper: Create Olympic Weight Plate
    const createFloatingPlate = (radius: number, thickness: number, mat: THREE.Material) => {
      const group = new THREE.Group();
      const disc = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, thickness, 32),
        mat
      );
      disc.rotation.x = Math.PI / 2;
      group.add(disc);

      const innerRing = new THREE.Mesh(
        new THREE.TorusGeometry(radius * 0.88, 0.02, 16, 32),
        goldAccentMat
      );
      group.add(innerRing);
      return group;
    };

    // Helper: Create Hex Dumbbell Nut
    const createHexNut = (size: number, mat: THREE.Material) => {
      const geo = new THREE.CylinderGeometry(size, size, size * 0.6, 6);
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
      { x: -7.5, y: 3.5, z: -4, scale: 1.4, type: 'plate-crimson' },
      { x: 7.2, y: 2.8, z: -3, scale: 1.2, type: 'plate-titanium' },
      { x: -6.0, y: -3.8, z: -5, scale: 1.6, type: 'hex' },
      { x: 6.8, y: -3.2, z: -4, scale: 1.3, type: 'plate-gold' },
      { x: -3.5, y: 5.5, z: -6, scale: 1.1, type: 'hex' },
      { x: 4.2, y: 6.0, z: -7, scale: 1.5, type: 'plate-crimson' },
      { x: -8.0, y: 0.2, z: -6, scale: 1.3, type: 'ring' },
      { x: 8.5, y: -0.5, z: -5, scale: 1.2, type: 'hex' },
      { x: 0.0, y: -6.5, z: -8, scale: 2.0, type: 'ring' },
    ];

    spawnConfigs.forEach((cfg, idx) => {
      let itemMesh: THREE.Object3D;
      if (cfg.type === 'plate-crimson') {
        itemMesh = createFloatingPlate(0.9, 0.16, crimsonAccentMat);
      } else if (cfg.type === 'plate-gold') {
        itemMesh = createFloatingPlate(0.75, 0.14, goldAccentMat);
      } else if (cfg.type === 'plate-titanium') {
        itemMesh = createFloatingPlate(1.0, 0.18, titaniumMat);
      } else if (cfg.type === 'hex') {
        itemMesh = createHexNut(0.65, titaniumMat);
      } else {
        const ringGeo = new THREE.TorusGeometry(1.2, 0.03, 16, 48);
        itemMesh = new THREE.Mesh(ringGeo, idx % 2 === 0 ? crimsonAccentMat : goldAccentMat);
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
        floatSpeed: 0.5 + Math.random() * 0.5,
        initialY: cfg.y,
        phase: Math.random() * Math.PI * 2,
      });
    });

    // 5. Ground Perspective Cyber-Grid
    const gridHelper = new THREE.GridHelper(50, 50, 0xe11d48, 0x27272a);
    gridHelper.position.y = -7.5;
    gridHelper.position.z = -5;
    scene.add(gridHelper);

    // 6. Rising Spark/Ember Particles
    const particleCount = 100;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds: number[] = [];

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 24;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 18 - 2;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 14;
      particleSpeeds.push(0.015 + Math.random() * 0.03);
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(particlePositions, 3)
    );

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xf59e0b,
      size: 0.08,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 7. Smooth Interactive Mouse Parallax
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

    // 8. Robust Perpetual Animation Render Loop
    let clock = new THREE.Clock();

    const animate = () => {
      if (isDisposed || !renderer) return;
      animationFrameId = requestAnimationFrame(animate);

      const time = clock.getElapsedTime();

      // Smooth mouse interpolation
      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;

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
      crimsonLight.intensity = (3.5 + Math.sin(time * 1.5) * 0.6) * intensity;
      goldLight.intensity = (3.0 + Math.cos(time * 1.2) * 0.5) * intensity;

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
      goldAccentMat.dispose();
      crimsonAccentMat.dispose();
    };
  }, [intensity]);

  return <div ref={containerRef} className={className} aria-hidden="true" />;
};
