// AssemblyAI Speech-to-Text API Configuration
// Copy this file to config.js and fill in your credentials

module.exports = {
  assemblyAI: {
    // Your AssemblyAI API key
    apiKey: 'your-assemblyai-api-key',
    
    // Speech-to-Text configuration
    speechConfig: {
      languageCode: 'en',
      punctuate: true,
      formatText: true
    }
  },
  
  server: {
    port: process.env.PORT || 3000,
    uploadDir: './uploads',
    maxFileSize: 100 * 1024 * 1024 // 100MB
  }
};


