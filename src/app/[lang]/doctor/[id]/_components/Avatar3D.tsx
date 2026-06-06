'use client';

import { useRef, useState, useEffect } from 'react';

interface Props {
  src: string;
  alt: string;
}

export default function Avatar3D({ src, alt }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Смещение мыши от центра в диапазоне -1..1
      const deltaX = (e.clientX - centerX) / (rect.width / 2);
      const deltaY = (e.clientY - centerY) / (rect.height / 2);

      // Ограничим угол наклона до ±15 градусов
      setRotateY(deltaX * 15);
      setRotateX(-deltaY * 15);
    };

    const handleMouseLeave = () => {
      setRotateX(0);
      setRotateY(0);
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="avatar-3d-container"
      style={{
        transformStyle: 'preserve-3d',
        transform: `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transition: 'transform 0.1s ease-out',
      }}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover rounded-2xl ring-2 ring-white/10 shadow-2xl"
      />
    </div>
  );
}
