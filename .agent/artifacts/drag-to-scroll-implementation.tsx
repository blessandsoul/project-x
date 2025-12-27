// Add this to the SimilarVehicles component after line 533

// Drag-to-scroll state
const scrollContainerRef = useRef<HTMLDivElement>(null)
const [isDragging, setIsDragging] = useState(false)
const [startX, setStartX] = useState(0)
const [scrollLeft, setScrollLeft] = useState(0)

// Drag-to-scroll handlers - add these after handleToggleWatch (around line 572)
const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return
    setIsDragging(true)
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft)
    setScrollLeft(scrollContainerRef.current.scrollLeft)
}

const handleMouseLeave = () => {
    setIsDragging(false)
}

const handleMouseUp = () => {
    setIsDragging(false)
}

const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollContainerRef.current.offsetLeft
    const walk = (x - startX) * 2 // Scroll speed multiplier
    scrollContainerRef.current.scrollLeft = scrollLeft - walk
}

// Replace line 606 with:
<div
    ref={scrollContainerRef}
    className={cn(
        "flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide select-none",
        isDragging ? "cursor-grabbing" : "cursor-grab"
    )}
    onMouseDown={handleMouseDown}
    onMouseLeave={handleMouseLeave}
    onMouseUp={handleMouseUp}
    onMouseMove={handleMouseMove}
>
