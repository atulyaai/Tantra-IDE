import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchAPI } from '../../services/api';
import { 
  Search, 
  ExternalLink, 
  Code, 
  BookOpen, 
  Package, 
  Github, 
  Globe,
  ChevronDown,
  Loader2
} from 'lucide-react';

export default function SearchPanel() {
  const [query, setQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState('all');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const sources = [
    { id: 'all', label: 'All Sources', icon: Globe },
    { id: 'stackoverflow', label: 'Stack Overflow', icon: Code },
    { id: 'github', label: 'GitHub', icon: Github },
    { id: 'npm', label: 'NPM', icon: Package },
    { id: 'mdn', label: 'MDN', icon: BookOpen },
    { id: 'web', label: 'Web', icon: Globe },
  ];

  // Debounced search suggestions
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const suggestions = await searchAPI.suggestions(query);
        setSuggestions(suggestions);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowSuggestions(false);

    try {
      const results = await searchAPI.web(searchQuery, selectedSource, { limit: 20 });
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    handleSearch(suggestion);
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'stackoverflow':
        return <Code className="w-4 h-4 text-orange-500" />;
      case 'github':
        return <Github className="w-4 h-4 text-gray-800" />;
      case 'npm':
        return <Package className="w-4 h-4 text-red-500" />;
      case 'mdn':
        return <BookOpen className="w-4 h-4 text-blue-500" />;
      case 'web':
        return <Globe className="w-4 h-4 text-green-500" />;
      default:
        return <Search className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Live Search</h2>
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onKeyPress={handleKeyPress}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full px-4 py-2 border border-border rounded bg-background pr-10"
                placeholder="Search Stack Overflow, GitHub, NPM, MDN..."
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={!query.trim() || isSearching}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
            >
              Search
            </button>
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded shadow-lg z-50">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-2 text-left hover:bg-accent first:rounded-t last:rounded-b"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Source Selection */}
        <div className="flex gap-2 overflow-x-auto">
          {sources.map((source) => {
            const Icon = source.icon;
            return (
              <button
                key={source.id}
                onClick={() => setSelectedSource(source.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded whitespace-nowrap transition-colors ${
                  selectedSource === source.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-accent hover:bg-accent/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{source.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto p-4">
        {searchResults.length === 0 && !isSearching ? (
          <div className="text-center text-muted-foreground py-8">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Enter a search query to find answers, code examples, and documentation</p>
          </div>
        ) : (
          <div className="space-y-4">
            {searchResults.map((result) => (
              <div key={result.id} className="bg-card border border-border rounded p-4 hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getSourceIcon(result.source)}
                    <span className="text-sm text-muted-foreground capitalize">{result.source}</span>
                    {result.score && (
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        Score: {result.score.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-accent rounded"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <h3 className="font-semibold mb-2 line-clamp-2">{result.title}</h3>
                
                <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                  {result.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {result.author && (
                    <span>By {result.author}</span>
                  )}
                  {result.createdAt && (
                    <span>{formatDate(result.createdAt)}</span>
                  )}
                  {result.language && (
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                      {result.language}
                    </span>
                  )}
                  {result.tags && result.tags.length > 0 && (
                    <div className="flex gap-1">
                      {result.tags.slice(0, 3).map((tag: string, index: number) => (
                        <span key={index} className="bg-muted px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                      {result.tags.length > 3 && (
                        <span className="bg-muted px-2 py-1 rounded">
                          +{result.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
