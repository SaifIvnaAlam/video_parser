import { SubtitleEntry } from './types';

export function timeToSeconds(timeString: string): number {
  // Parse time format: HH:MM:SS,mmm or HH:MM:SS.mmm
  const parts = timeString.replace(',', '.').split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseFloat(parts[2]);
  
  return hours * 3600 + minutes * 60 + seconds;
}

export function secondsToTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

export function parseSubRipFile(content: string): SubtitleEntry[] {
  const lines = content.trim().split('\n');
  const subtitles: SubtitleEntry[] = [];
  
  let i = 0;
  while (i < lines.length) {
    // Check if we have enough lines for a complete subtitle entry
    if (i + 2 >= lines.length) {
      break;
    }
    
    const id = parseInt(lines[i], 10);
    if (isNaN(id)) {
      i++;
      continue;
    }
    
    const timeLine = lines[i + 1];
    if (!timeLine) {
      i++;
      continue;
    }
    
    const timeMatch = timeLine.match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
    
    if (timeMatch) {
      const startTime = timeMatch[1];
      const endTime = timeMatch[2];
      
      let text = '';
      let j = i + 2;
      while (j < lines.length && lines[j] && lines[j].trim() !== '') {
        text += lines[j] + ' ';
        j++;
      }
      
      if (text.trim()) { // Only add if we have text
        subtitles.push({
          id,
          startTime,
          endTime,
          text: text.trim()
        });
      }
      
      i = j + 1;
    } else {
      i++;
    }
  }
  
  return subtitles;
}

export function calculateTextSimilarity(text1: string, text2: string): number {
  const normalize = (text: string) => text.toLowerCase().replace(/[^\w\s]/g, '').trim();
  
  const normalized1 = normalize(text1);
  const normalized2 = normalize(text2);
  
  if (normalized1 === normalized2) return 1.0;
  
  const words1 = normalized1.split(/\s+/);
  const words2 = normalized2.split(/\s+/);
  
  const commonWords = words1.filter(word => words2.includes(word));
  const totalWords = Math.max(words1.length, words2.length);
  
  return totalWords > 0 ? commonWords.length / totalWords : 0;
}
