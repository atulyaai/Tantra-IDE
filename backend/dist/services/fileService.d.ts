interface FileNode {
    name: string;
    path: string;
    type: 'file' | 'directory';
    children?: FileNode[];
    size?: number;
    modified?: number;
}
export declare function getFileTree(relativePath: string): Promise<FileNode[]>;
export declare function readFile(relativePath: string): Promise<string>;
export declare function writeFile(relativePath: string, content: string): Promise<void>;
export declare function createFile(relativePath: string, content?: string): Promise<void>;
export declare function deleteFile(relativePath: string): Promise<void>;
export declare function renameFile(oldRelativePath: string, newRelativePath: string): Promise<void>;
export declare function createFolder(relativePath: string): Promise<void>;
export declare function searchFiles(pattern: string, relativePath?: string): Promise<any[]>;
export {};
//# sourceMappingURL=fileService.d.ts.map