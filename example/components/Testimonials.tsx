import React from 'react';

interface Testimonial {
  quote: string;
  author: string;
  role: string;
}

export default function Testimonials({ testimonials = [] }: { testimonials?: Testimonial[] }) {
  const defaultTestimonials: Testimonial[] = [
    {
      quote: 'This tool transformed how we build campaigns.',
      author: 'Jane Doe',
      role: 'Marketing Director'
    },
    {
      quote: 'Incredibly flexible and easy to use.',
      author: 'John Smith',
      role: 'Product Manager'
    },
    {
      quote: 'Best solution for dynamic landing pages.',
      author: 'Alex Chen',
      role: 'Design Lead'
    }
  ];

  const displayTestimonials = testimonials.length > 0 ? testimonials : defaultTestimonials;

  return (
    <section className="py-24 px-4 bg-gradient-to-br from-[var(--color-secondary)] to-slate-900">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">What Our Users Say</h2>
          <p className="text-lg text-gray-300">Join thousands of teams building amazing campaigns</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {displayTestimonials.map((testimonial, idx) => (
            <div 
              key={idx}
              className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group"
            >
              <div className="flex items-center mb-6">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-xl">★</span>
                ))}
              </div>
              
              <p className="text-lg text-gray-700 mb-6 italic font-light">"{testimonial.quote}"</p>
              
              <div className="border-t-2 border-gray-200 pt-6">
                <p className="font-bold text-[var(--color-primary)] text-lg">{testimonial.author}</p>
                <p className="text-[var(--color-secondary)] text-sm">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
