'use client';

import React, { useState } from 'react';
import { Search, Loader2, AlertCircle, X } from 'lucide-react';

const SEARCH_API = '/api/search';

interface Tool {
  id: string | number;
  name: string;
  slug?: string;
  category: string;
  tagline?: string;
  monthly_price: number | null;
  free_tier: boolean | string | null;
  free_tier_description?: string | null;
  source_url: string | null;
}

export default function App() {
  const [view, setView] = useState<'home' | 'results'>('home');
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Tool[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceFilter, setPriceFilter] = useState('All');

  const categories = ['All', ...Array.from(new Set(results.map((t) => t.category).filter(Boolean)))];

  const handleSearch = async (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const q = overrideQuery ?? query;
    if (!q.trim()) return;
    if (overrideQuery) setQuery(overrideQuery);
    setIsSearching(true);
    setError(null);
    try {
      const res = await fetch(`${SEARCH_API}?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
      setView('results');
      setSelectedCategory('All');
      setPriceFilter('All');
    } catch {
      setError('Could not connect to the search API. Make sure n8n is running.');
      setView('results');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const hasFree = (tool: Tool) => {
    if (tool.free_tier === true) return true;
    if (typeof tool.free_tier === 'string') {
      const v = tool.free_tier.toLowerCase();
      return v !== 'no' && v !== 'false' && v !== '' && v !== 'null';
    }
    return !!tool.free_tier_description;
  };

  const filteredResults = results.filter((tool) => {
    if (selectedCategory !== 'All' && tool.category !== selectedCategory) return false;
    if (priceFilter === 'Free only') return hasFree(tool) || tool.monthly_price === 0;
    if (priceFilter === 'Under $20/mo') return tool.monthly_price !== null && tool.monthly_price <= 20;
    if (priceFilter === 'Under $50/mo') return tool.monthly_price !== null && tool.monthly_price <= 50;
    return true;
  });

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return null;
    if (price === 0) return 'Free';
    return `$${price}/mo`;
  };

  const getDomain = (url: string | null) => {
    if (!url) return null;
    try { return new URL(url).hostname.replace('www.', ''); } catch { return null; }
  };

  if (view === 'home') {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
        <div style={{ minHeight: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 68, fontWeight: 500, letterSpacing: '-3px', marginBottom: 12, lineHeight: 1, color: '#00AEEF' }}>
            Surfaced
          </div>
          <div style={{ fontSize: 14, color: '#71717a', marginBottom: 28, letterSpacing: '0.2px' }}>
            Search for AI tools without the noise
          </div>
          <form
            onSubmit={handleSearch}
            style={{ width: '100%', maxWidth: 560, display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', border: '0.5px solid #3f3f46', borderRadius: 28, background: '#0a0a0a' }}
          >
            <Search size={18} color="#71717a" style={{ flexShrink: 0 }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find an AI tool..."
              autoFocus
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 16, color: 'white' }}
            />
            {isSearching && <Loader2 size={16} color="#71717a" className="animate-spin" style={{ flexShrink: 0 }} />}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#d4d4d8' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '16px 20px', borderBottom: '0.5px solid #27272a' }}>
        <button
          onClick={() => { setView('home'); setQuery(''); setResults([]); setError(null); }}
          style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-1.5px', color: '#00AEEF', flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          Surfaced
        </button>
        <form
          onSubmit={handleSearch}
          style={{ flex: 1, maxWidth: 580, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', border: '0.5px solid #3f3f46', borderRadius: 24, background: '#0a0a0a' }}
        >
          <Search size={16} color="#71717a" style={{ flexShrink: 0 }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 15, color: 'white' }}
          />
          {isSearching
            ? <Loader2 size={16} color="#71717a" className="animate-spin" style={{ flexShrink: 0 }} />
            : query && (
              <button type="button" onClick={() => { setQuery(''); setView('home'); setResults([]); setError(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                <X size={16} color="#71717a" />
              </button>
            )
          }
        </form>
      </header>

      {/* Body */}
      <div style={{ display: 'flex', padding: 20, gap: 40, maxWidth: 900, margin: '0 auto' }}>
        {/* Results */}
        <div style={{ flex: 1 }}>
          {error && (
            <div style={{ marginBottom: 16, padding: '12px 16px', background: '#450a0a22', border: '0.5px solid #7f1d1d', borderRadius: 8, color: '#fca5a5', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <div style={{ fontSize: 13, color: '#71717a', marginBottom: 20 }}>
            About {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
          </div>

          {filteredResults.length === 0 && !error ? (
            <div style={{ fontSize: 14, color: '#71717a' }}>No tools found. Try a different search or clear filters.</div>
          ) : (
            filteredResults.map((tool, i) => {
              const domain = getDomain(tool.source_url);
              const price = formatPrice(tool.monthly_price);
              const free = hasFree(tool);
              return (
                <div key={tool.id} style={{ marginBottom: 24, paddingBottom: 24, borderBottom: i < filteredResults.length - 1 ? '0.5px solid #27272a' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#00AEEF22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 500, color: '#00AEEF', flexShrink: 0 }}>
                      {tool.name[0]?.toUpperCase()}
                    </div>
                    {domain && <span style={{ fontSize: 13, color: '#a1a1aa' }}>{domain}</span>}
                  </div>
                  {tool.source_url ? (
                    <a
                      href={tool.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 18, color: '#00AEEF', fontWeight: 400, marginBottom: 4, display: 'block', textDecoration: 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                    >
                      {tool.name}
                    </a>
                  ) : (
                    <div style={{ fontSize: 18, color: '#00AEEF', fontWeight: 400, marginBottom: 4 }}>{tool.name}</div>
                  )}
                  {tool.tagline && (
                    <div style={{ fontSize: 14, color: '#a1a1aa', lineHeight: 1.6, marginBottom: 8 }}>{tool.tagline}</div>
                  )}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {tool.category && (
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 12, background: '#18181b', color: '#a1a1aa', border: '0.5px solid #27272a' }}>
                        {tool.category}
                      </span>
                    )}
                    {free && (
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 12, background: '#00AEEF11', color: '#00AEEF', border: '0.5px solid #00AEEF44' }}>
                        Free tier
                      </span>
                    )}
                    {price && price !== 'Free' && (
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 12, background: '#18181b', color: '#a1a1aa', border: '0.5px solid #27272a' }}>
                        From {price}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar */}
        <div style={{ width: 180, flexShrink: 0, paddingTop: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Pricing</div>
          {['All', 'Free only', 'Under $20/mo', 'Under $50/mo'].map((opt) => (
            <div
              key={opt}
              onClick={() => setPriceFilter(opt)}
              style={{ fontSize: 13, color: priceFilter === opt ? '#00AEEF' : '#a1a1aa', fontWeight: priceFilter === opt ? 500 : 400, padding: '5px 0', cursor: 'pointer' }}
            >
              {opt}
            </div>
          ))}
          <div style={{ height: '0.5px', background: '#27272a', margin: '14px 0' }} />
          <div style={{ fontSize: 11, fontWeight: 500, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Category</div>
          {categories.map((cat) => (
            <div
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{ fontSize: 13, color: selectedCategory === cat ? '#00AEEF' : '#a1a1aa', fontWeight: selectedCategory === cat ? 500 : 400, padding: '5px 0', cursor: 'pointer' }}
            >
              {cat}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
