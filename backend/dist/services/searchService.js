import axios from 'axios';
// Stack Overflow Search
export async function searchStackOverflow(query, options = {}) {
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
        return response.data.items.map((item) => ({
            id: `so-${item.question_id}`,
            title: item.title,
            description: item.excerpt || '',
            url: item.link,
            source: 'stackoverflow',
            score: item.score,
            tags: item.tags,
            author: item.owner?.display_name,
            createdAt: new Date(item.creation_date * 1000).toISOString(),
        }));
    }
    catch (error) {
        console.error('Stack Overflow search error:', error);
        return [];
    }
}
// GitHub Search
export async function searchGitHub(query, options = {}) {
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
        return response.data.items.map((item) => ({
            id: `gh-${item.id}`,
            title: item.name,
            description: item.description || '',
            url: item.html_url,
            source: 'github',
            score: item.stargazers_count,
            language: item.language,
            author: item.owner?.login,
            createdAt: item.created_at,
        }));
    }
    catch (error) {
        console.error('GitHub search error:', error);
        return [];
    }
}
// NPM Search
export async function searchNPM(query, options = {}) {
    try {
        const params = new URLSearchParams({
            text: query,
            size: (options.limit || 10).toString(),
        });
        const response = await axios.get(`https://registry.npmjs.org/-/v1/search?${params}`);
        return response.data.objects.map((item) => ({
            id: `npm-${item.package.name}`,
            title: item.package.name,
            description: item.package.description || '',
            url: `https://www.npmjs.com/package/${item.package.name}`,
            source: 'npm',
            score: item.score?.final || 0,
            author: item.package.author?.name,
            createdAt: item.package.date,
        }));
    }
    catch (error) {
        console.error('NPM search error:', error);
        return [];
    }
}
// MDN Search
export async function searchMDN(query, options = {}) {
    try {
        const params = new URLSearchParams({
            q: query,
            locale: 'en-US',
        });
        const response = await axios.get(`https://developer.mozilla.org/api/v1/search?${params}`);
        return response.data.documents.slice(0, options.limit || 10).map((item) => ({
            id: `mdn-${item.id}`,
            title: item.title,
            description: item.summary || '',
            url: `https://developer.mozilla.org${item.mdn_url}`,
            source: 'mdn',
            score: item.score,
            tags: item.tags,
        }));
    }
    catch (error) {
        console.error('MDN search error:', error);
        return [];
    }
}
// General Web Search (using DuckDuckGo Instant Answer API)
export async function searchWeb(query, options = {}) {
    try {
        const params = new URLSearchParams({
            q: query,
            format: 'json',
            no_html: '1',
            skip_disambig: '1',
        });
        const response = await axios.get(`https://api.duckduckgo.com/?${params}`);
        const results = [];
        // Add abstract if available
        if (response.data.Abstract) {
            results.push({
                id: `web-abstract-${Date.now()}`,
                title: response.data.Heading || query,
                description: response.data.Abstract,
                url: response.data.AbstractURL || '',
                source: 'web',
                score: 1,
            });
        }
        // Add related topics
        if (response.data.RelatedTopics) {
            response.data.RelatedTopics.slice(0, options.limit || 5).forEach((topic, index) => {
                if (topic.Text && topic.FirstURL) {
                    results.push({
                        id: `web-topic-${index}`,
                        title: topic.Text.split(' - ')[0] || topic.Text,
                        description: topic.Text,
                        url: topic.FirstURL,
                        source: 'web',
                        score: 0.8,
                    });
                }
            });
        }
        return results;
    }
    catch (error) {
        console.error('Web search error:', error);
        return [];
    }
}
// Main search function
export async function searchAll(query, options = {}) {
    const results = [];
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
    }
    catch (error) {
        console.error('Search error:', error);
        return [];
    }
}
// Search specific source
export async function searchSource(source, query, options = {}) {
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
export async function getSearchSuggestions(query) {
    try {
        // Use DuckDuckGo for suggestions
        const response = await axios.get(`https://duckduckgo.com/ac/?q=${encodeURIComponent(query)}`);
        return response.data.map((item) => item.phrase).slice(0, 5);
    }
    catch (error) {
        console.error('Suggestions error:', error);
        return [];
    }
}
// Search code snippets
export async function searchCodeSnippets(query, language) {
    try {
        const searchQuery = language ? `${query} language:${language}` : query;
        // Search GitHub for code
        const githubResults = await searchGitHub(searchQuery, { limit: 5 });
        // Search Stack Overflow for code examples
        const soResults = await searchStackOverflow(searchQuery, { limit: 5 });
        return [...githubResults, ...soResults];
    }
    catch (error) {
        console.error('Code search error:', error);
        return [];
    }
}
// Search documentation
export async function searchDocumentation(query, framework) {
    try {
        const searchQuery = framework ? `${framework} ${query}` : query;
        // Search MDN for web documentation
        const mdnResults = await searchMDN(searchQuery, { limit: 5 });
        // Search GitHub for documentation repos
        const githubResults = await searchGitHub(`${searchQuery} documentation`, { limit: 3 });
        return [...mdnResults, ...githubResults];
    }
    catch (error) {
        console.error('Documentation search error:', error);
        return [];
    }
}
//# sourceMappingURL=searchService.js.map