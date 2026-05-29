"use client";

import { AnimatePresence, motion } from "framer-motion";

export function AiPageLoader({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="pointer-events-none fixed inset-x-0 top-0 z-[110] h-1 overflow-hidden bg-primary/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          aria-live="polite"
          aria-label="Loading route"
        >
          <motion.div
            className="h-full rounded-r-full bg-gradient-to-r from-primary via-success to-warning shadow-glow"
            initial={{ x: "-60%", width: "35%" }}
            animate={{ x: "260%", width: "46%" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeInOut", repeat: Infinity }}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
