// Environment Configuration Validator
// Centralized validation and management of environment variables

export class ConfigValidator {
  constructor() {
    this.config = {
      paypal: {
        donationUrl: import.meta.env.VITE_PAYPAL_DONATION_URL,
        isConfigured: !!import.meta.env.VITE_PAYPAL_DONATION_URL
      },
      bible: {
        apiKey: import.meta.env.VITE_BIBLE_API_KEY,
        baseUrl: import.meta.env.VITE_BIBLE_BASE_URL,
        defaultBibleId: import.meta.env.VITE_DEFAULT_BIBLE_ID,
        isConfigured: !!(
          import.meta.env.VITE_BIBLE_API_KEY && 
          import.meta.env.VITE_BIBLE_BASE_URL && 
          import.meta.env.VITE_DEFAULT_BIBLE_ID
        )
      },
      openRouter: {
        apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
        apiUrl: import.meta.env.VITE_OPENROUTER_API_URL,
        isConfigured: !!(
          import.meta.env.VITE_OPENROUTER_API_KEY && 
          import.meta.env.VITE_OPENROUTER_API_URL
        )
      }
    };
  }

  // Get configuration status
  getStatus() {
    return {
      paypal: this.config.paypal.isConfigured,
      bible: this.config.bible.isConfigured,
      openRouter: this.config.openRouter.isConfigured,
      overall: this.config.paypal.isConfigured && 
               this.config.bible.isConfigured && 
               this.config.openRouter.isConfigured
    };
  }

  // Get configuration details
  getConfig() {
    return this.config;
  }

  // Validate specific service
  validateService(service) {
    switch (service) {
      case 'paypal':
        return {
          isValid: this.config.paypal.isConfigured,
          message: this.config.paypal.isConfigured ? 
            'PayPal donation configured' : 
            'PayPal donation URL not configured',
          config: this.config.paypal
        };
      
      case 'bible':
        return {
          isValid: this.config.bible.isConfigured,
          message: this.config.bible.isConfigured ? 
            'Bible API fully configured' : 
            'Bible API missing configuration (API key, base URL, or Bible ID)',
          config: this.config.bible
        };
      
      case 'openRouter':
        return {
          isValid: this.config.openRouter.isConfigured,
          message: this.config.openRouter.isConfigured ? 
            'OpenRouter AI configured' : 
            'OpenRouter API missing configuration (API key or URL)',
          config: this.config.openRouter
        };
      
      default:
        return {
          isValid: false,
          message: 'Unknown service',
          config: null
        };
    }
  }

  // Get missing configurations
  getMissingConfig() {
    const missing = [];
    
    if (!this.config.paypal.isConfigured) {
      missing.push({
        service: 'PayPal',
        variables: ['VITE_PAYPAL_DONATION_URL'],
        impact: 'Donation functionality disabled'
      });
    }
    
    if (!this.config.bible.isConfigured) {
      const missingBible = [];
      if (!this.config.bible.apiKey) missingBible.push('VITE_BIBLE_API_KEY');
      if (!this.config.bible.baseUrl) missingBible.push('VITE_BIBLE_BASE_URL');
      if (!this.config.bible.defaultBibleId) missingBible.push('VITE_DEFAULT_BIBLE_ID');
      
      missing.push({
        service: 'Bible API',
        variables: missingBible,
        impact: 'Scripture lookup, Bible reading, and verse-of-the-day disabled'
      });
    }
    
    if (!this.config.openRouter.isConfigured) {
      const missingAI = [];
      if (!this.config.openRouter.apiKey) missingAI.push('VITE_OPENROUTER_API_KEY');
      if (!this.config.openRouter.apiUrl) missingAI.push('VITE_OPENROUTER_API_URL');
      
      missing.push({
        service: 'OpenRouter AI',
        variables: missingAI,
        impact: 'AI chatbot functionality disabled'
      });
    }
    
    return missing;
  }

  // Generate configuration report
  generateReport() {
    const status = this.getStatus();
    const missing = this.getMissingConfig();
    
    return {
      timestamp: new Date().toISOString(),
      status: status,
      services: {
        paypal: this.validateService('paypal'),
        bible: this.validateService('bible'),
        openRouter: this.validateService('openRouter')
      },
      missing: missing,
      recommendations: this.getRecommendations(missing)
    };
  }

  // Get recommendations for fixing configuration
  getRecommendations(missing) {
    const recommendations = [];
    
    if (missing.length === 0) {
      return ['✅ All services are properly configured!'];
    }
    
    recommendations.push('🔧 Configuration Issues Found:');
    
    missing.forEach(item => {
      recommendations.push(`• ${item.service}: Missing ${item.variables.join(', ')}`);
      recommendations.push(`  Impact: ${item.impact}`);
    });
    
    recommendations.push('');
    recommendations.push('💡 To fix these issues:');
    recommendations.push('1. Check your .env file in the project root');
    recommendations.push('2. Ensure all required environment variables are set');
    recommendations.push('3. Restart your development server after making changes');
    
    return recommendations;
  }
}

// Export singleton instance
export const configValidator = new ConfigValidator();
export default configValidator;