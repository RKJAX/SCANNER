class APIClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  async request(method, endpoint, data = null) {
    const url = `${this.baseUrl}/api${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Exchanges
  async getExchanges() {
    return this.request('GET', '/exchanges');
  }

  // Pairs
  async getPairs(exchanges) {
    return this.request('GET', `/pairs?exchanges=${exchanges.join(',')}`);
  }

  // Scan
  async scan(params) {
    return this.request('POST', '/scan', params);
  }

  // Signals
  async getSignals(limit = 50) {
    return this.request('GET', `/signals?limit=${limit}`);
  }

  async getSignalDetails(index) {
    return this.request('GET', `/signals/${index}`);
  }
}

const apiClient = new APIClient('');
