import { describe, it, expect, vi } from 'vitest';
import {
  pingWithRetries,
  withTimeout,
  executeExtractProtocol,
} from '../src/lib/protocol';

describe('Message Protocol', () => {
  it('pingWithRetries resolves true immediately when receiver is ready', async () => {
    const mockSender = vi.fn().mockResolvedValue({ status: 'ready' });
    const ready = await pingWithRetries(mockSender, 3, 10);
    expect(ready).toBe(true);
    expect(mockSender).toHaveBeenCalledTimes(1);
  });

  it('pingWithRetries succeeds after initial failed attempts', async () => {
    let callCount = 0;
    const mockSender = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount < 3) {
        throw new Error('Could not establish connection');
      }
      return { status: 'ready' };
    });

    const ready = await pingWithRetries(mockSender, 5, 10);
    expect(ready).toBe(true);
    expect(mockSender).toHaveBeenCalledTimes(3);
  });

  it('pingWithRetries returns false when receiver never responds ready', async () => {
    const mockSender = vi.fn().mockRejectedValue(new Error('Receiving end does not exist'));
    const ready = await pingWithRetries(mockSender, 3, 10);
    expect(ready).toBe(false);
    expect(mockSender).toHaveBeenCalledTimes(3);
  });

  it('withTimeout resolves value when operation completes before limit', async () => {
    const quickTask = Promise.resolve('ok');
    const result = await withTimeout(quickTask, 500);
    expect(result).toBe('ok');
  });

  it('withTimeout rejects with TIMEOUT error when operation exceeds limit', async () => {
    const slowTask = new Promise((resolve) => setTimeout(resolve, 200));
    await expect(withTimeout(slowTask, 50)).rejects.toThrow('TIMEOUT');
  });

  it('executeExtractProtocol rejects if content script is not ready', async () => {
    const deadSender = vi.fn().mockRejectedValue(new Error('Dead'));
    await expect(
      executeExtractProtocol(deadSender, {
        mode: 'article',
        includeLinks: true,
        imagesAsAlt: false,
        includeMeta: true,
      }, 500)
    ).rejects.toThrow('CONTENT_SCRIPT_NOT_READY');
  });

  it('executeExtractProtocol handles timeout during extraction', async () => {
    const mockSender = vi.fn().mockImplementation(async (msg: any) => {
      if (msg.type === 'mdai:ping') return { status: 'ready' };
      return new Promise((resolve) => setTimeout(resolve, 300));
    });

    await expect(
      executeExtractProtocol(mockSender, {
        mode: 'article',
        includeLinks: true,
        imagesAsAlt: false,
        includeMeta: true,
      }, 50)
    ).rejects.toThrow('TIMEOUT');
  });

  it('executeExtractProtocol throws when response has error property', async () => {
    const mockSender = vi.fn().mockImplementation(async (msg: any) => {
      if (msg.type === 'mdai:ping') return { status: 'ready' };
      return { error: 'DOM_ACCESS_DENIED' };
    });

    await expect(
      executeExtractProtocol(mockSender, {
        mode: 'article',
        includeLinks: true,
        imagesAsAlt: false,
        includeMeta: true,
      }, 500)
    ).rejects.toThrow('DOM_ACCESS_DENIED');
  });

  it('executeExtractProtocol succeeds and returns markdown response', async () => {
    const mockSender = vi.fn().mockImplementation(async (msg: any) => {
      if (msg.type === 'mdai:ping') return { status: 'ready' };
      return {
        markdown: '# Hello AI',
        title: 'Test Page',
        url: 'https://example.com',
        tokens: 10,
        mode: 'article',
        isFallback: false,
      };
    });

    const response = await executeExtractProtocol(mockSender, {
      mode: 'article',
      includeLinks: true,
      imagesAsAlt: false,
      includeMeta: true,
    }, 500);

    expect(response.markdown).toBe('# Hello AI');
    expect(response.tokens).toBe(10);
    expect(response.isFallback).toBe(false);
  });
});
