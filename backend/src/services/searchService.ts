import axios from 'axios';

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

// Stack Overflow Search
export async function searchStackOverflow(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
  try {
    const params = new URLSearchParams({
      order: 'desc',
      sort: options.sortBy === 'date' ? 'creation' : 'relevance',
      intitle: query,
      site: 'stackoverflow',
      pagesize: (options.limit || 10).toString(),
    });

    if (options.language) {
      params.append('tagged', options.language);
    }

    const response = await axios.get(`https://api.stackexchange.com/2.3/search/advanced?${params}`);
    
    return response.data.items.map((item: any) => ({
      id: `so-${item.question_id}`,
      title: item.title,
      description: item.excerpt || '',
      url: item.link,
      source: 'stackoverflow' as const,
      score: item.score,
      tags: item.tags,
      author: item.owner?.display_name,
      createdAt: new Date(item.creation_date * 1000).toISOString(),
    }));
  } catch (error) {
    console.error('Stack Overflow search error:', error);
    return [];
  }
}

// GitHub Search
export async function searchGitHub(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      sort: options.sortBy === 'stars' ? 'stars' : 'best match',
      order: 'desc',
      per_page: (options.limit || 10).toString(),
    });

    if (options.language) {
      params.append('language', options.language);
    }

    const response = await axios.get(`https://api.github.com/search/repositories?${params}`);
    
    return response.data.items.map((item: any) => ({
      id: `gh-${item.id}`,
      title: item.name,
      description: item.description || '',
      url: item.html_url,
      source: 'github' as const,
      score: item.stargazers_count,
      language: item.language,
      author: item.owner?.login,
      createdAt: item.created_at,
    }));
  } catch (error) {
    console.error('GitHub search error:', error);
    return [];
  }
}

// NPM Search
export async function searchNPM(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
  try {
    const params = new URLSearchParams({
      text: query,
      size: (options.limit || 10).toString(),
    });

    const response = await axios.get(`https://registry.npmjs.org/-/v1/search?${params}`);
    
    return response.data.objects.map((item: any) => ({
      id: `npm-${item.package.name}`,
      title: item.package.name,
      description: item.package.description || '',
      url: `https://www.npmjs.com/package/${item.package.name}`,
      source: 'npm' as const,
      score: item.score?.final || 0,
      author: item.package.author?.name,
      createdAt: item.package.date,
    }));
  } catch (error) {
    console.error('NPM search error:', error);
    return [];
  }
}

// MDN Search
export async function searchMDN(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      locale: 'en-US',
    });

    const response = await axios.get(`https://developer.mozilla.org/api/v1/search?${params}`);
    
    return response.data.documents.slice(0, options.limit || 10).map((item: any) => ({
      id: `mdn-${item.id}`,
      title: item.title,
      description: item.summary || '',
      url: `https://developer.mozilla.org${item.mdn_url}`,
      source: 'mdn' as const,
      score: item.score,
      tags: item.tags,
    }));
  } catch (error) {
    console.error('MDN search error:', error);
    return [];
  }
}

// General Web Search (using DuckDuckGo Instant Answer API)
export async function searchWeb(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      no_html: '1',
      skip_disambig: '1',
    });

    const response = await axios.get(`https://api.duckduckgo.com/?${params}`);
    
    const results: SearchResult[] = [];
    
    // Add abstract if available
    if (response.data.Abstract) {
      results.push({
        id: `web-abstract-${Date.now()}`,
        title: response.data.Heading || query,
        description: response.data.Abstract,
        url: response.data.AbstractURL || '',
        source: 'web' as const,
        score: 1,
      });
    }
    
    // Add related topics
    if (response.data.RelatedTopics) {
      response.data.RelatedTopics.slice(0, options.limit || 5).forEach((topic: any, index: number) => {
        if (topic.Text && topic.FirstURL) {
          results.push({
            id: `web-topic-${index}`,
            title: topic.Text.split(' - ')[0] || topic.Text,
            description: topic.Text,
            url: topic.FirstURL,
            source: 'web' as const,
            score: 0.8,
          });
        }
      });
    }
    
    return results;
  } catch (error) {
    console.error('Web search error:', error);
    return [];
  }
}

// Main search function
export async function searchAll(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  
  try {
    // Run all searches in parallel
    const [stackOverflowResults, githubResults, npmResults, mdnResults, webResults] = await Promise.all([
      searchStackOverflow(query, options),
      searchGitHub(query, options),
      searchNPM(query, options),
      searchMDN(query, options),
      searchWeb(query, options),
    ]);
    
    // Combine and sort results
    results.push(...stackOverflowResults);
    results.push(...githubResults);
    results.push(...npmResults);
    results.push(...mdnResults);
    results.push(...webResults);
    
    // Sort by score (if available) or relevance
    results.sort((a, b) => (b.score || 0) - (a.score || 0));
    
    // Limit results
    return results.slice(0, options.limit || 20);
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

// Search specific source
export async function searchSource(source: string, query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
  switch (source) {
    case 'stackoverflow':
      return await searchStackOverflow(query, options);
    case 'github':
      return await searchGitHub(query, options);
    case 'npm':
      return await searchNPM(query, options);
    case 'mdn':
      return await searchMDN(query, options);
    case 'web':
      return await searchWeb(query, options);
    case 'all':
      return await searchAll(query, options);
    default:
      return [];
  }
}

// Get search suggestions
export async function getSearchSuggestions(query: string): Promise<string[]> {
  try {
    // Use DuckDuckGo for suggestions
    const response = await axios.get(`https://duckduckgo.com/ac/?q=${encodeURIComponent(query)}`);
    
    return response.data.map((item: any) => item.phrase).slice(0, 5);
  } catch (error) {
    console.error('Suggestions error:', error);
    return [];
  }
}

// Search code snippets
export async function searchCodeSnippets(query: string, language?: string): Promise<SearchResult[]> {
  try {
    const searchQuery = language ? `${query} language:${language}` : query;
    
    // Search GitHub for code
    const githubResults = await searchGitHub(searchQuery, { limit: 5 });
    
    // Search Stack Overflow for code examples
    const soResults = await searchStackOverflow(searchQuery, { limit: 5 });
    
    return [...githubResults, ...soResults];
  } catch (error) {
    console.error('Code search error:', error);
    return [];
  }
}

// Search documentation
export async function searchDocumentation(query: string, framework?: string): Promise<SearchResult[]> {
  try {
    const searchQuery = framework ? `${framework} ${query}` : query;
    
    // Search MDN for web documentation
    const mdnResults = await searchMDN(searchQuery, { limit: 5 });
    
    // Search GitHub for documentation repos
    const githubResults = await searchGitHub(`${searchQuery} documentation`, { limit: 3 });
    
    return [...mdnResults, ...githubResults];
  } catch (error) {
    console.error('Documentation search error:', error);
    return [];
  }
}

