import { motion, useScroll, useSpring } from 'framer-motion'
import { Navbar } from './components/ui/Navbar'
import { Hero } from './components/sections/Hero'
import { TheProblem } from './components/sections/TheProblem'
import { CoreFeatures } from './components/sections/CoreFeatures'
import { Transparency } from './components/sections/Transparency'
import { UseCases } from './components/sections/UseCases'
import { FinalCTA } from './components/sections/FinalCTA'

function App() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  return (
    <div className="bg-background min-h-screen text-foreground font-sans">
      <Navbar />
      
      {/* Reading Progress Bar */}
      <motion.div
        className="fixed top-20 left-0 right-0 h-[2px] bg-charcoal/80 origin-left z-50 pointer-events-none"
        style={{ scaleX }}
      />
      
      <main>
        <Hero />
        <TheProblem />
        <CoreFeatures />
        <Transparency />
        <UseCases />
        <FinalCTA />
      </main>
    </div>
  )
}

export default App
