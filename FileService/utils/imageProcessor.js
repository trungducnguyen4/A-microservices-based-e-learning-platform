/**
 * Image processing utilities using Sharp
 */
import sharp from 'sharp';
import path from 'path';
import fs from 'fs-extra';

/**
 * Generate thumbnail for image
 * @param {string} inputPath - Input image path
 * @param {string} outputPath - Output thumbnail path
 * @param {number} width - Thumbnail width
 * @param {number} height - Thumbnail height
 * @param {number} quality - JPEG quality (1-100)
 * @returns {Promise<string>} - Output path
 */
export const generateThumbnail = async (inputPath, outputPath, width = 300, height = 300, quality = 80) => {
  try {
    await fs.ensureDir(path.dirname(outputPath));
    
    await sharp(inputPath)
      .resize(width, height, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .jpeg({ quality })
      .toFile(outputPath);
      
    return outputPath;
  } catch (error) {
    throw new Error(`Failed to generate thumbnail: ${error.message}`);
  }
};

/**
 * Optimize image for web
 * @param {string} inputPath - Input image path
 * @param {string} outputPath - Output optimized image path
 * @param {object} options - Optimization options
 * @returns {Promise<string>} - Output path
 */
export const optimizeImage = async (inputPath, outputPath, options = {}) => {
  const {
    width = null,
    height = null,
    quality = 85,
    format = 'jpeg'
  } = options;
  
  try {
    let processor = sharp(inputPath);
    
    if (width || height) {
      processor = processor.resize(width, height, { 
        fit: 'inside', 
        withoutEnlargement: true 
      });
    }
    
    switch (format.toLowerCase()) {
      case 'jpeg':
      case 'jpg':
        processor = processor.jpeg({ quality });
        break;
      case 'png':
        processor = processor.png({ quality });
        break;
      case 'webp':
        processor = processor.webp({ quality });
        break;
      default:
        processor = processor.jpeg({ quality });
    }
    
    await processor.toFile(outputPath);
    return outputPath;
  } catch (error) {
    throw new Error(`Failed to optimize image: ${error.message}`);
  }
};

/**
 * Get image metadata
 * @param {string} imagePath - Image file path
 * @returns {Promise<object>} - Image metadata
 */
export const getImageMetadata = async (imagePath) => {
  try {
    const metadata = await sharp(imagePath).metadata();
    
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      space: metadata.space,
      channels: metadata.channels,
      depth: metadata.depth,
      density: metadata.density,
      hasProfile: metadata.hasProfile,
      hasAlpha: metadata.hasAlpha
    };
  } catch (error) {
    throw new Error(`Failed to get image metadata: ${error.message}`);
  }
};

/**
 * Create multiple sizes of an image
 * @param {string} inputPath - Input image path
 * @param {string} outputDir - Output directory
 * @param {string} baseName - Base filename without extension
 * @param {object[]} sizes - Array of size objects {width, height, suffix}
 * @returns {Promise<object[]>} - Array of generated files info
 */
export const generateMultipleSizes = async (inputPath, outputDir, baseName, sizes) => {
  const generatedFiles = [];
  
  try {
    await fs.ensureDir(outputDir);
    
    for (const size of sizes) {
      const { width, height, suffix, quality = 80 } = size;
      const outputPath = path.join(outputDir, `${baseName}_${suffix}.jpg`);
      
      await sharp(inputPath)
        .resize(width, height, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .jpeg({ quality })
        .toFile(outputPath);
        
      generatedFiles.push({
        path: outputPath,
        width,
        height,
        suffix,
        filename: `${baseName}_${suffix}.jpg`
      });
    }
    
    return generatedFiles;
  } catch (error) {
    throw new Error(`Failed to generate multiple sizes: ${error.message}`);
  }
};

/**
 * Convert image format
 * @param {string} inputPath - Input image path
 * @param {string} outputPath - Output image path
 * @param {string} format - Target format (jpeg, png, webp)
 * @param {object} options - Format-specific options
 * @returns {Promise<string>} - Output path
 */
export const convertImageFormat = async (inputPath, outputPath, format, options = {}) => {
  try {
    let processor = sharp(inputPath);
    
    switch (format.toLowerCase()) {
      case 'jpeg':
      case 'jpg':
        processor = processor.jpeg({ 
          quality: options.quality || 85,
          progressive: options.progressive || true
        });
        break;
      case 'png':
        processor = processor.png({ 
          quality: options.quality || 85,
          compressionLevel: options.compressionLevel || 6
        });
        break;
      case 'webp':
        processor = processor.webp({ 
          quality: options.quality || 85,
          lossless: options.lossless || false
        });
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
    
    await processor.toFile(outputPath);
    return outputPath;
  } catch (error) {
    throw new Error(`Failed to convert image format: ${error.message}`);
  }
};