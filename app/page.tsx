'use client';

import React, { useState, useEffect } from 'react';

const SEARCH_API = '/api/search';

interface Tool {
  id?: string | number;
  name: string;
  source_url?: string | null;
  tagline?: string;
  category?: string;
  free_tier?: boolean | string | null;
  free_tier_description?: string | null;
  monthly_price?: number | null;
  gotcha?: string | null;
  limitations?: string | null;
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
    if (query.trim()) onNavigate('/search', query.trim());
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
            border: '1px solid #4a4d51',
            borderRadius: '6px',
            padding: '10px 14px',
            outline: 'none',
            background: 'transparent',
            fontSize: '15px',
            color: '#e8eaed',
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
  const [loading, setLoading] = useState(false);
  const [priceFilter, setPriceFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (!initialQuery) { setResults([]); return; }
    setLoading(true);
    fetch(`${SEARCH_API}?q=${encodeURIComponent(initialQuery)}`)
      .then(res => res.json())
      .then(data => { setResults(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [initialQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      setPriceFilter('All');
      setCategoryFilter('All');
      onNavigate('/search', query.trim());
    }
  };

  const categories = ['All', ...Array.from(new Set(results.map(t => t.category).filter(Boolean) as string[]))];

  const hasFree = (tool: Tool) => {
    if (tool.free_tier === true) return true;
    if (typeof tool.free_tier === 'string') {
      const v = tool.free_tier.toLowerCase();
      return v !== 'no' && v !== 'false' && v !== '' && v !== 'null';
    }
    return !!tool.free_tier_description;
  };

  const filtered = results.filter(tool => {
    if (categoryFilter !== 'All' && tool.category !== categoryFilter) return false;
    if (priceFilter === 'Free only') return hasFree(tool) || tool.monthly_price === 0;
    if (priceFilter === 'Under $20/mo') return tool.monthly_price != null && tool.monthly_price <= 20;
    if (priceFilter === 'Under $50/mo') return tool.monthly_price != null && tool.monthly_price <= 50;
    return true;
  });

  return (
    <main style={{ backgroundColor: '#202124', minHeight: '100vh', color: '#e8eaed', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        padding: '16px 20px',
        borderBottom: '1px solid #3c4043',
      }}>
        <span
          onClick={() => onNavigate('/')}
          style={{ color: '#00AEEF', fontSize: '28px', fontWeight: '500', letterSpacing: '-1.5px', cursor: 'pointer', flexShrink: 0 }}
        >
          Surfaced
        </span>
        <div style={{
          flex: 1,
          maxWidth: '580px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 16px',
          backgroundColor: '#303134',
          border: '1px solid #5f6368',
          borderRadius: '24px',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search AI tools..."
            style={{ flex: 1, border: '1px solid #4a4d51', borderRadius: '6px', padding: '6px 10px', outline: 'none', background: 'transparent', fontSize: '15px', color: '#e8eaed' }}
          />
          {query && (
            <span onClick={() => { setQuery(''); onNavigate('/'); }} style={{ cursor: 'pointer', color: '#9aa0a6', fontSize: '18px' }}>×</span>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', padding: '20px 20px 20px 160px', gap: '40px', flexWrap: 'wrap' }}>

        {/* Results */}
        <div style={{ flex: 1, minWidth: '300px', maxWidth: '640px' }}>
          {loading && (
            <p style={{ color: '#9aa0a6', fontSize: '13px' }}>Searching...</p>
          )}
          {!loading && filtered.length > 0 && (
            <p style={{ color: '#9aa0a6', fontSize: '13px', marginBottom: '20px' }}>
              About {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </p>
          )}
          {!loading && filtered.length === 0 && initialQuery && (
            <p style={{ color: '#9aa0a6', fontSize: '14px' }}>No results found for "{initialQuery}"</p>
          )}
          {filtered.map((tool, i) => (
            <div key={tool.id ?? i} style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%',
                  backgroundColor: '#00AEEF22', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '10px', fontWeight: '500', color: '#00AEEF',
                }}>
                  {tool.name?.[0] ?? '?'}
                </div>
                <span style={{ fontSize: '13px', color: '#9aa0a6' }}>{tool.source_url ?? ''}</span>
              </div>
              <div
                onClick={() => tool.source_url && window.open(tool.source_url, '_blank')}
                style={{ fontSize: '18px', color: '#00AEEF', fontWeight: '400', marginBottom: '4px', cursor: 'pointer' }}
              >
                {tool.name}
              </div>
              {tool.tagline && (
                <div style={{ fontSize: '14px', color: '#bdc1c6', lineHeight: '1.6', marginBottom: '6px' }}>
                  {tool.tagline}
                </div>
              )}
              {tool.gotcha && (
                <div style={{ fontSize: '13px', color: '#f28b82', lineHeight: '1.5', marginBottom: '8px' }}>
                  ⚠ {tool.gotcha}
                </div>
              )}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {tool.category && (
                  <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', backgroundColor: '#303134', color: '#9aa0a6', border: '1px solid #3c4043' }}>
                    {tool.category}
                  </span>
                )}
                {hasFree(tool) && (
                  <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', backgroundColor: '#00AEEF22', color: '#00AEEF', border: '1px solid #00AEEF44' }}>
                    Free tier
                  </span>
                )}
                {tool.monthly_price != null && tool.monthly_price > 0 && (
                  <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', backgroundColor: '#303134', color: '#9aa0a6', border: '1px solid #3c4043' }}>
                    From ${tool.monthly_price}/mo
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div style={{ width: '180px', flexShrink: 0, paddingTop: '4px' }}>
          <div style={{ fontSize: '11px', fontWeight: '500', color: '#9aa0a6', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Pricing</div>
          {['All', 'Free only', 'Under $20/mo', 'Under $50/mo'].map(f => (
            <div
              key={f}
              onClick={() => setPriceFilter(f)}
              style={{ fontSize: '13px', color: priceFilter === f ? '#00AEEF' : '#9aa0a6', fontWeight: priceFilter === f ? 500 : 400, padding: '5px 0', cursor: 'pointer' }}
            >
              {f}
            </div>
          ))}
          <div style={{ height: '1px', backgroundColor: '#3c4043', margin: '14px 0' }} />
          <div style={{ fontSize: '11px', fontWeight: '500', color: '#9aa0a6', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Category</div>
          {categories.map(c => (
            <div
              key={c}
              onClick={() => setCategoryFilter(c)}
              style={{ fontSize: '13px', color: categoryFilter === c ? '#00AEEF' : '#9aa0a6', fontWeight: categoryFilter === c ? 500 : 400, padding: '5px 0', cursor: 'pointer' }}
            >
              {c}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
