"use client"

import { GrainOverlay } from "@/components/grain-overlay"
import { LiquidBackground } from "@/components/liquid-background"
import { WorkSection } from "@/components/sections/work-section"
import { ServicesSection } from "@/components/sections/services-section"
import { AboutSection } from "@/components/sections/about-section"
import { FaqSection } from "@/components/sections/faq-section"
import { ContactSection } from "@/components/sections/contact-section"
import { SiteFooter } from "@/components/sections/site-footer"
import { MagneticButton } from "@/components/magnetic-button"
import { RotatingText } from "@/components/rotating-text"
import { ProfilePhoto } from "@/components/profile-photo"
import { HeroDashboard } from "@/components/hero-dashboard"
import { HeroStats } from "@/components/hero-stats"
import { HeroQueryBar } from "@/components/hero-query-bar"
import { DownloadCV } from "@/components/download-cv"
import { SpotlightHeroLazy } from "@/components/spotlight/spotlight-hero-lazy"
import { Menu, X, Home as HomeIcon, Briefcase, GraduationCap, UserRound, HelpCircle, Mail, Linkedin, Github } from "lucide-react"
import Link from "next/link"
import { useRef, useEffect, useState } from "react"

// Portfolio-first order: lead with Rakshit's work, skills & story.
// Courses/mentoring comes last (secondary to the portfolio).
const NAV_ITEMS = [
  { label: "Home", Icon: HomeIcon },
  { label: "Experience", Icon: Briefcase },
  { label: "About", Icon: UserRound },
  { label: "FAQ", Icon: HelpCircle },
  { label: "Contact", Icon: Mail },
  { label: "Courses", Icon: GraduationCap },
]

// Named section indices — keep these in sync with NAV_ITEMS + render order.
// Using names (not magic numbers) so future reorders only touch this block.
const SECTION = {
  home: 0,
  experience: 1,
  about: 2,
  faq: 3,
  contact: 4,
  courses: 5,
} as const
const LAST_INDEX = NAV_ITEMS.length - 1

export default function Home() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ""
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [currentSection, setCurrentSection] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const scrollThrottleRef = useRef<number>()

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Plain vertical scroll — jump to a section by index.
  const scrollToSection = (index: number) => {
    setMenuOpen(false)
    const container = scrollContainerRef.current
    const target = container?.children[index] as HTMLElement | undefined
    target?.scrollIntoView({ behavior: "smooth" })
    setCurrentSection(index)
  }

  // Keep the active nav item in sync with vertical scroll position.
  // Sections are min-h-[100dvh] and can grow TALLER than the viewport (long
  // content, mobile), so dividing scrollTop by viewport height drifts — walk
  // the real section offsets instead.
  useEffect(() => {
    const handleScroll = () => {
      if (scrollThrottleRef.current) return
      scrollThrottleRef.current = requestAnimationFrame(() => {
        const container = scrollContainerRef.current
        if (!container) {
          scrollThrottleRef.current = undefined
          return
        }
        const probe = container.scrollTop + container.offsetHeight * 0.5
        let newSection = 0
        const children = container.children
        for (let i = 0; i <= LAST_INDEX && i < children.length; i++) {
          if ((children[i] as HTMLElement).offsetTop <= probe) newSection = i
        }
        if (newSection !== currentSection) setCurrentSection(newSection)
        scrollThrottleRef.current = undefined
      })
    }
    const container = scrollContainerRef.current
    if (container) container.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      if (container) container.removeEventListener("scroll", handleScroll)
      if (scrollThrottleRef.current) cancelAnimationFrame(scrollThrottleRef.current)
    }
  }, [currentSection])

  // Keyboard navigation: Home/End jump to first/last section.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return
      if (e.key === "Home") {
        e.preventDefault()
        scrollToSection(SECTION.home)
      } else if (e.key === "End") {
        e.preventDefault()
        scrollToSection(LAST_INDEX)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [currentSection])

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-background">
      <GrainOverlay />

      {/* Interactive liquid background — base gradient + mouse-reactive blobs */}
      <div
        className={`animated-gradient fixed inset-0 z-0 overflow-hidden transition-opacity duration-700 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="hidden md:block">
          <LiquidBackground />
        </div>
        {/* Lighter vignette so the colour stays vivid but text stays readable. */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40" />
      </div>

      <nav
        className={`fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-5 py-4 transition-opacity duration-700 md:px-12 md:py-6 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      >
        <button onClick={() => scrollToSection(SECTION.home)} className="flex items-center gap-2.5 transition-transform hover:scale-105">
          {/* Brand monogram tile — 3D render (Cycles), 400px source downscaled
              for crispness. Falls back to nothing broken since it's decorative. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${basePath}/rs-logo-3d.png`}
            alt=""
            aria-hidden
            className="h-9 w-9 rounded-lg shadow-lg shadow-black/40 transition-transform duration-300 hover:scale-110 md:h-10 md:w-10"
          />
          <span className="font-sans text-base font-semibold tracking-tight text-foreground md:text-xl">Rakshit Sinha</span>
        </button>

        {/* Desktop nav */}
        <div className="hidden items-center gap-7 md:flex">
          {NAV_ITEMS.map((item, index) => (
            <button
              key={item.label}
              onClick={() => scrollToSection(index)}
              className={`group relative inline-flex items-center gap-1.5 font-sans text-sm font-medium transition-colors ${
                currentSection === index ? "text-foreground" : "text-foreground/80 hover:text-foreground"
              }`}
            >
              <item.Icon className="h-3.5 w-3.5" />
              {item.label}
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
          <MagneticButton variant="ghost" onClick={() => scrollToSection(SECTION.contact)}>
            Let&apos;s connect
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
              key={item.label}
              onClick={() => scrollToSection(index)}
              className={`inline-flex items-center gap-2.5 font-sans text-2xl font-light transition-colors ${
                currentSection === index ? "text-foreground" : "text-foreground/60"
              }`}
            >
              <item.Icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
          <Link
            href="/login/"
            className="font-sans text-2xl font-light text-foreground/60 transition-colors hover:text-foreground"
          >
            Login
          </Link>
          <div className="mt-4">
            <MagneticButton variant="ghost" onClick={() => scrollToSection(SECTION.contact)}>
              Let&apos;s connect
            </MagneticButton>
          </div>
        </div>
      )}

      <div
        id="main"
        ref={scrollContainerRef}
        data-scroll-container
        className={`relative z-10 h-[100dvh] overflow-y-auto overflow-x-hidden transition-opacity duration-700 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* Hero Section — interactive spotlight backdrop BEHIND always-rendered content */}
        <section className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-hidden px-5 pb-20 pt-24 text-center md:px-12 md:pb-16">
          {/* Aurora + data-grid wash for depth (sits at the very back). */}
          <div className="hero-aurora" aria-hidden />
          {/* Spotlight backdrop (draggable lamp + switch on desktop; static beam otherwise). */}
          <SpotlightHeroLazy />

          {/* Hero content — always rendered (server-side), sits above the backdrop. */}
          <div className="relative z-10 flex w-full items-center justify-center">
              <div className="grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
              <div className="flex flex-col items-center px-5 text-center lg:items-start lg:text-left">
                <ProfilePhoto className="mb-6 h-24 w-24 animate-in fade-in zoom-in-95 !rounded-full duration-1000 md:h-28 md:w-28" />
                {/* Editorial kicker — letter-spaced label framed by thin rules. */}
                <div className="mb-6 flex animate-in fade-in items-center gap-3 duration-700">
                  <span className="h-px w-6 bg-foreground/25 md:w-10" />
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/60 md:text-xs">
                    Business Intelligence · Mentor · Mumbai
                  </p>
                  <span className="h-px w-6 bg-foreground/25 lg:hidden md:w-10" />
                </div>
                <h1 className="mb-3 animate-in fade-in slide-in-from-bottom-8 font-sans text-5xl font-light leading-[1.03] tracking-tight duration-1000 md:mb-4 md:text-7xl lg:text-8xl">
                  <span className="shimmer-text text-balance">Rakshit Sinha</span>
                </h1>
                <HeroStats className="mb-5 animate-in fade-in slide-in-from-bottom-4 justify-center duration-1000 delay-100 lg:justify-start" />
                <div className="mb-6 flex animate-in fade-in slide-in-from-bottom-4 items-center justify-center gap-2 font-sans text-xl font-light text-foreground/90 duration-1000 delay-100 lg:justify-start md:mb-7 md:text-3xl">
                  <span className="text-foreground/45">I turn data into</span>
                  <RotatingText
                    words={["decisions", "dashboards", "Power BI reports", "clarity", "confident analysts"]}
                    className="bg-gradient-to-r from-sky-300 to-amber-300 bg-clip-text font-normal text-transparent"
                  />
                </div>
                <p className="mb-5 max-w-xl animate-in fade-in slide-in-from-bottom-4 text-base leading-relaxed text-foreground/80 duration-1000 delay-200 md:mb-6 md:text-lg">
                  <span className="text-pretty">
                    A Senior Business Intelligence professional who makes complex data make sense — and, after hours, a
                    mentor helping the next wave of analysts find their footing.
                  </span>
                </p>
                <HeroQueryBar className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 md:mb-7" />
                <div className="mb-7 flex animate-in fade-in slide-in-from-bottom-4 flex-wrap justify-center gap-2 duration-1000 delay-200 lg:justify-start md:mb-8">
                  {["Tableau", "Power BI", "T-SQL", "Advanced Excel", "Base SAS 9.4"].map((skill) => (
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
                  <MagneticButton size="lg" variant="ghost" onClick={() => scrollToSection(SECTION.experience)}>
                    Explore my work →
                  </MagneticButton>
                  <MagneticButton size="lg" variant="ghost" onClick={() => scrollToSection(SECTION.contact)}>
                    Let&apos;s connect
                  </MagneticButton>
                </div>
                {/* CV (appears once public/rakshit-sinha-cv.pdf is added) + pinned socials. */}
                <div className="mt-4 flex animate-in fade-in items-center gap-3 duration-1000 delay-500">
                  <DownloadCV />
                  <a
                    href="https://www.linkedin.com/in/rakshitsinha555/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Rakshit Sinha on LinkedIn"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/25 bg-foreground/10 text-foreground/80 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-foreground/50 hover:text-foreground"
                  >
                    <Linkedin className="h-4 w-4" />
                  </a>
                  <a
                    href="https://github.com/RakshitSinha18"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Rakshit Sinha on GitHub"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/25 bg-foreground/10 text-foreground/80 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-foreground/50 hover:text-foreground"
                  >
                    <Github className="h-4 w-4" />
                  </a>
                </div>
              </div>

              {/* Signature element — a live mini BI dashboard. */}
              <div className="flex animate-in fade-in slide-in-from-bottom-8 justify-center px-5 duration-1000 delay-500 lg:justify-end lg:px-0">
                <HeroDashboard />
              </div>
              </div>
          </div>

          {currentSection === 0 && (
            <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 animate-in fade-in duration-1000 delay-500 md:block">
              <button
                onClick={() => scrollToSection(SECTION.experience)}
                className="group flex items-center gap-2.5 rounded-full border border-foreground/20 bg-foreground/10 px-4 py-2 backdrop-blur-md transition-all hover:border-foreground/40 hover:bg-foreground/20"
              >
                <span className="font-mono text-xs text-foreground/90">Scroll to explore</span>
                <span className="text-foreground/80 transition-transform duration-300 group-hover:translate-y-0.5">
                  ↓
                </span>
              </button>
            </div>
          )}
        </section>

        <WorkSection />
        <AboutSection scrollToSection={scrollToSection} />
        <FaqSection />
        <ContactSection />
        <ServicesSection />
        <SiteFooter />
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
            key={item.label}
            onClick={() => scrollToSection(index)}
            aria-label={`Go to ${item.label}`}
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
              {item.label}
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
