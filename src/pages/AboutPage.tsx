import { motion } from 'framer-motion';
import { Droplet, Sparkles, Award, Heart } from 'lucide-react';

// Supabase storage URL - replace with your actual Supabase URL
const SUPABASE_URL = 'https://zzhwmxgjuesecmjoigfs.supabase.co/storage/v1/object/public';
const BUCKET_NAME = 'images';
const FOLDER_NAME = 'ambertouch';

// Construct the image URL
const storyImageUrl = `${SUPABASE_URL}/${BUCKET_NAME}/${FOLDER_NAME}/OurStoryImg.png`;

const VALUES = [
  {
    icon: Droplet,
    title: 'Crafted Essence',
    text: 'Each fragrance is meticulously blended using the finest ingredients, creating scents that linger and evolve throughout the day.',
  },
  {
    icon: Sparkles,
    title: 'Signature Presence',
    text: 'Designed to become your personal mark — subtle, memorable, and unmistakably you in every room you enter.',
  },
  {
    icon: Award,
    title: 'Premium Quality',
    text: 'We source only the highest quality oils and compounds, ensuring every bottle delivers an experience worthy of luxury.',
  },
  {
    icon: Heart,
    title: 'Made for You',
    text: 'Every scent is crafted with the wearer in mind — because the best fragrance is the one that feels like it was made just for you.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Hero */}
      <section 
        className="relative h-[90vh] overflow-hidden bg-neutral-900"
        style={{
          backgroundImage: `url(${storyImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-center px-4">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <p className="text-gold-400 text-sm font-medium tracking-[0.3em] uppercase mb-4 border border-gold-400/30 px-6 py-2 rounded-full bg-black/30 backdrop-blur-sm inline-block">
              Our Story
            </p>
            <h1 className="font-serif text-4xl md:text-6xl font-light text-white">The Amber Touch Story</h1>
            <p className="text-gold-400/80 text-lg mt-4 max-w-2xl mx-auto font-light tracking-wider">Smell the Story</p>
          </motion.div>
        </div>
      </section>

      {/* Story - Now with bg-neutral-950 */}
      <section className="px-4 py-20 text-center bg-neutral-950">
        <motion.div className="max-w-screen-xl mx-auto" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h1 className="font-serif text-4xl md:text-5xl font-light text-gold-400 py-10">Our Story</h1>
          <p className="font-serif text-2xl md:text-3xl font-light leading-relaxed text-neutral-100 mb-8">
            Amber Touch was created around one simple idea: a scent should be more than something you wear. It should become part of how people remember you.
          </p>
          <p className="text-neutral-300 leading-relaxed mb-6">
            We believe fragrance is a form of presence — subtle, personal, and often remembered long after the moment is gone. That's why we created Amber Touch: to offer scents inspired by fragrances people already love, while creating an experience and identity of our own.
          </p>
          <p className="text-neutral-300 leading-relaxed mb-6">
            For us, it's not just about smelling good. It's about finding a scent that feels like you.
          </p>
          <div className="mt-10">
            <p className="font-serif text-xl md:text-2xl font-light text-gold-400 tracking-wider">
              Amber Touch — <span className="italic">Smell the Story.</span>
            </p>
          </div>
        </motion.div>
      </section>

      {/* Values - Now with bg-neutral-900 */}
      <section className="py-20 bg-neutral-900 px-4">
        <div className="max-w-screen-xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <p className="text-gold-400 text-sm font-medium tracking-[0.3em] uppercase mb-3">What We Believe</p>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-neutral-100">Our Philosophy</h2>
            <div className="w-20 h-0.5 bg-gold-400/50 mx-auto mt-4" />
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {VALUES.map(({ icon: Icon, title, text }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center bg-neutral-950/80 backdrop-blur-sm p-8 rounded-xl border border-neutral-800 hover:border-gold-400/30 hover:shadow-lg hover:shadow-gold-400/5 transition-all duration-300"
              >
                <div className="w-14 h-14 border-2 border-gold-400/50 flex items-center justify-center mx-auto mb-5 rounded-full bg-neutral-800/50 hover:bg-neutral-800 hover:border-gold-400 transition-all duration-300">
                  <Icon size={22} className="text-gold-400" />
                </div>
                <h3 className="font-serif text-lg font-light text-neutral-100 mb-3">{title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}