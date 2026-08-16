"use client"

import { GrainOverlay } from "@/components/grain-overlay"
import { LiquidBackground } from "@/components/liquid-background"
import { WorkSection } from "@/components/sections/work-section"
import { ServicesSection } from "@/components/sections/services-section"
import { AboutSection } from "@/components/sections/about-section"
import { ContactSection } from "@/components/sections/contact-section"
import { MagneticButton } from "@/components/magnetic-button"
import { RotatingText } from "@/components/rotating-text"
import { SpotlightHeroLazy } from "@/components/spotlight/spotlight-hero-lazy"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import { useRef, useEffect, useState } from "react"

const NAV_ITEMS = ["Home", "Experience", "Courses", "About", "Contact"]

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

  // Keyboard navigation: arrows / Home / End move between sections (Operable, WCAG).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        if (currentSection < 4) scrollToSection(currentSection + 1)
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        if (currentSection > 0) scrollToSection(currentSection - 1)
      } else if (e.key === "Home") {
        scrollToSection(0)
      } else if (e.key === "End") {
        scrollToSection(4)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [currentSection, isDesktop])

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-background">
      <GrainOverlay />

      {/* Interactive liquid background — base gradient + mouse-reactive blobs */}
      <div
        className={`animated-gradient fixed inset-0 z-0 overflow-hidden transition-opacity duration-700 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      >
        {isDesktop && <LiquidBackground />}
        {/* Lighter vignette so the colour stays vivid but text stays readable. */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40" />
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

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login/"
            className="rounded-full border border-foreground/40 bg-transparent px-5 py-2 font-sans text-sm font-medium text-foreground backdrop-blur-md transition-all hover:scale-[1.02] hover:border-foreground hover:bg-foreground hover:text-background active:scale-[0.98]"
          >
            Login
          </Link>
          <MagneticButton variant="ghost" onClick={() => scrollToSection(4)}>
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
          <Link
            href="/login/"
            className="font-sans text-2xl font-light text-foreground/60 transition-colors hover:text-foreground"
          >
            Login
          </Link>
          <div className="mt-4">
            <MagneticButton variant="ghost" onClick={() => scrollToSection(4)}>
              Book a Session
            </MagneticButton>
          </div>
        </div>
      )}

      <div
        id="main"
        ref={scrollContainerRef}
        data-scroll-container
        className={`relative z-10 h-[100dvh] transition-opacity duration-700 ${
          isLoaded ? "opacity-100" : "opacity-0"
        } flex flex-col overflow-y-auto overflow-x-hidden md:flex-row md:overflow-x-auto md:overflow-y-hidden`}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* Hero Section — interactive spotlight backdrop BEHIND always-rendered content */}
        <section className="relative flex min-h-[100dvh] w-full shrink-0 flex-col items-center justify-center overflow-hidden px-5 pb-20 pt-24 text-center md:w-screen md:px-12 md:pb-16">
          {/* Spotlight backdrop (draggable lamp + switch on desktop; static beam otherwise). */}
          <SpotlightHeroLazy />

          {/* Hero content — always rendered (server-side), sits above the backdrop. */}
          <div className="relative z-10 flex w-full items-center justify-center">
              <div className="flex max-w-3xl flex-col items-center px-5 text-center">
                <div className="mb-4 inline-block animate-in fade-in slide-in-from-bottom-4 rounded-full border border-foreground/20 bg-foreground/15 px-3 py-1.5 backdrop-blur-md duration-700 md:px-4">
                  <p className="font-mono text-[10px] text-foreground/90 md:text-xs">
                    Senior BI Consultant · Mentor · Mumbai, India
                  </p>
                </div>
                <h1 className="mb-2 animate-in fade-in slide-in-from-bottom-8 font-sans text-5xl font-light leading-[1.05] tracking-tight duration-1000 md:mb-3 md:text-7xl lg:text-8xl">
                  <span className="shimmer-text text-balance">Rakshit Sinha</span>
                </h1>
                <div className="mb-5 flex animate-in fade-in slide-in-from-bottom-4 items-center justify-center gap-2 font-sans text-xl font-light text-foreground/90 duration-1000 delay-100 md:mb-6 md:text-3xl">
                  <span className="text-foreground/50">I do</span>
                  <RotatingText
                    words={["Data Analytics", "Tableau Dashboards", "SQL & BI", "Mentoring"]}
                    className="bg-gradient-to-r from-sky-300 to-amber-300 bg-clip-text font-normal text-transparent"
                  />
                </div>
                <p className="mb-5 max-w-2xl animate-in fade-in slide-in-from-bottom-4 text-base leading-relaxed text-foreground/90 duration-1000 delay-200 md:mb-6 md:text-xl">
                  <span className="text-pretty">
                    Results-driven Senior Business Intelligence professional turning complex information into meaningful
                    business insights — and an after-hours mentor helping aspiring professionals grow their skills and
                    careers.
                  </span>
                </p>
                <div className="mb-7 flex animate-in fade-in slide-in-from-bottom-4 flex-wrap justify-center gap-2 duration-1000 delay-200 md:mb-8">
                  {["T-SQL", "Tableau", "Advanced Excel", "Base SAS 9.4"].map((skill) => (
                    <span
                      key={skill}
                      className="cursor-default rounded-full border border-foreground/20 bg-foreground/10 px-3 py-1 font-mono text-[11px] text-foreground/90 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/40 hover:bg-foreground/20 md:text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="flex animate-in fade-in slide-in-from-bottom-4 flex-col items-center gap-4 duration-1000 delay-300 sm:flex-row">
                  {/* Ghost buttons — visible outline at rest, fill in on hover. */}
                  <MagneticButton size="lg" variant="ghost" onClick={() => scrollToSection(4)}>
                    Book a Session
                  </MagneticButton>
                  <MagneticButton size="lg" variant="ghost" onClick={() => scrollToSection(1)}>
                    View experience →
                  </MagneticButton>
                </div>
              </div>
          </div>

          {currentSection === 0 && (
            <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 animate-in fade-in duration-1000 delay-500 md:block">
              <button
                onClick={() => scrollToSection(1)}
                className="group flex items-center gap-2.5 rounded-full border border-foreground/20 bg-foreground/10 px-4 py-2 backdrop-blur-md transition-all hover:border-foreground/40 hover:bg-foreground/20"
              >
                <span className="font-mono text-xs text-foreground/90">
                  {isDesktop ? "Scroll → or use ← → keys" : "Swipe up to explore"}
                </span>
                <span className="text-foreground/80 transition-transform duration-300 group-hover:translate-x-1">
                  {isDesktop ? "→" : "↓"}
                </span>
              </button>
            </div>
          )}
        </section>

        <WorkSection />
        <ServicesSection />
        <AboutSection scrollToSection={scrollToSection} />
        <ContactSection />
      </div>

      {/* Section progress indicator — always shows where you are & how many
          sections remain (Visibility of system status + Goal-gradient). */}
      <div
        className={`fixed z-40 flex gap-2 transition-opacity duration-700 ${
          isLoaded ? "opacity-100" : "opacity-0"
        } bottom-4 left-1/2 -translate-x-1/2 flex-row md:bottom-auto md:left-auto md:right-6 md:top-1/2 md:-translate-x-0 md:-translate-y-1/2 md:flex-col`}
      >
        {NAV_ITEMS.map((item, index) => (
          <button
            key={item}
            onClick={() => scrollToSection(index)}
            aria-label={`Go to ${item}`}
            aria-current={currentSection === index}
            className="group relative flex items-center justify-center p-1.5"
          >
            <span
              className={`block rounded-full transition-all duration-300 ${
                currentSection === index
                  ? "h-2.5 w-2.5 bg-foreground md:h-3 md:w-3"
                  : "h-2 w-2 bg-foreground/40 group-hover:bg-foreground/70"
              }`}
            />
            <span className="pointer-events-none absolute right-full mr-2 hidden whitespace-nowrap rounded-md bg-background/80 px-2 py-1 font-mono text-[10px] text-foreground opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 md:block">
              {item}
            </span>
          </button>
        ))}
      </div>

      <style jsx global>{`
        [data-scroll-container]::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </main>
  )
}
