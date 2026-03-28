import { motion } from "framer-motion"
import { Button } from "../ui/Button"
import { UploadCloud, Shield } from "lucide-react"

export function FinalCTA() {
  return (
    <section 
      className="relative w-full py-48 overflow-hidden"
      style={{ backgroundColor: '#2A2529', color: '#F3F0E7' }}
    >
      {/* Background visual flair */}
      <div className="absolute inset-0 z-0 flex justify-center items-center pointer-events-none opacity-[0.05]">
        <div className="w-[800px] h-[800px] rounded-full border border-paleivory/50" />
        <div className="absolute w-[600px] h-[600px] rounded-full border border-paleivory/50" />
        <div className="absolute w-[400px] h-[400px] rounded-full border border-paleivory/50" />
      </div>

      <div className="container relative z-10 mx-auto max-w-4xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-paleivory/5 rounded-[40px] border border-paleivory/10 shadow-paper-deep p-12 md:p-24 backdrop-blur-sm relative overflow-hidden"
        >
          {/* Decorative Corner Folds */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-transparent via-transparent to-paleivory/5" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-transparent via-transparent to-paleivory/5" />

          <h2 className="text-4xl md:text-7xl font-serif text-paleivory mb-8 leading-tight">
            Stop guessing.<br />
            <span className="italic text-paleivory/80">Start verifying.</span>
          </h2>
          
          <p className="text-lg md:text-xl text-paleivory/70 mb-12 max-w-xl mx-auto leading-relaxed">
            Experience the only study copilot that treats your academic material with the rigor it deserves.
          </p>

          <div className="flex flex-col items-center gap-8">
            <Button size="lg" className="h-16 px-10 text-lg gap-3 group w-full sm:w-auto rounded-xl bg-white text-black">
              <UploadCloud className="h-6 w-6 transition-transform group-hover:-translate-y-0.5" />
              Upload Your Notes
            </Button>
            
            <div className="flex items-center gap-3 text-paleivory/40 font-medium font-mono text-[10px] uppercase tracking-[0.2em] bg-paleivory/5 px-6 py-2.5 rounded-full border border-paleivory/5">
              <Shield className="w-4 h-4" />
              Your files never leave your workspace
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
