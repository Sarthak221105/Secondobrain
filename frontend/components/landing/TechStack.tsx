import { motion } from 'framer-motion';

const STACK = [
  'Next.js',
  'FastAPI',
  'Pinecone',
  'Elasticsearch',
  'Vertex AI',
  'Firebase',
  'Docker',
  'Terraform',
  'Cloud DLP',
  'Cloud KMS',
];

/** Cream-theme marquee with monochrome ink wordmarks. */
export default function TechStack() {
  return (
    <section id="stack" className="relative py-20 bg-cream-50 overflow-hidden border-y border-black/5">
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5 }}
        className="text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-ink-600 font-mono mb-10"
      >
        Built on boring, trusted infrastructure
      </motion.p>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-cream-50 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-cream-50 to-transparent z-10" />

        <div className="flex w-max animate-marquee gap-12 px-12">
          {[...STACK, ...STACK].map((label, i) => (
            <span
              key={`${label}-${i}`}
              className="font-serif text-2xl text-ink-600/50 hover:text-ink-950 transition-colors whitespace-nowrap"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
