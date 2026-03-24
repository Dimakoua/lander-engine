import React, { useState } from 'react';
import { dispatcher, setState } from 'lander-engine/core';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save form data to package state with timestamp
    const messageData = {
      ...formData,
      timestamp: new Date().toISOString()
    };
    setState('sentMessage', messageData);
    
    setSubmitted(true);
    
    // Navigate to confirmation page after 1.5 seconds
    setTimeout(() => {
      dispatcher.dispatch([
        {
          type: 'ui',
          payload: {
            operation: 'goToNextStep',
            params: { next: 'confirmation' }
          }
        }
      ]);
    }, 1500);
  };

  return (
    <section className="py-24 px-4 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-[var(--color-primary)] mb-4">Get In Touch</h2>
          <p className="text-lg text-[var(--color-secondary)]">We'd love to hear from you. Send us a message!</p>
        </div>

        {submitted && (
          <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-500 text-green-800 p-6 rounded-xl mb-8 text-center animate-in slide-in-from-top duration-300">
            <p className="text-lg font-bold">✓ Message sent successfully!</p>
            <p className="text-sm">Redirecting to confirmation page...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-2xl p-10 space-y-8">
          <div>
            <label className="block text-lg font-bold text-[var(--color-primary)] mb-3">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={submitted}
              className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-200 transition-all duration-300 text-lg disabled:bg-gray-100"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-lg font-bold text-[var(--color-primary)] mb-3">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={submitted}
              className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-200 transition-all duration-300 text-lg disabled:bg-gray-100"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-lg font-bold text-[var(--color-primary)] mb-3">
              Message
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              disabled={submitted}
              rows={6}
              className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-200 transition-all duration-300 text-lg resize-none disabled:bg-gray-100"
              placeholder="Tell us what's on your mind..."
            />
          </div>

          <button
            type="submit"
            disabled={submitted}
            className="w-full px-8 py-5 bg-gradient-to-r from-[var(--color-primary)] to-blue-600 text-white text-lg font-bold rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 transform disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {submitted ? '⏳ Sending...' : '📧 Send Message'}
          </button>

          <p className="text-center text-gray-500 text-sm">
            Characters: <span className="font-bold text-[var(--color-primary)]">{Object.values(formData).join('').length}</span>
          </p>
        </form>
      </div>
    </section>
  );
}