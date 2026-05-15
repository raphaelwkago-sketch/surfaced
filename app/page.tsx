'use client';

import React, { useState } from 'react';
import { Search, Loader2, ArrowRight, ExternalLink, SlidersHorizontal, Tag, DollarSign, AlertCircle } from 'lucide-react';

const SEARCH_API = 'https://specked-recycler-uproot.ngrok-free.dev/webhook/Search';
const SCRAPER_API = 'https://specked-recycler-uproot.ngrok-free.dev/webhook/surfaced';

interface Tool {
  id: string | number;
  name: string;
  category: string;
  monthly_price: number | null;
  free_tier: string | null;
  cons: string | null;
  source_url: string | null;
}

export default function App() {
  const [view, setView] = useState<'search' | 'results'>('search');
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

      // Trigger background scraper silently — don't await
      fetch(`${SCRAPER_API}?q=${encodeURIComponent(q)}`).catch(() => {});
    } catch (err) {
      setError('Could not connect to the search API. Make sure ngrok and n8n are running.');
      setView('results');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const filteredResults = results.filter((tool) => {
    if (selectedCategory !== 'All' && tool.category !== selectedCategory) return false;
    if (priceFilter === 'Free') return tool.free_tier?.toLowerCase().startsWith('yes') ?? false;
    if (priceFilter === 'Freemium') return tool.free_tier?.toLowerCase().includes('freemium') ?? false;
    if (priceFilter === 'Paid') {
      const ft = tool.free_tier?.toLowerCase() ?? '';
      return ft === 'no' || ft === 'none' || ft === 'null' || ft === '';
    }
    return true;
  });

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return 'Unknown';
    if (price === 0) return 'Free';
    return `$${price}/mo`;
  };

  if (view === 'search') {
    return (
      <div className="min-h-screen bg-[#0e0e0e] text-zinc-300 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl space-y-8 text-center">

          {/* Logo */}
          <div className="space-y-3">
            <h1 className="text-5xl font-semibold tracking-tight text-white flex items-center justify-center gap-3">
              <Search className="w-10 h-10 text-indigo-400" />
              Surfaced
            </h1>
            <p className="text-zinc-500 text-lg">Discover the best AI tools, without the noise.</p>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-zinc-500" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for an AI tool (e.g., 'image generator')"
              className="w-full bg-[#1a1a1a] border border-zinc-800 rounded-2xl py-4 pl-12 pr-16 text-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent"
              autoFocus
            />
            <button
              type="submit"
              disabled={!query.trim() || isSearching}
              className="absolute inset-y-2 right-2 p-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl transition-colors flex items-center justify-center"
            >
              {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          {/* Quick tags */}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {['Image Generation', 'Coding Assistants', 'Audio', 'Free Tools', 'Video'].map((tag) => (
              <button
                key={tag}
                onClick={() => handleSearch(undefined, tag)}
                className="px-4 py-2 rounded-full bg-[#1a1a1a] border border-zinc-800 text-sm hover:bg-zinc-800 hover:text-white transition-colors text-zinc-400"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-zinc-300">

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-[#0e0e0e]/80 backdrop-blur-md border-b border-zinc-800 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={() => setView('search')}
            className="flex items-center gap-2 text-white font-semibold hover:opacity-80 transition-opacity shrink-0"
          >
            <Search className="w-5 h-5 text-indigo-400" />
            Surfaced
          </button>

          <form onSubmit={handleSearch} className="flex-1 relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-zinc-500" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-zinc-800 rounded-xl py-2 pl-10 pr-10 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="absolute inset-y-1 right-1 px-2 text-zinc-400 hover:text-white rounded-lg transition-colors"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row gap-8">

        {/* Sidebar */}
        <aside className="w-full md:w-56 flex-shrink-0 space-y-6">
          <div>
            <h3 className="flex items-center gap-2 text-white font-medium mb-4 pb-2 border-b border-zinc-800 text-sm">
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </h3>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Category
                </label>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      selectedCategory === cat
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> Pricing
                </label>
                {['All', 'Free', 'Freemium', 'Paid'].map((price) => (
                  <button
                    key={price}
                    onClick={() => setPriceFilter(price)}
                    className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      priceFilter === price
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    {price}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="mb-5 flex items-center justify-between">
            <p className="text-zinc-400 text-sm">
              <span className="text-white font-medium">{filteredResults.length}</span> result{filteredResults.length !== 1 ? 's' : ''} for <span className="text-indigo-400">"{query}"</span>
            </p>
          </div>

          {filteredResults.length === 0 && !error ? (
            <div className="text-center py-20 bg-[#1a1a1a] border border-zinc-800 rounded-2xl">
              <p className="text-zinc-500 mb-4">No tools found. Try a different search or clear filters.</p>
              <button
                onClick={() => { setSelectedCategory('All'); setPriceFilter('All'); }}
                className="text-indigo-400 hover:text-indigo-300 text-sm"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredResults.map((tool) => (
                <div
                  key={tool.id}
                  className="group bg-[#1a1a1a] border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-medium text-white mb-1 group-hover:text-indigo-400 transition-colors">
                          {tool.name}
                        </h3>
                        <span className="inline-block px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-xs border border-zinc-700">
                          {tool.category || 'AI Tool'}
                        </span>
                      </div>
                      {tool.source_url && (
                        <a
                          href={tool.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-500">Monthly Price</span>
                        <span className="text-white font-medium">{formatPrice(tool.monthly_price)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-500">Free Tier</span>
                        <span className="text-white font-medium">{tool.free_tier || 'Unknown'}</span>
                      </div>
                    </div>

                    {tool.cons && (
                      <div className="pt-3 border-t border-zinc-800/50">
                        <div className="flex gap-2 items-start text-sm">
                          <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                          <p className="text-zinc-400 leading-relaxed">
                            <span className="font-medium text-zinc-300">Watch out: </span>{tool.cons}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}