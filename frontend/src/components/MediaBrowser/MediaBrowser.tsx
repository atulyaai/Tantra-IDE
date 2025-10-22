import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { mediaAPI } from '../../services/api';
import { Image, Video, Music, Download, Eye, Tag, Trash2, Zap } from 'lucide-react';
import type { MediaFile } from '../../types';

export default function MediaBrowser() {
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'audio'>('all');

  const { data: mediaFiles, isLoading, refetch } = useQuery({
    queryKey: ['media-files'],
    queryFn: () => mediaAPI.getAll(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: stats } = useQuery({
    queryKey: ['media-stats'],
    queryFn: () => mediaAPI.getStats(),
  });

  const filteredFiles = mediaFiles?.filter(file => 
    filter === 'all' || file.type === filter
  ) || [];

  const getFileIcon = (file: MediaFile) => {
    switch (file.type) {
      case 'image':
        return <Image className="w-6 h-6 text-blue-500" />;
      case 'video':
        return <Video className="w-6 h-6 text-purple-500" />;
      case 'audio':
        return <Music className="w-6 h-6 text-green-500" />;
      default:
        return <Image className="w-6 h-6 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleTagImage = async (file: MediaFile) => {
    try {
      const tags = await mediaAPI.tag(file.path);
      console.log('AI tags:', tags);
      // In a real implementation, you would update the file with tags
    } catch (error) {
      console.error('Error tagging image:', error);
    }
  };

  const handleOptimizeImage = async (file: MediaFile) => {
    try {
      await mediaAPI.optimize(file.path, {
        quality: 80,
        maxWidth: 1920,
        maxHeight: 1080,
        format: 'webp',
      });
      refetch();
    } catch (error) {
      console.error('Error optimizing image:', error);
    }
  };

  const handleFindUsage = async (file: MediaFile) => {
    try {
      const usage = await mediaAPI.findUsage(file.path);
      console.log('Usage:', usage);
    } catch (error) {
      console.error('Error finding usage:', error);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Media Browser</h2>
          <div className="flex gap-2">
            <button
              className={`px-3 py-1 text-sm rounded ${
                filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-accent'
              }`}
              onClick={() => setFilter('all')}
            >
              All ({mediaFiles?.length || 0})
            </button>
            <button
              className={`px-3 py-1 text-sm rounded ${
                filter === 'image' ? 'bg-primary text-primary-foreground' : 'bg-accent'
              }`}
              onClick={() => setFilter('image')}
            >
              Images ({stats?.byType.image || 0})
            </button>
            <button
              className={`px-3 py-1 text-sm rounded ${
                filter === 'video' ? 'bg-primary text-primary-foreground' : 'bg-accent'
              }`}
              onClick={() => setFilter('video')}
            >
              Videos ({stats?.byType.video || 0})
            </button>
            <button
              className={`px-3 py-1 text-sm rounded ${
                filter === 'audio' ? 'bg-primary text-primary-foreground' : 'bg-accent'
              }`}
              onClick={() => setFilter('audio')}
            >
              Audio ({stats?.byType.audio || 0})
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="bg-card p-3 rounded">
              <div className="text-muted-foreground">Total Size</div>
              <div className="font-semibold">{formatFileSize(stats.totalSize)}</div>
            </div>
            <div className="bg-card p-3 rounded">
              <div className="text-muted-foreground">Unused Files</div>
              <div className="font-semibold text-orange-500">{stats.unusedFiles}</div>
            </div>
            <div className="bg-card p-3 rounded">
              <div className="text-muted-foreground">Optimized</div>
              <div className="font-semibold text-green-500">
                {mediaFiles?.filter(f => f.optimized).length || 0}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* File List */}
        <div className="w-1/2 border-r border-border overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">Loading media files...</div>
          ) : filteredFiles.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No {filter === 'all' ? '' : filter} files found
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className={`p-3 rounded cursor-pointer hover:bg-accent ${
                    selectedFile?.id === file.id ? 'bg-accent border border-primary' : ''
                  }`}
                  onClick={() => setSelectedFile(file)}
                >
                  <div className="flex items-center gap-3">
                    {file.thumbnail ? (
                      <img
                        src={`/api/files/read?path=${file.thumbnail}`}
                        alt={file.path}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        {getFileIcon(file)}
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{file.path}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)}
                        {file.width && file.height && ` • ${file.width}×${file.height}`}
                      </div>
                      {file.tags && file.tags.length > 0 && (
                        <div className="text-xs text-blue-500 mt-1">
                          {file.tags.slice(0, 3).join(', ')}
                          {file.tags.length > 3 && ` +${file.tags.length - 3} more`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* File Details */}
        <div className="w-1/2 p-4">
          {selectedFile ? (
            <div className="space-y-4">
              {/* Preview */}
              <div className="bg-card rounded-lg p-4">
                <h3 className="font-semibold mb-3">Preview</h3>
                {selectedFile.type === 'image' && selectedFile.thumbnail ? (
                  <img
                    src={`/api/files/read?path=${selectedFile.thumbnail}`}
                    alt={selectedFile.path}
                    className="w-full h-48 object-contain rounded"
                  />
                ) : (
                  <div className="w-full h-48 bg-muted rounded flex items-center justify-center">
                    {getFileIcon(selectedFile)}
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="bg-card rounded-lg p-4">
                <h3 className="font-semibold mb-3">File Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Path:</span>
                    <span className="font-mono text-xs">{selectedFile.path}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size:</span>
                    <span>{formatFileSize(selectedFile.size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="capitalize">{selectedFile.type}</span>
                  </div>
                  {selectedFile.width && selectedFile.height && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dimensions:</span>
                      <span>{selectedFile.width} × {selectedFile.height}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="bg-card rounded-lg p-4">
                <h3 className="font-semibold mb-3">Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedFile.type === 'image' && (
                    <>
                      <button
                        className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                        onClick={() => handleTagImage(selectedFile)}
                      >
                        <Tag className="w-4 h-4" />
                        AI Tag
                      </button>
                      <button
                        className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        onClick={() => handleOptimizeImage(selectedFile)}
                      >
                        <Zap className="w-4 h-4" />
                        Optimize
                      </button>
                    </>
                  )}
                  <button
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={() => handleFindUsage(selectedFile)}
                  >
                    <Eye className="w-4 h-4" />
                    Find Usage
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a file to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
