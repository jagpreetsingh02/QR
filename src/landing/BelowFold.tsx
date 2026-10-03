import { MotionProvider } from '../components/MotionProvider';
import { TypesShowcase } from './sections/TypesShowcase';
import { DesignSection } from './sections/DesignSection';
import { ScanSection } from './sections/ScanSection';
import { PrivacySection } from './sections/PrivacySection';
import { HowItWorks } from './sections/HowItWorks';
import { Faq } from './sections/Faq';
import { FinalCta, SiteFooter } from './sections/Closing';

export default function BelowFold() {
  return (
    <MotionProvider>
      <TypesShowcase />
      <DesignSection />
      <ScanSection />
      <PrivacySection />
      <HowItWorks />
      <Faq />
      <FinalCta />
      <SiteFooter />
    </MotionProvider>
  );
}
