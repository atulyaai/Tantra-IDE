export interface SearchResult {
    id: string;
    title: string;
    description: string;
    url: string;
    source: 'stackoverflow' | 'github' | 'npm' | 'mdn' | 'web';
    score?: number;
    tags?: string[];
    author?: string;
    createdAt?: string;
    language?: string;
}
export interface SearchOptions {
    limit?: number;
    language?: string;
    sortBy?: 'relevance' | 'date' | 'stars' | 'downloads';
}
export declare function searchStackOverflow(query: string, options?: SearchOptions): Promise<SearchResult[]>;
export declare function searchGitHub(query: string, options?: SearchOptions): Promise<SearchResult[]>;
export declare function searchNPM(query: string, options?: SearchOptions): Promise<SearchResult[]>;
export declare function searchMDN(query: string, options?: SearchOptions): Promise<SearchResult[]>;
export declare function searchWeb(query: string, options?: SearchOptions): Promise<SearchResult[]>;
export declare function searchAll(query: string, options?: SearchOptions): Promise<SearchResult[]>;
export declare function searchSource(source: string, query: string, options?: SearchOptions): Promise<SearchResult[]>;
export declare function getSearchSuggestions(query: string): Promise<string[]>;
export declare function searchCodeSnippets(query: string, language?: string): Promise<SearchResult[]>;
export declare function searchDocumentation(query: string, framework?: string): Promise<SearchResult[]>;
//# sourceMappingURL=searchService.d.ts.map