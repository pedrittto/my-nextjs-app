export type Language = 'pl' | 'en';

export interface Translations {
  topNews: string;
  noArticlesAvailable: string;
  noArticlesFound: string;
  loading: string;
  pulse: string;
  credibility: string;
  readMore: string;
  readLess: string;
  publishedAt: string;
  source: string;
  noDate: string;
  articleImage: string;
  pulseLogo: string;
  // Error messages
  error: string;
  emailAndMessageRequired: string;
  resendApiKeyNotConfigured: string;
  failedToSendEmail: string;
  missingImageUrl: string;
  failedToProxyImage: string;
  // Landing page translations
  landingTitle: string;
  landingSubtitle: string;
  applyButton: string;
  whatIsPulse: string;
  whatIsPulseDescription: string;
  whatDoesTesterDo: string;
  testerStep1: string;
  testerStep2: string;
  testerStep3: string;
  testerStep4: string;
  whyWorthIt: string;
  benefit1: string;
  benefit2: string;
  benefit3: string;
  wantToBeTester: string;
  signUp: string;
  contact: string;
  // Form translations
  applyAsTester: string;
  close: string;
  email: string;
  message: string;
  emailPlaceholder: string;
  messagePlaceholder: string;
  send: string;
  sending: string;
  thankYou: string;
  thankYouMessage: string;
}

export const translations: Record<Language, Translations> = {
  pl: {
    topNews: 'Wiadomości dnia',
    noArticlesAvailable: 'Brak dostępnych artykułów',
    noArticlesFound: 'Nie znaleziono artykułów',
    loading: 'Ładowanie...',
    pulse: 'Pulse',
    credibility: 'Wiarygodność',
    readMore: 'Czytaj więcej',
    readLess: 'Czytaj mniej',
    publishedAt: 'Opublikowano',
    source: 'Źródło',
    noDate: 'Brak daty',
    articleImage: 'Zdjęcie artykułu',
    pulseLogo: 'Logo Pulse',
    // Error messages
    error: 'Błąd',
    emailAndMessageRequired: 'Email i wiadomość są wymagane',
    resendApiKeyNotConfigured: 'Klucz API Resend nie jest skonfigurowany. Ustaw RESEND_API_KEY w pliku .env.local.',
    failedToSendEmail: 'Nie udało się wysłać emaila',
    missingImageUrl: 'Brak URL obrazka',
    failedToProxyImage: 'Nie udało się proxy obrazka',
    // Landing page translations
    landingTitle: 'Pulse',
    landingSubtitle: 'Dołącz do testerów Pulse – zwięzłych, codziennych newsów z paskiem wiarygodności',
    applyButton: 'Wyślij zgłoszenie',
    whatIsPulse: 'Czym jest Pulse?',
    whatIsPulseDescription: 'Pulse to eksperymentalna aplikacja, która codziennie generuje zwięzłe i aktualne wiadomości z oceną wiarygodności. Testujemy wersję MVP – chcemy sprawdzić, czy działa, czy jest przydatna i jak ją ulepszyć. Twoja opinia naprawdę pomoże.',
    whatDoesTesterDo: 'Co robi tester?',
    testerStep1: 'Przez 5 dni codziennie sprawdza newsy.',
    testerStep2: 'Czyta treść, sprawdza pasek wiarygodności – ocenia, czy to działa.',
    testerStep3: 'Wypełnia anonimową ankietę.',
    testerStep4: 'Bierze udział w dokładnym wywiadzie (dla chętnych).',
    whyWorthIt: 'Dlaczego warto?',
    benefit1: 'Otrzymasz darmowy dostęp do wersji Pro, gdy aplikacja ruszy.',
    benefit2: 'Realny wpływ na kształt aplikacji – twoje sugestie prawdopodobnie trafią do kodu.',
    benefit3: 'Będziesz mógł uczestniczyć w przyszłych testach.',
    wantToBeTester: 'Chcesz zostać testerem?',
    signUp: 'Zgłoś się',
    contact: 'Kontakt: pulseaiapp8@gmail.com',
    // Form translations
    applyAsTester: 'Zgłoś się jako tester',
    close: 'Zamknij',
    email: 'Email *',
    message: 'Wiadomość *',
    emailPlaceholder: 'twoj@email.com',
    messagePlaceholder: 'Cześć, chciałbym zostać testerem',
    send: 'Wyślij',
    sending: 'Wysyłanie...',
    thankYou: 'Dziękujemy za zgłoszenie!',
    thankYouMessage: 'Skontaktujemy się z Tobą wkrótce.'
  },
  en: {
    topNews: 'Top news',
    noArticlesAvailable: 'No articles available',
    noArticlesFound: 'No articles found',
    loading: 'Loading...',
    pulse: 'Pulse',
    credibility: 'Credibility',
    readMore: 'Read more',
    readLess: 'Read less',
    publishedAt: 'Published at',
    source: 'Source',
    noDate: 'No date',
    articleImage: 'Article image',
    pulseLogo: 'Pulse logo',
    // Error messages
    error: 'Error',
    emailAndMessageRequired: 'Email and message are required',
    resendApiKeyNotConfigured: 'Resend API key not configured. Please set RESEND_API_KEY in your .env.local file.',
    failedToSendEmail: 'Failed to send email',
    missingImageUrl: 'Missing image URL',
    failedToProxyImage: 'Failed to proxy image',
    // Landing page translations
    landingTitle: 'Pulse',
    landingSubtitle: 'Join Pulse testers – concise, daily news with credibility scoring',
    applyButton: 'Send application',
    whatIsPulse: 'What is Pulse?',
    whatIsPulseDescription: 'Pulse is an experimental app that generates concise and current news with credibility scoring daily. We are testing the MVP version – we want to check if it works, if it is useful and how to improve it. Your opinion will really help.',
    whatDoesTesterDo: 'What does a tester do?',
    testerStep1: 'For 5 days, checks the news daily.',
    testerStep2: 'Reads content, checks the credibility bar – evaluates if it works.',
    testerStep3: 'Fills out an anonymous survey.',
    testerStep4: 'Takes part in a detailed interview (for those willing).',
    whyWorthIt: 'Why is it worth it?',
    benefit1: 'You will receive free access to the Pro version when the app launches.',
    benefit2: 'Real influence on the shape of the app – your suggestions will likely make it into the code.',
    benefit3: 'You will be able to participate in future tests.',
    wantToBeTester: 'Want to be a tester?',
    signUp: 'Sign up',
    contact: 'Contact: pulseaiapp8@gmail.com',
    // Form translations
    applyAsTester: 'Apply as a tester',
    close: 'Close',
    email: 'Email *',
    message: 'Message *',
    emailPlaceholder: 'your@email.com',
    messagePlaceholder: 'Hi, I would like to be a tester',
    send: 'Send',
    sending: 'Sending...',
    thankYou: 'Thank you for your application!',
    thankYouMessage: 'We will contact you soon.'
  }
}; 