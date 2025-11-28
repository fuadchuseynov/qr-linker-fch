import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import abbLogo from '@/assets/abb-logo.png';
import { useGesture } from '@use-gesture/react';
import { motion, AnimatePresence } from 'framer-motion';

interface QRLink {
  id: number;
  title: string;
  url: string;
  description?: string;
  image_url?: string;
  order: number;
  auto_scroll_enabled?: boolean;
}

export function MainScreen() {
  const [links, setLinks] = useState<QRLink[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState(0);
  const [autoScroll, setAutoScroll] = useState(false);
  const navigate = useNavigate();
  const swipeRef = useRef(null);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchLinks();
  }, []);

  async function fetchLinks() {
    try {
      const { data, error } = await supabase
        .from('qr_links')
        .select('*')
        .order('order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinks(data || []);

      // Check if auto-scroll is enabled from first link (stored globally)
      if (data && data.length > 0) {
        setAutoScroll(data[0].auto_scroll_enabled || false);
      }
    } catch (error) {
      console.error('Error fetching links:', error);
    } finally {
      setLoading(false);
    }
  }

  const goToPrevious = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? links.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev === links.length - 1 ? 0 : prev + 1));
  };

  // Auto-scroll effect
  useEffect(() => {
    if (autoScroll && links.length > 1) {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
      autoScrollRef.current = setInterval(() => {
        goToNext();
      }, 4000);
    } else {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    }

    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };
  }, [autoScroll, links.length]);

  useEffect(() => {
    const bind = (ev: any) => {
      if (ev.type === 'swiped') {
        if (ev.detail.dir === 'LEFT') {
          goToNext();
        } else if (ev.detail.dir === 'RIGHT') {
          goToPrevious();
        }
      }
    };

    const element = swipeRef.current as HTMLElement;
    if (element) {
      let startX = 0;

      const handleTouchStart = (e: TouchEvent) => {
        startX = e.touches[0].clientX;
      };

      const handleTouchEnd = (e: TouchEvent) => {
        const endX = e.changedTouches[0].clientX;
        const diff = startX - endX;

        if (Math.abs(diff) > 50) {
          if (diff > 0) {
            // Свайп влево
            goToNext();
          } else {
            // Свайп вправо
            goToPrevious();
          }
        }
      };

      element.addEventListener('touchstart', handleTouchStart);
      element.addEventListener('touchend', handleTouchEnd);

      return () => {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [links.length]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (links.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-xl text-muted-foreground">No QR codes available</p>
        <Button onClick={() => navigate('/admin')}>Go to Admin Panel</Button>
      </div>
    );
  }

  const currentLink = links[currentIndex];

  return (
    <div ref={swipeRef} className="flex flex-col items-center justify-between min-h-screen bg-gray-200 dark:bg-gray-800 p-4 pt-8">
      <div className="w-full flex justify-center bg-blue-600 py-6 rounded-2xl mx-4">
        <button
          onClick={() => navigate('/admin')}
          className="hover:opacity-80 transition-opacity"
          title="Go to Admin Panel"
        >
          <img src={abbLogo} alt="Admin Panel" className="h-16 w-auto rounded-lg" />
        </button>
      </div>

      <div className="flex flex-col items-center gap-2 pt-2 flex-1 w-full overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: direction > 0 ? 100 : -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -100 : 100 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="w-full flex flex-col items-center"
          >
            <QRCodeDisplay
              url={currentLink.url}
              title={currentLink.title}
              description={currentLink.description}
            />

            {/* Картинка внизу QR кода */}
            {currentLink.image_url && (
              <div className="w-full mt-1">
                <img src={currentLink.image_url} alt={currentLink.title} className="w-full h-80 rounded-lg object-cover" />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {links.length > 1 && (
          <div className="flex gap-4 mt-4">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevious}
              className="rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="flex items-center px-4 text-sm font-medium">
              {currentIndex + 1} / {links.length}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              className="rounded-full"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}