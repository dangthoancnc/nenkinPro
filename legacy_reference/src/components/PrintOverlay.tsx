import React from 'react';

interface PrintContainerProps {
  imageUrl: string;
  children: React.ReactNode;
  isLandscape?: boolean;
}

export const PrintContainer = ({ imageUrl, children, isLandscape = false }: PrintContainerProps) => {
  const isPdf = imageUrl.toLowerCase().endsWith('.pdf');
  
  return (
    <div 
      className={`relative w-full mx-auto bg-white shadow-xl print:shadow-none print:m-0 break-inside-avoid ${isLandscape ? 'max-w-[1414px]' : 'max-w-[1000px]'}`} 
      style={{ aspectRatio: isLandscape ? '297/210' : '210/297' }}
    >
      {/* Background Layer */}
      {isPdf ? (
        <iframe 
          src={`${imageUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} 
          className="absolute inset-0 w-full h-full pointer-events-none border-none opacity-90 print:opacity-100" 
        />
      ) : (
        <img 
          src={imageUrl} 
          alt="Form Background" 
          className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-90 print:opacity-100" 
        />
      )}
      
      {/* Text Overlay Layer */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        {children}
      </div>
      
      {/* Watermark for Dev/Preview (Hidden on Print) */}
      <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded font-bold opacity-50 print:hidden pointer-events-none">
        PREVIEW MODE
      </div>
    </div>
  );
};

export interface PrintFieldProps {
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  value: string | number | undefined | null;
  className?: string;
  charSpacing?: number; // In px, useful for spreading text like "1 2 3"
}

export const PrintField = ({ x, y, value, className = '', charSpacing }: PrintFieldProps) => {
  if (value === undefined || value === null || value === '') return null;
  
  const content = charSpacing 
    ? String(value).split('').map((char, i) => (
        <span key={i} style={{ display: 'inline-block', width: `${charSpacing}px`, textAlign: 'center' }}>
          {char}
        </span>
      ))
    : value;

  return (
    <div 
      className={`absolute font-mono text-black print:text-black font-semibold whitespace-nowrap ${className}`} 
      style={{ 
        left: `${x}%`, 
        top: `${y}%`, 
        transform: 'translateY(-50%)',
        fontSize: className.includes('text-') ? undefined : '14px', // default font size if no Tailwind text class is provided
      }}
    >
      {content}
    </div>
  );
};
