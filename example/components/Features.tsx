import React from 'react';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

export default function Features({ features = [] }: { features?: Feature[] }) {
  const defaultFeatures: Feature[] = [
    {
      icon: '⚡',
      title: 'Fast',
      description: 'Lightning-quick performance and load times'
    },
    {
      icon: '🎨',
      title: 'Beautiful',
      description: 'Stunning designs with theme customization'
    },
    {
      icon: '🔧',
      title: 'Flexible',
      description: 'Easily adaptable to your needs'
    }
  ];

  const displayFeatures = features.length > 0 ? features : defaultFeatures;

  return (
    <section className="py-24 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-black text-[var(--color-primary)] mb-4">Why Choose Us</h2>
          <p className="text-lg text-[var(--color-secondary)] max-w-2xl mx-auto">Experience the power of data-driven, configuration-based landing pages</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {displayFeatures.map((feature, idx) => (
            <div 
              key={idx}
              className="group p-8 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 rounded-2xl hover:border-[var(--color-primary)] hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
            >
              <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
              <h3 className="text-2xl font-bold text-[var(--color-primary)] mb-3">{feature.title}</h3>
              <p className="text-[var(--color-secondary)] leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
