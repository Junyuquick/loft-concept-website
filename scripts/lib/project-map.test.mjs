import { describe, expect, it } from 'vitest';
import { imageName } from './project-map.mjs';

describe('imageName', () => {
  it('numbers, lowercases and normalises to .jpg', () => {
    expect(imageName(0, 'IMG_5072.JPG')).toBe('01-img-5072.jpg');
    expect(imageName(11, '20151026_147BedokRoad_448.jpg')).toBe('12-20151026-147bedokroad-448.jpg');
  });
});
