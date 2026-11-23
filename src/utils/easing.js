export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Frame-rate independent exponential damping
 */
export function damp(current, target, lambda, dt) {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
}

export function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function easeOutCubic(t) {
  const x = clamp(t, 0, 1);
  return 1 - Math.pow(1 - x, 3);
}

export function easeInCubic(t) {
  const x = clamp(t, 0, 1);
  return x * x * x;
}

export function easeInOutCubic(t) {
  const x = clamp(t, 0, 1);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/**
 * Simulasi pegas teredam dengan retargeting dari posisi & kecepatan aktual.
 */
export class DampedSpring {
  constructor({ value = 0, stiffness = 170, damping = 22, mass = 1.1 } = {}) {
    this.value = value;
    this.target = value;
    this.velocity = 0;
    this.stiffness = stiffness;
    this.damping = damping;
    this.mass = mass;
  }

  setTarget(nextTarget) {
    this.target = nextTarget;
  }

  snap(nextValue) {
    this.value = nextValue;
    this.target = nextValue;
    this.velocity = 0;
  }

  step(dt) {
    const safeDt = Math.min(dt, 0.05);
    const force = -this.stiffness * (this.value - this.target);
    const dampingForce = -this.damping * this.velocity;
    const accel = (force + dampingForce) / this.mass;
    this.velocity += accel * safeDt;
    this.value += this.velocity * safeDt;
    return this.value;
  }
}