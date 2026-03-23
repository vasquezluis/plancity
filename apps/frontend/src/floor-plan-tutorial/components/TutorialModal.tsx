import * as Dialog from '@radix-ui/react-dialog';
import Lottie from 'lottie-react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useState } from 'react';

import drawWallsAnimation from '../animations/01-draw-walls.json';
import addDoorsAnimation from '../animations/02-add-doors.json';
import generateLayoutAnimation from '../animations/03-generate-layout.json';
import aiEnhancementAnimation from '../animations/04-ai-enhancement.json';
import view3dAnimation from '../animations/05-view-3d.json';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const SLIDES = [
  {
    title: 'Draw Walls',
    description:
      'Select the Wall tool and click on the canvas to place a start point. Click again to finish the segment. Keep clicking to outline your entire floor plan.',
    animation: drawWallsAnimation,
  },
  {
    title: 'Add Doors',
    description:
      'Switch to Door mode and click anywhere near a wall. PlanCity snaps the door to the closest wall and draws the swing arc automatically.',
    animation: addDoorsAnimation,
  },
  {
    title: 'Generate Electrical Layout',
    description:
      "Once you've drawn your walls and doors, hit Generate. PlanCity places outlets, switches, a panel, and routes all the wiring automatically.",
    animation: generateLayoutAnimation,
  },
  {
    title: 'AI Enhancement',
    description:
      'Hit Optimize with AI to to enhance the layout, outlet placement, switches and wiring.',
    animation: aiEnhancementAnimation,
  },
  {
    title: 'Preview in 3D',
    description:
      'Toggle 3D View to see your floor plan and wiring in perspective. Drag to orbit the camera, scroll to zoom in and out.',
    animation: view3dAnimation,
  },
] as const;

export function TutorialModal({ isOpen, onClose }: Props) {
  const [current, setCurrent] = useState(0);

  const isFirst = current === 0;
  const isLast = current === SLIDES.length - 1;

  function prev() {
    setCurrent((i) => Math.max(0, i - 1));
  }

  function next() {
    setCurrent((i) => Math.min(SLIDES.length - 1, i + 1));
  }

  function handleClose() {
    setCurrent(0);
    onClose();
  }

  const slide = SLIDES[current];

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-xl shadow-xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          aria-describedby="tutorial-description"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
            <Dialog.Title className="text-sm font-semibold text-foreground">
              How to use PlanCity
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                aria-label="Close tutorial"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Animation */}
          <div className="px-5 pt-4">
            <div className="rounded-lg overflow-hidden bg-muted/40 border border-border/50">
              <Lottie
                key={current}
                animationData={slide.animation}
                loop={true}
                style={{ width: '100%', height: 200 }}
              />
            </div>
          </div>

          {/* Slide text */}
          <div className="px-5 pt-3 pb-4 space-y-1" id="tutorial-description">
            <p className="text-sm font-semibold text-foreground">{slide.title}</p>
            <p className="text-xs text-foreground leading-relaxed">{slide.description}</p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 pb-5 border-t border-border pt-3">
            {/* Prev */}
            <button
              type="button"
              onClick={prev}
              disabled={isFirst}
              className="rounded-md p-1.5 text-foreground hover:font-bold hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {SLIDES.map((_, i) => (
                <button
                  // Reason: index is stable — SLIDES is a fixed-length const
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length const array
                  key={i}
                  type="button"
                  onClick={() => setCurrent(i)}
                  className={`rounded-full transition-all cursor-pointer ${
                    i === current
                      ? 'w-4 h-2 bg-primary'
                      : 'w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/60'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>

            {/* Next / Got it */}
            {isLast ? (
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer"
              >
                Got it
              </button>
            ) : (
              <button
                type="button"
                onClick={next}
                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                aria-label="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
