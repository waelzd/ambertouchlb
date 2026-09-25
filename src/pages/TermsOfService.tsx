export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gold-400/10 border border-gold-400/20 rounded-full mb-6">
            <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-gold-400">Legal</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light text-white mb-4">
            Terms of Service
          </h1>
          <div className="w-20 h-0.5 bg-gold-400/50 mx-auto" />
          <p className="text-sm text-neutral-500 mt-6">
            Last updated: <span className="text-gold-400">August 2026</span>
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Acceptance of Terms */}
          <section className="bg-neutral-800/30 backdrop-blur-sm rounded-2xl border border-white/5 p-6 md:p-8 hover:border-white/10 transition-all duration-300">
            <h2 className="font-serif text-xl md:text-2xl font-light text-gold-400 mb-4 flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-500">01</span>
              1. Acceptance of Terms
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              By accessing or using the <span className="text-gold-400 font-medium">AmberTouch</span> website 
              and purchasing our fragrances, you agree to be bound by these Terms of Service and our Privacy 
              Policy. If you do not agree to these terms, please do not use our website. We reserve the right 
              to update these terms at any time, and your continued use of the site constitutes acceptance of 
              any changes.
            </p>
          </section>

          {/* Use of the Website */}
          <section className="bg-neutral-800/30 backdrop-blur-sm rounded-2xl border border-white/5 p-6 md:p-8 hover:border-white/10 transition-all duration-300">
            <h2 className="font-serif text-xl md:text-2xl font-light text-gold-400 mb-4 flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-500">02</span>
              2. Use of the Website
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed mb-4">
              By using our website, you agree that you will not:
            </p>
            <ul className="space-y-3">
              {[
                'Use the site for any unlawful purpose or in violation of any regulations.',
                'Attempt to gain unauthorized access to any part of the website or its related systems.',
                'Transmit any harmful, offensive, or disruptive content.',
                'Copy, reproduce, or distribute any content from the site without our written permission.',
                'Use automated tools to scrape, crawl, or extract data from our website.',
                'Impersonate any person or entity or misrepresent your affiliation with any person or entity.',
                'Remove, obscure, or alter any proprietary rights notices on our content.'
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-400/50 mt-2 group-hover:bg-gold-400 transition-colors duration-300" />
                  <span className="text-sm text-neutral-400">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Account Registration */}
          <section className="bg-neutral-800/30 backdrop-blur-sm rounded-2xl border border-white/5 p-6 md:p-8 hover:border-white/10 transition-all duration-300">
            <h2 className="font-serif text-xl md:text-2xl font-light text-gold-400 mb-4 flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-500">03</span>
              3. Account Registration
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              To access certain features of our website, such as placing orders, saving your favorite fragrances, 
              and creating wishlists, you must create an account. You are responsible for maintaining the 
              confidentiality of your account credentials and for all activities that occur under your account. 
              You agree to notify us immediately of any unauthorized use of your account. We reserve the right 
              to terminate accounts at our discretion.
            </p>
          </section>

          {/* Fragrances & Pricing */}
          <section className="bg-neutral-800/30 backdrop-blur-sm rounded-2xl border border-white/5 p-6 md:p-8 hover:border-white/10 transition-all duration-300">
            <h2 className="font-serif text-xl md:text-2xl font-light text-gold-400 mb-4 flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-500">04</span>
              4. Fragrances & Pricing
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed mb-4">
              We reserve the right to modify or discontinue any fragrance or product at any time without notice. 
              All prices are displayed in US Dollars and are subject to change without notice. We make every 
              effort to display fragrance notes, colors, and packaging accurately, but we cannot guarantee 
              that your device's display will accurately reflect the actual product.
            </p>
            <p className="text-sm text-neutral-400 leading-relaxed mb-4">
              In the event of a pricing error, we reserve the right to cancel any orders placed at the incorrect
              price and will notify you promptly. We are not obligated to fulfill orders at erroneous prices.
            </p>
            <p className="text-sm text-neutral-400 leading-relaxed">
              <span className="font-medium text-gold-400">Please note:</span> Fragrances may vary slightly in 
              scent due to natural ingredients and batch variations. We recommend testing samples before 
              purchasing full-sized bottles.
            </p>
          </section>

          {/* Orders & Payment */}
          <section className="bg-neutral-800/30 backdrop-blur-sm rounded-2xl border border-white/5 p-6 md:p-8 hover:border-white/10 transition-all duration-300">
            <h2 className="font-serif text-xl md:text-2xl font-light text-gold-400 mb-4 flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-500">05</span>
              5. Orders & Payment
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed mb-4">
              By placing an order, you represent that you are authorized to use the payment method provided.
              All orders are subject to acceptance and availability. We reserve the right to refuse or cancel
              any order for any reason, including but not limited to:
            </p>
            <ul className="space-y-3 mb-4">
              {[
                'Product unavailability or stock limitations.',
                'Errors in product or pricing information.',
                'Suspected fraudulent or unauthorized transactions.',
                'Failure to meet eligibility requirements.',
                'Restrictions on international shipping of fragrance products.'
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-400/50 mt-2 group-hover:bg-gold-400 transition-colors duration-300" />
                  <span className="text-sm text-neutral-400">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-neutral-400 leading-relaxed">
              You will receive an order confirmation email upon successful placement of your order. This
              confirmation does not constitute acceptance of your order; acceptance occurs when your order
              is shipped.
            </p>
          </section>

          {/* Shipping & Delivery */}
          <section className="bg-neutral-800/30 backdrop-blur-sm rounded-2xl border border-white/5 p-6 md:p-8 hover:border-white/10 transition-all duration-300">
            <h2 className="font-serif text-xl md:text-2xl font-light text-gold-400 mb-4 flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-500">06</span>
              6. Shipping & Delivery
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed mb-4">
              We offer complimentary shipping on orders over $100. Delivery times are estimates and are not
              guaranteed. We are not responsible for delays caused by customs, postal services, or other
              factors outside our control.
            </p>
            <p className="text-sm text-neutral-400 leading-relaxed mb-4">
              <span className="font-medium text-gold-400">International Shipping:</span> Please be aware 
              that fragrance shipments may be subject to customs duties, taxes, and import restrictions in 
              your country. These fees and any additional charges are the responsibility of the customer. 
              We recommend checking your local regulations before placing an order.
            </p>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Risk of loss and title for products pass to you upon delivery to the carrier. Please ensure 
              your shipping address is accurate — we are not responsible for orders delivered to incorrect 
              addresses provided by the customer.
            </p>
          </section>

          {/* Returns & Refunds */}
          <section className="bg-neutral-800/30 backdrop-blur-sm rounded-2xl border border-white/5 p-6 md:p-8 hover:border-white/10 transition-all duration-300">
            <h2 className="font-serif text-xl md:text-2xl font-light text-gold-400 mb-4 flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-500">07</span>
              7. Returns & Refunds
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed mb-4">
              We want you to love your fragrance. If you are not completely satisfied, we accept returns within 
              14 days of delivery for unopened, unused, and sealed fragrance bottles in their original packaging. 
              To initiate a return, please contact us via WhatsApp or our contact page.
            </p>
            <ul className="space-y-3 mb-4">
              {[
                'Items must be returned in original, unopened, and sealed packaging.',
                'Opened or used fragrance bottles cannot be returned due to hygiene reasons.',
                'Sale items and limited edition fragrances are final sale and cannot be returned or exchanged.',
                'Refunds will be issued to the original payment method within 5–10 business days of receiving the return.',
                'Return shipping costs are the responsibility of the customer unless the item is defective or incorrect.',
                'We reserve the right to refuse returns that do not meet our return conditions.'
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-400/50 mt-2 group-hover:bg-gold-400 transition-colors duration-300" />
                  <span className="text-sm text-neutral-400">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-neutral-400 leading-relaxed">
              <span className="font-medium text-gold-400">Fragrance Samples:</span> We offer samples for 
              many of our fragrances. Sample purchases are final sale and cannot be returned.
            </p>
          </section>

          {/* Intellectual Property */}
          <section className="bg-neutral-800/30 backdrop-blur-sm rounded-2xl border border-white/5 p-6 md:p-8 hover:border-white/10 transition-all duration-300">
            <h2 className="font-serif text-xl md:text-2xl font-light text-gold-400 mb-4 flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-500">08</span>
              8. Intellectual Property
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed mb-4">
              All content on this website — including text, images, logos, graphics, fragrance descriptions, 
              and bottle designs — is the property of AmberTouch and is protected by applicable intellectual 
              property laws. You may not reproduce, distribute, modify, or create derivative works from any 
              content on this site without our express written permission.
            </p>
            <p className="text-sm text-neutral-400 leading-relaxed">
              The AmberTouch name, logo, and all related trademarks are our exclusive property. Any unauthorized 
              use of our intellectual property is strictly prohibited.
            </p>
          </section>

          {/* Fragrance Allergies */}
          <section className="bg-neutral-800/30 backdrop-blur-sm rounded-2xl border border-white/5 p-6 md:p-8 hover:border-white/10 transition-all duration-300">
            <h2 className="font-serif text-xl md:text-2xl font-light text-gold-400 mb-4 flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-500">09</span>
              9. Fragrance Allergies & Sensitivities
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              While we strive to create fragrances that are safe for all users, some individuals may experience 
              allergic reactions or sensitivities to certain fragrance ingredients. We recommend reviewing the 
              ingredient list for each product before purchasing. If you have known allergies or sensitivities, 
              we strongly recommend testing a sample before purchasing a full-sized bottle. AmberTouch is not 
              responsible for any allergic reactions or adverse effects resulting from the use of our products.
            </p>
          </section>

          {/* Disclaimer of Warranties */}
          <section className="bg-neutral-800/30 backdrop-blur-sm rounded-2xl border border-white/5 p-6 md:p-8 hover:border-white/10 transition-all duration-300">
            <h2 className="font-serif text-xl md:text-2xl font-light text-gold-400 mb-4 flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-500">10</span>
              10. Disclaimer of Warranties
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Our website and products are provided "as is" without warranties of any kind, either express
              or implied. We do not warrant that the website will be uninterrupted, error-free, or free of
              viruses or other harmful components. To the fullest extent permitted by law, we disclaim all
              warranties, express or implied, including implied warranties of merchantability and fitness
              for a particular purpose.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section className="bg-neutral-800/30 backdrop-blur-sm rounded-2xl border border-white/5 p-6 md:p-8 hover:border-white/10 transition-all duration-300">
            <h2 className="font-serif text-xl md:text-2xl font-light text-gold-400 mb-4 flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-500">11</span>
              11. Limitation of Liability
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              To the maximum extent permitted by law, AmberTouch shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages arising from your use of our website
              or products, including but not limited to allergic reactions, loss of use, or any other 
              damages, even if we have been advised of the possibility of such damages. Our total liability 
              to you for any claim arising from these terms shall not exceed the amount you paid for the 
              product giving rise to the claim.
            </p>
          </section>

          {/* Governing Law */}
          <section className="bg-neutral-800/30 backdrop-blur-sm rounded-2xl border border-white/5 p-6 md:p-8 hover:border-white/10 transition-all duration-300">
            <h2 className="font-serif text-xl md:text-2xl font-light text-gold-400 mb-4 flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-500">12</span>
              12. Governing Law
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              These Terms of Service shall be governed by and construed in accordance with the laws of
              Lebanon, without regard to its conflict of law provisions. Any disputes arising under these
              terms shall be subject to the exclusive jurisdiction of the courts located in Lebanon.
            </p>
          </section>

          {/* Severability */}
          <section className="bg-neutral-800/30 backdrop-blur-sm rounded-2xl border border-white/5 p-6 md:p-8 hover:border-white/10 transition-all duration-300">
            <h2 className="font-serif text-xl md:text-2xl font-light text-gold-400 mb-4 flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-500">13</span>
              13. Severability
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              If any provision of these Terms of Service is found to be invalid, illegal, or unenforceable, 
              the remaining provisions shall continue in full force and effect. The invalid provision shall 
              be replaced with a valid provision that most closely reflects the intent of the original.
            </p>
          </section>

          {/* Contact Us */}
          <section className="bg-neutral-800/30 backdrop-blur-sm rounded-2xl border border-white/5 p-6 md:p-8 hover:border-white/10 transition-all duration-300">
            <h2 className="font-serif text-xl md:text-2xl font-light text-gold-400 mb-4 flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-500">14</span>
              14. Contact Us
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed mb-6">
              If you have any questions about these Terms of Service, please contact us:
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