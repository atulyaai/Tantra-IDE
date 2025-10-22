import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import sharp from 'sharp';

const WORKSPACE_PATH = process.env.WORKSPACE_PATH || process.cwd();
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

export interface MediaFile {
  id: string;
  path: string;
  type: 'image' | 'video' | 'audio';
  size: number;
  width?: number;
  height?: number;
  thumbnail?: string;
  tags?: string[];
  usedIn?: string[];
  optimized: boolean;
}

export interface MediaStats {
  totalFiles: number;
  totalSize: number;
  byType: {
    image: number;
    video: number;
    audio: number;
  };
  unusedFiles: number;
}

const SUPPORTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
const SUPPORTED_VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'];
const SUPPORTED_AUDIO_EXTENSIONS = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'];

export async function getAllMediaFiles(): Promise<MediaFile[]> {
  const mediaFiles: MediaFile[] = [];
  
  try {
    await scanDirectory(WORKSPACE_PATH, mediaFiles);
    return mediaFiles;
  } catch (error) {
    console.error('Error scanning media files:', error);
    return [];
  }
}

async function scanDirectory(dirPath: string, mediaFiles: MediaFile[]): Promise<void> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      // Skip hidden files and node_modules
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue;
      }
      
      if (entry.isDirectory()) {
        await scanDirectory(fullPath, mediaFiles);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        
        if (isMediaFile(ext)) {
          const stats = await fs.stat(fullPath);
          const relativePath = path.relative(WORKSPACE_PATH, fullPath);
          
          const mediaFile: MediaFile = {
            id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            path: relativePath,
            type: getMediaType(ext),
            size: stats.size,
            optimized: false,
          };
          
          // Get dimensions for images
          if (mediaFile.type === 'image') {
            try {
              const metadata = await sharp(fullPath).metadata();
              mediaFile.width = metadata.width;
              mediaFile.height = metadata.height;
              
              // Generate thumbnail
              mediaFile.thumbnail = await generateThumbnail(fullPath);
            } catch (error) {
              console.error(`Error processing image ${fullPath}:`, error);
            }
          }
          
          mediaFiles.push(mediaFile);
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error);
  }
}

function isMediaFile(extension: string): boolean {
  return [
    ...SUPPORTED_IMAGE_EXTENSIONS,
    ...SUPPORTED_VIDEO_EXTENSIONS,
    ...SUPPORTED_AUDIO_EXTENSIONS,
  ].includes(extension);
}

function getMediaType(extension: string): 'image' | 'video' | 'audio' {
  if (SUPPORTED_IMAGE_EXTENSIONS.includes(extension)) return 'image';
  if (SUPPORTED_VIDEO_EXTENSIONS.includes(extension)) return 'video';
  if (SUPPORTED_AUDIO_EXTENSIONS.includes(extension)) return 'audio';
  return 'image'; // fallback
}

async function generateThumbnail(imagePath: string): Promise<string> {
  try {
    const thumbnailPath = path.join(
      path.dirname(imagePath),
      '.thumbnails',
      path.basename(imagePath, path.extname(imagePath)) + '_thumb.jpg'
    );
    
    // Ensure thumbnail directory exists
    await fs.mkdir(path.dirname(thumbnailPath), { recursive: true });
    
    // Generate thumbnail
    await sharp(imagePath)
      .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);
    
    return path.relative(WORKSPACE_PATH, thumbnailPath);
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return '';
  }
}

export async function tagImageWithAI(imagePath: string): Promise<string[]> {
  try {
    // For now, return basic tags based on filename
    // In a real implementation, you would use LLaVA or similar vision model
    const filename = path.basename(imagePath, path.extname(imagePath));
    const tags: string[] = [];
    
    // Basic keyword extraction from filename
    const keywords = filename.toLowerCase().split(/[-_\s]+/);
    tags.push(...keywords.filter(k => k.length > 2));
    
    // Add type-based tags
    const ext = path.extname(imagePath).toLowerCase();
    if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      tags.push('photo', 'image');
    } else if (['.gif'].includes(ext)) {
      tags.push('animation', 'gif');
    } else if (['.svg'].includes(ext)) {
      tags.push('vector', 'icon');
    }
    
    return tags.slice(0, 10); // Limit to 10 tags
  } catch (error) {
    console.error('Error tagging image:', error);
    return [];
  }
}

export async function findAssetUsage(assetPath: string): Promise<string[]> {
  const usageFiles: string[] = [];
  
  try {
    const assetName = path.basename(assetPath);
    const assetNameWithoutExt = path.basename(assetPath, path.extname(assetPath));
    
    // Search patterns
    const searchPatterns = [
      assetName,
      assetNameWithoutExt,
      `"${assetName}"`,
      `'${assetName}'`,
      `/${assetName}`,
      `./${assetName}`,
    ];
    
    await searchInDirectory(WORKSPACE_PATH, searchPatterns, usageFiles);
    
    return usageFiles;
  } catch (error) {
    console.error('Error finding asset usage:', error);
    return [];
  }
}

async function searchInDirectory(dirPath: string, patterns: string[], results: string[]): Promise<void> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        await searchInDirectory(fullPath, patterns, results);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        
        // Search in text files
        if (['.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.scss', '.json', '.md'].includes(ext)) {
          try {
            const content = await fs.readFile(fullPath, 'utf-8');
            
            for (const pattern of patterns) {
              if (content.includes(pattern)) {
                const relativePath = path.relative(WORKSPACE_PATH, fullPath);
                if (!results.includes(relativePath)) {
                  results.push(relativePath);
                }
              }
            }
          } catch (error) {
            // Skip files that can't be read
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error searching in directory ${dirPath}:`, error);
  }
}

export async function optimizeImage(imagePath: string, options: {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: 'jpeg' | 'png' | 'webp';
}): Promise<void> {
  try {
    const fullPath = path.join(WORKSPACE_PATH, imagePath);
    const optimizedPath = path.join(
      path.dirname(fullPath),
      path.basename(fullPath, path.extname(fullPath)) + '_optimized.' + (options.format || 'jpg')
    );
    
    let sharpInstance = sharp(fullPath);
    
    // Resize if needed
    if (options.maxWidth || options.maxHeight) {
      sharpInstance = sharpInstance.resize(options.maxWidth, options.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }
    
    // Apply format-specific optimizations
    switch (options.format || 'jpeg') {
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({ quality: options.quality || 80 });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({ quality: options.quality || 80 });
        break;
      case 'webp':
        sharpInstance = sharpInstance.webp({ quality: options.quality || 80 });
        break;
    }
    
    await sharpInstance.toFile(optimizedPath);
    
    // Optionally replace original
    // await fs.rename(optimizedPath, fullPath);
  } catch (error) {
    console.error('Error optimizing image:', error);
    throw error;
  }
}

export async function getMediaStats(): Promise<MediaStats> {
  const mediaFiles = await getAllMediaFiles();
  
  const stats: MediaStats = {
    totalFiles: mediaFiles.length,
    totalSize: mediaFiles.reduce((sum, file) => sum + file.size, 0),
    byType: {
      image: mediaFiles.filter(f => f.type === 'image').length,
      video: mediaFiles.filter(f => f.type === 'video').length,
      audio: mediaFiles.filter(f => f.type === 'audio').length,
    },
    unusedFiles: 0,
  };
  
  // Count unused files
  for (const file of mediaFiles) {
    const usage = await findAssetUsage(file.path);
    if (usage.length === 0) {
      stats.unusedFiles++;
    }
  }
  
  return stats;
}

export async function detectUnusedAssets(): Promise<MediaFile[]> {
  const mediaFiles = await getAllMediaFiles();
  const unusedFiles: MediaFile[] = [];
  
  for (const file of mediaFiles) {
    const usage = await findAssetUsage(file.path);
    if (usage.length === 0) {
      unusedFiles.push(file);
    }
  }
  
  return unusedFiles;
}

