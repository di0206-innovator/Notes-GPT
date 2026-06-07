"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative min-h-[90vh] pt-32 pb-20 flex flex-col items-center justify-center overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-secondary/20 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-accent/10 blur-[140px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center lg:text-left space-y-10"
        >
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md"
          >
            <span className="flex h-2 w-2 rounded-full bg-secondary animate-pulse shadow-[0_0_8px_rgba(var(--secondary-rgb),0.8)]"></span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary/90">AI-Powered Academic Intelligence</span>
          </motion.div>

          <div className="space-y-6">
            <h1 className="text-6xl lg:text-8xl font-black tracking-tight leading-[1.05] text-white">
              Master Your <br />
              <span className="gradient-text">Campus Life</span>
            </h1>

            <p className="text-xl text-foreground/70 max-w-xl leading-relaxed">
              Experience the future of university with CampusGPT. From deciphering complex lecture notes to navigating campus secrets, your intelligent academic companion is always ready.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-5">
            <Link
              href="/chat"
              className="group relative px-8 py-4 rounded-2xl bg-primary text-white font-bold shadow-2xl shadow-primary/40 hover:shadow-primary/60 transition-all flex items-center gap-2 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative">Start Your Journey</span>
              <ArrowRight className="w-5 h-5 relative group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#demo"
              className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm font-bold hover:bg-white/10 transition-all flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Play className="w-4 h-4 fill-white text-white translate-x-0.5" />
              </div>
              <span>Watch Experience</span>
            </Link>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="flex items-center gap-6 pt-6"
          >
            <div className="flex -space-x-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-12 h-12 rounded-full border-4 border-[#0F0F1A] bg-zinc-800 flex items-center justify-center overflow-hidden ring-1 ring-white/5 shadow-xl">
                   <Image src={`https://i.pravatar.cc/100?u=${i + 10}`} alt="User" className="w-full h-full object-cover" width={48} height={48} unoptimized />
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-secondary">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                ))}
              </div>
              <p className="text-xs text-foreground/50 font-bold uppercase tracking-widest">
                Trusted by <span className="text-white">5,000+</span> Students
              </p>
            </div>
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative group lg:block hidden"
        >
          {/* Main Visual Container */}
          <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-white/10 ring-1 ring-white/5">
            <Image
              src="/hero-visual.png"
              alt="CampusGPT AI Visual"
              width={1000}
              height={1000}
              className="w-full h-auto transition-transform duration-1000 group-hover:scale-105"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F1A] via-transparent to-transparent opacity-60"></div>
          </div>
          
          {/* Floating Accents */}
          <motion.div 
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-12 -right-12 w-64 h-64 bg-primary/20 blur-[80px] rounded-full -z-10" 
          />
          <motion.div 
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-12 -left-12 w-64 h-64 bg-secondary/20 blur-[80px] rounded-full -z-10" 
          />
        </motion.div>
      </div>
    </section>
  );
};

