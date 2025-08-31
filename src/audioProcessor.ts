import ffmpeg from 'fluent-ffmpeg';
import { AssemblyAI } from 'assemblyai';
import fs from 'fs';
import path from 'path';
import { SubtitleEntry, ProcessedSubtitle } from './types';

export class AudioProcessor {
  private assemblyAI: AssemblyAI;

  constructor() {
    // Initialize AssemblyAI client with API key from environment variable
    const apiKey = process.env.ASSEMBLYAI_API_KEY || '94bd121e761240dc8266fad51dc95d6e';
    this.assemblyAI = new AssemblyAI({ apiKey });
  }

  /**
   * Extract audio from video file and convert to WAV format
   */
  async extractAudio(videoPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const audioPath = videoPath.replace(/\.[^/.]+$/, '_audio.wav');
      
      ffmpeg(videoPath)
        .audioChannels(1) // Mono audio for better speech recognition
        .audioFrequency(16000) // 16kHz sample rate (required for Speech-to-Text)
        .audioCodec('pcm_s16le') // 16-bit PCM
        .output(audioPath)
        .on('end', () => {
          console.log('Audio extraction completed');
          resolve(audioPath);
        })
        .on('error', (err) => {
          console.error('Audio extraction error:', err);
          reject(err);
        })
        .run();
    });
  }

  /**
   * Extract audio segment for a specific subtitle timestamp
   * This function uses FFmpeg to extract a specific time segment from a video file
   * and converts it to WAV format optimized for speech recognition
   * 
   * @param videoPath - Path to the source video file
   * @param startTime - Start time in seconds
   * @param endTime - End time in seconds
   * @returns Promise<string> - Path to the extracted audio segment file
   * @throws Error - If audio extraction fails
   */
  async extractAudioSegment(
    videoPath: string, 
    startTime: number, 
    endTime: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      // Validate timing parameters
      if (startTime < 0 || endTime <= startTime) {
        reject(new Error(`Invalid timing: start=${startTime}s, end=${endTime}s`));
        return;
      }
      
      const duration = endTime - startTime;
      const segmentPath = path.join(
        path.dirname(videoPath),
        `segment_${startTime.toFixed(2)}_${endTime.toFixed(2)}.wav`
      );
      
      console.log(`🎵 Extracting audio segment: ${startTime}s to ${endTime}s (${duration.toFixed(2)}s)`);
      
      ffmpeg(videoPath)
        .inputOptions([`-ss ${startTime}`, `-t ${duration}`])
        .audioChannels(1) // Mono audio for better speech recognition
        .audioFrequency(16000) // 16kHz sample rate (optimal for speech)
        .audioCodec('pcm_s16le') // 16-bit PCM (high quality)
        .output(segmentPath)
        .on('start', (commandLine) => {
          console.log(`🔄 FFmpeg command: ${commandLine}`);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`📊 Extraction progress: ${progress.percent.toFixed(1)}%`);
          }
        })
        .on('end', () => {
          console.log(`✅ Audio segment extracted successfully: ${path.basename(segmentPath)}`);
          resolve(segmentPath);
        })
        .on('error', (err) => {
          console.error(`❌ Audio segment extraction error:`, err);
          reject(err);
        })
        .run();
    });
  }

  /**
   * Transcribe audio using AssemblyAI speech-to-text API
   * This function sends an audio file to AssemblyAI and returns the transcribed text
   * 
   * @param audioPath - Path to the audio file to transcribe
   * @returns Promise<string> - Transcribed text from the audio
   * @throws Error - If transcription fails
   */
  async transcribeAudio(audioPath: string): Promise<string> {
    try {
      console.log(`🎤 Transcribing audio: ${path.basename(audioPath)}`);
      
      // Transcribe the audio file directly using AssemblyAI
      const transcript = await this.assemblyAI.transcripts.transcribe({
        audio: audioPath,
        language_code: 'en',
        punctuate: true,
        format_text: true,
        boost_param: 'high' // Improve accuracy for better results
      });
      
      if (!transcript.text) {
        console.log(`⚠️  No text detected in audio: ${path.basename(audioPath)}`);
        return '';
      }

      const transcribedText = transcript.text.trim();
      console.log(`✅ Transcription successful: ${transcribedText.substring(0, 100)}...`);
      
      return transcribedText;
    } catch (error) {
      console.error(`❌ AssemblyAI transcription error for ${path.basename(audioPath)}:`, error);
      throw error;
    }
  }

  /**
   * Process all subtitles with real audio transcription
   * This function analyzes each subtitle by transcribing the corresponding audio segment
   * and comparing it with the original subtitle text for accuracy assessment
   * 
   * @param videoPath - Path to the video file
   * @param subtitles - Array of subtitle entries to process
   * @param onProgress - Optional callback for progress updates
   * @returns Promise<ProcessedSubtitle[]> - Array of processed subtitles with accuracy scores
   */
  async processSubtitlesWithAudio(
    videoPath: string,
    subtitles: SubtitleEntry[],
    onProgress?: (progress: { current: number; total: number; subtitle: SubtitleEntry; status: string }) => void
  ): Promise<ProcessedSubtitle[]> {
    console.log(`🎬 Processing ${subtitles.length} subtitles with real audio transcription...`);
    
    const processedSubtitles: ProcessedSubtitle[] = [];
    let successCount = 0;
    let failureCount = 0;
    
    for (let i = 0; i < subtitles.length; i++) {
      const subtitle = subtitles[i];
      const currentProgress = i + 1;
      
      // Send progress update
      if (onProgress) {
        onProgress({
          current: currentProgress,
          total: subtitles.length,
          subtitle,
          status: 'Processing audio segment...'
        });
      }
      
      console.log(`🔄 Processing subtitle ${currentProgress}/${subtitles.length}: "${subtitle.text.substring(0, 50)}..."`);
      
      try {
        // Extract audio segment for this subtitle
        const startSeconds = this.timeToSeconds(subtitle.startTime);
        const endSeconds = this.timeToSeconds(subtitle.endTime);
        
        // Validate timestamp logic
        if (endSeconds <= startSeconds) {
          console.warn(`⚠️  Invalid timestamp for subtitle ${currentProgress}: start=${startSeconds}s, end=${endSeconds}s`);
        }
        
        if (onProgress) {
          onProgress({
            current: currentProgress,
            total: subtitles.length,
            subtitle,
            status: 'Extracting audio segment...'
          });
        }
        
        const audioSegmentPath = await this.extractAudioSegment(
          videoPath, 
          startSeconds, 
          endSeconds
        );
        
        if (onProgress) {
          onProgress({
            current: currentProgress,
            total: subtitles.length,
            subtitle,
            status: 'Transcribing with AI...'
          });
        }
        
        // Transcribe the audio segment
        const transcribedText = await this.transcribeAudio(audioSegmentPath);
        
        // Calculate accuracy using real transcription
        const accuracy = this.calculateTextSimilarity(subtitle.text, transcribedText);
        const isMatch = accuracy > 0.7; // 70% threshold for real analysis
        
        const processedSubtitle = {
          ...subtitle,
          startSeconds,
          endSeconds,
          accuracy,
          transcribedText: transcribedText || '[No speech detected]',
          isMatch
        };
        
        processedSubtitles.push(processedSubtitle);
        
        // Clean up audio segment
        fs.unlinkSync(audioSegmentPath);
        successCount++;
        
        if (onProgress) {
          onProgress({
            current: currentProgress,
            total: subtitles.length,
            subtitle: processedSubtitle,
            status: 'Completed'
          });
        }
        
        // Add small delay to avoid overwhelming the API
        await this.delay(100);
        
      } catch (error) {
        console.error(`❌ Error processing subtitle ${currentProgress}:`, error);
        failureCount++;
        
        // Fallback to simulated accuracy if transcription fails
        const startSeconds = this.timeToSeconds(subtitle.startTime);
        const endSeconds = this.timeToSeconds(subtitle.endTime);
        
        const processedSubtitle = {
          ...subtitle,
          startSeconds,
          endSeconds,
          accuracy: 0.5, // Fallback accuracy
          transcribedText: '[Transcription failed]',
          isMatch: false
        };
        
        processedSubtitles.push(processedSubtitle);
        
        if (onProgress) {
          onProgress({
            current: currentProgress,
            total: subtitles.length,
            subtitle: processedSubtitle,
            status: 'Failed'
          });
        }
      }
    }
    
    console.log(`✅ Processing complete: ${successCount} successful, ${failureCount} failed`);
    return processedSubtitles;
  }

  /**
   * Fallback method for time conversion (in case utils.ts is not available)
   */
  private timeToSeconds(timeString: string): number {
    const parts = timeString.replace(',', '.').split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseFloat(parts[2]);
    
    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * Calculate text similarity between subtitle and transcribed text
   * This function compares two text strings and returns a similarity score from 0 to 1
   * 
   * @param text1 - First text string to compare
   * @param text2 - Second text string to compare
   * @returns number - Similarity score (0 = no similarity, 1 = exact match)
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;
    
    const normalize = (text: string) => 
      text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    
    const normalized1 = normalize(text1);
    const normalized2 = normalize(text2);
    
    if (normalized1 === normalized2) return 1.0;
    
    const words1 = normalized1.split(/\s+/);
    const words2 = normalized2.split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = Math.max(words1.length, words2.length);
    
    return totalWords > 0 ? commonWords.length / totalWords : 0;
  }



  /**
   * Utility function to add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up temporary files
   */
  cleanup(audioPath: string): void {
    try {
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
        console.log('Cleaned up temporary audio file');
      }
    } catch (error) {
      console.error('Error cleaning up audio file:', error);
    }
  }

  /**
   * Generate SRT file from transcribed audio segments
   * This function creates a new subtitle file with real speech-to-text results
   * 
   * @param videoPath - Path to the video file
   * @param subtitles - Array of subtitle entries with timestamps
   * @returns Promise<string> - Path to the generated SRT file
   */
  async generateSRTFromAudio(
    videoPath: string,
    subtitles: SubtitleEntry[]
  ): Promise<string> {
    console.log(`🎯 Generating SRT file from audio transcription...`);
    
    // Create generated_srt directory in the project root (not relative to video path)
    const projectRoot = process.cwd();
    const generatedSrtDir = path.join(projectRoot, 'generated_srt');
    if (!fs.existsSync(generatedSrtDir)) {
      fs.mkdirSync(generatedSrtDir, { recursive: true });
      console.log(`📁 Created directory: ${generatedSrtDir}`);
    }
    
    // Generate filename based on video name and timestamp
    const videoName = path.basename(videoPath, path.extname(videoPath));
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const srtFilePath = path.join(generatedSrtDir, `${videoName}_generated_${timestamp}.srt`);
    
    let srtContent = '';
    let subtitleIndex = 1;
    let successCount = 0;
    let failureCount = 0;
    
    console.log(`📝 Processing ${subtitles.length} subtitle segments...`);
    
    for (let i = 0; i < subtitles.length; i++) {
      const subtitle = subtitles[i];
      console.log(`🔄 Processing subtitle ${i + 1}/${subtitles.length}: "${subtitle.text.substring(0, 50)}..."`);
      
      try {
        // Extract audio segment for this subtitle
        const startSeconds = this.timeToSeconds(subtitle.startTime);
        const endSeconds = this.timeToSeconds(subtitle.endTime);
        
        const audioSegmentPath = await this.extractAudioSegment(
          videoPath, 
          startSeconds, 
          endSeconds
        );
        
        // Transcribe the audio segment
        const transcribedText = await this.transcribeAudio(audioSegmentPath);
        
        // Clean up audio segment
        fs.unlinkSync(audioSegmentPath);
        
        // Format SRT entry with proper timing
        const startTimeFormatted = this.secondsToSRTTime(startSeconds);
        const endTimeFormatted = this.secondsToSRTTime(endSeconds);
        
        srtContent += `${subtitleIndex}\n`;
        srtContent += `${startTimeFormatted} --> ${endTimeFormatted}\n`;
        srtContent += `${transcribedText || '[No speech detected]'}\n\n`;
        
        subtitleIndex++;
        successCount++;
        
        // Add small delay to avoid overwhelming the API
        await this.delay(100);
        
      } catch (error) {
        console.error(`❌ Error transcribing subtitle ${i + 1} for SRT:`, error);
        failureCount++;
        
        // Use original subtitle text as fallback with error indicator
        const startTimeFormatted = this.secondsToSRTTime(this.timeToSeconds(subtitle.startTime));
        const endTimeFormatted = this.secondsToSRTTime(this.timeToSeconds(subtitle.endTime));
        
        srtContent += `${subtitleIndex}\n`;
        srtContent += `${startTimeFormatted} --> ${endTimeFormatted}\n`;
        srtContent += `[Transcription failed: ${subtitle.text}]\n\n`;
        
        subtitleIndex++;
      }
    }
    
    // Write SRT file
    fs.writeFileSync(srtFilePath, srtContent, 'utf-8');
    
    console.log(`✅ SRT file generated successfully!`);
    console.log(`📁 Location: ${srtFilePath}`);
    console.log(`📊 Stats: ${successCount} successful, ${failureCount} failed`);
    
    return srtFilePath;
  }

  /**
   * Convert seconds to SRT time format (HH:MM:SS,mmm)
   */
  private secondsToSRTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
  }
}
