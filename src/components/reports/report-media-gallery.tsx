"use client";

import { useMemo, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type GalleryImage = {
  url: string;
  alt?: string;
};

type ReportMediaGalleryProps = {
  title: string;
  images: GalleryImage[];
  emptyText: string;
};

export function ReportMediaGallery({ title, images, emptyText }: ReportMediaGalleryProps) {
  const [activeImage, setActiveImage] = useState<GalleryImage | null>(null);
  const sanitizedImages = useMemo(
    () => images.filter((item) => typeof item.url === "string" && item.url.trim().length > 0),
    [images]
  );

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h4>
        {sanitizedImages.length > 0 ? (
          <span className="text-xs text-slate-500 dark:text-slate-400">{sanitizedImages.length} image(s)</span>
        ) : null}
      </div>

      {sanitizedImages.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          {emptyText}
        </div>
      ) : (
        <>
          <Carousel className="w-full" opts={{ loop: sanitizedImages.length > 1 }}>
            <CarouselContent>
              {sanitizedImages.map((image, index) => (
                <CarouselItem key={`${image.url}-${index}`}>
                  <button
                    type="button"
                    onClick={() => setActiveImage(image)}
                    className="group relative block w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-900"
                    aria-label={`Open image ${index + 1}`}
                  >
                    <div className="relative aspect-video w-full">
                      <img
                        src={image.url}
                        alt={image.alt || `${title} ${index + 1}`}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    </div>
                    <span className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white">
                      Click to enlarge
                    </span>
                  </button>
                </CarouselItem>
              ))}
            </CarouselContent>
            {sanitizedImages.length > 1 ? (
              <>
                <CarouselPrevious className="left-3 border-slate-300 bg-white/90 text-slate-700 hover:bg-white" />
                <CarouselNext className="right-3 border-slate-300 bg-white/90 text-slate-700 hover:bg-white" />
              </>
            ) : null}
          </Carousel>

          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {sanitizedImages.map((image, index) => (
              <button
                key={`thumb-${image.url}-${index}`}
                type="button"
                onClick={() => setActiveImage(image)}
                className="overflow-hidden rounded-md border border-slate-200 bg-slate-100 transition hover:border-blue-400 dark:border-slate-700 dark:bg-slate-900"
                aria-label={`Open thumbnail ${index + 1}`}
              >
                <div className="aspect-square w-full">
                  <img
                    src={image.url}
                    alt={image.alt || `${title} thumbnail ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      <Dialog open={Boolean(activeImage)} onOpenChange={(open) => !open && setActiveImage(null)}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-5xl rounded-xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-left">{title} - Enlarged View</DialogTitle>
          </DialogHeader>
          {activeImage ? (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-black dark:border-slate-700">
              <img src={activeImage.url} alt={activeImage.alt || title} className="max-h-[75vh] w-full object-contain" />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
