import Navbar from './Navbar';
import HeroSection from './HeroSection';
import WhatIsGantly from './WhatIsGantly';
import PatientFlow from './PatientFlow';
import SmartMatching from './SmartMatching';
import VideoChat from './VideoChat';
import ForProfessionals from './ForProfessionals';
import ForClinics from './ForClinics';
import TestsPreview from './TestsPreview';
import TrustSecurity from './TrustSecurity';
import FinalCTA from './FinalCTA';
import Footer from './Footer';
import SEO, { organizationSchema, medicalBusinessSchema, webAppSchema, faqSchema, softwareAppSchema } from '../seo/SEO';

interface LandingProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onShowAbout: () => void;
  onShowSoyProfesional: () => void;
}

export default function Landing({ onGetStarted, onLogin, onShowAbout: _onShowAbout, onShowSoyProfesional }: LandingProps) {
  return (
    <div className="font-body">
      <SEO
        title="Encuentra tu psicólogo ideal"
        description="Plataforma de salud mental con matching clínico personalizado. Tests validados, videollamadas seguras y seguimiento continuo con psicólogos verificados."
        path="/"
        jsonLd={[organizationSchema, medicalBusinessSchema, webAppSchema, faqSchema, softwareAppSchema]}
      />
      <Navbar onLogin={onLogin} onStart={onGetStarted} />
      <main>
        <HeroSection onPatient={onGetStarted} onProfessional={onShowSoyProfesional} />
        <WhatIsGantly />
        <PatientFlow />
        <SmartMatching />
        <VideoChat />
        <ForProfessionals onJoin={onShowSoyProfesional} />
        <ForClinics />
        <TestsPreview />
        <TrustSecurity />
        <FinalCTA onPatient={onGetStarted} onProfessional={onShowSoyProfesional} />
      </main>
      <Footer />
    </div>
  );
}
