import { describe, expect, it } from 'vitest';
import { extractDomain, isCapturableUrl } from '../src/lib/domain';

describe('extractDomain', () => {
  it('extrae el dominio en minúsculas y sin www', () => {
    expect(extractDomain('https://www.youtube.com/watch?v=123')).toBe('youtube.com');
    expect(extractDomain('http://WWW.Sub.Example.COM/path')).toBe('sub.example.com');
    expect(extractDomain('https://twitch.tv/streamer')).toBe('twitch.tv');
  });

  it('retorna null para esquemas internos del navegador', () => {
    expect(extractDomain('chrome://extensions/')).toBeNull();
    expect(extractDomain('edge://settings/')).toBeNull();
    expect(extractDomain('about:blank')).toBeNull();
    expect(extractDomain('file:///C:/test.mp3')).toBeNull();
    expect(extractDomain('chrome-extension://abcdef/index.html')).toBeNull();
  });

  it('retorna null para URLs vacías, indefinidas o malformadas', () => {
    expect(extractDomain('')).toBeNull();
    expect(extractDomain('   ')).toBeNull();
    expect(extractDomain(undefined)).toBeNull();
    expect(extractDomain(null)).toBeNull();
    expect(extractDomain('not-a-valid-url')).toBeNull();
  });
});

describe('isCapturableUrl', () => {
  it('permite URLs http y https convencionales', () => {
    expect(isCapturableUrl('https://open.spotify.com')).toBe(true);
    expect(isCapturableUrl('http://localhost:3000')).toBe(true);
    expect(isCapturableUrl('https://news.ycombinator.com/item?id=1')).toBe(true);
  });

  it('bloquea URLs del sistema y tiendas de extensiones', () => {
    expect(isCapturableUrl('chrome://extensions')).toBe(false);
    expect(isCapturableUrl('chrome-extension://abcdef123/popup.html')).toBe(false);
    expect(isCapturableUrl('edge://flags')).toBe(false);
    expect(isCapturableUrl('about:blank')).toBe(false);
    expect(isCapturableUrl('https://chromewebstore.google.com/detail/xyz')).toBe(false);
    expect(isCapturableUrl('https://chrome.google.com/webstore')).toBe(false);
  });

  it('bloquea entradas nulas, vacías o malformadas', () => {
    expect(isCapturableUrl('')).toBe(false);
    expect(isCapturableUrl(null)).toBe(false);
    expect(isCapturableUrl(undefined)).toBe(false);
    expect(isCapturableUrl('random text')).toBe(false);
  });
});
