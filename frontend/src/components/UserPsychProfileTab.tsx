import React, { useEffect, useState } from 'react';
import { SkeletonCard } from './ui/SkeletonLoader';
import PsychProfileCard from './PsychProfileCard';
import { calendarService } from '../services/api';

interface UserPsychProfileTabProps {
  psychologistProfile: any;
  loadingPsychologistProfile: boolean;
  onBack: () => void;
}

const UserPsychProfileTab: React.FC<UserPsychProfileTabProps> = ({
  psychologistProfile,
  loadingPsychologistProfile,
  onBack,
}) => {
  const [ratingSummary, setRatingSummary] = useState<{ averageRating: number | null; totalRatings: number } | null>(null);
  const [ratings, setRatings] = useState<Array<{ rating: number; comment: string; patientName: string; createdAt: string }>>([]);

  useEffect(() => {
    if (!psychologistProfile?.id) return;
    const id = psychologistProfile.id;

    calendarService.getPsychologistRating(id).then(setRatingSummary).catch(() => {});
    calendarService.getPsychologistRatings(id).then(setRatings).catch(() => {});
  }, [psychologistProfile?.id]);

  if (loadingPsychologistProfile) {
    return (
      <div className="max-w-[900px] mx-auto space-y-4 py-4">
        <div className="flex items-center gap-4">
          <div className="animate-pulse bg-slate-200 rounded-2xl w-20 h-20 shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="animate-pulse bg-slate-200 rounded h-5 w-48" />
            <div className="animate-pulse bg-slate-100 rounded h-3 w-32" />
          </div>
        </div>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <PsychProfileCard
      profile={psychologistProfile}
      ratingSummary={ratingSummary}
      ratings={ratings}
      onBack={onBack}
    />
  );
};

export default UserPsychProfileTab;
