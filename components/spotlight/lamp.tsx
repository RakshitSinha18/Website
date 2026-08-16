// src/components/lamp.tsx

"use client"

import { motion, type MotionValue } from "framer-motion"

interface LampProps {
  x: MotionValue<number>
  y: MotionValue<number>
  rotation: MotionValue<number>
  anchor: { x: number; y: number }
  isLightOn: boolean
  onPointerDown: (e: React.PointerEvent) => void
  onCordPull: () => void
}

export function Lamp({ x, y, rotation, anchor, isLightOn, onPointerDown, onCordPull }: LampProps) {
  return (
    <>
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-40" style={{ overflow: "visible" }}>
        <motion.line
          x1={anchor.x}
          y1={anchor.y}
          x2={x}
          y2={y}
          stroke="#e2e8f0"
          strokeWidth={3}
          strokeLinecap="round"
        />
      </svg>

      <motion.div
        className="pointer-events-auto absolute z-50 cursor-grab active:cursor-grabbing"
        style={{
          x, y, rotate: rotation, width: 120, height: 150,
          originX: "50%", originY: "0%", translateX: "-50%", translateY: "-15px",
        }}
        onPointerDown={onPointerDown}
      >

        {/*
        <motion.div
          className="absolute inset-0 flex justify-center items-start pt-5"
          animate={{ opacity: isLightOn ? 1 : 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-12 h-12 rounded-full"
            style={{
              boxShadow: "0 0 30px 15px #E1D4A7",
              backgroundColor: isLightOn ? "#E1D4A7" : "#FFFFFF00",
            }}
          />
        </motion.div>
        */}

        <img
          src="/lumi2.png"
          alt="Lâmpada pendurada"
          className="absolute top-[-38px] inset-0 w-full h-full object-contain pointer-events-none z-10"
        />
        <div
          className="absolute bottom-[-60px] left-1/2 -translate-x-1/2 w-20 h-24 cursor-pointer z-20"
          onClick={onCordPull}
        />
      </motion.div>
    </>
  )
}
