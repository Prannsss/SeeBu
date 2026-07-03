import { LegalLayout, LegalSection } from "@/components/legal/LegalLayout";

const sections: LegalSection[] = [
  { id: "overview", title: "1. Overview" },
  { id: "information-we-collect", title: "2. Information We Collect" },
  { id: "photos-redaction", title: "3. Photos & Face Redaction" },
  { id: "how-we-use", title: "4. How We Use Information" },
  { id: "sharing", title: "5. How We Share Information" },
  { id: "third-party-login", title: "6. Third-Party Sign-In" },
  { id: "retention", title: "7. Data Retention" },
  { id: "security", title: "8. Data Security" },
  { id: "rights", title: "9. Your Rights & Choices" },
  { id: "children", title: "10. Children's Privacy" },
  { id: "cookies", title: "11. Cookies & Similar Technologies" },
  { id: "changes", title: "12. Changes to This Policy" },
  { id: "contact", title: "13. Contact Us" },
];

export const metadata = {
  title: "Privacy Policy | SeeBu",
  description: "How SeeBu collects, uses, and protects your information.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout title="Privacy Policy" effectiveDate="July 4, 2026" sections={sections}>
      <p>
        This Privacy Policy explains how SeeBu (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;)
        collects, uses, discloses, and safeguards information when you use our website, mobile
        experience, and related services (collectively, the &quot;Service&quot;) for reporting and
        tracking public infrastructure and community issues in Cebu City. By using the Service, you
        agree to the collection and use of information described here. This Policy should be read
        together with our <a href="/terms">Terms of Service</a>.
      </p>

      <h2 id="overview">1. Overview</h2>
      <p>
        SeeBu is built to bridge residents (&quot;Clients&quot;), local government administrators,
        and field workforce teams so public issues can be reported, verified, and resolved. Because
        the Service handles reports that may include location data and photos of public spaces, we
        take privacy and data minimization seriously, including using automated tools to reduce
        incidental exposure of bystanders in submitted photos.
      </p>

      <h2 id="information-we-collect">2. Information We Collect</h2>
      <h3>Account Information</h3>
      <ul>
        <li>Name, email address, and password (when you register directly);</li>
        <li>Profile information from Google or Facebook if you sign in with those providers (see <a href="#third-party-login">Section 6</a>);</li>
        <li>Contact number, when provided for SMS-based verification or password recovery; and</li>
        <li>Role information (Client, Admin, Workforce, Superadmin) used to control access within the Service.</li>
      </ul>
      <h3>Report Information</h3>
      <ul>
        <li>The description, category, and status of issues you report;</li>
        <li>Location data (such as an address or map coordinates) associated with a report;</li>
        <li>Photos submitted as evidence of the reported issue; and</li>
        <li>A generated tracking ID used to look up a report&apos;s status without logging in.</li>
      </ul>
      <h3>Automatically Collected Information</h3>
      <ul>
        <li>Session and authentication tokens used to keep you signed in;</li>
        <li>Basic device and usage information (such as browser type and pages visited) collected through standard web server logs; and</li>
        <li>Cookies and similar technologies as described in <a href="#cookies">Section 11</a>.</li>
      </ul>

      <h2 id="photos-redaction">3. Photos &amp; Face Redaction</h2>
      <p>
        Photos submitted with a report often depict streets, infrastructure, or public spaces and
        may incidentally include bystanders. To reduce the privacy impact of this, SeeBu processes
        uploaded images through an automated face-redaction service (EgoBlur) that detects and
        blurs faces before images are stored for review or shown to administrators, workforce
        accounts, or through the public tracking page. This redaction is automated and intended to
        reduce identifiability of bystanders; it is not a guarantee that every face will be
        detected in every image, particularly in low-quality, low-light, or heavily obscured
        photos.
      </p>

      <h2 id="how-we-use">4. How We Use Information</h2>
      <p>We use the information we collect to:</p>
      <ul>
        <li>Create and maintain your account and authenticate your sign-ins;</li>
        <li>Receive, route, and display reports to the appropriate administrators and workforce personnel;</li>
        <li>Provide status updates and enable tracking-ID lookups;</li>
        <li>Send transactional communications, such as verification codes, password-reset emails or SMS, and report status notifications;</li>
        <li>Maintain the security and integrity of the Service, including detecting abuse and enforcing rate limits; and</li>
        <li>Comply with legal obligations and respond to lawful requests from public authorities.</li>
      </ul>

      <h2 id="sharing">5. How We Share Information</h2>
      <p>We do not sell your personal information. We may share information as follows:</p>
      <ul>
        <li><strong>With government administrators and workforce personnel</strong> responsible for reviewing, verifying, assigning, and resolving the specific reports you submit;</li>
        <li><strong>Publicly, in limited form,</strong> when a report&apos;s status is looked up using its tracking ID, which does not require login;</li>
        <li><strong>With service providers</strong> who help us operate the Service (for example, hosting, email/SMS delivery, and the automated face-redaction service), under obligations to protect your information and use it only for the purposes we specify; and</li>
        <li><strong>When required by law,</strong> such as in response to a valid legal process, or to protect the rights, safety, or property of SeeBu, our users, or the public.</li>
      </ul>

      <h2 id="third-party-login">6. Third-Party Sign-In</h2>
      <p>
        If you sign up or log in using Google or Facebook, that provider shares limited profile
        information with us (such as your name, email address, and profile picture) so we can
        create or match your SeeBu account. We do not receive your password for these providers.
        Your relationship with Google or Facebook, and the information they collect about you
        independently of SeeBu, is governed by their own privacy policies.
      </p>

      <h2 id="retention">7. Data Retention</h2>
      <p>
        We retain account and report information for as long as reasonably necessary to provide the
        Service, resolve reports, maintain accurate records of government action taken, and comply
        with legal and recordkeeping obligations. If you request account deletion, we will delete or
        anonymize your personal information, except where retention is required for legal,
        security, or legitimate recordkeeping purposes (for example, maintaining historical records
        of resolved public infrastructure reports).
      </p>

      <h2 id="security">8. Data Security</h2>
      <p>
        We use reasonable administrative, technical, and physical safeguards designed to protect
        your information, including encrypted transmission, hashed passwords, and access controls
        limiting report data to relevant roles. No method of transmission or storage is completely
        secure, and we cannot guarantee absolute security.
      </p>

      <h2 id="rights">9. Your Rights &amp; Choices</h2>
      <p>
        Subject to applicable law, including the Philippine Data Privacy Act of 2012, you may have
        the right to access, correct, or request deletion of your personal information, object to
        or restrict certain processing, and withdraw consent where processing is based on consent.
        To exercise these rights, contact us at{" "}
        <a href="mailto:privacy@seebu.app">privacy@seebu.app</a>. We may need to verify your
        identity before fulfilling your request.
      </p>

      <h2 id="children">10. Children&apos;s Privacy</h2>
      <p>
        The Service is not directed to children under 13, and we do not knowingly collect personal
        information from children under 13. If you believe a child has provided us with personal
        information, please contact us so we can take appropriate action.
      </p>

      <h2 id="cookies">11. Cookies &amp; Similar Technologies</h2>
      <p>
        We use cookies and similar technologies to keep you signed in, remember your preferences,
        and understand how the Service is used. You can control cookies through your browser
        settings; disabling cookies may limit some features, such as staying logged in between
        visits.
      </p>

      <h2 id="changes">12. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. If we make material changes, we will
        update the &quot;Effective date&quot; above and, where appropriate, provide additional
        notice. We encourage you to review this Policy periodically.
      </p>

      <h2 id="contact">13. Contact Us</h2>
      <p>
        If you have questions about this Privacy Policy or our data practices, please contact us at{" "}
        <a href="mailto:privacy@seebu.app">privacy@seebu.app</a>.
      </p>
    </LegalLayout>
  );
}
