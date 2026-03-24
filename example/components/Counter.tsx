import React, { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <section className="py-24 px-4 bg-gradient-to-br from-[var(--color-primary)] to-blue-700">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-[var(--color-primary)] mb-4">Interactive Counter</h2>
          <p className="text-lg text-[var(--color-secondary)] mb-12">Watch the counter update in real-time</p>
          
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-4 border-[var(--color-primary)] rounded-2xl p-12 mb-12">
            <p className="text-8xl md:text-9xl font-black text-[var(--color-primary)] tabular-nums">{count}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => setCount(count - 1)}
              className="px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white text-lg font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 transform"
            >
              − Decrease
            </button>
            <button 
              onClick={() => setCount(0)}
              className="px-8 py-4 bg-gray-400 hover:bg-gray-500 text-white text-lg font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 transform"
            >
              ↻ Reset
            </button>
            <button 
              onClick={() => setCount(count + 1)}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white text-lg font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 transform"
            >
              + Increase
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
