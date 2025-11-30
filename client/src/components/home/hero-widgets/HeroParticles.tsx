import { Particles } from '@tsparticles/react';

export function HeroParticles() {
  return (
    <Particles
      id="hero-particles"
      className="pointer-events-none absolute inset-0 -z-10 opacity-80"
      options={{
        fullScreen: false,
        fpsLimit: 60,
        detectRetina: true,
        particles: {
          number: {
            value: 90,
          },
          color: {
            value: ['#0BDA51', '#22c55e', '#14b8a6'],
          },
          opacity: {
            value: 0.3,
          },
          size: {
            value: { min: 1, max: 3 },
          },
          links: {
            enable: true,
            distance: 130,
            color: '#16a34a',
            opacity: 0.25,
            width: 1,
          },
          move: {
            enable: true,
            speed: 0.7,
            direction: 'none',
            random: true,
            straight: false,
            outModes: {
              default: 'out',
            },
          },
        },
        interactivity: {
          detectsOn: 'window',
          events: {
            onHover: {
              enable: true,
              mode: 'repulse',
            },
          },
          modes: {
            repulse: {
              distance: 80,
              duration: 0.4,
            },
          },
        },
      }}
    />
  );
}
