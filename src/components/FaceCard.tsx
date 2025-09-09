import { useState } from 'react';

interface Person {
  id: string;
  name: string;
  photo_url: string;
  rating: number;
}

interface FaceCardProps {
  person: Person;
  onClick: () => void;
  isWinner?: boolean;
  disabled?: boolean;
}

const FaceCard = ({ person, onClick, isWinner, disabled }: FaceCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={`face-card ${isWinner ? 'winner' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={disabled ? undefined : onClick}
    >
      <div className="aspect-square relative overflow-hidden">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        {imageError ? (
          <div className="absolute inset-0 bg-muted flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">👤</div>
              <div className="text-sm text-muted-foreground">Image not available</div>
            </div>
          </div>
        ) : (
          <img
            src={person.photo_url}
            alt={person.name}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}
        
        <div className="rating-badge">
          {person.rating}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-center truncate">
          {person.name}
        </h3>
      </div>
    </div>
  );
};

export default FaceCard;