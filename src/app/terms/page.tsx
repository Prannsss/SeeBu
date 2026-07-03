import { LegalLayout, LegalSection } from "@/components/legal/LegalLayout";

const sections: LegalSection[] = [
  { id: "acceptance", title: "1. Acceptance of Terms" },
  { id: "eligibility", title: "2. Eligibility & Accounts" },
  { id: "description", title: "3. Description of Service" },
  { id: "reports", title: "4. Submitting Reports" },
  { id: "conduct", title: "5. Acceptable Use" },
  { id: "workforce", title: "6. Government & Workforce Accounts" },
  { id: "content", title: "7. Content & License" },
  { id: "third-party", title: "8. Third-Party Sign-In" },
  { id: "disclaimers", title: "9. Disclaimers" },
  { id: "liability", title: "10. Limitation of Liability" },
  { id: "termination", title: "11. Suspension & Termination" },
  { id: "changes", title: "12. Changes to These Terms" },
  { id: "law", title: "13. Governing Law" },
  { id: "contact", title: "14. Contact Us" },
];

export const metadata = {
  title: "Terms of Service | SeeBu",
  description: "The terms that govern your use of SeeBu.",
};

export default function TermsOfServicePage() {
  return (
    <LegalLayout title="Terms of Service" effectiveDate="July 4, 2026" sections={sections}>
      <p>
        Welcome to SeeBu. These Terms of Service (&quot;Terms&quot;) govern your access to and use
        of the SeeBu website, mobile experience, and related services (collectively, the
        &quot;Service&quot;), operated to help residents of Cebu City report public infrastructure
        and community issues, and to help local government units and workforce teams track and
        resolve them. Please read these Terms carefully before using the Service.
      </p>

      <h2 id="acceptance">1. Acceptance of Terms</h2>
      <p>
        By creating an account, submitting a report, or otherwise accessing the Service, you agree
        to be bound by these Terms and by our <a href="/privacy">Privacy Policy</a>, which is
        incorporated into these Terms by reference. If you do not agree, do not use the Service.
      </p>
      <p>
        If you are using the Service on behalf of a government office, agency, or workforce team,
        you represent that you have the authority to bind that organization to these Terms.
      </p>

      <h2 id="eligibility">2. Eligibility &amp; Accounts</h2>
      <p>
        You must be at least 13 years old to create a SeeBu account. When you register, you agree
        to provide accurate, current, and complete information and to keep it up to date. You are
        responsible for:
      </p>
      <ul>
        <li>Maintaining the confidentiality of your password and account credentials;</li>
        <li>All activity that occurs under your account, whether authorized by you or not; and</li>
        <li>Notifying us promptly at <a href="mailto:support@seebu.app">support@seebu.app</a> if you suspect unauthorized use of your account.</li>
      </ul>
      <p>
        SeeBu supports sign-up and sign-in via email/password as well as third-party providers
        (Google and Facebook). See <a href="#third-party">Section 8</a> for details.
      </p>

      <h2 id="description">3. Description of Service</h2>
      <p>
        SeeBu is a civic-engagement platform that allows residents (&quot;Clients&quot;) to report
        issues such as damaged infrastructure, waste management concerns, and other public-safety
        or community matters, and to track the status of those reports. Reports may be routed to
        administrators and field workforce accounts responsible for verifying and resolving them.
        SeeBu also provides a public tracking page so a report&apos;s status can be checked using a
        tracking ID without requiring an account.
      </p>
      <p>
        SeeBu is a reporting and coordination tool. It is <strong>not</strong> an emergency service.
        If you are experiencing a life-threatening emergency, contact your local emergency hotline
        or 911 immediately instead of, or in addition to, submitting a report through SeeBu.
      </p>

      <h2 id="reports">4. Submitting Reports</h2>
      <p>When you submit a report through SeeBu, you agree that:</p>
      <ul>
        <li>The information you provide, including the description, location, and any photos, is truthful and accurate to the best of your knowledge;</li>
        <li>You will not knowingly submit false, misleading, duplicate, or malicious reports;</li>
        <li>Photos you upload may depict public spaces, infrastructure, and, incidentally, members of the public. SeeBu applies automated face-redaction (EgoBlur) to uploaded images to reduce the visibility of bystanders' faces before they are reviewed or published, but you should still avoid intentionally photographing identifiable individuals where it is not necessary to illustrate the issue; and</li>
        <li>Reports and their status updates may be visible to relevant government administrators, workforce personnel, and, where a tracking ID is used, to anyone with that tracking ID.</li>
      </ul>

      <h2 id="conduct">5. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for any unlawful purpose or in violation of any local, national, or international law;</li>
        <li>Submit reports containing hate speech, harassment, defamatory content, or sexually explicit material;</li>
        <li>Impersonate any person or entity, or misrepresent your affiliation with a person or entity;</li>
        <li>Attempt to gain unauthorized access to another user&apos;s account, to administrator or workforce accounts, or to any part of the Service&apos;s infrastructure;</li>
        <li>Interfere with, overload, or disrupt the Service, including through automated scraping, bulk report submission, or denial-of-service attempts; or</li>
        <li>Reverse engineer, decompile, or attempt to extract the source code of the Service, except where applicable law permits it.</li>
      </ul>
      <p>
        We may investigate and take appropriate action against anyone who, in our sole discretion,
        violates this section, including removing content and suspending or terminating accounts.
      </p>

      <h2 id="workforce">6. Government &amp; Workforce Accounts</h2>
      <p>
        Administrator, workforce, and superadmin accounts are provisioned for authorized local
        government personnel and field teams to review, assign, and resolve reports. These accounts
        carry additional responsibilities:
      </p>
      <ul>
        <li>Access must be limited to legitimate government business related to report handling;</li>
        <li>Status updates and resolutions must reflect the genuine state of the reported issue;</li>
        <li>Any resident data accessed through these accounts must be handled in accordance with our <a href="/privacy">Privacy Policy</a> and applicable data privacy law; and</li>
        <li>Credentials for these account types are not self-service and are issued or approved by an existing administrator.</li>
      </ul>

      <h2 id="content">7. Content &amp; License</h2>
      <p>
        You retain ownership of the text, photos, and other content you submit to SeeBu
        (&quot;User Content&quot;). By submitting User Content, you grant SeeBu a worldwide,
        non-exclusive, royalty-free license to host, store, reproduce, process (including
        automated redaction), and display that content solely for the purpose of operating,
        improving, and providing the Service, including sharing relevant report details with
        the government units and workforce personnel responsible for resolving it.
      </p>
      <p>
        We may remove or decline to publish any User Content that we reasonably believe violates
        these Terms or applicable law.
      </p>

      <h2 id="third-party">8. Third-Party Sign-In</h2>
      <p>
        SeeBu allows you to sign up or log in using Google or Facebook. If you choose to do so, we
        receive basic profile information (such as your name, email address, and profile photo)
        from that provider, as permitted by your settings with them. Your use of a third-party
        sign-in is also subject to that provider&apos;s own terms and privacy policy. We are not
        responsible for the practices of these third-party providers.
      </p>

      <h2 id="disclaimers">9. Disclaimers</h2>
      <p>
        THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE,&quot; WITHOUT WARRANTIES
        OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION WARRANTIES OF
        MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. We do not guarantee
        that any report will be reviewed, acted upon, or resolved within any particular timeframe,
        as resolution depends on the responsible government unit or workforce team, resource
        availability, and factors outside SeeBu&apos;s control.
      </p>

      <h2 id="liability">10. Limitation of Liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, SEEBU AND ITS DEVELOPERS SHALL NOT BE LIABLE FOR
        ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF
        DATA, ARISING FROM YOUR USE OF, OR INABILITY TO USE, THE SERVICE, INCLUDING RELIANCE ON THE
        SERVICE FOR TIME-SENSITIVE OR SAFETY-CRITICAL SITUATIONS. NOTHING IN THESE TERMS LIMITS
        LIABILITY THAT CANNOT BE LIMITED UNDER APPLICABLE LAW.
      </p>

      <h2 id="termination">11. Suspension &amp; Termination</h2>
      <p>
        We may suspend or terminate your access to the Service at any time, with or without
        notice, if we believe you have violated these Terms, misused the Service, or if required
        to do so by law. You may stop using the Service and request deletion of your account at
        any time by contacting us as described in <a href="#contact">Section 14</a> or through
        your account settings, where available.
      </p>

      <h2 id="changes">12. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time to reflect changes to the Service or for legal
        or operational reasons. If we make material changes, we will update the &quot;Effective
        date&quot; above and, where appropriate, provide additional notice. Your continued use of
        the Service after changes take effect constitutes acceptance of the revised Terms.
      </p>

      <h2 id="law">13. Governing Law</h2>
      <p>
        These Terms are governed by the laws of the Republic of the Philippines, without regard to
        its conflict-of-law provisions. Any dispute arising from these Terms or the Service shall
        be subject to the exclusive jurisdiction of the competent courts of Cebu City, Philippines.
      </p>

      <h2 id="contact">14. Contact Us</h2>
      <p>
        If you have questions about these Terms, please contact us at{" "}
        <a href="mailto:support@seebu.app">support@seebu.app</a>.
      </p>
    </LegalLayout>
  );
}
