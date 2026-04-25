import type { Transition } from 'framer-motion'

export const defaultSpring: Transition = {
  type: 'spring',
  stiffness: 140,
  damping: 22,
  mass: 0.6,
}

export const panelSpring: Transition = {
  type: 'spring',
  stiffness: 110,
  damping: 24,
  mass: 0.7,
}

export const pressSpring: Transition = {
  type: 'spring',
  stiffness: 320,
  damping: 22,
  mass: 0.4,
}

export const offlineSpring: Transition = {
  type: 'spring',
  stiffness: 90,
  damping: 20,
  mass: 0.9,
}

export const fadeQuick: Transition = {
  duration: 0.18,
  ease: [0.22, 1, 0.36, 1],
}
