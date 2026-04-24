import React from "react";
import { motion } from "framer-motion";

/**
 * Wrap any page / section to fade-slide in on mount.
 * Drop-in: <PageTransition>…</PageTransition>
 */
const PageTransition = ({ children, className }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

/**
 * Stagger wrapper for list items.
 * Usage:
 *   <StaggerList>
 *     {items.map((item, i) => (
 *       <StaggerItem key={item.id} index={i}>…</StaggerItem>
 *     ))}
 *   </StaggerList>
 */
const StaggerList = ({ children, className }) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={{
      hidden: {},
      visible: { transition: { staggerChildren: 0.06 } },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

const StaggerItem = ({ children, className }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 10 },
      visible: { opacity: 1, y: 0 },
    }}
    transition={{ duration: 0.2, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

export { PageTransition, StaggerList, StaggerItem };



