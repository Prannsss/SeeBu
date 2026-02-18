import Link from "next/link";
import Image from 'next/image';

export function Footer() {
  return (
    <footer id="contact" className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 pt-16 pb-8 transition-colors">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 text-text-main dark:text-white mb-6">
              <Image 
                src="/assets/logo.svg" 
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
            <div className="flex gap-4">
              <Link className="text-gray-400 hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">public</span></Link>
              <Link className="text-gray-400 hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">mail</span></Link>
              <Link className="text-gray-400 hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">call</span></Link>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-text-main dark:text-white mb-4">Platform</h4>
            <ul className="space-y-3 text-sm text-text-muted dark:text-gray-400">
              <li><Link className="hover:text-primary transition-colors" href="#">About Us</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="#">Services</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="#">Download App</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="#">For Government</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-text-main dark:text-white mb-4">Support</h4>
            <ul className="space-y-3 text-sm text-text-muted dark:text-gray-400">
              <li><Link className="hover:text-primary transition-colors" href="#">Help Center</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/client/report">Report an Issue</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="#">Contact Support</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="#">FAQs</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-text-main dark:text-white mb-4">Legal</h4>
            <ul className="space-y-3 text-sm text-text-muted dark:text-gray-400">
              <li><Link className="hover:text-primary transition-colors" href="#">Privacy Policy</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="#">Terms of Service</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="#">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-100 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} SeeBu. All rights reserved.</p>
          <p>Developed by France Laurence Velarde</p>
        </div>
      </div>
    </footer>
  );
}
