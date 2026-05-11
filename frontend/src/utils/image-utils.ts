/**
 * Utility for client-side image compression and resizing
 */

export interface ResizeOptions {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    quality?: number;
    outputType?: string;
}

/**
 * Resizes and compresses an image file
 * @param file The original image file
 * @param options Compression options
 * @returns A Promise that resolves to a new compressed File object
 */
export async function compressImage(
    file: File,
    options: ResizeOptions = {}
): Promise<File> {
    const {
        maxSizeMB = 5,
        maxWidthOrHeight = 1200,
        quality = 0.8,
        outputType = 'image/jpeg'
    } = options;

    // If file is already smaller than limit, returning it directly as an optimization
    // though we might still want to resize it for consistency.
    // For now, let's only compress if it exceeds the limit.
    if (file.size <= maxSizeMB * 1024 * 1024 && !options.maxWidthOrHeight) {
        return file;
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions
                if (width > height) {
                    if (width > maxWidthOrHeight) {
                        height *= maxWidthOrHeight / width;
                        width = maxWidthOrHeight;
                    }
                } else {
                    if (height > maxWidthOrHeight) {
                        width *= maxWidthOrHeight / height;
                        height = maxWidthOrHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Canvas to Blob conversion failed'));
                            return;
                        }
                        const compressedFile = new File([blob], file.name, {
                            type: outputType,
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    },
                    outputType,
                    quality
                );
            };
            img.onerror = () => reject(new Error('Failed to load image'));
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
    });
}
