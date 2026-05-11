import { describe, it, expect } from 'vitest';
import { compressImage } from './image-utils';

describe('image-utils', () => {
    describe('compressImage', () => {
        it('should be defined', () => {
            expect(compressImage).toBeDefined();
        });

        it('should return the original file if it is within size limits and no resizing is requested', async () => {
            const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
            // maxSizeMB defaults to 5. Our mock file is 0.
            const result = await compressImage(file);
            expect(result).toBe(file);
        });
    });
});
