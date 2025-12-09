/**
 * Audio Processing Utilities
 * Xử lý audio level monitoring và audio context
 */

export class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animationFrameId: number | null = null;
  private onLevelChange?: (level: number) => void;

  /**
   * Setup audio meter cho track
   * @param audioTrack - MediaStreamTrack để monitor
   * @param onLevelChange - Callback khi audio level thay đổi
   */
  setup(audioTrack: MediaStreamTrack, onLevelChange: (level: number) => void) {
    this.cleanup();
    
    this.onLevelChange = onLevelChange;
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    
    const microphone = this.audioContext.createMediaStreamSource(
      new MediaStream([audioTrack])
    );
    
    this.analyser.smoothingTimeConstant = 0.8;
    this.analyser.fftSize = 1024;
    
    microphone.connect(this.analyser);
    
    this.startMonitoring();
  }

  /**
   * Start monitoring audio levels
   */
  private startMonitoring() {
    if (!this.analyser) return;
    
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    
    const update = () => {
      if (!this.analyser || !this.onLevelChange) return;
      
      this.analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const level = Math.min(100, (average / 128) * 100);
      
      this.onLevelChange(level);
      this.animationFrameId = requestAnimationFrame(update);
    };
    
    update();
  }

  /**
   * Stop monitoring và cleanup resources
   */
  cleanup() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.analyser = null;
    this.onLevelChange = undefined;
  }
}
