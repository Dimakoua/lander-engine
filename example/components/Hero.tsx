import React, { useState, useEffect } from 'react';
import { dispatcher, watchLoadingAction } from 'lander-engine/core';

interface HeroProps {
  title: string;
  subtitle: string;
  ctaText?: string;
  onCtaClick?: any[];
}

// Local React wrapper - consumers can create their own for their framework
function useLoadingAction(actions: any) {
  // Start with empty state — sessionStorage-backed $state must NOT be read during
  // SSR/hydration or it causes a server/client HTML mismatch.
  // watchLoadingAction calls the callback synchronously on subscription,
  // so actual state is picked up immediately after mount.
  const [state, setState] = useState<{ isLoading: boolean; values: Record<string, any> }>(
    () => ({ isLoading: false, values: {} })
  );
  useEffect(() => {
    // Re-subscribe whenever actions change
    const unsubscribe = watchLoadingAction(actions, setState);
    return unsubscribe;
  }, [JSON.stringify(actions)]); // Serialize actions for dependency tracking

  return state;
}

export default function Hero({ title, subtitle, ctaText, onCtaClick }: HeroProps) {
  const [copied, setCopied] = useState(false);
  const { isLoading, values } = useLoadingAction(onCtaClick);

  const handleCTAClick = () => {
    dispatcher.dispatch(onCtaClick);

    // Show "Copied!" feedback if this is a copy action
    if (onCtaClick && Array.isArray(onCtaClick)) {
      const hasCopyAction = onCtaClick.some(action => action.payload?.operation === 'copyToClipboard');
      if (hasCopyAction) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <section className="relative bg-gradient-to-br from-[var(--color-background)] to-gray-50 px-4 py-32 md:py-48 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-primary)] opacity-5 rounded-full -mr-48 -mt-48"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[var(--color-secondary)] opacity-5 rounded-full -ml-40 -mb-40"></div>
      
      <div className="relative max-w-4xl mx-auto text-center">
        <div className="mb-6 inline-block">
          <span className="text-sm font-semibold text-[var(--color-primary)] bg-blue-50 px-4 py-2 rounded-full">Welcome to Lander Engine</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black text-[var(--color-primary)] mb-8 leading-tight">
          {title}
        </h1>
        
        <p className="text-xl md:text-2xl text-[var(--color-secondary)] max-w-2xl mx-auto mb-12 leading-relaxed font-light">
          {subtitle}
        </p>
        
        <div>
          {ctaText && (<button
            onClick={handleCTAClick}
            disabled={isLoading}
            className={`inline-block px-10 py-5 text-white text-lg font-bold rounded-xl shadow-lg transition-all duration-300 transform ${isLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-[var(--color-primary)] to-blue-600 hover:shadow-2xl hover:scale-105'}`}
            style={{ borderRadius: 'var(--token-buttonRadius)' }}
          >
            {isLoading ? `${ctaText} (loading...)` : ctaText}
          </button>)}

          {isLoading && (
            <div className="mt-4 inline-flex items-center space-x-2 text-blue-700 font-semibold">
              <span className="animate-spin inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              <span>Loading...</span>
            </div>
          )}

          {Object.keys(values).length > 0 && (
            <div className="mt-6 bg-white border border-gray-200 rounded-xl p-4 text-left">
              <h4 className="font-semibold text-[var(--color-primary)] mb-2">State values after action</h4>
              {Object.entries(values).map(([key, value]) => (
                <div key={key} className="mb-2">
                  <p className="text-sm text-gray-500">{key}</p>
                  <pre className="text-xs bg-gray-50 border border-gray-100 rounded p-2 overflow-auto text-gray-800">{JSON.stringify(value, null, 2) || 'undefined'}</pre>
                </div>
              ))}
            </div>
          )}

          {copied && (
            <div className="mt-4 inline-block animate-in slide-in-from-top duration-300 bg-green-100 border-2 border-green-500 text-green-800 px-6 py-3 rounded-lg font-semibold">
              ✓ Copied to clipboard!
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

