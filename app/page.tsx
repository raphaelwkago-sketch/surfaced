'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

const SEARCH_API = '/api/search';

type LimitError = 'anon_limit' | 'free_limit' | null;

interface Profile {
  is_plus: boolean;
  searches_today: number;
  last_search_date: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

interface Tool {
  id?: string | number;
  name: string;
  landing_url?: string | null;
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

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [breakpoint]);

  return isMobile;
}

function GoogleLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function SearchIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2" style={{ flexShrink: 0 }}>
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function LimitModal({
  error,
  onClose,
}: {
  error: LimitError;
  onClose: () => void;
}) {
  if (!error) return null;

  const supabase = createClient();

  const handleSignIn = () => {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const isAnon = error === 'anon_limit';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: '#303134', borderRadius: '20px',
          padding: 'clamp(28px, 6vw, 40px)',
          maxWidth: '400px', width: '100%', border: '1px solid #4a4d51',
          display: 'flex', flexDirection: 'column', gap: '16px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ fontSize: '32px', textAlign: 'center' }}>{isAnon ? '🔍' : '🌙'}</div>
        <h2 style={{ color: '#e8eaed', fontSize: '20px', fontWeight: '600', textAlign: 'center', margin: 0 }}>
          {isAnon ? 'Free searches used up' : "That's all for today"}
        </h2>
        <p style={{ color: '#9aa0a6', fontSize: '14px', textAlign: 'center', margin: 0, lineHeight: '1.6' }}>
          {isAnon
            ? 'Sign in with Google to get 15 free searches per day.'
            : "You've used all 15 of today's searches. Come back tomorrow for 15 more."}
        </p>
        {isAnon && (
          <button
            onClick={handleSignIn}
            style={{
              width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
              backgroundColor: '#00AEEF', color: '#fff', fontSize: '15px',
              fontWeight: '500', cursor: 'pointer', marginTop: '8px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#009fd9')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#00AEEF')}
          >
            Sign in with Google
          </button>
        )}
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', color: '#9aa0a6',
            fontSize: '13px', cursor: 'pointer', textAlign: 'center',
            padding: '8px',
            marginTop: isAnon ? 0 : '8px',
          }}
        >
          {isAnon ? 'Maybe later' : 'Got it'}
        </button>
      </div>
    </div>
  );
}

function TopActions({
  user,
  profile,
  onSignOut,
}: {
  onNavigate: (path: string, query?: string) => void;
  user: User | null;
  profile: Profile | null;
  onSignOut: () => void;
}) {
  const isMobile = useIsMobile();
  const supabase = createClient();

  const handleSignIn = () => {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  if (!user) {
    return (
      <button
        onClick={handleSignIn}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '8px' : '10px',
          padding: isMobile ? '8px 12px' : '8px 16px',
          backgroundColor: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: isMobile ? '13px' : '14px',
          fontWeight: '500',
          color: '#202124',
          whiteSpace: 'nowrap',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f1f3f4')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#fff')}
      >
        <GoogleLogo size={isMobile ? 16 : 18} />
        {isMobile ? 'Sign in' : 'Sign in with Google'}
      </button>
    );
  }

  const FREE_LIMIT = 15;
  const searchesLeft = profile?.is_plus
    ? null
    : Math.max(0, FREE_LIMIT - (profile?.searches_today ?? 0));
  const barPct = profile?.is_plus ? 100 : ((profile?.searches_today ?? 0) / FREE_LIMIT) * 100;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '16px' }}>
      {/* Counter pill only for free users */}
      {!profile?.is_plus && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '10px',
          padding: isMobile ? '4px 10px' : '4px 12px',
          backgroundColor: '#202124',
          border: '1px solid #4a4d51',
          borderRadius: '20px',
          flexShrink: 0,
        }}>
          <div style={{ width: isMobile ? '22px' : '28px', height: '6px', backgroundColor: '#3c4043', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${barPct}%`, height: '100%', backgroundColor: '#00AEEF', borderRadius: '3px', transition: 'width 0.3s ease' }} />
          </div>
          <span style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: '500', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
            <span style={{ color: '#8ab4f8' }}>{searchesLeft}</span>
            <span style={{ color: '#5f6368' }}> / </span>
            <span style={{ color: '#8ab4f8' }}>15</span>
          </span>
        </div>
      )}

      {/* Avatar + sign out */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '10px' }}>
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.full_name ?? 'User'}
            width={32}
            height={32}
            style={{ borderRadius: '50%', border: '1px solid #4a4d51', flexShrink: 0 }}
          />
        ) : (
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            backgroundColor: '#00AEEF22', border: '1px solid #00AEEF44',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#00AEEF', fontSize: '13px', fontWeight: '600', flexShrink: 0,
          }}>
            {user.email?.[0]?.toUpperCase() ?? '?'}
          </div>
        )}
        <button
          onClick={onSignOut}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#9aa0a6',
            fontSize: '13px',
            cursor: 'pointer',
            padding: '0',
            whiteSpace: 'nowrap',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => ((e.target as HTMLElement).style.color = '#e8eaed')}
          onMouseLeave={e => ((e.target as HTMLElement).style.color = '#9aa0a6')}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<Route>({ path: '/', query: '' });
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [limitError, setLimitError] = useState<LimitError>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      if (data.user) fetchProfile(data.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('is_plus, searches_today, last_search_date, full_name, avatar_url')
      .eq('id', userId)
      .single();
    if (data) setProfile(data as Profile);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const navigate = (path: string, query = '') => {
    setCurrentRoute({ path, query });
  };

  const authProps = { user, profile, onSignOut: handleSignOut };

  const limitModal = (
    <LimitModal
      error={limitError}
      onClose={() => setLimitError(null)}
    />
  );

  const handleSearchDone = () => { if (user) fetchProfile(user.id); };

  if (currentRoute.path === '/search') {
    return <>{limitModal}<SearchResults initialQuery={currentRoute.query} onNavigate={navigate} onLimitError={setLimitError} onSearchDone={handleSearchDone} {...authProps} /></>;
  }

  // Pricing/payments disabled for launch — route falls through to Home.

  return <>{limitModal}<Home onNavigate={navigate} {...authProps} /></>;
}

interface AuthProps {
  user: User | null;
  profile: Profile | null;
  onSignOut: () => void;
}

function Home({ onNavigate, user, profile, onSignOut }: { onNavigate: (path: string, query?: string) => void } & AuthProps) {
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
      position: 'relative',
      backgroundColor: '#202124',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 20px 15vh',
      boxSizing: 'border-box',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{ position: 'absolute', top: 'clamp(16px, 3vw, 24px)', right: 'clamp(16px, 4vw, 32px)' }}>
        <TopActions onNavigate={onNavigate} user={user} profile={profile} onSignOut={onSignOut} />
      </div>

      <h1 style={{
        color: '#00AEEF',
        fontSize: 'clamp(52px, 15vw, 92px)',
        fontWeight: '500',
        letterSpacing: '-0.045em',
        margin: '0 0 8px',
        lineHeight: 1,
        textAlign: 'center',
      }}>
        Surfaced
      </h1>

      <p style={{ color: '#9aa0a6', fontSize: '14px', margin: '0 0 28px', letterSpacing: '0.2px', textAlign: 'center' }}>
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
          gap: '14px',
          padding: '14px 20px',
          backgroundColor: (isHovered && !isFocused) ? '#3c4043' : '#303134',
          border: isFocused ? '1px solid #00AEEF66' : '1px solid #5f6368',
          borderRadius: '28px',
          boxSizing: 'border-box',
          transition: 'background-color 0.2s, box-shadow 0.2s, border-color 0.2s',
          boxShadow: (isHovered || isFocused) ? '0 1px 6px rgba(0,0,0,0.25)' : 'none',
          cursor: 'text',
        }}>
        <SearchIcon />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Find an AI tool..."
          style={{
            flex: 1,
            minWidth: 0,
            border: 'none',
            padding: 0,
            outline: 'none',
            background: 'transparent',
            fontSize: '16px',
            color: '#e8eaed',
          }}
          autoFocus
        />
      </label>
    </main>
  );
}

function SearchResults({ initialQuery, onNavigate, onLimitError, onSearchDone, user, profile, onSignOut }: { initialQuery: string; onNavigate: (path: string, query?: string) => void; onLimitError: (e: LimitError) => void; onSearchDone: () => void } & AuthProps) {
  const isMobile = useIsMobile();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [priceFilter, setPriceFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => { setQuery(initialQuery); }, [initialQuery]);

  useEffect(() => {
    if (!initialQuery) { setResults([]); return; }
    setLoading(true);
    fetch(`${SEARCH_API}?q=${encodeURIComponent(initialQuery)}`)
      .then(async res => {
        if (res.status === 401) {
          const data = await res.json();
          onLimitError(data.error as LimitError);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
        setLoading(false);
        onSearchDone();
      })
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
  const priceOptions = ['All', 'Free only', 'Under $20/mo', 'Under $50/mo'];

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

  const searchBar = (
    <div style={{
      flex: isMobile ? undefined : 1,
      width: isMobile ? '100%' : undefined,
      maxWidth: isMobile ? undefined : '580px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 16px',
      backgroundColor: '#303134',
      border: '1px solid #5f6368',
      borderRadius: '24px',
      boxSizing: 'border-box',
    }}>
      <SearchIcon size={16} />
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search AI tools..."
        style={{ flex: 1, minWidth: 0, border: 'none', padding: 0, outline: 'none', background: 'transparent', fontSize: '16px', color: '#e8eaed' }}
      />
      {query && (
        <span
          onClick={() => { setQuery(''); onNavigate('/'); }}
          style={{ cursor: 'pointer', color: '#9aa0a6', fontSize: '18px', lineHeight: 1, padding: '2px 4px', flexShrink: 0 }}
        >
          ×
        </span>
      )}
    </div>
  );

  const filterChip = (label: string, active: boolean, onClick: () => void) => (
    <button
      key={label}
      onClick={onClick}
      style={{
        fontSize: '13px',
        padding: '6px 14px',
        borderRadius: '16px',
        border: active ? '1px solid #00AEEF66' : '1px solid #3c4043',
        backgroundColor: active ? '#00AEEF22' : '#303134',
        color: active ? '#00AEEF' : '#9aa0a6',
        fontWeight: active ? 500 : 400,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {label}
    </button>
  );

  const sidebarOption = (label: string, active: boolean, onClick: () => void) => (
    <div
      key={label}
      onClick={onClick}
      style={{ fontSize: '13px', color: active ? '#00AEEF' : '#9aa0a6', fontWeight: active ? 500 : 400, padding: '5px 0', cursor: 'pointer' }}
    >
      {label}
    </div>
  );

  const sidebarHeading = (text: string) => (
    <div style={{ fontSize: '11px', fontWeight: '500', color: '#9aa0a6', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>{text}</div>
  );

  return (
    <main style={{ backgroundColor: '#202124', minHeight: '100vh', color: '#e8eaed', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header: single row on desktop; on mobile the logo + actions share a row and the search bar drops below */}
      <div style={{
        display: 'flex',
        flexWrap: isMobile ? 'wrap' : 'nowrap',
        alignItems: 'center',
        gap: isMobile ? '12px' : '20px',
        padding: isMobile ? '12px 16px' : '16px 20px',
        borderBottom: '1px solid #3c4043',
      }}>
        <span
          onClick={() => onNavigate('/')}
          style={{ color: '#00AEEF', fontSize: '26px', fontWeight: '500', letterSpacing: '-1.5px', cursor: 'pointer', flexShrink: 0, lineHeight: 1 }}
        >
          Surfaced
        </span>
        {!isMobile && searchBar}
        <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
          <TopActions onNavigate={onNavigate} user={user} profile={profile} onSignOut={onSignOut} />
        </div>
        {isMobile && searchBar}
      </div>

      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        padding: isMobile ? '16px' : '24px clamp(20px, 4vw, 40px) 40px clamp(24px, 11vw, 160px)',
        gap: isMobile ? '16px' : '40px',
      }}>
        {/* Mobile: filters as horizontal chip rows above results */}
        {isMobile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', margin: '0 -16px', padding: '0 16px 4px' }}>
              {priceOptions.map(f => filterChip(f, priceFilter === f, () => setPriceFilter(f)))}
            </div>
            {categories.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', margin: '0 -16px', padding: '0 16px 4px' }}>
                {categories.map(c => filterChip(c, categoryFilter === c, () => setCategoryFilter(c)))}
              </div>
            )}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0, maxWidth: isMobile ? undefined : '640px' }}>
          {loading && <p style={{ color: '#9aa0a6', fontSize: '13px' }}>Searching...</p>}
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
                  flexShrink: 0,
                }}>
                  {tool.name?.[0] ?? '?'}
                </div>
                <span style={{ fontSize: '13px', color: '#9aa0a6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tool.landing_url ?? ''}</span>
              </div>
              <div
                onClick={() => tool.landing_url && window.open(tool.landing_url, '_blank')}
                style={{ fontSize: '18px', color: '#00AEEF', fontWeight: '400', marginBottom: '4px', cursor: 'pointer', overflowWrap: 'break-word' }}
              >
                {tool.name}
              </div>
              {tool.tagline && (
                <div style={{ fontSize: '14px', color: '#bdc1c6', lineHeight: '1.6', marginBottom: '6px' }}>{tool.tagline}</div>
              )}
              {tool.gotcha && (
                <div style={{ fontSize: '13px', color: '#bdc1c6', lineHeight: '1.5', marginBottom: '4px' }}>{tool.gotcha}</div>
              )}
              {tool.limitations && (
                <div style={{ fontSize: '13px', color: '#9aa0a6', lineHeight: '1.5', marginBottom: '4px' }}>{tool.limitations}</div>
              )}
              {tool.free_tier_description && (
                <div style={{ fontSize: '13px', color: '#9aa0a6', lineHeight: '1.5', marginBottom: '8px' }}>{tool.free_tier_description}</div>
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

        {/* Desktop: filter sidebar on the right */}
        {!isMobile && (
          <div style={{ width: '180px', flexShrink: 0, paddingTop: '4px' }}>
            {sidebarHeading('Pricing')}
            {priceOptions.map(f => sidebarOption(f, priceFilter === f, () => setPriceFilter(f)))}
            <div style={{ height: '1px', backgroundColor: '#3c4043', margin: '14px 0' }} />
            {sidebarHeading('Category')}
            {categories.map(c => sidebarOption(c, categoryFilter === c, () => setCategoryFilter(c)))}
          </div>
        )}
      </div>
    </main>
  );
}
