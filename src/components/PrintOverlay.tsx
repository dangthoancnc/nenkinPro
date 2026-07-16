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
  value?: string | number | undefined | null;
  className?: string;
  charSpacing?: number; // In px, useful for spreading text like "1 2 3"
  size?: number; // Font size from config
  type?: 'text' | 'line' | 'circle';
  width?: number; // Width for lines/circles
  height?: number; // Height for circles
  thickness?: number; // Border thickness
  isMock?: boolean;
}

export const PrintField = ({ x, y, value, className = '', charSpacing, size = 12, type = 'text', width, height, thickness = 1, isMock = false }: PrintFieldProps) => {
  // Common style for absolute positioning using percentages
  const style: React.CSSProperties = {
    left: `${x}%`,
    top: `${y}%`,
    position: 'absolute',
    transform: type === 'text' ? 'translateY(-50%)' : 'translate(0, -100%)', // Match PdfMapperClient logic
  };

  if (type === 'line') {
    // 595.32 is A4 width in points. We calculate width percentage based on points
    const widthPercent = ((width || 100) / 595.32) * 100;
    return (
      <div 
        className="bg-black print:bg-black absolute" 
        style={{
          ...style,
          width: `${widthPercent}%`,
          height: `${thickness}px`,
          transform: 'none' // Lines draw from exactly x, y
        }}
      />
    );
  }

  if (type === 'circle') {
    const widthPercent = ((width || 20) / 595.32) * 100;
    const heightPercent = ((height || 20) / 841.92) * 100;
    return (
      <div 
        className="absolute border-black print:border-black rounded-full" 
        style={{
          left: `${x}%`,
          top: `${y}%`,
          width: `${widthPercent}%`,
          height: `${heightPercent}%`,
          borderWidth: `${thickness}px`,
          borderStyle: 'solid',
          transform: 'translate(-50%, -50%)', // Circle centers on coordinate usually, wait, in PdfMapperClient it centers differently, let's use translate(-50%, -50%) for simplicity
        }}
      />
    );
  }

  if (value === undefined || value === null || value === '') return null;
  
  const content = charSpacing 
    ? String(value).split('').map((char, i) => (
        <span key={i} style={{ display: 'inline-block', width: `${charSpacing}px`, textAlign: 'center' }}>
          {char}
        </span>
      ))
    : value;

  // Convert font size from points to a rough viewport relative size or just px if scaling is fixed.
  // Actually, PrintContainer uses a fixed aspect ratio. A4 width is 210mm. 
  // For simplicity, we'll use a responsive font size based on container width if possible, or just raw px (since it's max 1000px wide anyway).
  // A4 is 595.32 points wide. So 1pt = 1/595.32 of container width.
  const fontSizeVw = (size / 595.32) * 100;

  return (
    <div 
      className={`absolute font-mono whitespace-nowrap ${isMock ? 'text-red-500/70 print:text-transparent print:hidden' : 'text-black print:text-black font-semibold'} ${className}`} 
      style={{ 
        ...style,
        fontSize: className.includes('text-') ? undefined : `max(10px, ${fontSizeVw}cqi)`, // use container query inline if supported, otherwise fallback
      }}
    >
      {content}
    </div>
  );
};
