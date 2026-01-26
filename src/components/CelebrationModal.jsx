import { useEffect, useState } from 'react'
import { PartyPopper } from 'lucide-react'
import gsap from 'gsap'

export default function CelebrationModal({ isOpen, onClose }) {
    const [showConfetti, setShowConfetti] = useState(false)

    useEffect(() => {
        if (isOpen) {
            // Show confetti after a short delay to let the modal appear first
            const timer = setTimeout(() => {
                setShowConfetti(true)
            }, 300)

            return () => clearTimeout(timer)
        } else {
            setShowConfetti(false)
        }
    }, [isOpen])

    useEffect(() => {
        if (showConfetti) {
            createConfetti()
        }
    }, [showConfetti])

    const createConfetti = () => {
        const container = document.getElementById('celebration-confetti-container')
        if (!container) return

        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#fbbf24', '#f97316']

        // Create 50 confetti pieces for a big celebration
        for (let i = 0; i < 50; i++) {
            const piece = document.createElement('div')
            piece.style.position = 'absolute'
            piece.style.width = '10px'
            piece.style.height = '10px'
            piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
            piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px'
            piece.style.left = `${Math.random() * 100}%`
            piece.style.top = '-20px'
            piece.style.opacity = '1'
            container.appendChild(piece)

            // Animate with GSAP
            const duration = 3 + Math.random() * 2
            const rotation = Math.random() * 720 - 360
            const xMovement = (Math.random() - 0.5) * 200

            gsap.to(piece, {
                y: window.innerHeight + 100,
                x: xMovement,
                rotation: rotation,
                opacity: 0.8,
                duration: duration,
                ease: 'power1.in',
                delay: Math.random() * 0.5,
                onComplete: () => piece.remove()
            })
        }
    }

    if (!isOpen) return null

    return (
        <>
            {/* Confetti container */}
            <div
                id="celebration-confetti-container"
                className="fixed inset-0 pointer-events-none z-[60]"
            />

            {/* Modal overlay */}
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-dark-surface border border-dark-border rounded-2xl p-8 max-w-md w-full shadow-2xl animate-fadeIn">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <PartyPopper size={40} className="text-white" />
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-3xl font-bold text-center mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Bravo ! 🎉
                    </h2>

                    {/* Message */}
                    <p className="text-center text-dark-text mb-6 text-lg">
                        Vous avez terminé toutes vos tâches du jour !
                    </p>

                    <p className="text-center text-dark-subtext mb-8">
                        Excellent travail ! Vous méritez une pause bien méritée. 💪
                    </p>

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105"
                    >
                        Continuer
                    </button>
                </div>
            </div>
        </>
    )
}
