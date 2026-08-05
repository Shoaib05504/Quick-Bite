import React, { useRef, useState, useEffect, useCallback } from 'react';
import './ExploreMenu.css';
import { menu_list } from '../../assets/assets';

const ExploreMenu = ({ category, setCategory }) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollStart, setScrollStart] = useState(0);
  const dragDistance = useRef(0);

  const checkScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    checkScroll();
    container.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      container.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  // Scroll carousel via arrow buttons
  const scroll = (direction) => {
    const container = scrollRef.current;
    if (!container) return;
    const scrollAmount = container.clientWidth * 0.65;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Mouse wheel horizontal scroll
  const handleWheel = (e) => {
    const container = scrollRef.current;
    if (!container) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      container.scrollLeft += e.deltaY;
    }
  };

  // Click & drag handlers for desktop
  const handleMouseDown = (e) => {
    const container = scrollRef.current;
    if (!container) return;
    setIsDragging(true);
    setStartX(e.pageX - container.offsetLeft);
    setScrollStart(container.scrollLeft);
    dragDistance.current = 0;
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const container = scrollRef.current;
    if (!container) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 1.5;
    dragDistance.current = Math.abs(walk);
    container.scrollLeft = scrollStart - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Keyboard navigation
  const handleKeyDownWrapper = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scroll('left');
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      scroll('right');
    }
  };

  const handleCategoryClick = (menuName) => {
    if (dragDistance.current > 5) return;
    setCategory((prev) => (prev === menuName ? 'All' : menuName));
  };

  return (
    <section className="explore-menu" id="explore-menu">
      <div className="explore-menu-header">
        <h2 className="explore-menu-title">
          <span className="explore-menu-icon" role="img" aria-label="Plate">🍽️</span> Explore Our Menu
        </h2>
        <p className="explore-menu-text">
          Discover delicious cuisines tailored to your cravings.
        </p>
      </div>

      <div 
        className="explore-menu-carousel-wrapper"
        onKeyDown={handleKeyDownWrapper}
        tabIndex={0}
        aria-label="Food Categories Carousel. Use left and right arrow keys to navigate."
      >
        {/* Edge Fade Overlays */}
        <div className={`carousel-fade-left ${canScrollLeft ? 'visible' : ''}`} />
        <div className={`carousel-fade-right ${canScrollRight ? 'visible' : ''}`} />

        {/* Floating Left Arrow */}
        <button
          className={`carousel-nav-btn nav-btn-left ${canScrollLeft ? 'visible' : ''}`}
          onClick={() => scroll('left')}
          aria-label="Scroll left through categories"
          type="button"
          tabIndex={canScrollLeft ? 0 : -1}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        {/* Carousel Items Container */}
        <div
          className={`explore-menu-list ${isDragging ? 'is-dragging' : ''}`}
          ref={scrollRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {menu_list.map((item, index) => {
            const isSelected = category === item.menu_name;
            return (
              <div
                key={index}
                className={`explore-menu-list-item ${isSelected ? 'active-item' : ''}`}
                onClick={() => handleCategoryClick(item.menu_name)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setCategory((prev) => (prev === item.menu_name ? 'All' : item.menu_name));
                  }
                }}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-label={`Filter by ${item.menu_name} category`}
              >
                <div className="item-image-wrapper">
                  <img
                    className={isSelected ? 'active-img' : ''}
                    src={item.menu_image}
                    alt={item.menu_name}
                    loading="lazy"
                  />
                </div>
                <p className="item-name">{item.menu_name}</p>
              </div>
            );
          })}
        </div>

        {/* Floating Right Arrow */}
        <button
          className={`carousel-nav-btn nav-btn-right ${canScrollRight ? 'visible' : ''}`}
          onClick={() => scroll('right')}
          aria-label="Scroll right through categories"
          type="button"
          tabIndex={canScrollRight ? 0 : -1}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
      <hr className="explore-menu-divider" />
    </section>
  );
};

export default ExploreMenu;