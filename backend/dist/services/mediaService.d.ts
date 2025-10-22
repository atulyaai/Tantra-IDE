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
export declare function getAllMediaFiles(): Promise<MediaFile[]>;
export declare function tagImageWithAI(imagePath: string): Promise<string[]>;
export declare function findAssetUsage(assetPath: string): Promise<string[]>;
export declare function optimizeImage(imagePath: string, options: {
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
    format?: 'jpeg' | 'png' | 'webp';
}): Promise<void>;
export declare function getMediaStats(): Promise<MediaStats>;
export declare function detectUnusedAssets(): Promise<MediaFile[]>;
//# sourceMappingURL=mediaService.d.ts.map