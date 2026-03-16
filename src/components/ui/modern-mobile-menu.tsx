"use client";

import React, { useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Briefcase, Calendar, Shield, Settings } from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';

type IconComponentType = React.ElementType<{ className?: string }>;
export interface InteractiveMenuItem {
  label: string;
  icon: IconComponentType;
  href: string;
}

export interface InteractiveMenuProps {
  items?: InteractiveMenuItem[];
  className?: string;
}

const defaultItems: InteractiveMenuItem[] = [
    { label: 'home', icon: Home, href: '/' },
    { label: 'strategy', icon: Briefcase, href: '/strategy' },
    { label: 'period', icon: Calendar, href: '/period' },
    { label: 'security', icon: Shield, href: '/security' },
    { label: 'settings', icon: Settings, href: '/settings' },
];

export const InteractiveMenu: React.FC<InteractiveMenuProps> = ({ items, className }) => {
  const router = useRouter();
  const pathname = usePathname();
  const letterContainerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.022,
        delayChildren: 0.01,
      },
    },
    exit: {
      transition: {
        staggerChildren: 0.014,
        staggerDirection: -1,
      },
    },
  } satisfies Variants;

  const letterVariants = {
    hidden: { y: 8, opacity: 0, scale: 0.94 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: { type: 'spring' as const, stiffness: 420, damping: 24, mass: 0.6 },
    },
    exit: {
      y: -6,
      opacity: 0,
      scale: 0.97,
      transition: { duration: 0.12, ease: 'easeOut' as const },
    },
  } satisfies Variants;

  const finalItems = useMemo(() => {
     const isValid = items && Array.isArray(items) && items.length >= 2;
     if (!isValid) {
        console.warn("InteractiveMenu: 'items' prop is invalid or missing. Using default items.", items);
        return defaultItems;
     }
     return items;
  }, [items]);

  const activeIndex = useMemo(() => {
    if (!pathname) return 0;

    const exactMatch = finalItems.findIndex((item) => pathname === item.href);
    if (exactMatch !== -1) return exactMatch;

    // Prefer the longest matching prefix so '/client/history' does not resolve to '/client' when a more specific route exists.
    let bestIndex = 0;
    let bestLength = -1;

    finalItems.forEach((item, index) => {
      const isPrefixMatch = pathname.startsWith(`${item.href}/`);
      if (isPrefixMatch && item.href.length > bestLength) {
        bestLength = item.href.length;
        bestIndex = index;
      }
    });

    return bestIndex;
  }, [pathname, finalItems]);

  const handleItemClick = (href: string) => {
    router.push(href);
  };

  return (
    <nav
      className={`flex w-full items-center gap-2 px-2 py-2 ${className || ""}`}
      role="navigation"
    >
      {finalItems.map((item, index) => {
        const isActive = index === activeIndex;
        const IconComponent = item.icon;

        return (
          <motion.button
            layout
            key={item.label}
            title={item.label}
            className={`relative flex h-12 min-w-0 items-center justify-center gap-2 rounded-xl px-2.5 outline-none ${
              isActive ? 'flex-[1.45_1_0%]' : 'flex-[1_1_0%]'
            } ${
              isActive ? 'text-blue-600' : 'text-muted-foreground'
            }`}
            onClick={() => handleItemClick(item.href)}
            whileTap={{ scale: 0.98 }}
            transition={{
              layout: { type: 'spring', stiffness: 240, damping: 30, mass: 1 },
              type: 'spring',
              stiffness: 280,
              damping: 26,
            }}
          >
            {isActive && (
              <motion.div
                layoutId="dock-active-pill"
                className="absolute inset-x-1 inset-y-0 rounded-xl bg-blue-600/10"
                transition={{ type: 'spring', stiffness: 250, damping: 30, mass: 1 }}
              />
            )}

            {/* Icon Wrapper */}
            <motion.div
              className="relative z-10 flex items-center justify-center"
              initial={false}
              animate={{
                y: isActive ? -2 : 0,
                scale: isActive ? 1.05 : 1,
              }}
              transition={{
                type: 'spring',
                stiffness: 270,
                damping: 24,
                mass: 0.9,
              }}
            >
              <IconComponent className="w-6 h-6 md:w-7 md:h-7 relative z-10" strokeWidth={isActive ? 2.5 : 2} />
            </motion.div>

            {/* Text Label */}
            <AnimatePresence initial={false}>
              {isActive && (
                <motion.strong
                  className="z-10 ml-1 pr-1 flex max-w-full flex-col items-start justify-center overflow-hidden whitespace-nowrap text-sm font-bold md:text-base"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 250, damping: 28, mass: 1 }}
                >
                  <motion.span
                    className="inline-flex"
                    variants={letterContainerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    {item.label.split('').map((char, charIndex) => (
                      <motion.span
                        key={`${item.label}-char-${charIndex}`}
                        className="inline-block"
                        variants={letterVariants}
                      >
                        {char === ' ' ? '\u00A0' : char}
                      </motion.span>
                    ))}
                  </motion.span>
                  <motion.span
                    className="mt-0.5 h-[2px] rounded-full bg-blue-600"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: '100%', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                  />
                </motion.strong>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </nav>
  );
};
