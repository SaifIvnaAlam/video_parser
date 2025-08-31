export interface SubtitleEntry {
  id: number;
  startTime: string; // Format: HH:MM:SS,mmm
  endTime: string;   // Format: HH:MM:SS,mmm
  text: string;
}

export interface ProcessedSubtitle extends SubtitleEntry {
  startSeconds: number;
  endSeconds: number;
  accuracy: number;
  transcribedText: string;
  isMatch: boolean;
}

export interface VideoAnalysisResult {
  videoFile: string;
  subtitleFile: string;
  totalSubtitles: number;
  matchedSubtitles: number;
  overallAccuracy: number;
  subtitles: ProcessedSubtitle[];
  processingTime: number;
  generatedSrtFile?: string; // Path to the generated SRT file
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
