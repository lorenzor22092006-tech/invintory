/* Animated background orbs — living backdrop from the Figma liquid glass design */
export default function OrbsBackground() {
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-18%',
          left: '-5%',
          width: 420,
          height: 420,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(0,210,240,1) 0%, rgba(0,140,200,0.6) 40%, transparent 70%)',
          animation: 'inv-orb1 7s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '8%',
          right: '-12%',
          width: 360,
          height: 360,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(0,100,200,1) 0%, rgba(0,60,160,0.5) 40%, transparent 70%)',
          animation: 'inv-orb2 9s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '48%',
          left: '18%',
          width: 280,
          height: 280,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(100,0,240,1) 0%, rgba(60,0,180,0.5) 40%, transparent 70%)',
          animation: 'inv-orb3 11s ease-in-out infinite',
        }}
      />
    </div>
  )
}
