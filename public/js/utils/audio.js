// public/js/utils/audio.js
class AudioManager {
    constructor() {
        this.context = null;
    }

    getAudioContext() {
        if (!this.context) {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.context;
    }

    playBeep(frequency = 1000, duration = 80, type = 'square') {
        try {
            const ctx = this.getAudioContext();
            const oscillator = ctx.createOscillator();
            
            oscillator.type = type;
            oscillator.frequency.value = frequency;
            oscillator.connect(ctx.destination);
            oscillator.start();
            
            setTimeout(() => {
                oscillator.stop();
                // Don't close context, reuse it
            }, duration);
        } catch (error) {
            console.warn('Could not play audio beep:', error);
        }
    }

    playAuctionBeep(timeLeft) {
        let frequency = 440; // Default frequency
        
        if (timeLeft <= 4 && timeLeft > 2) {
            frequency = 880; // Higher pitch for yellow phase
        } else if (timeLeft <= 2 && timeLeft > 0) {
            frequency = 1320; // Highest pitch for red phase
        }
        
        this.playBeep(frequency);
    }

    // Cleanup method if needed
    close() {
        if (this.context) {
            this.context.close();
            this.context = null;
        }
    }
}

// Create global instance
window.audioManager = new AudioManager();

export default AudioManager;