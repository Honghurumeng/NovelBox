/**
 * LLM统一服务接口
 * 支持多个LLM提供商（OpenAI、Gemini等）的统一调用
 */

/**
 * LLM请求参数接口
 */
export class LLMRequest {
  constructor({
    prompt,
    maxTokens = 1000,
    temperature = 0.7,
    topP = 0.95,
    topK = 40,
    stopSequences = []
  } = {}) {
    this.prompt = prompt
    this.maxTokens = maxTokens
    this.temperature = temperature
    this.topP = topP
    this.topK = topK
    this.stopSequences = stopSequences
  }
}

/**
 * LLM响应接口
 */
export class LLMResponse {
  constructor({
    content = '',
    tokensUsed = 0,
    finishReason = '',
    error = null
  } = {}) {
    this.content = content
    this.tokensUsed = tokensUsed
    this.finishReason = finishReason
    this.error = error
    this.success = !error
  }
}

/**
 * LLM提供商基类
 */
export class LLMProvider {
  constructor(config) {
    this.config = config
    this.type = config.type
    this.name = config.name
    this.baseUrl = config.base_url
    this.apiKey = config.api_key
    this.models = config.models || []
  }

  /**
   * 生成内容 - 子类需要实现
   * @param {string} modelName - 模型名称
   * @param {LLMRequest} request - 请求参数
   * @returns {Promise<LLMResponse>} 响应结果
   */
  async generateContent(modelName, request) {
    throw new Error('generateContent method must be implemented by subclass')
  }

  /**
   * 验证配置
   */
  validateConfig() {
    if (!this.apiKey) {
      throw new Error(`${this.type} provider requires API key`)
    }
    if (!this.baseUrl) {
      throw new Error(`${this.type} provider requires base URL`)
    }
  }

  /**
   * 获取可用模型列表
   */
  getAvailableModels() {
    return this.models
  }
}

/**
 * OpenAI提供商实现
 */
export class OpenAIProvider extends LLMProvider {
  constructor(config) {
    super(config)
    this.validateConfig()
  }

  async generateContent(modelName, request) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      }

      const body = {
        model: modelName,
        messages: [{ role: 'user', content: request.prompt }],
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        top_p: request.topP,
        stop: request.stopSequences.length > 0 ? request.stopSequences : undefined
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`OpenAI API Error: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      const choice = data.choices?.[0]

      if (!choice) {
        throw new Error('No response choice available')
      }

      return new LLMResponse({
        content: choice.message?.content || '',
        tokensUsed: data.usage?.total_tokens || 0,
        finishReason: choice.finish_reason || 'unknown'
      })

    } catch (error) {
      return new LLMResponse({
        error: error.message
      })
    }
  }
}

/**
 * Gemini提供商实现
 */
export class GeminiProvider extends LLMProvider {
  constructor(config) {
    super(config)
    this.validateConfig()
  }

  async generateContent(modelName, request) {
    try {
      const headers = {
        'Content-Type': 'application/json'
      }

      // Gemini API的安全设置
      const safetySettings = [
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_NONE'
        }
      ]

      const body = {
        contents: [{
          parts: [{ text: request.prompt }]
        }],
        generationConfig: {
          maxOutputTokens: request.maxTokens,
          temperature: request.temperature,
          topP: request.topP,
          topK: request.topK,
          stopSequences: request.stopSequences.length > 0 ? request.stopSequences : undefined
        },
        safetySettings
      }

      const url = `${this.baseUrl}/v1beta/models/${modelName}:generateContent?key=${this.apiKey}`
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Gemini API Error: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      const candidate = data.candidates?.[0]

      if (!candidate) {
        throw new Error('No response candidate available')
      }

      if (candidate.finishReason === 'SAFETY') {
        throw new Error('Response was blocked by safety filters')
      }

      const content = candidate.content?.parts?.[0]?.text || ''

      return new LLMResponse({
        content,
        tokensUsed: data.usageMetadata?.totalTokenCount || 0,
        finishReason: candidate.finishReason || 'unknown'
      })

    } catch (error) {
      return new LLMResponse({
        error: error.message
      })
    }
  }
}

/**
 * LLM服务管理器
 */
export class LLMService {
  constructor() {
    this.providers = new Map()
    this.loadProviders()
  }

  /**
   * 从本地存储加载提供商配置
   */
  loadProviders() {
    try {
      const providersData = localStorage.getItem('novelbox-providers')
      if (!providersData) return

      const providers = JSON.parse(providersData)
      
      providers.forEach(config => {
        const providerKey = `${config.name}_${config.type}`
        
        if (config.type === 'OpenAI') {
          this.providers.set(providerKey, new OpenAIProvider(config))
        } else if (config.type === 'Gemini') {
          this.providers.set(providerKey, new GeminiProvider(config))
        }
      })
    } catch (error) {
      console.error('Failed to load LLM providers:', error)
    }
  }

  /**
   * 重新加载提供商配置
   */
  reloadProviders() {
    this.providers.clear()
    this.loadProviders()
  }

  /**
   * 生成内容
   * @param {string} providerName - 提供商名称
   * @param {string} modelName - 模型名称
   * @param {LLMRequest|string} request - 请求参数或提示文本
   * @returns {Promise<LLMResponse>} 响应结果
   */
  async generateContent(providerName, modelName, request) {
    try {
      // 查找匹配的提供商
      const provider = this.findProvider(providerName)
      if (!provider) {
        return new LLMResponse({
          error: `Provider not found: ${providerName}`
        })
      }

      // 确保request是LLMRequest对象
      const llmRequest = request instanceof LLMRequest 
        ? request 
        : new LLMRequest({ prompt: request })

      // 验证模型是否存在
      const availableModels = provider.getAvailableModels()
      const modelExists = availableModels.some(model => {
        // OpenAI模型格式: {id: "gpt-4", ...}
        // Gemini模型格式: {name: "models/gemini-pro", displayName: "Gemini Pro", ...}
        return model.id === modelName || 
               model.name === modelName || 
               model.name === `models/${modelName}` ||
               model.displayName === modelName
      })

      if (!modelExists) {
        return new LLMResponse({
          error: `Model not found: ${modelName} in provider: ${providerName}`
        })
      }

      return await provider.generateContent(modelName, llmRequest)

    } catch (error) {
      return new LLMResponse({
        error: error.message
      })
    }
  }

  /**
   * 查找提供商
   * @param {string} providerName - 提供商名称
   * @returns {LLMProvider|null} 提供商实例
   */
  findProvider(providerName) {
    // 尝试直接匹配
    for (const [key, provider] of this.providers) {
      if (key.startsWith(providerName)) {
        return provider
      }
    }

    // 尝试按名称匹配
    for (const [key, provider] of this.providers) {
      if (provider.name === providerName) {
        return provider
      }
    }

    return null
  }

  /**
   * 获取所有可用的提供商
   */
  getAvailableProviders() {
    const providers = []
    this.providers.forEach((provider, key) => {
      providers.push({
        key,
        name: provider.name,
        type: provider.type,
        models: provider.getAvailableModels()
      })
    })
    return providers
  }

  /**
   * 获取指定提供商的模型列表
   */
  getProviderModels(providerName) {
    const provider = this.findProvider(providerName)
    return provider ? provider.getAvailableModels() : []
  }
}

// 导出单例实例
export const llmService = new LLMService()