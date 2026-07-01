'use client';

export default function FlowerExplosion({ active }) {
  if (!active) return null;

  const flowers = ['🌸', '⭐', , '🌹', '🌟', '💰', '💐', '✨', '🌼', '✯', '🌺', '💎'];

  const particles = Array.from({ length: 35 }, (_, i) => {
    const angle = Math.random() * 2 * Math.PI;
    const distance = 100 + Math.random() * 200;
    return {
      id: i,
      emoji: flowers[Math.floor(Math.random() * flowers.length)],
      tx: Math.cos(angle) * distance,
      ty: Math.sin(angle) * distance,
      rotation: Math.random() * 720 - 360,
      scale: 0.6 + Math.random() * 1.2,
      duration: 1.8 + Math.random() * 1.2,
      delay: Math.random() * 1.0,
    };
  });

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute text-3xl sm:text-4xl md:text-5xl"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%) scale(0) rotate(0deg)',
              opacity: 0,
              animation: `flowerExplode ${p.duration}s ease-out ${p.delay}s both`,
              '--tx': `${p.tx}px`,
              '--ty': `${p.ty}px`,
              '--rot': `${p.rotation}deg`,
              '--scale': p.scale,
            }}
          >
            {p.emoji}
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes flowerExplode {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty)))
              scale(var(--scale)) rotate(var(--rot));
          }
        }
      `}</style>
    </>
  );
}