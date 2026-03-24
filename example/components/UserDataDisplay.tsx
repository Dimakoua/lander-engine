import React, { useState, useEffect } from 'react';
import { getState } from 'lander-engine/core';

interface UserData {
  email?: string;
  name?: string;
  company?: string;
}

export default function UserDataDisplay() {
  const [userData, setUserData] = useState<UserData | undefined>();

  useEffect(() => {
    const data = getState('userData');
    if (data) {
      setUserData(data);
    }
  }, []);

  if (!userData || (!userData.name && !userData.email && !userData.company)) {
    return (
      <section className="py-12 px-4 bg-amber-50 rounded-lg border-2 border-amber-200">
        <div className="text-center">
          <p className="text-lg text-amber-800 font-semibold">
            ℹ️ No user data found. Please fill out the form on the previous step.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-[var(--color-primary)] mb-2">📊 Your Stored Data</h3>
          <p className="text-gray-600">This information was saved from the previous step</p>
        </div>

        <div className="bg-white rounded-lg p-8 space-y-6">
          {userData.name && (
            <div className="border-l-4 border-[var(--color-primary)] pl-4">
              <p className="text-sm text-gray-600 font-semibold">NAME</p>
              <p className="text-2xl font-bold text-[var(--color-primary)]">{userData.name}</p>
            </div>
          )}

          {userData.email && (
            <div className="border-l-4 border-[var(--color-primary)] pl-4">
              <p className="text-sm text-gray-600 font-semibold">EMAIL</p>
              <p className="text-2xl font-bold text-[var(--color-primary)]">{userData.email}</p>
            </div>
          )}

          {userData.company && (
            <div className="border-l-4 border-[var(--color-primary)] pl-4">
              <p className="text-sm text-gray-600 font-semibold">COMPANY</p>
              {typeof userData.company === 'object' ? (
                <pre className="text-left text-base font-semibold text-[var(--color-primary)] bg-gray-50 p-3 rounded-lg overflow-auto">{JSON.stringify(userData.company, null, 2)}</pre>
              ) : (
                <p className="text-2xl font-bold text-[var(--color-primary)]">{userData.company}</p>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-green-700 text-sm mt-6 font-semibold">
          ✓ Data retrieved from application state!
        </p>
      </div>
    </section>
  );
}
