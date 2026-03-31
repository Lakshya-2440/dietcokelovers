import * as React from "react"
import { motion, useScroll, useTransform, useSpring } from "framer-motion"
import { UploadCloud, FileText, Database, Search, Target, Link } from "lucide-react"

const PIPELINE_STEPS = [
  {
    icon: UploadCloud,
    title: "Upload",
    desc: "Your course materials are securely uploaded to your private workspace, maintaining native formatting.",
  },
  {
    icon: FileText,
    title: "Chunking",
    desc: "We break down massive textbooks into granular, semantically meaningful paragraphs using intelligent parsing.",
  },
  {
    icon: Database,
    title: "Embedding",
    desc: "Each chunk is mathematically mapped into a high-dimensional vector space for lightning-fast semantic search.",
  },
  {
    icon: Search,
    title: "Retrieval",
    desc: "When you ask a question, we instantly find the most relevant mathematical matches within your precise context.",
  },
  {
    icon: Target,
    title: "Synthesis",
    desc: "The AI isolates and reads only the retrieved chunks, synthesizing a hyper-accurate, direct answer.",
  },
  {
    icon: Link,
    title: "Citation",
    desc: "Every claim is linked directly back to the exact source document, page, and paragraph for instant verification.",
  },
]

export function Transparency() {
  const targetRef = React.useRef<HTMLDivElement>(null)
  
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end start"]
  })

  // Add physically modeled smoothing to the raw scroll value
  const smoothProgress = useSpring(scrollYProgress, {
    mass: 0.1,
    stiffness: 100,
    damping: 20,
    restDelta: 0.001
  })

  // Smooth horizontal scroll based on the spring value
  const x = useTransform(smoothProgress, [0, 1], ["10%", "-55%"])

  return (
    <section 
      id="how-it-works" 
      ref={targetRef} 
      className="relative h-[100vh] bg-charcoal text-paleivory overflow-hidden"
    >
      {/* Dynamic Background Noise / Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #FFFFFF 1px, transparent 0)', backgroundSize: '48px 48px' }} />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-paleivory/[0.02] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-paleivory/[0.01] rounded-full blur-[100px] pointer-events-none" />

      {/* Sticky container */}
      <div className="sticky top-0 flex flex-col justify-center h-screen overflow-hidden">
        
        {/* Header Section */}
        <div className="absolute top-24 md:top-32 left-8 md:left-24 z-20 w-full max-w-2xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-paleivory/5 border border-paleivory/10 mb-6 backdrop-blur-md"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-paleivory/60 animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-paleivory/60">System Architecture</span>
          </motion.div>
          <h2 className="text-5xl md:text-7xl font-serif text-white mb-6 tracking-tight leading-[1.1]">
            Complete Transparency.
          </h2>
          <p className="text-xl text-paleivory/50 max-w-xl leading-relaxed font-light">
            We don't believe in "magic" AI models that obscure how they arrive at an answer. Here is exactly how your data flows from upload to citation.
          </p>
        </div>

        {/* Horizontal Scrolling Track */}
        <div className="relative mt-48 md:mt-24 z-10 w-full overflow-hidden">
          {/* Faint connecting line running behind all cards */}
          <div className="absolute top-1/2 left-0 w-[200vw] h-px bg-gradient-to-r from-transparent via-paleivory/10 to-transparent -translate-y-1/2 z-0" />

          <motion.div style={{ x }} className="flex gap-8 pr-8 md:pr-24 pl-[50vw] md:pl-[60vw] py-20 items-center w-max relative z-10">
            {PIPELINE_STEPS.map((step, index) => {
              const Icon = step.icon
              const stepNumber = String(index + 1).padStart(2, '0')
              
              return (
                <div 
                  key={index}
                  className="group relative flex h-[440px] w-[360px] shrink-0 flex-col justify-between overflow-hidden rounded-[32px] bg-[#3B3539]/40 border border-paleivory/5 p-10 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:bg-[#3B3539]/80 hover:border-paleivory/15 hover:-translate-y-4"
                >
                  {/* Huge background number */}
                  <div className="absolute -bottom-8 -right-4 text-[180px] font-serif font-bold text-paleivory/[0.03] leading-none pointer-events-none transition-transform duration-700 group-hover:scale-110 group-hover:text-paleivory/[0.06] select-none">
                    {stepNumber}
                  </div>

                  {/* Top soft light reflection */}
                  <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-paleivory/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Subtle radial glow on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-paleivory/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  <div className="relative z-10 h-full flex flex-col">
                    <div className="mb-12 flex h-16 w-16 items-center justify-center rounded-2xl bg-black/40 border border-paleivory/10 text-white shadow-inner transition-transform duration-500 group-hover:scale-110 group-hover:bg-paleivory/10 group-hover:border-paleivory/20">
                      <Icon className="h-7 w-7 opacity-70 group-hover:opacity-100 transition-opacity" />
                    </div>
                    
                    <div className="mt-auto">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-[11px] font-mono font-bold text-paleivory/30 tracking-[0.2em] uppercase">Phase {stepNumber}</span>
                        <div className="h-px flex-1 bg-paleivory/10" />
                      </div>
                      
                      <h3 className="mb-4 font-serif text-3xl font-medium text-white tracking-tight group-hover:text-white transition-colors">{step.title}</h3>
                      
                      <p className="text-[15px] leading-relaxed text-paleivory/50 group-hover:text-paleivory/80 transition-colors font-light">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
