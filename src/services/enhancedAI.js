// Enhanced AI Service with Bible Integration
// Combines OpenRouter AI responses with relevant Bible verses

import bibleApi from './bibleApi.js';

class EnhancedAIService {
  constructor() {
    this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    this.apiUrl = import.meta.env.VITE_OPENROUTER_API_URL;
    this.bibleApiKey = import.meta.env.VITE_BIBLE_API_KEY;
    
    if (!this.apiKey) {
      console.warn('OpenRouter API key not configured');
    }
    if (!this.bibleApiKey) {
      console.warn('Bible API key not configured');
    }
  }

  // Extract potential Bible-related keywords from user input
  extractBibleKeywords(text) {
    const bibleKeywords = [
      'love', 'faith', 'hope', 'forgiveness', 'sin', 'salvation', 'grace', 'mercy',
      'prayer', 'worship', 'praise', 'blessing', 'peace', 'joy', 'strength',
      'wisdom', 'truth', 'righteousness', 'justice', 'compassion', 'kindness',
      'patience', 'humility', 'sacrifice', 'redemption', 'eternal', 'heaven',
      'hell', 'death', 'resurrection', 'holy', 'sacred', 'divine', 'miracle',
      'prophet', 'disciple', 'apostle', 'church', 'ministry', 'gospel',
      'commandment', 'covenant', 'promise', 'testimony', 'witness', 'spirit',
      'soul', 'heart', 'mind', 'temptation', 'obedience', 'fear', 'courage',
      'trust', 'believe', 'doubt', 'worship', 'thanksgiving', 'repentance',
      'creation', 'creator', 'almighty', 'lord', 'god', 'jesus', 'christ',
      'holy spirit', 'father', 'son', 'trinity', 'cross', 'crucifixion'
    ];

    const words = text.toLowerCase().split(/\s+/);
    const foundKeywords = words.filter(word => 
      bibleKeywords.some(keyword => 
        word.includes(keyword) || keyword.includes(word)
      )
    );

    return [...new Set(foundKeywords)]; // Remove duplicates
  }

  // Search for relevant Bible verses based on keywords
  async findRelevantVerses(keywords, limit = 3) {
    if (!this.bibleApiKey || keywords.length === 0) {
      return [];
    }

    try {
      const searchQuery = keywords.join(' ');
      const verses = await bibleApi.searchVerses(searchQuery, limit);
      return verses.slice(0, limit); // Ensure we don't exceed limit
    } catch (error) {
      console.error('Error finding relevant verses:', error);
      return [];
    }
  }

  // Get AI response with Bible verse integration
  async getChatResponse(userMessage, conversationHistory = []) {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    try {
      // Extract Bible-related keywords from user message
      const keywords = this.extractBibleKeywords(userMessage);
      
      // Find relevant Bible verses
      const relevantVerses = await this.findRelevantVerses(keywords, 2);
      
      // Build enhanced system prompt
      let systemPrompt = `You are a knowledgeable and compassionate Bible study assistant. Your role is to:

1. Provide biblical guidance and wisdom
2. Answer questions about faith, theology, and Christian living
3. Use Scripture to support your responses when relevant
4. Be respectful of different denominations and interpretations
5. Encourage further Bible study and prayer

When responding:
- Always ground your answers in biblical truth
- Cite specific verses when appropriate
- Be encouraging and supportive
- If uncertain about theological matters, suggest consulting religious leaders
- Use the provided relevant verses to strengthen your response

Guidelines:
- Be warm, wise, and pastoral in tone
- Avoid denominational bias
- Encourage personal Bible reading and prayer
- Point to Jesus Christ as the ultimate source of truth and hope`;

      // Add relevant verses to the prompt if found
      if (relevantVerses.length > 0) {
        systemPrompt += `\n\nRelevant Bible verses for this conversation:\n`;
        relevantVerses.forEach((verse, index) => {
          systemPrompt += `${index + 1}. ${verse.reference}: "${verse.text}"\n`;
        });
        systemPrompt += `\nUse these verses wisely to support, clarify, or provide biblical perspective on your response. You may quote them directly or reference them naturally in your answer.`;
      }

      // Build conversation messages
      const messages = [
        {
          role: "system",
          content: systemPrompt
        },
        ...conversationHistory,
        {
          role: "user",
          content: userMessage
        }
      ];

      // Make API call to OpenRouter
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Bible Study App - AI Assistant'
        },
        body: JSON.stringify({
          model: "anthropic/claude-3.5-sonnet",
          messages: messages,
          max_tokens: 800,
          temperature: 0.7,
          top_p: 0.9
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API request failed: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

      // Return response with metadata
      return {
        response: aiResponse,
        relevantVerses: relevantVerses,
        keywords: keywords,
        hasVerses: relevantVerses.length > 0
      };

    } catch (error) {
      console.error('Enhanced AI Service error:', error);
      throw error;
    }
  }

  // Get a biblical perspective on a specific topic
  async getBiblicalPerspective(topic) {
    const keywords = this.extractBibleKeywords(topic);
    const verses = await this.findRelevantVerses([topic, ...keywords], 3);
    
    const prompt = `Provide a biblical perspective on "${topic}" using relevant Scripture.`;
    
    try {
      const result = await this.getChatResponse(prompt);
      return {
        ...result,
        topic: topic,
        verses: verses
      };
    } catch (error) {
      return {
        response: `I'd encourage you to search the Scriptures about "${topic}" and seek guidance through prayer and study.`,
        relevantVerses: verses,
        keywords: keywords,
        hasVerses: verses.length > 0,
        error: error.message
      };
    }
  }

  // Validate environment configuration
  isConfigured() {
    return {
      openRouter: !!this.apiKey,
      bibleApi: !!this.bibleApiKey,
      fullyConfigured: !!(this.apiKey && this.bibleApiKey)
    };
  }
}

// Export singleton instance
export const enhancedAI = new EnhancedAIService();
export default enhancedAI;