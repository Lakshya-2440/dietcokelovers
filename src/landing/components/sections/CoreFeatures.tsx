import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BookOpen, SearchX, BrainCircuit, CheckCircle2 } from "lucide-react"
import { ChatBubble } from "../ui/ChatBubble"
import { Citation } from "../ui/Citation"
import { cn } from "../../lib/utils"

type FeatureTab = "scoped" | "notfound" | "study"

export function CoreFeatures() {
  const [activeTab, setActiveTab] = useState<FeatureTab>("scoped")

  return (
    <section id="features" className="relative w-full bg-background py-32 overflow-hidden">
      <div className="container mx-auto max-w-7xl px-6 md:px-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif text-foreground mb-4">Precision Engineering for Students</h2>
          <p className="text-lg text-foreground/75 max-w-2xl mx-auto">
            AskMyNotes isn't a general chatbot. It's a specialized tool built to process, retrieve, and teach from your exact curriculum.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          
          {/* Left Navigation */}
          <div className="flex flex-col gap-4 lg:w-1/3">
            <FeatureNavItem 
              active={activeTab === "scoped"} 
              onClick={() => setActiveTab("scoped")}
              icon={<BookOpen className="w-5 h-5" />}
              title="Subject-Scoped Brain"
              description="Switch between subjects instantly. The AI's entire context shifts to only index notes from that specific subject."
            />
            <FeatureNavItem 
              active={activeTab === "notfound"} 
              onClick={() => setActiveTab("notfound")}
              icon={<SearchX className="w-5 h-5" />}
              title="The 'Not Found' Guarantee"
              description="If the answer isn't in your notes, we won't invent one. Tricky questions are met with honest transparency."
            />
            <FeatureNavItem 
              active={activeTab === "study"} 
              onClick={() => setActiveTab("study")}
              icon={<BrainCircuit className="w-5 h-5" />}
              title="Active Study Mode"
              description="Generate MCQs and short-answer quizzes directly from your materials to test your retention."
            />
          </div>

          {/* Right Interactive Area */}
          <div className="lg:w-2/3 h-[500px] relative bg-paleivory rounded-2xl shadow-paper-deep border border-charcoal/5 p-6 md:p-10 overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === "scoped" && <ScopedBrainDemo key="scoped" />}
              {activeTab === "notfound" && <NotFoundDemo key="notfound" />}
              {activeTab === "study" && <StudyModeDemo key="study" />}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </section>
  )
}

function FeatureNavItem({ active, onClick, icon, title, description }: { active: boolean, onClick: () => void, icon: React.ReactNode, title: string, description: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "text-left p-5 rounded-xl transition-all duration-300 border border-transparent outline-none group",
        active ? "bg-paleivory shadow-paper border-charcoal/5" : "hover:bg-charcoal/5"
      )}
    >
      <div className={cn("flex items-center gap-3 mb-2 font-serif text-lg", active ? "text-charcoal" : "text-foreground")}>
        <div className={cn("p-2 rounded-lg", active ? "bg-charcoal/10" : "bg-black/5 group-hover:bg-paleivory")}>
          {icon}
        </div>
        <h3>{title}</h3>
      </div>
      <p className="text-sm text-foreground/70 leading-relaxed pl-12">{description}</p>
    </button>
  )
}

function ScopedBrainDemo() {
  const [subject, setSubject] = useState<"history" | "physics">("history")

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="h-full flex flex-col"
    >
      <div className="flex gap-2 mb-8 p-1 bg-charcoal/5 rounded-lg w-fit">
        <button 
          onClick={() => setSubject("history")}
          className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors", subject === "history" ? "bg-white shadow-sm text-foreground" : "text-foreground/60 hover:text-foreground")}
        >
          European Hist.
        </button>
        <button 
          onClick={() => setSubject("physics")}
          className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors", subject === "physics" ? "bg-white shadow-sm text-foreground" : "text-foreground/60 hover:text-foreground")}
        >
          Quantum Phys.
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-4">
        <ChatBubble role="user" className="mb-6">What is string theory?</ChatBubble>
        
        <AnimatePresence mode="popLayout">
          {subject === "history" ? (
            <motion.div key="history" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <ChatBubble role="assistant">
                I cannot find any references to "string theory" in your European History notes. The closest matches relate to stringed instruments in the Renaissance period.
              </ChatBubble>
            </motion.div>
          ) : (
            <motion.div key="physics" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <ChatBubble role="assistant">
                According to your Lecture 4 notes, <Citation number={1}>string theory</Citation> is a theoretical framework in which the point-like particles of particle physics are replaced by one-dimensional objects called strings.
              </ChatBubble>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

function NotFoundDemo() {
  const [asked, setAsked] = useState(false)

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="h-full flex flex-col justify-center"
    >
      <div className="bg-charcoal/5 p-4 rounded-xl mb-6">
        <p className="text-xs font-mono text-foreground/50 mb-2 uppercase tracking-wider">Document Context</p>
        <p className="text-sm font-serif">"The French Revolution began in 1789 and ended in 1799..."</p>
      </div>

      <div className="flex-1 flex flex-col justify-end pb-4">
        {asked ? (
          <div className="space-y-6">
            <ChatBubble role="user">What was the weather like on the day the revolution started?</ChatBubble>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <ChatBubble role="assistant" className="border-charcoal/20 bg-charcoal/5">
                <div className="flex items-center gap-2 text-charcoal mb-1 font-medium text-sm">
                  <SearchX className="w-4 h-4" /> Not found in notes
                </div>
                Your notes discuss the timeline and political causes of the French Revolution, but they do not mention the meteorological conditions on the starting day.
              </ChatBubble>
            </motion.div>
          </div>
        ) : (
          <div className="text-center">
            <button 
              onClick={() => setAsked(true)}
              className="px-6 py-3 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors shadow-paper inline-flex items-center gap-2"
            >
              Ask Trick Question
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function StudyModeDemo() {
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null)
  const [isGenerated, setIsGenerated] = useState(false)

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="h-full flex flex-col items-center justify-center p-4 relative"
    >
      <AnimatePresence mode="wait">
        {!isGenerated ? (
          <motion.div
            key="generate-btn"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
             <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-charcoal/5 text-charcoal shadow-sm">
                <BrainCircuit className="h-8 w-8" />
             </div>
             <h3 className="font-serif text-2xl text-foreground mb-2">Test Your Knowledge</h3>
             <p className="text-foreground/60 mb-8 max-w-[250px] mx-auto text-sm">
               Generate questions directly from "Bio_Ch4.pdf"
             </p>
             <button
               onClick={() => setIsGenerated(true)}
               className="px-6 py-3 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-all active:scale-95 shadow-paper inline-flex items-center gap-2 font-medium"
             >
               <BrainCircuit className="w-4 h-4" />
               Generate Practice Set
             </button>
          </motion.div>
        ) : (
          <motion.div
            key="question-box"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="w-full flex flex-col h-full"
          >
            <div className="flex items-center gap-2 mb-6">
              <BrainCircuit className="w-5 h-5 text-charcoal" />
              <h3 className="font-serif text-lg font-medium">Practice Question</h3>
            </div>

            <div className="bg-background rounded-xl p-6 border border-charcoal/10 shadow-sm relative w-full">
              <p className="font-medium text-[15px] mb-6 leading-relaxed text-left">Based on your upload "Bio_Ch4.pdf", which organelle is considered the primary site of cellular transpiration?</p>
              
              <div className="space-y-3">
                {[
                  { id: 0, text: "Nucleus", correct: false },
                  { id: 1, text: "Mitochondria", correct: true },
                  { id: 2, text: "Ribosome", correct: false },
                  { id: 3, text: "Golgi Apparatus", correct: false },
                ].map((opt, index) => (
                  <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 + (index * 0.1) }}
                    key={opt.id}
                    onClick={() => setSelectedOpt(opt.id)}
                    disabled={selectedOpt !== null}
                    className={cn(
                      "w-full text-left p-4 rounded-lg border transition-all flex items-center justify-between",
                      selectedOpt === null ? "border-charcoal/10 hover:border-charcoal/50 hover:bg-charcoal/5 cursor-pointer" :
                      opt.correct ? "border-charcoal bg-charcoal/10 text-charcoal" :
                      selectedOpt === opt.id ? "border-charcoal/40 bg-charcoal/5 text-charcoal/70" : "border-charcoal/5 opacity-50"
                    )}
                  >
                    <span>{opt.text}</span>
                    {selectedOpt !== null && opt.correct && <CheckCircle2 className="w-5 h-5 text-charcoal" />}
                  </motion.button>
                ))}
              </div>

              {selectedOpt !== null && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-6 pt-4 border-t border-charcoal/10 overflow-hidden text-left"
                >
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    <span className="font-medium text-foreground">Explanation:</span> In Chapter 4 (Page 42), the mitochondria is explicitly defined as the "powerhouse of the cell, where cellular respiration primarily occurs to generate ATP."
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
