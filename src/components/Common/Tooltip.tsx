// import React, { useState, useRef, useEffect } from 'react';

// interface TooltipProps {
//   content: string;
//   children: React.ReactNode;
//   position?: 'top' | 'bottom' | 'left' | 'right';
//   delay?: number;
// }

// const Tooltip: React.FC<TooltipProps> = ({ 
//   content, 
//   children, 
//   position = 'top',
//   delay = 200 
// }) => {
//   const [isVisible, setIsVisible] = useState(false);
//   const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
//   const tooltipRef = useRef<HTMLDivElement>(null);
//   const triggerRef = useRef<HTMLDivElement>(null);
//   const timeoutRef = useRef<NodeJS.Timeout | null>(null);

//   const showTooltip = () => {
//     if (timeoutRef.current) {
//       clearTimeout(timeoutRef.current);
//     }
//     timeoutRef.current = setTimeout(() => {
//       setIsVisible(true);
//       calculatePosition();
//     }, delay);
//   };

//   const hideTooltip = () => {
//     if (timeoutRef.current) {
//       clearTimeout(timeoutRef.current);
//     }
//     setIsVisible(false);
//   };

//   const calculatePosition = () => {
//     if (!triggerRef.current || !tooltipRef.current) return;

//     const triggerRect = triggerRef.current.getBoundingClientRect();
//     const tooltipRect = tooltipRef.current.getBoundingClientRect();
//     const scrollY = window.scrollY;
//     const scrollX = window.scrollX;

//     let top = 0;
//     let left = 0;

//     switch (position) {
//       case 'top':
//         top = triggerRect.top + scrollY - tooltipRect.height - 8;
//         left = triggerRect.left + scrollX + (triggerRect.width / 2) - (tooltipRect.width / 2);
//         break;
//       case 'bottom':
//         top = triggerRect.bottom + scrollY + 8;
//         left = triggerRect.left + scrollX + (triggerRect.width / 2) - (tooltipRect.width / 2);
//         break;
//       case 'left':
//         top = triggerRect.top + scrollY + (triggerRect.height / 2) - (tooltipRect.height / 2);
//         left = triggerRect.left + scrollX - tooltipRect.width - 8;
//         break;
//       case 'right':
//         top = triggerRect.top + scrollY + (triggerRect.height / 2) - (tooltipRect.height / 2);
//         left = triggerRect.right + scrollX + 8;
//         break;
//     }

//     // Boundary checks to keep tooltip in viewport
//     const padding = 8;
//     if (left < padding) left = padding;
//     if (left + tooltipRect.width > window.innerWidth - padding) {
//       left = window.innerWidth - tooltipRect.width - padding;
//     }
//     if (top < padding) top = padding;
//     if (top + tooltipRect.height > window.innerHeight + scrollY - padding) {
//       top = window.innerHeight + scrollY - tooltipRect.height - padding;
//     }

//     setTooltipPosition({ top, left });
//   };

//   useEffect(() => {
//     if (isVisible) {
//       calculatePosition();
//       window.addEventListener('scroll', calculatePosition);
//       window.addEventListener('resize', calculatePosition);
//     }

//     return () => {
//       window.removeEventListener('scroll', calculatePosition);
//       window.removeEventListener('resize', calculatePosition);
//       if (timeoutRef.current) {
//         clearTimeout(timeoutRef.current);
//       }
//     };
//   }, [isVisible]);

//   const getArrowClass = () => {
//     switch (position) {
//       case 'top':
//         return 'bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full border-l-transparent border-r-transparent border-b-transparent border-t-gray-800';
//       case 'bottom':
//         return 'top-0 left-1/2 transform -translate-x-1/2 -translate-y-full border-l-transparent border-r-transparent border-t-transparent border-b-gray-800';
//       case 'left':
//         return 'right-0 top-1/2 transform -translate-y-1/2 translate-x-full border-t-transparent border-b-transparent border-l-transparent border-r-gray-800';
//       case 'right':
//         return 'left-0 top-1/2 transform -translate-y-1/2 -translate-x-full border-t-transparent border-b-transparent border-r-transparent border-l-gray-800';
//       default:
//         return '';
//     }
//   };

//   return (
//     <div
//       ref={triggerRef}
//       className="relative inline-block"
//       onMouseEnter={showTooltip}
//       onMouseLeave={hideTooltip}
//       onFocus={showTooltip}
//       onBlur={hideTooltip}
//     >
//       {children}
//       {isVisible && (
//         <div
//           ref={tooltipRef}
//           className="fixed z-[9999] pointer-events-none"
//           style={{
//             top: `${tooltipPosition.top}px`,
//             left: `${tooltipPosition.left}px`,
//           }}
//         >
//           <div className="relative">
//             <div className="bg-gray-800 text-white text-sm font-medium py-2 px-3 rounded-lg shadow-lg whitespace-nowrap">
//               {content}
//             </div>
//             <div className={`absolute w-0 h-0 border-4 ${getArrowClass()}`} />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Tooltip;




import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';

// Simple tooltip props (backward compatible)
interface SimpleTooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

// Rich info tooltip props
interface InfoTooltipProps {
  title: string;
  description: string;
  formula?: string;
  example?: string;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

// Union type for all tooltip props
type TooltipProps = SimpleTooltipProps | InfoTooltipProps;

// Type guard to check if it's a simple tooltip
const isSimpleTooltip = (props: TooltipProps): props is SimpleTooltipProps => {
  return 'content' in props && typeof props.content === 'string';
};

const Tooltip: React.FC<TooltipProps> = (props) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isSimple = isSimpleTooltip(props);
  const position = props.position || 'top';
  const delay = 'delay' in props ? props.delay : 200;

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      calculatePosition();
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  // Update the calculatePosition function in Tooltip.tsx (around line 208)
const calculatePosition = () => {
  if (!triggerRef.current || !tooltipRef.current) return;

  const triggerRect = triggerRef.current.getBoundingClientRect();
  const tooltipRect = tooltipRef.current.getBoundingClientRect();
  const scrollY = window.scrollY;
  const scrollX = window.scrollX;
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  let top = 0;
  let left = 0;
  let actualPosition = position;
  const spacing = isSimple ? 8 : 12;
  const padding = spacing;

  // Auto-adjust position if there's not enough space
  const spaceAbove = triggerRect.top;
  const spaceBelow = viewportHeight - triggerRect.bottom;
  const spaceLeft = triggerRect.left;
  const spaceRight = viewportWidth - triggerRect.right;

  // For top position, check if we have enough space, otherwise flip to bottom
  if (position === 'top' && spaceAbove < tooltipRect.height + spacing) {
    if (spaceBelow > tooltipRect.height + spacing) {
      actualPosition = 'bottom';
    } else if (spaceRight > tooltipRect.width + spacing) {
      actualPosition = 'right';
    } else if (spaceLeft > tooltipRect.width + spacing) {
      actualPosition = 'left';
    }
  }

  // For bottom position, check if we have enough space, otherwise flip to top
  if (position === 'bottom' && spaceBelow < tooltipRect.height + spacing) {
    if (spaceAbove > tooltipRect.height + spacing) {
      actualPosition = 'top';
    } else if (spaceRight > tooltipRect.width + spacing) {
      actualPosition = 'right';
    } else if (spaceLeft > tooltipRect.width + spacing) {
      actualPosition = 'left';
    }
  }

  switch (actualPosition) {
    case 'top':
      top = triggerRect.top + scrollY - tooltipRect.height - spacing;
      left = triggerRect.left + scrollX + (triggerRect.width / 2) - (tooltipRect.width / 2);
      break;
    case 'bottom':
      top = triggerRect.bottom + scrollY + spacing;
      left = triggerRect.left + scrollX + (triggerRect.width / 2) - (tooltipRect.width / 2);
      break;
    case 'left':
      top = triggerRect.top + scrollY + (triggerRect.height / 2) - (tooltipRect.height / 2);
      left = triggerRect.left + scrollX - tooltipRect.width - spacing;
      break;
    case 'right':
      top = triggerRect.top + scrollY + (triggerRect.height / 2) - (tooltipRect.height / 2);
      left = triggerRect.right + scrollX + spacing;
      break;
  }

  // Boundary checks to keep tooltip in viewport
  if (left < padding) left = padding;
  if (left + tooltipRect.width > viewportWidth - padding) {
    left = viewportWidth - tooltipRect.width - padding;
  }
  if (top < scrollY + padding) top = scrollY + padding;
  if (top + tooltipRect.height > scrollY + viewportHeight - padding) {
    top = scrollY + viewportHeight - tooltipRect.height - padding;
  }

  setTooltipPosition({ top, left });
};

  useEffect(() => {
    if (isVisible) {
      calculatePosition();
      window.addEventListener('scroll', calculatePosition);
      window.addEventListener('resize', calculatePosition);
    }

    return () => {
      window.removeEventListener('scroll', calculatePosition);
      window.removeEventListener('resize', calculatePosition);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isVisible]);

  
const getArrowClass = (arrowPosition: 'top' | 'bottom' | 'left' | 'right' = position) => {
  switch (arrowPosition) {
    case 'top':
      return 'bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full border-l-transparent border-r-transparent border-b-transparent border-t-gray-800';
    case 'bottom':
      return 'top-0 left-1/2 transform -translate-x-1/2 -translate-y-full border-l-transparent border-r-transparent border-t-transparent border-b-gray-800';
    case 'left':
      return 'right-0 top-1/2 transform -translate-y-1/2 translate-x-full border-t-transparent border-b-transparent border-l-transparent border-r-gray-800';
    case 'right':
      return 'left-0 top-1/2 transform -translate-y-1/2 -translate-x-full border-t-transparent border-b-transparent border-r-transparent border-l-gray-800';
    default:
      return '';
  }
};

  // Render simple tooltip
  if (isSimple) {
    return (
      <div
        ref={triggerRef}
        className="relative inline-block"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {props.children}
        {isVisible && (
          <div
            ref={tooltipRef}
            className="fixed z-[9999] pointer-events-none"
            style={{
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
            }}
          >
            <div className="relative">
              <div className="bg-gray-800 text-white text-sm font-medium py-2 px-3 rounded-lg shadow-lg whitespace-nowrap">
                {props.content}
              </div>
              <div className={`absolute w-0 h-0 border-4 ${getArrowClass()}`} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render rich info tooltip
  const infoProps = props as InfoTooltipProps;
  return (
    <div
      ref={triggerRef}
      className="relative inline-flex items-center"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {infoProps.children || (
        <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help transition-colors" />
      )}
      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-[9999] pointer-events-none"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
          }}
        >
          <div className="relative">
            <div className="bg-gray-800 text-white text-sm rounded-lg shadow-xl max-w-sm p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <h5 className="font-semibold text-white pr-4">{infoProps.title}</h5>
                <button
                  onClick={hideTooltip}
                  className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    hideTooltip();
                  }}
                  aria-label="Close tooltip"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* Description */}
              <p className="text-gray-300 mb-3 leading-relaxed text-xs">{infoProps.description}</p>
              
              {/* Formula */}
              {infoProps.formula && (
                <div className="mb-3 pt-3 border-t border-gray-700">
                  <p className="text-xs font-medium text-gray-400 mb-1">Formula:</p>
                  <code className="text-xs bg-gray-900 text-green-300 px-2 py-1 rounded block font-mono break-words">
                    {infoProps.formula}
                  </code>
                </div>
              )}
              
              {/* Example */}
              {infoProps.example && (
                <div className="pt-2 border-t border-gray-700">
                  <p className="text-xs font-medium text-gray-400 mb-1">Example:</p>
                  <p className="text-xs text-gray-300 italic break-words">{infoProps.example}</p>
                </div>
              )}
            </div>
            <div className={`absolute w-0 h-0 border-4 ${getArrowClass()}`} />
          </div>
        </div>
      )}
    </div>
  );
};

// Export both as default and named exports for flexibility
export default Tooltip;

// Named export for explicit usage
export type { SimpleTooltipProps, InfoTooltipProps, TooltipProps };