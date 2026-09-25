export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gold-400/10 border border-gold-400/20 rounded-full mb-6">
            <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-gold-400">Legal</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light text-white mb-4">
            Privacy Policy
          </h1>
          <div className="w-20 h-0.5 bg-gold-400/50 mx-auto" />
          <p className="text-sm text-neutral-500 mt-6">
            Last updated: <span className="text-gold-400">June 2025</span>
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Introduction */}
          <section className="bg-neutral-800/30 backdrop-blur-sm rounded-2xl border border-white/5 p-6 md:p-8 hover:border-white/10 transition-all duration-300">
            <h2 className="font-serif text-xl md:text-2xl font-light text-gold-400 mb-4 flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-500">01</span>
              1. Introduction
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Welcome to <span className="text-gold-400 font-medium">AmberTouch</span> ("we", "our", or "us"). 
              We are a luxury perfume boutique committed to protecting your personal information and your right 
              to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your 
              information when you visit our website and make purchases from our fragrance collection. 
              Please read this policy carefully. If you disagree with its terms, please discontinue use of 
              our site.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="bg-neutral-800/30 backdrop-blur-sm rounded-2xl border border-white/5 p-6 md:p-8 hover:border-white/10 transition-all duration-300">
            <h2 className="font-serif text-xl md:text-2xl font-light text-gold-400 mb-4 flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-500">02</span>
              2. Information We Collect
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed mb-4">
              We collect information you provide directly to us, including:
            </p>
            <ul className="space-y-3">
              {[
                { label: 'Account Information', desc: 'Your name, email address, and password when you create an account.' },
                { label: 'Order Information', desc: 'Billing address, shipping address, phone number, and payment details when you place an order.' },
                { label: 'Fragrance Preferences', desc: 'Your preferred scent families (floral, woody, oriental, fresh, amber, etc.) and fragrance notes you\'ve shown interest in.' },
                { label: 'Profile Information', desc: 'Wishlist items, fragrance reviews, and other information you add to your account.' },
                { label: 'Communications', desc: 'Messages you send us via contact forms, email, or WhatsApp.' },
                { label: 'Usage Data', desc: 'Pages visited, time spent on pages, products viewed, and other browsing behavior on our site.' },
                { label: 'Quiz Responses', desc: 'Answers provided in our fragrance finder quiz to help us recommend the perfect scent for you.' }
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-400/50 mt-2 group-hover:bg-gold-400 transition-colors duration-300" />
                  <span className="text-sm text-neutral-300">
                    <span className="font-medium text-gold-400">{item.label}:</span>{' '}
                    <span className="text-neutral-400">{item.desc}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section className="bg-neutral-800/30 backdrop-blur-sm rounded-2xl border border-white/5 p-6 md:p-8 hover:border-white/10 transition-all duration-300">
            <h2 className="font-serif text-xl md:text-2xl font-light text-gold-400 mb-4 flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-500">03</span>
              3. How We Use Your Information
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="space-y-3">
              {[
                'Process and fulfill your perfume orders, including order confirmations and shipping updates.',
                'Create and manage your account for a personalized shopping experience.',
                'Recommend fragrances based on your preferences and purchase history.',
                'Respond to your inquiries and provide customer support.',
                'Send you promotional communications about new perfume launches, exclusive offers, and seasonal collections, if you have opted in.',
                'Improve our website, product selection, and services.',
                'Detect and prevent fraudulent transactions and other illegal activities.',
                'Comply with legal obligations.',
                'Conduct market research and analyze customer preferences to curate our fragrance collection.'
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-400/50 mt-2 group-hover:bg-gold-400 transition-colors duration-300" />
                  <span className="text-sm text-neutral-400">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Sharing Your Information */}
          <section className="bg-neutral-800/30 backdrop-blur-sm rounded-2xl border border-white/5 p-6 md:p-8 hover:border-white/10 transition-all duration-300">
            <h2 className="font-serif text-xl md:text-2xl font-light text-gold-400 mb-4 flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-500">04</span>
              4. Sharing Your Information
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed mb-4">
              We do not sell, trade, or rent your personal information to third parties. We may share your
              information only in the following circumstances:
            </p>
            <ul className="space-y-3">
              {[
                { label: 'Service Providers', desc: 'With trusted third-party vendors who assist us in operating our website, processing payments, and delivering perfume orders (e.g. payment processors, shipping carriers).' },
                { label: 'Legal Requirements', desc: 'When required by law, court order, or governmental authority.' },
                { label: 'Business Transfers', desc: 'In connection with a merger, acquisition, or sale of all or part of our business.' },
                { label: 'Protection of Rights', desc: 'To protect the rights, property, or safety of AmberTouch, our customers, or others.' }
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-400/50 mt-2 group-hover:bg-gold-400 transition-colors duration-300" />
                  <span className="text-sm text-neutral-300">
                    <span className="font-medium text-gold-400">{item.label}:</span>{' '}
                    <span className="text-neutral-400">{item.desc}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Cookies & Tracking */}
          <section className="bg-neutral-800/30 backdrop-blur-sm rounded-2xl border border-white/5 p-6 md:p-8 hover:border-white/10 transition-all duration-300">
            <h2 className="font-serif text-xl md:text-2xl font-light text-gold-400 mb-4 flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-500">05</span>
              5. Cookies & Tracking
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              We use cookies and similar tracking technologies to enhance your browsing experience, remember your
              fragrance preferences, and analyze site traffic. Cookies are small data files stored on your device. 
              You may instruct your browser to refuse all cookies or to indicate when a cookie is being sent. 
              However, some features of our site, such as saving your favorite fragrances, may not function 
              properly without cookies.
            </p>
          </section>

          {/* Data Security */}
          <section className="bg-neutral-800/30 backdrop-blur-sm rounded-2xl border border-white/5 p-6 md:p-8 hover:border-white/10 transition-all duration-300">
            <h2 className="font-serif text-xl md:text-2xl font-light text-gold-400 mb-4 flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-500">06</span>
              6. Data Security
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              We implement industry-standard security measures to protect your personal information, including
              SSL encryption for data transmission and secure storage through our infrastructure provider (Supabase).
              Your payment information is processed through secure, PCI-compliant payment gateways. However, no 
              method of transmission over the internet or electronic storage is 100% secure. While we strive to 
              use commercially acceptable means to protect your information, we cannot guarantee its absolute 
              security.
            </p>
          </section>

          {/* Data Retention */}
          <section className="bg-neutral-800/30 backdrop-blur-sm rounded-2xl border border-white/5 p-6 md:p-8 hover:border-white/10 transition-all duration-300">
            <h2 className="font-serif text-xl md:text-2xl font-light text-gold-400 mb-4 flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-500">07</span>
              7. Data Retention
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide
              you with our perfume services. We will also retain and use your information as necessary to comply 
              with our legal obligations, resolve disputes, and enforce our agreements. You may request deletion 
              of your account and associated data at any time by contacting us.
            </p>
          </section>

          {/* Your Rights */}
          <section className="bg-neutral-800/30 backdrop-blur-sm rounded-2xl border border-white/5 p-6 md:p-8 hover:border-white/10 transition-all duration-300">
            <h2 className="font-serif text-xl md:text-2xl font-light text-gold-400 mb-4 flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-500">08</span>
              8. Your Rights
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed mb-4">
              Depending on your location, you may have the following rights regarding your personal data:
            </p>
            <ul className="space-y-3">
              {[
                { label: 'Access', desc: 'Request a copy of the personal data we hold about you.' },
                { label: 'Correction', desc: 'Request correction of inaccurate or incomplete data.' },
                { label: 'Deletion', desc: 'Request deletion of your personal data.' },
                { label: 'Opt-Out', desc: 'Unsubscribe from marketing emails at any time using the unsubscribe link in our emails.' },
                { label: 'Portability', desc: 'Request a copy of your data in a structured, machine-readable format.' },
                { label: 'Restriction', desc: 'Request restriction of processing your personal data.' }
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-400/50 mt-2 group-hover:bg-gold-400 transition-colors duration-300" />
                  <span className="text-sm text-neutral-300">
                    <span className="font-medium text-gold-400">{item.label}:</span>{' '}
                    <span className="text-neutral-400">{item.desc}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-neutral-400 mt-4">
              To exercise any of these rights, please contact us at the details below.
            </p>
          </section>

          {/* Fragrance Samples */}
          <section className="bg-neutral-800/30 backdrop-blur-sm rounded-2xl border border-white/5 p-6 md:p-8 hover:border-white/10 transition-all duration-300">
            <h2 className="font-serif text-xl md:text-2xl font-light text-gold-400 mb-4 flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-500">09</span>
              9. Fragrance Samples & Testing
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              If you participate in our fragrance testing program or request perfume samples, we may collect 
              additional information about your preferences and feedback. This information helps us curate 
              our collection and ensure we offer scents that resonate with our customers. Your feedback is 
              valued and may be used anonymously for product development purposes.
            </p>
          </section>

          {/* Third-Party Links */}
          <section className="bg-neutral-800/30 backdrop-blur-sm rounded-2xl border border-white/5 p-6 md:p-8 hover:border-white/10 transition-all duration-300">
            <h2 className="font-serif text-xl md:text-2xl font-light text-gold-400 mb-4 flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-500">10</span>
              10. Third-Party Links
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Our website may contain links to third-party websites, including perfume blogs, fragrance 
              review sites, and social media platforms. We are not responsible for the privacy practices 
              or content of those sites. We encourage you to review the privacy policies of any third-party 
              sites you visit.
            </p>
          </section>

          {/* Children's Privacy */}
          <section className="bg-neutral-800/30 backdrop-blur-sm rounded-2xl border border-white/5 p-6 md:p-8 hover:border-white/10 transition-all duration-300">
            <h2 className="font-serif text-xl md:text-2xl font-light text-gold-400 mb-4 flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-500">11</span>
              11. Children's Privacy
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Our website is not directed to children under the age of 13. We do not knowingly collect personal
              information from children. If you believe we have inadvertently collected information from a child,
              please contact us immediately and we will take steps to delete such information.
            </p>
          </section>

          {/* International Transfers */}
          <section className="bg-neutral-800/30 backdrop-blur-sm rounded-2xl border border-white/5 p-6 md:p-8 hover:border-white/10 transition-all duration-300">
            <h2 className="font-serif text-xl md:text-2xl font-light text-gold-400 mb-4 flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-500">12</span>
              12. International Transfers
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              As a perfume boutique serving customers worldwide, your information may be transferred to and 
              processed in countries other than your own. We ensure that appropriate safeguards are in place 
              to protect your data in accordance with applicable privacy laws.
            </p>
          </section>

          {/* Changes to This Policy */}
          <section className="bg-neutral-800/30 backdrop-blur-sm rounded-2xl border border-white/5 p-6 md:p-8 hover:border-white/10 transition-all duration-300">
            <h2 className="font-serif text-xl md:text-2xl font-light text-gold-400 mb-4 flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-500">13</span>
              13. Changes to This Policy
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes in our practices or 
              legal requirements. We will notify you of any significant changes by posting the new policy 
              on this page with an updated date. Your continued use of our website after any changes 
              constitutes your acceptance of the updated policy.
            </p>
          </section>

          {/* Contact Us */}
          <section className="bg-neutral-800/30 backdrop-blur-sm rounded-2xl border border-white/5 p-6 md:p-8 hover:border-white/10 transition-all duration-300">
            <h2 className="font-serif text-xl md:text-2xl font-light text-gold-400 mb-4 flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-500">14</span>
              14. Contact Us
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed mb-6">
              If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data,
              please contact us:
            </p>
            <div className="bg-neutral-900/50 border border-white/10 rounded-xl p-6 space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Store</span>
                <span className="text-sm text-neutral-300">AmberTouch Perfumes</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">WhatsApp</span>
                <a href="https://wa.me/96170702697" className="text-sm text-gold-400 hover:text-gold-300 transition-colors">
                  +961 70 702 697
                </a>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Email</span>
                <a href="mailto:ambertouch2026@gmail.com" className="text-sm text-gold-400 hover:text-gold-300 transition-colors">
                  ambertouch2026@gmail.com
                </a>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Website</span>
                <span className="text-sm text-neutral-300">www.ambertouchlb.com</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}