import Link from "next/link";
import Image from 'next/image';
import { InstallAppLink } from "@/components/InstallAppLink";

export function Footer() {
  return (
    <footer id="contact" className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 pt-16 pb-8 transition-colors">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12 md:gap-12 mb-12">
          <div className="col-span-2 md:col-span-1 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-2 text-text-main dark:text-white mb-6">
              <Image 
                src="/assets/logo-128.png" 
                alt="SeeBu Logo" 
                width={32} 
                height={32}
                className="w-8 h-8"
              />
              <span className="font-bold text-lg">SeeBu</span>
            </div>
            <p className="text-text-muted dark:text-gray-400 text-sm mb-6">
              Bridging the gap between the government and the people of Cebu City through technology.
            </p>
            <div className="flex gap-4 justify-center md:justify-start">
              <a className="text-slate-600 hover:text-primary transition-colors" href="mailto:vfrancelaurence@gmail.com" aria-label="Email us at vfrancelaurence@gmail.com"><span className="material-symbols-outlined" aria-hidden="true">mail</span></a>
            </div>
          </div>
          <div className="flex flex-col items-center md:items-start">
            <h4 className="font-bold text-text-main dark:text-white mb-4">Platform</h4>
            <ul className="space-y-3 text-sm text-text-muted dark:text-gray-400 flex flex-col items-center md:items-start">
              <li><Link className="hover:text-primary transition-colors" href="/about">About Us</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/services">Services</Link></li>
              <InstallAppLink className="hover:text-primary transition-colors" />
            </ul>
          </div>
          <div className="flex flex-col items-center md:items-start">
            <h4 className="font-bold text-text-main dark:text-white mb-4">Support</h4>
            <ul className="space-y-3 text-sm text-text-muted dark:text-gray-400 flex flex-col items-center md:items-start">
              <li><a className="hover:text-primary transition-colors" href="https://github.com/Prannsss/SeeBu/issues/new" target="_blank" rel="noopener noreferrer">Report an Issue</a></li>
              <li><Link className="hover:text-primary transition-colors" href="/faq">FAQs</Link></li>
            </ul>
          </div>
          <div className="col-span-2 md:col-span-1 flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="font-bold text-text-main dark:text-white mb-4">Legal</h4>
            <ul className="space-y-3 text-sm text-text-muted dark:text-gray-400 flex flex-col items-center md:items-start">
              <li><Link className="hover:text-primary transition-colors" href="/privacy">Privacy Policy</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/terms">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-100 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-600">
          <p>© {new Date().getFullYear()} SeeBu. All rights reserved.</p>
          <p>Developed by France Laurence Velarde</p>
        </div>
      </div>
    </footer>
  );
}
