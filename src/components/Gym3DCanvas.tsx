import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Gym3DCanvasProps {
  className?: string;
  isHovered?: boolean;
}

export const Gym3DCanvas: React.FC<Gym3DCanvasProps> = ({
  className = 'w-full h-64 sm:h-80',
  isHovered = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isHoveredRef = useRef(isHovered);
  isHoveredRef.current = isHovered;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Dimensions
    const width = container.clientWidth || 320;
    const height = container.clientHeight || 280;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 5.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const keyLight = new THREE.PointLight(0xfbbf24, 3, 20);
    keyLight.position.set(5, 5, 4);
    scene.add(keyLight);

    const crimsonLight = new THREE.PointLight(0xdc2626, 2.5, 20);
    crimsonLight.position.set(-5, -4, 3);
    scene.add(crimsonLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.2);
    rimLight.position.set(0, 6, -3);
    scene.add(rimLight);

    // Root Group for Entire 3D Dumbbell Sculpture
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    const dumbbellGroup = new THREE.Group();
    dumbbellGroup.scale.set(1.15, 1.15, 1.15);
    rootGroup.add(dumbbellGroup);

    // 1. Center Barbell Rod
    const barGeo = new THREE.CylinderGeometry(0.09, 0.09, 2.8, 32);
    const barMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.92,
      roughness: 0.18,
      emissive: 0x5a2d0c,
      emissiveIntensity: 0.15,
    });
    const barMesh = new THREE.Mesh(barGeo, barMat);
    barMesh.rotation.z = Math.PI / 2;
    dumbbellGroup.add(barMesh);

    // Grip Knurling Bands
    const knurlMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      metalness: 0.85,
      roughness: 0.35,
    });
    [-0.7, -0.35, 0, 0.35, 0.7].forEach((x) => {
      const knurlGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.12, 24);
      const knurlMesh = new THREE.Mesh(knurlGeo, knurlMat);
      knurlMesh.position.x = x;
      knurlMesh.rotation.z = Math.PI / 2;
      dumbbellGroup.add(knurlMesh);
    });

    // Plate Builder
    const createPlateAssembly = (side: 1 | -1) => {
      const plateGroup = new THREE.Group();
      plateGroup.position.x = side * 1.45;

      // Outer 25KG Heavy Black Plate
      const bigPlateGeo = new THREE.CylinderGeometry(0.95, 0.95, 0.18, 36);
      const bigPlateMat = new THREE.MeshStandardMaterial({
        color: 0x18181b,
        metalness: 0.85,
        roughness: 0.22,
      });
      const bigPlate = new THREE.Mesh(bigPlateGeo, bigPlateMat);
      bigPlate.rotation.z = Math.PI / 2;
      plateGroup.add(bigPlate);

      // Gold Outer Ring Accent
      const goldRingGeo = new THREE.TorusGeometry(0.9, 0.035, 16, 36);
      const goldRingMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.95,
        roughness: 0.12,
      });
      const goldRing = new THREE.Mesh(goldRingGeo, goldRingMat);
      goldRing.position.x = side * -0.04;
      goldRing.rotation.y = Math.PI / 2;
      plateGroup.add(goldRing);

      // Inner Red Competition Plate
      const medPlateGeo = new THREE.CylinderGeometry(0.78, 0.78, 0.16, 32);
      const medPlateMat = new THREE.MeshStandardMaterial({
        color: 0xdc2626,
        metalness: 0.8,
        roughness: 0.28,
      });
      const medPlate = new THREE.Mesh(medPlateGeo, medPlateMat);
      medPlate.position.x = side * (side === 1 ? -0.2 : 0.2);
      medPlate.rotation.z = Math.PI / 2;
      plateGroup.add(medPlate);

      // Lock Collar
      const collarGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.12, 24);
      const collarMat = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        metalness: 0.9,
        roughness: 0.2,
      });
      const collar = new THREE.Mesh(collarGeo, collarMat);
      collar.position.x = side * (side === 1 ? -0.34 : 0.34);
      collar.rotation.z = Math.PI / 2;
      plateGroup.add(collar);

      return plateGroup;
    };

    dumbbellGroup.add(createPlateAssembly(1));
    dumbbellGroup.add(createPlateAssembly(-1));

    // 2. Orbital Energy Rings
    const ring1Geo = new THREE.TorusGeometry(2.4, 0.018, 16, 64);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.55 });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    rootGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(2.8, 0.015, 16, 64);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.45 });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    rootGroup.add(ring2);

    // 3. Floating Fitness Ember Particles
    const particleCount = 60;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 8;
      positions[i + 1] = (Math.random() - 0.5) * 6;
      positions[i + 2] = (Math.random() - 0.5) * 4;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xfbbf24,
      size: 0.055,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    rootGroup.add(particles);

    // Drag Interaction
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let targetRotY = 0;
    let targetRotX = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      targetRotY += deltaX * 0.01;
      targetRotX += deltaY * 0.01;
      targetRotX = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, targetRotX));
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Auto rotation + float
      const hoverSpeed = isHoveredRef.current ? 1.4 : 0.45;
      if (!isDragging) {
        targetRotY += delta * hoverSpeed;
      }

      dumbbellGroup.rotation.y += (targetRotY - dumbbellGroup.rotation.y) * 0.08;
      dumbbellGroup.rotation.x += (targetRotX - dumbbellGroup.rotation.x) * 0.08;
      dumbbellGroup.rotation.z = Math.sin(time * 0.7) * 0.08;
      dumbbellGroup.position.y = Math.sin(time * 1.2) * 0.12;

      // Orbit rings
      ring1.rotation.x = time * 0.4;
      ring1.rotation.y = time * 0.3;
      ring2.rotation.y = -time * 0.35;
      ring2.rotation.z = time * 0.2;

      // Particles gentle drift
      particles.rotation.y = time * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      barGeo.dispose();
      barMat.dispose();
      knurlMat.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative cursor-grab active:cursor-grabbing select-none ${className}`}
      style={{ touchAction: 'none' }}
    />
  );
};
