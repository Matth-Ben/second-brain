import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export default function Confetti({ taskId }) {
    const containerRef = useRef(null)

    useEffect(() => {
        if (!containerRef.current) return

        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
        const confettiElements = []

        // Create 20 confetti pieces
        for (let i = 0; i < 20; i++) {
            const piece = document.createElement('div')
            piece.className = 'confetti-piece-gsap'
            piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
            // Position at the checkbox location (left side)
            piece.style.left = '20px' // Approximate checkbox position
            piece.style.top = '50%'
            piece.style.position = 'absolute'
            piece.style.width = '8px'
            piece.style.height = '8px'
            piece.style.borderRadius = '2px'
            containerRef.current.appendChild(piece)
            confettiElements.push(piece)

            // Random trajectory spreading from checkbox
            const angle = -90 + (Math.random() * 180 - 90) // -180 to 0 degrees (full semicircle upward)
            const distance = 60 + Math.random() * 80 // 60-140px
            const duration = 0.6 + Math.random() * 0.4 // 0.6-1.0s

            const radians = (angle * Math.PI) / 180
            const endX = Math.cos(radians) * distance
            const endY = Math.sin(radians) * distance

            // Animate with GSAP
            gsap.to(piece, {
                x: endX,
                y: endY,
                rotation: Math.random() * 720 - 360,
                opacity: 0,
                duration: duration,
                ease: 'power2.out',
                delay: Math.random() * 0.1,
            })
        }

        // Cleanup
        const timer = setTimeout(() => {
            confettiElements.forEach(el => el.remove())
        }, 1200)

        return () => {
            clearTimeout(timer)
            confettiElements.forEach(el => el.remove())
        }
    }, [taskId])

    return <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-visible" />
}
