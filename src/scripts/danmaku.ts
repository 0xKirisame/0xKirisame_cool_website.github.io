const POOL_SIZE = 50;
const SPAWN_INTERVAL_MS = 400;

const TERMS = [
  '0xFFFFFF', 'sched_switch', 'PID_HOLLOWING', 'Aya_eBPF',
  'sys_execve', 'DKOM_DETECTED', '0xKIRISAME', 'vmlinux',
  'ptrace', 'kprobe', 'bpf_map_lookup', 'Vec<u8>',
  'KERNEL_PANIC', 'VOCALOID_01', "39's_GIVING_DAY",
];

interface Bullet {
  el: HTMLDivElement;
  active: boolean;
}

let pool: Bullet[] = [];
let gsap: any;
let layer: HTMLElement | null;

function initPool() {
  layer = document.getElementById('danmaku-layer');
  if (!layer) return;

  for (let i = 0; i < POOL_SIZE; i++) {
    const el = document.createElement('div');
    el.className = 'danmaku-bullet';
    el.style.visibility = 'hidden';
    layer.appendChild(el);
    pool.push({ el, active: false });
  }
}

function fireBullet() {
  const bullet = pool.find((b) => !b.active);
  if (!bullet || !gsap) return;

  bullet.active = true;
  const el = bullet.el;

  el.textContent = TERMS[Math.floor(Math.random() * TERMS.length)];
  el.style.top = `${Math.random() * window.innerHeight}px`;
  el.style.visibility = 'visible';

  gsap.fromTo(
    el,
    { x: window.innerWidth + 200 },
    {
      x: -400,
      duration: 8 + Math.random() * 12,
      ease: 'none',
      onComplete: () => {
        el.style.visibility = 'hidden';
        bullet.active = false;
      },
    },
  );
}

function startDanmaku(gsapInstance: any) {
  gsap = gsapInstance;
  initPool();
  setInterval(fireBullet, SPAWN_INTERVAL_MS);
  for (let i = 0; i < 30; i++) {
    setTimeout(fireBullet, Math.random() * 2000);
  }
}

export { startDanmaku };
