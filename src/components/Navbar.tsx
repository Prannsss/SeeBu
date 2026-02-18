"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface NavItem {
  label: string;
  href: string;
}

interface NavbarProps {
  items?: NavItem[];
}

export function Navbar({ items = [] }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const defaultItems: NavItem[] = [
    { label: 'About', href: '#about' },
    { label: 'Process', href: '#process' },
    { label: 'Features', href: '#features' },
    { label: 'Contact', href: '#contact' }
  ];

  const navItems = items.length > 0 ? items : defaultItems;

  const scrollToTarget = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        const offset = 100;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      } else if (href === '#top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      setIsOpen(false);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
        <nav className="max-w-4xl mx-auto bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-full px-6 py-3 shadow-lg border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link 
              href="#top" 
              onClick={(e) => scrollToTarget(e, '#top')}
              className="flex items-center gap-2 group"
            >
              <Image 
                src="/assets/logo.svg" 
                alt="SeeBu Logo" 
                width={40} 
                height={40}
                className="w-10 h-10"
              />
              <span className="text-xl font-black text-gray-900 dark:text-white tracking-tight hidden sm:block">
                SeeBu
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <ul className="hidden md:flex items-center gap-1">
              {navItems.map((item, index) => (
                <li key={index}>
                  <a
                    href={item.href}
                    onClick={(e) => scrollToTarget(e, item.href)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              <Link 
                href="/auth/login"
                className="px-5 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Login
              </Link>
              <ThemeToggle />
            </div>

            {/* Mobile: Theme Toggle and Burger Menu */}
            <div className="flex md:hidden items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
                aria-label="Toggle menu"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="absolute top-24 left-4 right-4 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 p-6">
            {/* Navigation Items */}
            <ul className="space-y-2 mb-6">
              {navItems.map((item, index) => (
                <li key={index}>
                  <a
                    href={item.href}
                    onClick={(e) => scrollToTarget(e, item.href)}
                    className="block px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>

            {/* Login Button */}
            <Link 
              href="/auth/login"
              className="block w-full px-5 py-3 text-center text-base font-medium bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Login
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
