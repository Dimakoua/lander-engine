import React, { useState, useEffect } from 'react';
import { getState } from 'lander-engine/core';

interface SentMessage {
  name?: string;
  email?: string;
  message?: string;
  timestamp?: string;
}

export default function MessageConfirmation() {
  const [messageData, setMessageData] = useState<SentMessage | undefined>();

  useEffect(() => {
    const data = getState('sentMessage');
    if (data) {
      setMessageData(data);
    }
  }, []);

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Unknown';
    return new Date(isoString).toLocaleString();
  };

  if (!messageData) {
    return (
      <section className="py-12 px-4 bg-amber-50 rounded-lg border-2 border-amber-200">
        <div className="text-center">
          <p className="text-lg text-amber-800 font-semibold">
            ℹ️ No message data found. Please send a message first.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 px-4 bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-block bg-green-100 rounded-full p-4 mb-6">
            <p className="text-5xl">✓</p>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-[var(--color-primary)] mb-4">Message Confirmed</h2>
          <p className="text-lg text-[var(--color-secondary)]">Thank you! Here's a summary of what you sent.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-12 space-y-8">
          <div>
            <p className="text-sm text-gray-600 font-semibold mb-2">👤 SENDER NAME</p>
            <p className="text-2xl font-bold text-[var(--color-primary)]">{messageData.name || 'Not provided'}</p>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <p className="text-sm text-gray-600 font-semibold mb-2">📧 EMAIL ADDRESS</p>
            <p className="text-2xl font-bold text-[var(--color-primary)] break-all">{messageData.email || 'Not provided'}</p>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <p className="text-sm text-gray-600 font-semibold mb-2">💬 MESSAGE</p>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
              <p className="text-lg text-[var(--color-secondary)] whitespace-pre-wrap leading-relaxed">
                {messageData.message || 'No message provided'}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <p className="text-sm text-gray-600 font-semibold mb-2">🕐 SENT AT</p>
            <p className="text-lg text-[var(--color-primary)] font-mono">{formatDate(messageData.timestamp)}</p>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <p className="text-sm text-gray-600 font-semibold mb-4">📊 MESSAGE STATS</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-[var(--color-primary)]">
                  {messageData.message?.length || 0}
                </p>
                <p className="text-xs text-gray-600 mt-2">Characters</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-[var(--color-primary)]">
                  {messageData.message?.split(' ').filter(w => w.length > 0).length || 0}
                </p>
                <p className="text-xs text-gray-600 mt-2">Words</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-[var(--color-primary)]">
                  {messageData.message?.split('\n').filter(l => l.trim().length > 0).length || 0}
                </p>
                <p className="text-xs text-gray-600 mt-2">Lines</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-green-700 text-sm mt-8 font-semibold">
          ✅ Your message has been received and logged!
        </p>
      </div>
    </section>
  );
}
