---
layout: ../../layouts/BlogLayout.astro
title: "SPiCa: Security through obscurity and prayers"
date: "2026.05.26"
track_id: "SPICA_V2.0"
tags: "SECURITY / eBPF / RUST"
heroImage: "/images/SPiCa_cover2.webp"
---

*"Catch me! I'll leap over Denebola!"*

as I was living my post SPiCa life I got a very Specific comment from an interesting person in linkedin nonetheless, the comment was sadly deleted but it was by someone who goes by matheus, he left a very helpful message saying "no it doesnt, singularity can bypass SPiCa", interesting! whats singularity? whos matheus?

<div class="my-8 border border-black bg-white p-2">
  <div class="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
    <span class="font-['JetBrains_Mono'] text-[10px] text-gray-500 uppercase tracking-widest">SYS.IMG // SINGULARITY_PROJECT</span>
  </div>
  <img src="/images/singularity.png" alt="singularity project" class="w-full h-auto" />
</div>

with a bit of research i found out he's the author of the so called singularity rootkit, its a binary written with C, ftrace and prayers designed to hook more than 20 syscalls and disable eBPF, he was interesting because he firmly believed eBPF was inferior to normal LKMs, i tested his first iteration where I first run singularity then SPiCa assuming execution post intrusion just to get hit with -EPREM since he blocked eBPF... way to go and get caught from the Infra team instead of the security team! the second configuration was running SPiCa before signularity and voila it instantly detected it because the first iteration of SPiCa logged sheduler processes instead of reading from syscalls.

kudos to matheus he was quick to patch the eBPF blocking and released a new version for me in my post where I showcased SPiCa capabilities in detecting singularity, he manually disconnected all tracepoints made by SPiCa and filtered all eBPF perf events and tracepoints in the kernel, so the bypass I had to do was an external LKM with special data type for my app which doesnt make it pure eBPF.

<div class="my-8 border border-black bg-white p-2">
  <div class="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
    <span class="font-['JetBrains_Mono'] text-[10px] text-gray-500 uppercase tracking-widest">SYS.IMG // SINGULARITY_PROJECT</span>
  </div>
  <img src="/images/singularity2.png" alt="singularity new iteration" class="w-full h-auto" />
</div>

## NMIs? cool, sign me up

he wrote a new bypass but why did I have to wait an entire week for it?... anyways for me at that time SPiCa was a toy project and I stopped updating it for a while until I felt the update offended hatsune miku  (yeah naming projects based on your beloved characters makes you think like this) at that time I was mid another project which was an NES emulator, interesting enough NES PPU (pixel processing unit) utilized something called Non-Maskable Interrupts (NMI) its a simple interrupt that can't be stopped at the software level that was fired by the PPU whenever the screen finishes drawing a frame

<div class="my-8 border border-black bg-white p-2">
  <div class="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
    <span class="font-['JetBrains_Mono'] text-[10px] text-gray-500 uppercase tracking-widest">SYS.IMG // NMI_IN_NES</span>
  </div>
  <img src="/images/NMI.png" alt="NMI in NES" class="w-full h-auto" />
</div>

the thing that sparked in my mind is that if they are non-maskable can they be used as the routine that scans my processes? and DAMN yes they can be, so I was quick to make a NMI handler that reads kernel memory directly through BTF eBPF and... it succeeded in bypassing his disarming mechanism but frankly my handler had to use eBPF perf event

<div class="my-8 border-l-4 border-red-600 bg-[#24292e] p-4 rounded shadow-lg">
  <div class="text-[10px] text-gray-400 uppercase tracking-widest mb-2 font-['JetBrains_Mono']">SYS.CODE // SINGULARITY_EVASION_ROUTINE</div>

```c {10-17}
static notrace inline bool should_filter_bpf_prog_exec(const struct bpf_prog *prog)
{
    enum bpf_prog_type type;

    if (!prog)
        return false;

    type = READ_ONCE(prog->type);

    switch (type) {
    case BPF_PROG_TYPE_TRACEPOINT:
    case BPF_PROG_TYPE_RAW_TRACEPOINT:
    case BPF_PROG_TYPE_RAW_TRACEPOINT_WRITABLE:
    case BPF_PROG_TYPE_TRACING:
    case BPF_PROG_TYPE_PERF_EVENT:
        return true;
    default:
        return false;
    }
}
```
</div>

## the making of SPiCa v2.0

after an intense argument with claude about adding LKM with a special data storage to my pure eBPF program it hit me... the OLDEST trick in the book was the answer! if I couldn't evade his filtering what if I just obscured it? what if I just XOR'ed all the PIDs I was generating? and voila I actually evaded his second aggressive iteration

<div class="my-8 border border-black bg-white p-2">
  <div class="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
    <span class="font-['JetBrains_Mono'] text-[10px] text-gray-500 uppercase tracking-widest">SYS.VID // SPICA_V1.2</span>
  </div>
  <video controls class="w-full">
    <source src="/images/signularity_kill.mp4" type="video/mp4" />
    Your browser does not support the video tag.
  </video>
</div>

it was fun getting results but again, while using the oldest trick in the book I committed the OLDEST blunder in cryptography; *not hiding your keys properly* so as any amateur I casually genrated the key hourly from /dev/urandom just to store it in a kernel map that was easily retrievable, and so was matheus quick to capitalize on it.

<div class="my-8 border border-black bg-white p-2">
  <div class="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
    <span class="font-['JetBrains_Mono'] text-[10px] text-gray-500 uppercase tracking-widest">SYS.IMG // SINGULARITY</span>
  </div>
  <img src="/images/singularity3.png" alt="singularity newer iteration" class="w-full h-auto" />
</div>

here I had the naive assumption that matheus didn't setup his testing environment properly, but once again after waiting for an entire week I found out the ironic truth

<div class="my-8 border-l-4 border-red-600 bg-[#24292e] p-4 rounded shadow-lg">
  <div class="text-[10px] text-gray-400 uppercase tracking-widest mb-2 font-['JetBrains_Mono']">SYS.CODE // SINGULARITY_EVASION_ROUTINE</div>

```c {10-17}
static atomic64_t ebpf_obf_key = ATOMIC64_INIT(0);

static notrace inline u64 get_obf_key(void)
{
    return (u64)atomic64_read(&ebpf_obf_key);
}

static inline bool is_obf_config_map(const struct bpf_map *map)
{
    return map &&
           map->map_type    == BPF_MAP_TYPE_ARRAY &&
           map->key_size    == sizeof(u32)        &&
           map->value_size  == sizeof(u64)        &&
           map->max_entries == 1;
}

static void *config_map_va = NULL;

static notrace inline u64 read_obf_key_va(void)
{
    void *va = READ_ONCE(config_map_va);
    if (!va || (unsigned long)va < PAGE_SIZE)
        return 0ULL;
    return READ_ONCE(*(u64 *)va);
}

```
</div>

at this point me and matheus weren't really on the same page about the way we were coordinating our collective research since it was really about proving eBPF effectiveness and I was determined to prove my point, so it transitioned from research into a battle of egos (deleting comments, showing video proof with delayed source code release, banning from discord server), this is the line where I drew the end of our collaboration and started to view it again as my passion project that started from my obsession on hatsune miku.

as a final contribution I added a custom compiling script, hardcoding a key (from /dev/urandom) per core as an assembly literal, combined with rust compiler optimization the keys get lost in a soup of random assembly operations making the only way of retrieving the key is dumping SPiCa and reverse engineering the binary, mind you all it takes to refresh the keys is recompiling the rust binary

## is this the end?

hopefully not, this project isn't the amalgamation of my quirks only but rather it's the combined support and effort of great people who influenced me directly and indirectly, Salman who built a simple kernel gave me the courage to explore eBPF, Zyad who saw my potential and passion gave me the reason to make it, and my professor Abdulwadood who is now working alongside me to co-author the binary star architecture as a research paper!

--- 

Build Instructions & Source Code: [github.com/0xKirisame/SPiCa](https://github.com/0xKirisame/SPiCa)

License: GPL-2.0 — *Shine bright.*
