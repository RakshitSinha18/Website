"use client"

import { CustomCursor } from "@/components/custom-cursor"
import { GrainOverlay } from "@/components/grain-overlay"
import { WorkSection } from "@/components/sections/work-section"
import { ServicesSection } from "@/components/sections/services-section"
import { AboutSection } from "@/components/sections/about-section"
import { ContactSection } from "@/components/sections/contact-section"
import { MagneticButton } from "@/components/magnetic-button"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Menu, X } from "lucide-react"
import { useRef, useEffect, useState } from "react"

const NAV_ITEMS = ["Home", "Experience", "Skills", "About", "Contact"]

export default function Home() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [currentSection, setCurrentSection] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const touchStartY = useRef(0)
  const touchStartX = useRef(0)
  const scrollThrottleRef = useRef<number>()

  // Desktop drives a horizontal "slide" experience; mobile is normal vertical scroll.
  const isDesktop = useMediaQuery("(min-width: 768px)")

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const scrollToSection = (index: number) => {
    setMenuOpen(false)
    const container = scrollContainerRef.current
    if (!container) return

    if (isDesktop) {
      const sectionWidth = container.offsetWidth
      container.scrollTo({ left: sectionWidth * index, behavior: "smooth" })
    } else {
      const target = container.children[index] as HTMLElement | undefined
      target?.scrollIntoView({ behavior: "smooth" })
    }
    setCurrentSection(index)
  }

  // --- Desktop-only: hijack vertical wheel/touch to scroll horizontally ---
  useEffect(() => {
    if (!isDesktop) return

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY
      touchStartX.current = e.touches[0].clientX
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (Math.abs(e.touches[0].clientY - touchStartY.current) > 10) {
        e.preventDefault()
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const deltaY = touchStartY.current - e.changedTouches[0].clientY
      const deltaX = touchStartX.current - e.changedTouches[0].clientX

      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50) {
        if (deltaY > 0 && currentSection < 4) scrollToSection(currentSection + 1)
        else if (deltaY < 0 && currentSection > 0) scrollToSection(currentSection - 1)
      }
    }

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault()
        const container = scrollContainerRef.current
        if (!container) return
        container.scrollBy({ left: e.deltaY, behavior: "instant" as ScrollBehavior })
        const newSection = Math.round(container.scrollLeft / container.offsetWidth)
        if (newSection !== currentSection) setCurrentSection(newSection)
      }
    }

    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener("touchstart", handleTouchStart, { passive: true })
      container.addEventListener("touchmove", handleTouchMove, { passive: false })
      container.addEventListener("touchend", handleTouchEnd, { passive: true })
      container.addEventListener("wheel", handleWheel, { passive: false })
    }

    return () => {
      if (container) {
        container.removeEventListener("touchstart", handleTouchStart)
        container.removeEventListener("touchmove", handleTouchMove)
        container.removeEventListener("touchend", handleTouchEnd)
        container.removeEventListener("wheel", handleWheel)
      }
    }
  }, [currentSection, isDesktop])

  // Keep the active nav item in sync with scroll position (both axes).
  useEffect(() => {
    const handleScroll = () => {
      if (scrollThrottleRef.current) return
      scrollThrottleRef.current = requestAnimationFrame(() => {
        const container = scrollContainerRef.current
        if (!container) {
          scrollThrottleRef.current = undefined
          return
        }

        const newSection = isDesktop
          ? Math.round(container.scrollLeft / container.offsetWidth)
          : Math.round(container.scrollTop / container.offsetHeight)

        if (newSection !== currentSection && newSection >= 0 && newSection <= 4) {
          setCurrentSection(newSection)
        }
        scrollThrottleRef.current = undefined
      })
    }

    const container = scrollContainerRef.current
    if (container) container.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      if (container) container.removeEventListener("scroll", handleScroll)
      if (scrollThrottleRef.current) cancelAnimationFrame(scrollThrottleRef.current)
    }
  }, [currentSection, isDesktop])

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-background">
      {isDesktop && <CustomCursor />}
      <GrainOverlay />

      {/* Animated gradient background (CSS-based) */}
      <div
        className={`animated-gradient fixed inset-0 z-0 transition-opacity duration-700 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        style={{ contain: "strict" }}
      >
        <div className="absolute inset-0 bg-black/25" />
      </div>

      <nav
        className={`fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-5 py-4 transition-opacity duration-700 md:px-12 md:py-6 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      >
        <button onClick={() => scrollToSection(0)} className="flex items-center gap-2 transition-transform hover:scale-105">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground/15 backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-foreground/25 md:h-10 md:w-10">
            <span className="font-sans text-base font-bold text-foreground md:text-xl">RS</span>
          </div>
          <span className="font-sans text-base font-semibold tracking-tight text-foreground md:text-xl">Rakshit Sinha</span>
        </button>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          {NAV_ITEMS.map((item, index) => (
            <button
              key={item}
              onClick={() => scrollToSection(index)}
              className={`group relative font-sans text-sm font-medium transition-colors ${
                currentSection === index ? "text-foreground" : "text-foreground/80 hover:text-foreground"
              }`}
            >
              {item}
              <span
                className={`absolute -bottom-1 left-0 h-px bg-foreground transition-all duration-300 ${
                  currentSection === index ? "w-full" : "w-0 group-hover:w-full"
                }`}
              />
            </button>
          ))}
        </div>

        <div className="hidden md:block">
          <MagneticButton variant="secondary" onClick={() => scrollToSection(4)}>
            Book a Session
          </MagneticButton>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground/15 text-foreground backdrop-blur-md md:hidden"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-background/90 backdrop-blur-xl md:hidden">
          {NAV_ITEMS.map((item, index) => (
            <button
              key={item}
              onClick={() => scrollToSection(index)}
              className={`font-sans text-2xl font-light transition-colors ${
                currentSection === index ? "text-foreground" : "text-foreground/60"
              }`}
            >
              {item}
            </button>
          ))}
          <div className="mt-4">
            <MagneticButton variant="primary" onClick={() => scrollToSection(4)}>
              Book a Session
            </MagneticButton>
          </div>
        </div>
      )}

      <div
        ref={scrollContainerRef}
        data-scroll-container
        className={`relative z-10 h-[100dvh] transition-opacity duration-700 ${
          isLoaded ? "opacity-100" : "opacity-0"
        } flex flex-col overflow-y-auto overflow-x-hidden md:flex-row md:overflow-x-auto md:overflow-y-hidden`}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* Hero Section */}
        <section className="flex min-h-[100dvh] w-full shrink-0 flex-col justify-end px-5 pb-16 pt-24 md:w-screen md:px-12 md:pb-24">
          <div className="max-w-3xl">
            <div className="mb-4 inline-block animate-in fade-in slide-in-from-bottom-4 rounded-full border border-foreground/20 bg-foreground/15 px-3 py-1.5 backdrop-blur-md duration-700 md:px-4">
              <p className="font-mono text-[10px] text-foreground/90 md:text-xs">
                Senior BI Consultant · Mentor · Mumbai, India
              </p>
            </div>
            <h1 className="mb-5 animate-in fade-in slide-in-from-bottom-8 font-sans text-5xl font-light leading-[1.05] tracking-tight text-foreground duration-1000 md:mb-6 md:text-7xl lg:text-8xl">
              <span className="text-balance">Rakshit Sinha</span>
            </h1>
            <p className="mb-5 max-w-2xl animate-in fade-in slide-in-from-bottom-4 text-base leading-relaxed text-foreground/90 duration-1000 delay-200 md:mb-6 md:text-xl">
              <span className="text-pretty">
                Results-driven Senior Business Intelligence professional turning complex information into meaningful
                business insights — and an after-hours mentor helping aspiring professionals grow their skills and
                careers.
              </span>
            </p>
            <div className="mb-7 flex animate-in fade-in slide-in-from-bottom-4 flex-wrap gap-2 duration-1000 delay-200 md:mb-8">
              {["T-SQL", "Tableau", "Advanced Excel", "Base SAS 9.4"].map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-foreground/20 bg-foreground/10 px-3 py-1 font-mono text-[11px] text-foreground/90 backdrop-blur-md md:text-xs"
                >
                  {skill}
                </span>
              ))}
            </div>
            <div className="flex animate-in fade-in slide-in-from-bottom-4 flex-col gap-3 duration-1000 delay-300 sm:flex-row sm:items-center">
              <MagneticButton size="lg" variant="primary" onClick={() => scrollToSection(4)}>
                Book a Session
              </MagneticButton>
              <MagneticButton size="lg" variant="secondary" onClick={() => scrollToSection(1)}>
                View Experience
              </MagneticButton>
            </div>
          </div>

          <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 animate-in fade-in duration-1000 delay-500 md:block">
            <div className="flex items-center gap-2">
              <p className="font-mono text-xs text-foreground/80">
                {isDesktop ? "Scroll to explore" : "Swipe up to explore"}
              </p>
              <div className="flex h-6 w-12 items-center justify-center rounded-full border border-foreground/20 bg-foreground/15 backdrop-blur-md">
                <div className="h-2 w-2 animate-pulse rounded-full bg-foreground/80" />
              </div>
            </div>
          </div>
        </section>

        <WorkSection />
        <ServicesSection />
        <AboutSection scrollToSection={scrollToSection} />
        <ContactSection />
      </div>

      <style jsx global>{`
        [data-scroll-container]::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </main>
  )
}
