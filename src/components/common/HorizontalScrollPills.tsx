import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HorizontalScrollPillsProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  extraAction?: React.ReactNode;
  activeColorClass?: string;
  className?: string;
}

export const HorizontalScrollPills: React.FC<HorizontalScrollPillsProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  extraAction,
  activeColorClass = 'bg-red-600 text-white shadow-xs',
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftVal, setScrollLeftVal] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);

  // Check scroll boundaries
  const updateScrollIndicators = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    updateScrollIndicators();
    window.addEventListener('resize', updateScrollIndicators);

    return () => {
      window.removeEventListener('resize', updateScrollIndicators);
    };
  }, [categories, updateScrollIndicators]);

  // Smooth step scroll buttons (< and >)
  const scrollStep = (direction: 'left' | 'right') => {
    const el = containerRef.current;
    if (!el) return;
    const scrollAmount = Math.max(160, Math.round(el.clientWidth * 0.65));
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  // Convert mouse wheel vertical scroll to horizontal scroll
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    if (e.deltaY !== 0) {
      el.scrollLeft += e.deltaY;
      updateScrollIndicators();
    }
  };

  // Mouse drag-to-scroll handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    setIsDragging(true);
    setStartX(e.pageX - el.offsetLeft);
    setScrollLeftVal(el.scrollLeft);
    setHasMoved(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const el = containerRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX) * 1.3;
    if (Math.abs(walk) > 4) {
      setHasMoved(true);
    }
    el.scrollLeft = scrollLeftVal - walk;
    updateScrollIndicators();
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handlePillClick = (cat: string) => {
    if (!hasMoved) {
      onSelectCategory(cat);
    }
  };

  return (
    <div className={`relative flex items-center w-full group/scroll ${className}`}>
      {/* Left Scroll Arrow Button */}
      {canScrollLeft && (
        <div className="absolute left-0 z-20 flex items-center h-full pr-3 bg-gradient-to-r from-white via-white/90 to-transparent pointer-events-none">
          <button
            type="button"
            onClick={() => scrollStep('left')}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white shadow-md border border-slate-200 text-slate-700 hover:text-red-600 hover:border-red-300 flex items-center justify-center transition cursor-pointer pointer-events-auto hover:scale-105 active:scale-95"
            title="Geser ke kiri"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      )}

      {/* Main Scrollable Track */}
      <div
        ref={containerRef}
        onScroll={updateScrollIndicators}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className={`flex items-center space-x-2 py-2 overflow-x-auto w-full select-none cursor-grab active:cursor-grabbing ${
          isDragging ? 'cursor-grabbing scroll-auto' : 'scroll-smooth'
        }`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x'
        }}
      >
        {categories.map(cat => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => handlePillClick(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
                isSelected
                  ? activeColorClass
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200/50'
              }`}
            >
              {cat}
            </button>
          );
        })}

        {extraAction && (
          <div className="shrink-0">
            {extraAction}
          </div>
        )}
      </div>

      {/* Right Scroll Arrow Button */}
      {canScrollRight && (
        <div className="absolute right-0 z-20 flex items-center h-full pl-3 bg-gradient-to-l from-white via-white/90 to-transparent pointer-events-none">
          <button
            type="button"
            onClick={() => scrollStep('right')}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white shadow-md border border-slate-200 text-slate-700 hover:text-red-600 hover:border-red-300 flex items-center justify-center transition cursor-pointer pointer-events-auto hover:scale-105 active:scale-95 animate-pulse"
            title="Geser ke kanan"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
