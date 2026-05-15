export function useConfetti() {
  function launchConfetti(opts = {}) {
    const count = opts.count || 80
    const colors = opts.colors || ['#FF3CAC','#FFE500','#44AAFF','#44DD88','#FF8C00','#CC44FF','#FF4455','#00CFFF','#FFFFFF']
    const shapes = ['rect','circle','ribbon']
    const particles = []

    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;'
    document.body.appendChild(canvas)
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    for (let i = 0; i < count; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: canvas.height * 0.3,
        vx: (Math.random() - 0.5) * 14,
        vy: -(Math.random() * 12 + 4),
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        size: Math.random() * 10 + 5,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 8,
        gravity: 0.4,
        drag: 0.97,
        alpha: 1
      })
    }

    let frame
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let alive = false
      for (const p of particles) {
        p.vy += p.gravity
        p.vx *= p.drag
        p.vy *= p.drag
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.rotSpeed
        if (p.y > canvas.height + 20) p.alpha = 0
        else p.alpha = Math.max(0, p.alpha - 0.008)
        if (p.alpha > 0) alive = true
        ctx.save()
        ctx.globalAlpha = p.alpha
        ctx.fillStyle = p.color
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        if (p.shape === 'circle') {
          ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill()
        } else if (p.shape === 'ribbon') {
          ctx.fillRect(-p.size / 2, -p.size / 8, p.size, p.size / 4)
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
        }
        ctx.restore()
      }
      if (alive) frame = requestAnimationFrame(draw)
      else { canvas.remove(); cancelAnimationFrame(frame) }
    }
    frame = requestAnimationFrame(draw)
  }

  return { launchConfetti }
}
