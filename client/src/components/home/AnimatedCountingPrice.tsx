
import { useState, useEffect } from 'react';

/**
 * AnimatedCountingPrice - Counts up to the target value
 */
export default function AnimatedCountingPrice({ value, delay = 0 }: { value: number; delay?: number }) {
    const [displayValue, setDisplayValue] = useState(value - 400);

    useEffect(() => {
        let start = value - 400;
        const duration = 2000;
        let animationFrameId: number;
        let timeoutId: number;

        // Wait for the delay before starting animation
        timeoutId = window.setTimeout(() => {
            const startTime = performance.now();

            const update = (now: number) => {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Ease out quart
                const ease = 1 - Math.pow(1 - progress, 4);

                const current = start + (value - start) * ease;
                setDisplayValue(current);

                if (progress < 1) {
                    animationFrameId = requestAnimationFrame(update);
                }
            };
            animationFrameId = requestAnimationFrame(update);
        }, delay * 1000); // Convert seconds to milliseconds

        return () => {
            clearTimeout(timeoutId);
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [value, delay]);

    return (
        <span>
            {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0,
            }).format(displayValue)}
        </span>
    );
}
