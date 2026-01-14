"use client";

import { useEffect, useState } from "react";

interface PreloadImagesProps {
    images: string[];
}

export function PreloadImages({ images }: PreloadImagesProps) {
    // We render hidden regular img tags. 
    // Browsers will cache them. 
    // This is simple and effective for standard HTTP caching.

    if (!images || images.length === 0) return null;

    return (
        <div style={{ display: 'none' }} aria-hidden="true">
            {images.map((src, i) => (
                <img key={i} src={src} alt="" />
            ))}
        </div>
    );
}
