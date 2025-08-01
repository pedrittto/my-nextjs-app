'use client';

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

// Native IntersectionObserver-based fade/slide-in
function useReveal(ref: React.RefObject<HTMLElement>) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return visible;
}

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const visible = useReveal(ref);
  return (
    <section
      ref={ref}
      className={
        `${className} transition-all duration-200 ease-out will-change-transform will-change-opacity` +
        (visible
          ? ' opacity-100 translate-y-0'
          : ' opacity-0 translate-y-8 pointer-events-none')
      }
      style={{}}
    >
      {children}
    </section>
  );
}

export default function LandingPage() {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  // Close modal on outside click
  useEffect(() => {
    if (!showForm) return;
    function handleClick(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowForm(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showForm]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          message,
          to: 'pulseaiapp8@gmail.com'
        }),
      });
      setIsSubmitted(true);
      setShowForm(false);
      setEmail('');
      setMessage('');
    } catch (error) {
      setIsSubmitted(true);
      setShowForm(false);
      setEmail('');
      setMessage('');
    }
    setIsSubmitting(false);
    setTimeout(() => setIsSubmitted(false), 3000);
  };

  // Modal fade/zoom with CSS
  const modalBgClass = showForm || isSubmitted
    ? 'opacity-100 pointer-events-auto'
    : 'opacity-0 pointer-events-none';
  const modalContentClass = showForm || isSubmitted
    ? 'scale-100 opacity-100'
    : 'scale-95 opacity-0';

  return (
    <div className="min-h-screen bg-white">
      {/* Success Message */}
      <div
        className={
          `fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 transition-opacity duration-200 ease-out will-change-opacity ` +
          (isSubmitted ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none')
        }
        aria-hidden={!isSubmitted}
      >
        <div
          className={
            'bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl transform transition-all duration-200 ease-out will-change-transform will-change-opacity ' +
            (isSubmitted ? 'scale-100 opacity-100' : 'scale-95 opacity-0')
          }
        >
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h3 className="text-2xl font-bold text-black mb-2">{t('thankYou')}</h3>
          <p className="text-gray-700">{t('thankYouMessage')}</p>
        </div>
      </div>

      {/* Signup Form Modal */}
      <div
        className={
          `fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-40 p-4 transition-opacity duration-200 ease-out will-change-opacity ` +
          (showForm ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none')
        }
        aria-hidden={!showForm}
      >
        <div
          ref={modalRef}
          className={
            'bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-all duration-200 ease-out will-change-transform will-change-opacity ' +
            (showForm ? 'scale-100 opacity-100' : 'scale-95 opacity-0')
          }
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-black">{t('applyAsTester')}</h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600 text-2xl font-light"
              aria-label={t('close')}
            >
              ×
            </button>
          </div>
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t('email')}
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition-colors text-black placeholder-gray-400"
                placeholder={t('emailPlaceholder')}
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                {t('message')}
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={4}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition-colors resize-none text-black placeholder-gray-400"
                placeholder={t('messagePlaceholder')}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-4 px-8 rounded-xl text-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              style={{ willChange: 'transform' }}
            >
              {isSubmitting ? t('sending') : t('send')}
            </button>
          </form>
        </div>
      </div>

      {/* Header Section */}
      <Section className="pt-20 pb-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold mb-6 tracking-tight text-black">{t('landingTitle')}</h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto leading-relaxed text-black">
            {t('landingSubtitle')}
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-4 px-8 rounded-xl text-lg transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
            style={{ willChange: 'transform' }}
          >
            {t('applyButton')}
          </button>
        </div>
      </Section>

      {/* Section 1: Czym jest Pulse? */}
      <Section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <Image
                  src="/landing/1.png"
                  alt="Pulse app screenshot"
                  width={500}
                  height={400}
                  className="rounded-2xl shadow-lg w-full h-auto"
                />
              </div>
              <div className="order-1 md:order-2">
                <h2 className="text-3xl font-bold mb-6 tracking-tight text-black">{t('whatIsPulse')}</h2>
                <p className="text-lg leading-relaxed text-black">
                  {t('whatIsPulseDescription')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Section 2: Co robi tester? */}
      <Section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6 tracking-tight text-black">{t('whatDoesTesterDo')}</h2>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <span className="bg-gray-100 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">1</span>
                    <span className="text-lg text-black">{t('testerStep1')}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-gray-100 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">2</span>
                    <span className="text-lg text-black">{t('testerStep2')}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-gray-100 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">3</span>
                    <span className="text-lg text-black">{t('testerStep3')}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-gray-100 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">4</span>
                    <span className="text-lg text-black">{t('testerStep4')}</span>
                  </li>
                </ul>
              </div>
              <div>
                <Image
                  src="/landing/2.png"
                  alt="Tester workflow"
                  width={500}
                  height={400}
                  className="rounded-2xl shadow-lg w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Section 3: Dlaczego warto? */}
      <Section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <Image
                  src="/landing/3.png"
                  alt="Benefits illustration"
                  width={500}
                  height={400}
                  className="rounded-2xl shadow-lg w-full h-auto"
                />
              </div>
              <div className="order-1 md:order-2">
                <h2 className="text-3xl font-bold mb-6 tracking-tight text-black">{t('whyWorthIt')}</h2>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <span className="bg-green-100 text-green-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">✓</span>
                    <span className="text-lg text-black">{t('benefit1')}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-green-100 text-green-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">✓</span>
                    <span className="text-lg text-black">{t('benefit2')}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-green-100 text-green-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">✓</span>
                    <span className="text-lg text-black">{t('benefit3')}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Final CTA Section */}
      <Section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-8 tracking-tight text-black">{t('wantToBeTester')}</h2>
          <button
            onClick={() => setShowForm(true)}
            className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-4 px-8 rounded-xl text-lg transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
            style={{ willChange: 'transform' }}
          >
            {t('signUp')}
          </button>
        </div>
      </Section>

      {/* Footer */}
      <footer className="bg-white h-20 flex items-center justify-center border-t border-gray-200">
        <p className="text-black text-lg font-medium">
          {t('contact')}
        </p>
      </footer>
    </div>
  );
}
