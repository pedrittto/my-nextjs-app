'use client';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="bg-black text-white fixed top-0 left-0 right-0 z-50 shadow-lg">
      <div className="w-full flex items-center px-4 py-3">
        <div className="flex items-center">
          <Image
            src="/icons/icon-512.png"
            alt="Pulse logo"
            width={32}
            height={32}
            className="rounded-lg"
            priority
          />
          <span className="text-white text-xl font-bold ml-2" style={{fontFamily: 'inherit'}}>Pulse</span>
        </div>
      </div>
    </header>
  );
}
