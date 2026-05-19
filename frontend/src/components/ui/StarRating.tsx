import React from 'react';

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = { sm: 'text-sm', md: 'text-base', lg: 'text-lg' };

const StarRating: React.FC<StarRatingProps> = ({ rating, max = 5, size = 'md', className = '' }) => {
  return (
    <div className={`flex gap-0.5 ${className}`}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={sizeMap[size]}
          style={{ color: i < Math.round(rating) ? '#F0C930' : '#d1d5db' }}
        >
          ★
        </span>
      ))}
    </div>
  );
};

export default StarRating;
