
import React, { useState } from 'react';
import { User, ImageOff } from 'lucide-react';
import { PHOTO_BASE_URL } from '../constants';

interface AvatarDisplayProps {
  filename?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const AvatarDisplay: React.FC<AvatarDisplayProps> = ({ filename, alt, size = 'md', className = '' }) => {
  const [error, setError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  const containerClasses = `
    relative rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0
    ${sizeClasses[size]} 
    ${className}
  `;

  // If no filename, or explicitly empty
  if (!filename || filename.trim() === '') {
    return (
      <div className={containerClasses}>
        <User className="text-slate-300" size={size === 'sm' ? 14 : size === 'md' ? 20 : 40} />
      </div>
    );
  }

  // If error loading image, show fallback
  if (error) {
    return (
      <div className={containerClasses} title="Image not found">
        <ImageOff className="text-slate-300" size={size === 'sm' ? 14 : size === 'md' ? 20 : 40} />
      </div>
    );
  }

  // Try to load the image
  // Handle absolute paths (legacy data might have full paths) vs filenames
  const src = filename.startsWith('http') || filename.startsWith('data:') 
    ? filename 
    : `${PHOTO_BASE_URL}${filename}`;

  return (
    <div className={containerClasses}>
      <img 
        src={src} 
        alt={alt} 
        className="w-full h-full object-cover"
        onError={() => setError(true)}
      />
    </div>
  );
};

export default AvatarDisplay;
