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

interface LandingProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onShowAbout: () => void;
  onShowSoyProfesional: () => void;
}

export default function Landing({ onGetStarted, onLogin, onShowAbout: _onShowAbout, onShowSoyProfesional }: LandingProps) {
  return (
    <div className="font-body">
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
