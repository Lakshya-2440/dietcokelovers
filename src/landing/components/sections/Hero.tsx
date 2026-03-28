import { motion, useScroll, useTransform } from "framer-motion"
import { Button } from "../ui/Button"
import { Badge } from "../ui/Badge"
import { UploadCloud, ShieldCheck } from "lucide-react"

export function Hero() {
  const { scrollY } = useScroll()
  
  // Parallax effects
  const opacity = useTransform(scrollY, [0, 300], [1, 0])

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-background pt-32 pb-32">
      {/* Background Decor - Minimalist & Premium */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #2A2529 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-charcoal/[0.03] blur-[150px] rounded-full -translate-y-1/2" />
      </div>

      <div className="container relative z-10 mx-auto max-w-7xl px-6 text-center">
        {/* Top Badge */}
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8 }}
           className="flex justify-center mb-10"
        >
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-charcoal/5 border border-charcoal/10 backdrop-blur-sm">
            <div className="flex gap-1">
               <div className="w-1.5 h-1.5 rounded-full bg-charcoal/60 animate-pulse" />
               <div className="w-1.5 h-1.5 rounded-full bg-charcoal/30" />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-charcoal/60">Verified Source indexing</span>
          </div>
        </motion.div>

        {/* Impactful Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="text-6xl md:text-8xl font-serif text-charcoal leading-[1.1] mb-8 tracking-tighter"
        >
          Answers that <br className="hidden md:block" />
          <span className="italic relative px-4">
             only
             <img src="/sparkle.svg" className="absolute -top-4 -right-4 w-12 h-12 opacity-10" alt="" />
          </span> 
          come from your notes.
        </motion.h1>

        {/* Refined Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="text-xl md:text-2xl text-foreground/40 max-w-2xl mx-auto mb-16 leading-relaxed font-light"
        >
          The only AI assistant that prioritizes your textbooks and curated notes over the noise of the internet. Zero noise, zero guesswork.
        </motion.p>

        {/* Primary CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-32"
        >
          <Button size="lg" className="h-20 px-10 bg-black text-white text-xl rounded-2xl group shadow-paper-deep transition-all hover:scale-[1.02] hover:shadow-paper-hover relative overflow-hidden">
            <div className="relative z-10 flex items-center gap-3">
               <UploadCloud className="h-6 w-6 transition-transform group-hover:-translate-y-1" />
               Start Your Library
            </div>
            <motion.div 
               className="absolute inset-0 bg-white/10"
               initial={{ x: "-100%" }}
               whileHover={{ x: "100%" }}
               transition={{ duration: 0.5 }}
            />
          </Button>
          <div className="flex items-center gap-4 text-charcoal/30 font-mono text-[11px] uppercase tracking-widest font-bold">
             <div className="w-12 h-[1px] bg-charcoal/10" />
             Scanned by 12,000+ Students
             <div className="w-12 h-[1px] bg-charcoal/10" />
          </div>
        </motion.div>

        {/* High-Fidelity Product Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
          className="relative mx-auto w-full max-w-[1000px] h-[600px] bg-paleivory rounded-[40px] border border-charcoal/10 shadow-paper-deep overflow-hidden flex"
        >
           {/* Sidebar: Library */}
           <div className="w-64 border-r border-charcoal/5 bg-charcoal/[0.02] p-8 flex flex-col gap-8 text-left">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-charcoal flex items-center justify-center shadow-sm">
                    <ShieldCheck className="w-4 h-4 text-white" />
                 </div>
                 <span className="font-serif text-sm font-bold text-charcoal">Library</span>
              </div>

              <div className="space-y-4">
                 <div className="p-3 bg-white rounded-xl shadow-sm border border-charcoal/5 flex items-center gap-3 cursor-default">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-[11px] font-mono text-charcoal/60 truncate">Biol_101_Lecture_4.pdf</span>
                 </div>
                 <div className="p-3 hover:bg-white/50 rounded-xl transition-colors flex items-center gap-3 cursor-pointer group/item">
                    <div className="w-2 h-2 rounded-full bg-charcoal/10" />
                    <span className="text-[11px] font-mono text-charcoal/40 truncate group-hover/item:text-charcoal/60">Anatomy_Textbook.pdf</span>
                 </div>
                 <div className="p-3 hover:bg-white/50 rounded-xl transition-colors flex items-center gap-3 cursor-pointer group/item">
                    <div className="w-2 h-2 rounded-full bg-charcoal/10" />
                    <span className="text-[11px] font-mono text-charcoal/40 truncate group-hover/item:text-charcoal/60">Lab_Notes_v2.pdf</span>
                 </div>
              </div>

              <div className="mt-auto">
                 <div className="h-1 w-full bg-charcoal/5 rounded-full overflow-hidden">
                    <motion.div 
                       initial={{ width: 0 }} 
                       animate={{ width: "65%" }} 
                       transition={{ duration: 1.5, delay: 1 }}
                       className="h-full bg-charcoal/30" 
                    />
                 </div>
                 <span className="text-[9px] font-mono text-charcoal/40 uppercase mt-2 block tracking-widest font-bold">1.2GB / 2GB Indexing</span>
              </div>
           </div>

           {/* Main Area: Chat Window */}
           <div className="flex-1 flex flex-col relative">
              {/* Window Header */}
              <div className="px-10 py-6 border-b border-charcoal/5 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="h-5 w-px bg-charcoal/10" />
                    <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-charcoal/40">Query Session: Golgi Function</span>
                 </div>
                 <Badge variant="outline" className="font-mono text-[9px] uppercase tracking-widest border-charcoal/10 px-3">Sync Locked</Badge>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 p-12 flex flex-col gap-10 overflow-y-auto">
                 <div className="flex flex-col items-end gap-3 max-w-[80%] ml-auto">
                    <div className="px-6 py-4 bg-charcoal text-paleivory rounded-[24px] text-sm shadow-lg leading-relaxed text-left">
                       What is the primary function of the Golgi apparatus in protein synthesis?
                    </div>
                 </div>

                 <div className="flex gap-6 max-w-[90%] group/answer">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-charcoal/10 flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover/answer:scale-105">
                       <ShieldCheck className="w-6 h-6 text-charcoal" />
                    </div>
                    <div className="flex flex-col gap-4">
                       <div className="px-10 py-8 bg-white border border-charcoal/10 rounded-[32px] rounded-tl-none shadow-paper text-charcoal/80 text-[16px] leading-[1.6] text-left relative overflow-hidden">
                          <p className="mb-6">The primary function of the Golgi apparatus is to <span className="text-charcoal font-bold underline decoration-charcoal/20 underline-offset-4">post-translationally modify, sort, and package</span> proteins into vesicles for secretion.</p>
                          
                          <div className="flex flex-wrap gap-3">
                             <div className="flex items-center gap-2 px-3 py-1.5 bg-charcoal/5 border border-charcoal/5 rounded-lg font-mono text-[11px] font-bold text-charcoal/50 hover:bg-charcoal/10 transition-colors cursor-pointer">
                                <div className="h-1 w-1 bg-green-500 rounded-full" />
                                Lecture 4, Page 12
                             </div>
                             <div className="flex items-center gap-2 px-3 py-1.5 bg-charcoal/5 border border-charcoal/5 rounded-lg font-mono text-[11px] font-bold text-charcoal/50 hover:bg-charcoal/10 transition-colors cursor-pointer">
                                <div className="h-1 w-1 bg-green-500 rounded-full" />
                                Biol_Anatomy.pdf, p.241
                             </div>
                          </div>

                          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-8xl font-serif italic italic font-bold">100%</div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Modern Glassy Input Area */}
              <div className="p-10 pt-0">
                 <div className="h-16 w-full rounded-2xl border border-charcoal/10 bg-white/40 backdrop-blur-md shadow-lg flex items-center px-8 gap-4 group/input hover:border-charcoal/30 transition-all">
                    <div className="w-1.5 h-1.5 rounded-full bg-charcoal/10 group-hover/input:bg-charcoal/40 transition-colors" />
                    <div className="flex-1 text-charcoal/20 font-light text-sm italic">Compare with Lab Notes from Tuesday...</div>
                    <Button size="icon" className="w-10 h-10 rounded-xl bg-charcoal text-black hover:scale-105 transition-transform">
                       <UploadCloud className="w-4 h-4" />
                    </Button>
                 </div>
              </div>
           </div>

           {/* Hover gradient effect */}
           <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-charcoal/[0.01] pointer-events-none" />
        </motion.div>
      </div>
      
      {/* Scroll indicator */}
      <motion.div 
        style={{ opacity }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
      >
         <div className="h-12 w-px bg-gradient-to-b from-charcoal/20 to-transparent" />
      </motion.div>
    </section>
  )
}
