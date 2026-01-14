import { useState, useEffect, useRef, useCallback } from 'react'

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
            let interimText = ''
            let finalText = ''

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcriptPiece = event.results[i][0].transcript
                if (event.results[i].isFinal) {
                    finalText += transcriptPiece + ' '
                } else {
                    interimText += transcriptPiece
                }
            }

            // Update interim transcript for real-time display
            setInterimTranscript(interimText)

            // Update final transcript (accumulated)
            if (finalText) {
                setTranscript(prev => prev + finalText)
                setInterimTranscript('') // Clear interim when we get final result
            }
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
