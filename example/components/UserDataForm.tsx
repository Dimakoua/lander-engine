import React, { useState } from 'react';
import { setState } from 'lander-engine/core';

export default function UserDataForm() {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    company: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Store data in package state
    setState('userData', formData);
    setSubmitted(true);
    
    setTimeout(() => {
      setSubmitted(false);
    }, 3000);
  };

  return (
    <section className="py-24 px-4 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black text-[var(--color-primary)] mb-4">Your Profile</h2>
          <p className="text-lg text-[var(--color-secondary)]">This data will be available on the next page</p>
        </div>

        {submitted && (
          <div className="bg-green-100 border-2 border-green-500 text-green-800 p-4 rounded-xl mb-8 text-center animate-in slide-in-from-top duration-300">
            <p className="text-lg font-bold">✓ Data saved to store!</p>
            <p className="text-sm">Go to the next page to see it displayed</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div>
            <label className="block text-lg font-bold text-[var(--color-primary)] mb-3">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-200 transition-all duration-300 text-lg"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-lg font-bold text-[var(--color-primary)] mb-3">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-200 transition-all duration-300 text-lg"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-lg font-bold text-[var(--color-primary)] mb-3">
              Company
            </label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              required
              className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-200 transition-all duration-300 text-lg"
              placeholder="Your Company"
            />
          </div>

          <button
            type="submit"
            className="w-full px-8 py-5 bg-gradient-to-r from-[var(--color-primary)] to-blue-600 text-white text-lg font-bold rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 transform"
          >
            Save & Continue
          </button>
        </form>

        <p className="text-center text-gray-600 text-sm mt-6">
          💾 Your data is stored in the application state. Navigate to the next page to see it displayed!
        </p>
      </div>
    </section>
  );
}
