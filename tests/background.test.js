import { jest } from '@jest/globals';

// Mock fetch
global.fetch = jest.fn();

// Store the original URL.createObjectURL if it exists
const originalCreateObjectURL = global.URL?.createObjectURL;

// Mock URL.createObjectURL
global.URL = {
  createObjectURL: jest.fn().mockReturnValue('mock-blob-url')
};

describe('Background Script Proxy', () => {
  let messageListener = null;

  // Set up the mocks and import the background script
  beforeAll(async () => {
    // Mock chrome.runtime.onMessage.addListener to capture the message listener
    global.chrome = {
      runtime: {
        onMessage: {
          addListener: jest.fn((listener) => {
            messageListener = listener;
          })
        },
        lastError: null
      }
    };

    // Import the background script directly
    await import('../background.js');

    // Verify the listener was registered
    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
    expect(messageListener).toBeTruthy();
  });

  // Restore the original URL.createObjectURL
  afterAll(() => {
    if (originalCreateObjectURL) {
      global.URL.createObjectURL = originalCreateObjectURL;
    }
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.resetAllMocks();
    chrome.runtime.lastError = null;
  });

  it('should handle JSON responses', async () => {
    // Setup
    const mockJsonData = { data: 'test' };
    const mockResponse = {
      ok: true,
      headers: {
        get: jest.fn().mockReturnValue('application/json')
      },
      json: jest.fn().mockResolvedValue(mockJsonData)
    };

    global.fetch.mockResolvedValue(mockResponse);

    // Execute
    const result = await new Promise((resolve) => {
      messageListener(
        { type: 'PROXY_REQUEST', url: 'https://example.com/api' },
        {},
        resolve
      );
    });

    // Verify
    expect(fetch).toHaveBeenCalledWith('https://example.com/api', expect.objectContaining({
      mode: 'cors'
    }));
    expect(mockResponse.json).toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      data: mockJsonData
    });
  });

  it('should handle image responses', async () => {
    // Setup
    const mockBlob = new Blob(['image data'], { type: 'image/jpeg' });

    const mockResponse = {
      ok: true,
      headers: {
        get: jest.fn().mockReturnValue('image/jpeg')
      },
      blob: jest.fn().mockResolvedValue(mockBlob)
    };

    global.fetch.mockResolvedValue(mockResponse);
    global.URL.createObjectURL.mockReturnValue('mock-blob-url');

    // Execute
    const result = await new Promise((resolve) => {
      messageListener(
        { type: 'PROXY_REQUEST', url: 'https://example.com/image.jpg' },
        {},
        resolve
      );
    });

    // Verify
    expect(fetch).toHaveBeenCalledWith('https://example.com/image.jpg', expect.any(Object));
    expect(mockResponse.blob).toHaveBeenCalled();
    expect(URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    expect(result).toEqual({
      success: true,
      data: {
        blob: true,
        url: 'mock-blob-url',
        type: 'image/jpeg'
      }
    });
  });

  it('should handle text responses', async () => {
    // Setup
    const mockHtmlContent = '<html><body>Test</body></html>';

    const mockResponse = {
      ok: true,
      headers: {
        get: jest.fn().mockReturnValue('text/html')
      },
      text: jest.fn().mockResolvedValue(mockHtmlContent)
    };

    global.fetch.mockResolvedValue(mockResponse);

    // Execute
    const result = await new Promise((resolve) => {
      messageListener(
        { type: 'PROXY_REQUEST', url: 'https://example.com/page.html' },
        {},
        resolve
      );
    });

    // Verify
    expect(fetch).toHaveBeenCalledWith('https://example.com/page.html', expect.any(Object));
    expect(mockResponse.text).toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      data: {
        text: mockHtmlContent
      }
    });
  });

  it('should handle fetch errors', async () => {
    // Setup
    global.fetch.mockRejectedValue(new Error('Network error'));

    // Execute
    const result = await new Promise((resolve) => {
      messageListener(
        { type: 'PROXY_REQUEST', url: 'https://example.com/invalid' },
        {},
        resolve
      );
    });

    // Verify
    expect(fetch).toHaveBeenCalledWith('https://example.com/invalid', expect.any(Object));
    expect(result).toEqual({
      success: false,
      error: 'Network error'
    });
  });

  it('should handle non-ok responses', async () => {
    // Setup
    const mockResponse = {
      ok: false,
      status: 404
    };

    global.fetch.mockResolvedValue(mockResponse);

    // Execute
    const result = await new Promise((resolve) => {
      messageListener(
        { type: 'PROXY_REQUEST', url: 'https://example.com/not-found' },
        {},
        resolve
      );
    });

    // Verify
    expect(fetch).toHaveBeenCalledWith('https://example.com/not-found', expect.any(Object));
    expect(result).toEqual({
      success: false,
      error: 'Proxy request failed with status: 404'
    });
  });

  it('should apply default headers when none are provided', async () => {
    // Setup
    const mockResponse = {
      ok: true,
      headers: {
        get: jest.fn().mockReturnValue('text/plain')
      },
      text: jest.fn().mockResolvedValue('text response')
    };

    global.fetch.mockResolvedValue(mockResponse);

    // Execute
    await new Promise((resolve) => {
      messageListener(
        { type: 'PROXY_REQUEST', url: 'https://example.com/test' },
        {},
        resolve
      );
    });

    // Verify
    expect(fetch).toHaveBeenCalledWith('https://example.com/test', expect.objectContaining({
      headers: expect.objectContaining({
        'User-Agent': expect.stringContaining('Mozilla')
      })
    }));
  });

  it('should preserve custom headers when provided', async () => {
    // Setup
    const customHeaders = {
      'X-Custom-Header': 'custom value',
      'Authorization': 'Bearer token123'
    };

    const mockResponse = {
      ok: true,
      headers: {
        get: jest.fn().mockReturnValue('text/plain')
      },
      text: jest.fn().mockResolvedValue('text response')
    };

    global.fetch.mockResolvedValue(mockResponse);

    // Execute
    await new Promise((resolve) => {
      messageListener(
        {
          type: 'PROXY_REQUEST',
          url: 'https://example.com/test',
          options: { headers: customHeaders }
        },
        {},
        resolve
      );
    });

    // Verify
    expect(fetch).toHaveBeenCalledWith('https://example.com/test', expect.objectContaining({
      headers: expect.objectContaining(customHeaders)
    }));
  });
});
