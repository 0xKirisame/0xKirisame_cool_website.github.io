---
layout: ../../layouts/BlogLayout.astro
title: "SPiCa: Binary Star Systems & Kernel Sovereignty"
date: "2026.01.17"
track_id: "SPICA_V1"
tags: "SECURITY / eBPF / RUST"
heroImage: "/images/spica_cover.webp"
---

*"I'm going to sing, so shine bright, SPiCa..."*

A few weeks ago, I was playing *Hatsune Miku Project Diva 2nd F* on my PS Vita. I was grinding the song **"SPiCa -39's Giving Day Edition-"**, and something about the lyrics made me curious. I paused the game and looked it up.

I discovered that Spica isn't just a name. It's the brightest star in the Virgo constellation and a binary star system. It's not one massive star, but two distinct stars spinning in perfect harmony, so close together that they appear as one single, brilliant point of light in the night sky.

That explanation immediately painted an image in my mind: **The Kernel and The User Space.**

Ideally, they are like binary stars spinning in harmony, perfectly synchronized, always understanding each other. But then it hit me: *Do they always spin in harmony?*

No. Rootkits exist. They poison the relationship. They decouple the reality of the Kernel from the perception of the User. They ruin the harmony.

That's when I realized that my idea for a rootkit detector based on differential analysis was actually the engineering equivalent of that binary star system. I looked at existing tools, mostly built on LKMs (Loadable Kernel Modules) and C++. They were powerful, sure, but unstable. A bug there bricks your kernel.

What does the world need now? A detector that is stable, safe, and fast. That is why I wrote **SPiCa** in Rust using the Aya eBPF stack.

---

## Live Demonstration

Seeing is believing. Below is a recording of SPiCa catching **Nysm**, a modern stealth container that uses eBPF to blind standard tools like `ps` and `top`. Note the delay: Nysm activates its cloak, but SPiCa sees through it instantly.

<div class="my-8 border border-black bg-white p-2">
  <div class="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
    <span class="font-['JetBrains_Mono'] text-[10px] text-gray-500 uppercase tracking-widest">SYS.VID // SPICA_V1</span>
  </div>
  <video controls class="w-full">
    <source src="/images/nysm_kill.mp4" type="video/mp4" />
    Your browser does not support the video tag.
  </video>
</div>

## SPiCa: System Process Integrity & Cross-view Analysis

SPiCa is a high-performance, eBPF-based rootkit detection engine. Inspired by the miku song by toku, SPiCa acts as that "Binary Star" enforcing **Kernel Sovereignty** by establishing a ground truth based on CPU execution rather than relying on potentially compromised system APIs.

### The "Layer 0" Argument

Some people argue that SPiCa is only effective in Layer 0 (Kernel) and is irrelevant in the cloud age. I argue the opposite.

In the Cloud Shared Responsibility Model, everything above Layer 0 is the user's problem. While the provider handles the hypervisor and firmware, the **guest kernel** is your territory. If an attacker owns your kernel, they own your data. SPiCa defends that sovereignty.

## The Architecture

SPiCa operates on a "Binary Star" principle, maintaining two distinct observational vantages to identify discrepancies in system state:

**1. The Kernel View — Ground Truth.** Utilizes an eBPF probe hooked into the `sched_switch` tracepoint. This captures the raw execution context of every process the moment it touches the CPU, bypassing the Virtual File System (VFS).

**2. The User View — Reported Reality.** Queries standard system APIs (like the `/proc` filesystem) to retrieve the list of processes the Operating System *claims* are running.

## Detection Logic

- **CLEAN** — The process executes on the CPU and is correctly reported by the OS. Harmony.
- **SUSPECT** — A transient state. The process is in the kernel but missing from User space. We debounce this to filter out race conditions.
- **GHOST** — DKOM Detected. A process is consuming CPU cycles but is persistently invisible to tools like `ps` or `top`. This is a rootkit.
- **MASQUERADE** — PID Hollowing. The process name recorded by the Scheduler differs from the name reported by the filesystem.

> **DEV NOTE:** Masquerade Detection (PID Hollowing) is currently under active construction. The hooks are in place, but the userspace logic is landing in v1.2.

## Technology Stack

Rust | Aya (eBPF) | Tokio | sched_switch

---

Build Instructions & Source Code: [github.com/0xKirisame/SPiCa](https://github.com/0xKirisame/SPiCa)

License: GPL-2.0 — *Shine bright.*
