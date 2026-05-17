'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Sparkles } from 'lucide-react';

const SEARCH_API = '/api/search';

interface Tool {
  id: string | number;
  name: string;
  category: string;
  tagline?: string;
  monthly_price: number | null;
  free_tier: boolean | string | null;
  free_tier_description?: string | null;
  source_url: string | null;
}

interface Route {
  path: string;
  query: string;
}

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<Route>({ path: '/', query: '' });

  const navigate = (path: string, query = '') => {
    setCurrentRoute({ path, query });
  };

  if (currentRoute.path === '/search') {
    return <SearchResults initialQuery={currentRoute.query} onNavigate={navigate} />;
  }

  return <Home onNavigate={navigate} />;
}

function Home({ onNavigate }: { onNavigate: (path: string, query?: string) => void }) {
  const [query, setQuery] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = () => {
    if (query.trim()) {
      onNavigate('/search', query.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <main style={{
      backgroundColor: '#202124',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: '120px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{
        color: '#00AEEF',
        fontSize: '92px',
        fontWeight: '500',
        letterSpacing: '-4px',
        marginBottom: '8px',
        lineHeight: 1,
      }}>
        Surfaced
      </h1>

      <p style={{
        color: '#9aa0a6',
        fontSize: '14px',
        marginBottom: '28px',
        letterSpacing: '0.2px',
      }}>
        Search for AI tools without the noise
      </p>

      <label
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: '100%',
          maxWidth: '560px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 20px',
          backgroundColor: (isHovered && !isFocused) ? '#3c4043' : '#303134',
          border: '1px solid #5f6368',
          borderRadius: '28px',
          transition: 'background-color 0.2s, box-shadow 0.2s',
          boxShadow: (isHovered && !isFocused) ? '0 1px 6px rgba(0,0,0,0.2)' : 'none',
          cursor: 'text',
        }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Find an AI tool..."
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: '15px',
            color: '#e8eaed',
            padding: '10px 0',
          }}
          autoFocus
        />
      </label>
    </main>
  );
}

function SearchResults({ initialQuery, onNavigate }: { initialQuery: string; onNavigate: (path: string, query?: string) => void }) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${SEARCH_API}?q=${encodeURIComponent(initialQuery)}`);
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setError('Could not connect to the search API.');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchResults();
  }, [initialQuery]);

  const handleSearch = () => {
    if (query.trim() && query.trim() !== initialQuery) {
      onNavigate('/search', query.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const getDomain = (url: string | null) => {
    if (!url) return null;
    try { return new URL(url).hostname.replace('www.', ''); } catch { return null; }
  };

  return (
    <div style={{
      backgroundColor: '#202124',
      minHeight: '100vh',
      color: '#e8eaed',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        padding: '24px',
        borderBottom: '1px solid #3c4043',
        gap: '24px',
        position: 'sticky',
        top: 0,
        backgroundColor: '#202124',
        zIndex: 10
      }}>
        <button
          onClick={() => onNavigate('/')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#9aa0a6',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            borderRadius: '50%',
          }}
          title="Back to Search"
        >
          <ArrowLeft size={20} />
        </button>

        <h1
          onClick={() => onNavigate('/')}
          style={{
            color: '#00AEEF',
            fontSize: '28px',
            fontWeight: '500',
            letterSpacing: '-1px',
            margin: 0,
            cursor: 'pointer'
          }}
        >
          Surfaced
        </h1>

        <div style={{
          flex: 1,
          maxWidth: '690px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 16px',
          backgroundColor: '#303134',
          border: '1px solid transparent',
          borderRadius: '24px',
          boxShadow: '0 1px 6px rgba(32, 33, 36, 0.28)'
        }}>
          <Search size={18} color="#9aa0a6" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Find an AI tool..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '16px',
              color: '#e8eaed',
            }}
          />
        </div>
      </header>

      {/* Results */}
      <main style={{ padding: '24px', maxWidth: '800px', marginLeft: '60px' }}>
        <div style={{ color: '#9aa0a6', fontSize: '14px', marginBottom: '24px' }}>
          {isLoading
            ? `Searching for "${initialQuery}"…`
            : error
              ? error
              : `${results.length} result${results.length !== 1 ? 's' : ''} for "${initialQuery}"`
          }
        </div>

        {!isLoading && !error && results.length === 0 && (
          <div style={{ color: '#9aa0a6', fontSize: '14px' }}>No tools found. Try a different search.</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {results.map((tool) => {
            const domain = getDomain(tool.source_url);
            return (
              <div key={tool.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: '#303134',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Sparkles size={12} color="#00AEEF" />
                  </div>
                  {domain && <span style={{ color: '#bdc1c6', fontSize: '14px' }}>{domain}</span>}
                </div>

                <a
                  href={tool.source_url ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#8ab4f8',
                    fontSize: '20px',
                    textDecoration: 'none',
                    lineHeight: 1.3,
                    display: 'inline-block',
                    marginBottom: '4px'
                  }}
                >
                  <h3 style={{ margin: 0, fontWeight: '400' }}>{tool.name}</h3>
                </a>

                {tool.tagline && (
                  <p style={{
                    color: '#bdc1c6',
                    fontSize: '14px',
                    lineHeight: 1.58,
                    margin: 0,
                    maxWidth: '600px'
                  }}>
                    {tool.tagline}
                  </p>
                )}

                <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {tool.category && (
                    <span style={{
                      backgroundColor: '#303134',
                      color: '#e8eaed',
                      fontSize: '12px',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      border: '1px solid #5f6368'
                    }}>
                      {tool.category}
                    </span>
                  )}
                  {tool.monthly_price === 0 || tool.free_tier === true || !!tool.free_tier_description ? (
                    <span style={{
                      backgroundColor: '#00AEEF11',
                      color: '#00AEEF',
                      fontSize: '12px',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      border: '1px solid #00AEEF44'
                    }}>
                      Free tier
                    </span>
                  ) : null}
                  {tool.monthly_price !== null && tool.monthly_price > 0 && (
                    <span style={{
                      backgroundColor: '#303134',
                      color: '#e8eaed',
                      fontSize: '12px',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      border: '1px solid #5f6368'
                    }}>
                      From ${tool.monthly_price}/mo
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
