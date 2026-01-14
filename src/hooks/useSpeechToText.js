import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Process voice commands and convert them to Markdown formatting
 * @param {string} text - The transcribed text
 * @returns {string} - Text with commands replaced by Markdown
 */
const processVoiceCommands = (text) => {
    if (!text) return text

    let processedText = text

    // Define command patterns (case insensitive)
    // Order matters: process more specific commands first
    const commandPatterns = [
        // Headings (must come before "titre" alone)
        { pattern: /\b(titre un|titre 1)\b/gi, replacement: '\n# ' },
        { pattern: /\b(titre deux|titre 2)\b/gi, replacement: '\n## ' },
        { pattern: /\b(titre trois|titre 3)\b/gi, replacement: '\n### ' },

        // Lists (specific before general)
        { pattern: /\b(liste numérotée|numéro)\b/gi, replacement: '\n1. ' },
        { pattern: /\b(checklist|case à cocher|tâche)\b/gi, replacement: '\n- [ ] ' },
        { pattern: /\b(liste|puce)\b/gi, replacement: '\n- ' },

        // Line breaks
        { pattern: /\b(nouvelle ligne|retour à la ligne)\b/gi, replacement: '\n' },
        { pattern: /\bparagraphe\b/gi, replacement: '\n\n' },
    ]

    // Process each command pattern
    commandPatterns.forEach(({ pattern, replacement }) => {
        processedText = processedText.replace(pattern, replacement)
    })

    // Capitalize first letter after headings
    processedText = processedText.replace(/(\n#{1,3}\s+)(\w)/g, (match, prefix, letter) => {
        return prefix + letter.toUpperCase()
    })

    return processedText
}

/**
 * Custom hook for Speech-to-Text using Web Speech API
 * @param {string} language - Language code (default: 'fr-FR')
 * @returns {Object} - { isListening, transcript, interimTranscript, error, startListening, stopListening, resetTranscript }
 */
export default function useSpeechToText(language = 'fr-FR') {
    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [interimTranscript, setInterimTranscript] = useState('')
    const [error, setError] = useState(null)

    const recognitionRef = useRef(null)

    // Initialize Speech Recognition
    useEffect(() => {
        // Check if Web Speech API is supported
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            setError('La reconnaissance vocale n\'est pas supportée par votre navigateur.')
            return
        }

        // Create recognition instance
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        const recognition = new SpeechRecognition()

        // Configure recognition
        recognition.continuous = true // Keep listening until stopped
        recognition.interimResults = true // Get results as user speaks
        recognition.lang = language
        recognition.maxAlternatives = 1

        // Handle results
        recognition.onresult = (event) => {
            let allFinalText = ''
            let currentInterimText = ''

            // Process ALL results from the beginning to get complete transcript
            for (let i = 0; i < event.results.length; i++) {
                const transcriptPiece = event.results[i][0].transcript
                if (event.results[i].isFinal) {
                    allFinalText += transcriptPiece + ' '
                } else {
                    currentInterimText += transcriptPiece
                }
            }

            // Update final transcript (this contains all finalized text)
            if (allFinalText) {
                setTranscript(allFinalText)
            }

            // Update interim transcript for real-time display
            setInterimTranscript(currentInterimText)
        }

        // Handle errors
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error)

            switch (event.error) {
                case 'no-speech':
                    setError('Aucune parole détectée. Veuillez réessayer.')
                    break
                case 'audio-capture':
                    setError('Microphone non détecté. Vérifiez vos paramètres.')
                    break
                case 'not-allowed':
                    setError('Permission du microphone refusée. Veuillez autoriser l\'accès au microphone.')
                    break
                case 'network':
                    setError('Erreur réseau. La reconnaissance vocale nécessite une connexion internet.')
                    break
                default:
                    setError(`Erreur de reconnaissance vocale: ${event.error}`)
            }

            setIsListening(false)
        }

        // Handle end of recognition
        recognition.onend = () => {
            setIsListening(false)
        }

        recognitionRef.current = recognition

        // Cleanup
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop()
            }
        }
    }, [language])

    // Start listening
    const startListening = useCallback(() => {
        if (!recognitionRef.current) {
            setError('La reconnaissance vocale n\'est pas disponible.')
            return
        }

        try {
            setError(null)
            setTranscript('') // Reset transcript when starting new recording
            setInterimTranscript('') // Reset interim transcript
            recognitionRef.current.start()
            setIsListening(true)
        } catch (err) {
            console.error('Error starting recognition:', err)
            setError('Impossible de démarrer la reconnaissance vocale.')
        }
    }, [])

    // Stop listening
    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            try {
                recognitionRef.current.stop()
                setIsListening(false)
            } catch (err) {
                console.error('Error stopping recognition:', err)
            }
        }
    }, [isListening])

    // Reset transcript
    const resetTranscript = useCallback(() => {
        setTranscript('')
    }, [])

    return {
        isListening,
        transcript,
        interimTranscript,
        error,
        startListening,
        stopListening,
        resetTranscript
    }
}
