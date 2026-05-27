import { LitElement, html, svg, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

// Constants extracted from the original helpers.ts
const SPACING_X = 250;
const SPACING_Y = 300;
const X_MIN = -300;
const Y_MIN = -300;
const X_MAX = 2220;
const Y_MAX = 1480;
const RANDOM_OFFSET = 0.7;
const MAX_MOVE_PER_FRAME = 100;

const sinTable = new Array(720).fill(0).map((_, i) => Math.sin((i * Math.PI) / 180));

export interface ParallaxObject {
  targetX: number;
  targetY: number;
  sinOffset: number;
  currentY?: number; 
}

const lerp = (current: number, target: number, speed: number): number => {
  let diff = speed * (target - current);
  if (Math.abs(diff) > MAX_MOVE_PER_FRAME) {
    diff = MAX_MOVE_PER_FRAME * Math.sign(diff);
  }
  return current + diff;
};

@customElement('parallax-hero')
export class ParallaxHero extends LitElement {
  static styles = css`
    :host {
      display: block;
      position: absolute;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      max-width: 1920px;
      max-height: 1080px;
      overflow: hidden;
      z-index: -1;
      background-color: white;
    }
    
    svg {
      width: 100%;
      height: 100%;
    }

    rect.parallax-node {
      fill: white;
      stroke: #94a3b8; /* Equivalent to tailwind stroke-slate-400 */
      stroke-width: 2px;
    }
  `;

  @state()
  private accessor parallaxNodes: ParallaxObject[] = [];

  private viewCoords = { x: 0, y: 0 };
  private mousePosition = { x: 0, y: 0 };
  
  private animationFrameId: number | null = null;
  private time = 0;

  constructor() {
    super();
    this.parallaxNodes = this.generateObjectsDesktop();
    // Start centered
    if (typeof window !== 'undefined') {
      this.mousePosition = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2
      };
    }
  }

  private generateObjectsDesktop(): ParallaxObject[] {
    const objects: ParallaxObject[] = [];
    for (let x = X_MIN; x < X_MAX; x += SPACING_X) {
      for (let y = Y_MIN; y < Y_MAX; y += SPACING_Y) {
        const targetX = x + Math.random() * RANDOM_OFFSET * SPACING_X;
        const targetY = y + Math.random() * RANDOM_OFFSET * SPACING_Y;
        const sinOffset = Math.floor(Math.random() * 360) % 360;
        objects.push({ targetX, targetY, sinOffset, currentY: targetY });
      }
    }
    return objects;
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('mousemove', this.handleMouseMove);
    this.startAnimation();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('mousemove', this.handleMouseMove);
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private handleMouseMove = (e: MouseEvent) => {
    this.mousePosition = {
      x: e.clientX,
      y: e.clientY
    };
  };

  private startAnimation = () => {
    const floatingEffect = 25;
    const animate = () => {
      // 1. Floating animation for nodes
      this.parallaxNodes.forEach((node) => {
        const sinIndex = Math.floor(node.sinOffset + this.time) % 720;
        node.currentY = node.targetY + sinTable[sinIndex] * floatingEffect;
      });
      this.time += 1;

      // 2. Mouse parallax tracking for entire layer
      const SCREEN_CENTER_X = window.innerWidth / 2;
      const SCREEN_CENTER_Y = window.innerHeight / 2;
      
      const DISTANCE_X = ((this.mousePosition.x - SCREEN_CENTER_X) / SCREEN_CENTER_X) * 1920;
      const DISTANCE_Y = ((this.mousePosition.y - SCREEN_CENTER_Y) / SCREEN_CENTER_Y) * 1080;

      this.viewCoords = {
        x: lerp(this.viewCoords.x, DISTANCE_X / 12, 0.2),
        y: lerp(this.viewCoords.y, DISTANCE_Y / 12, 0.2),
      };

      // Trigger Lit's efficient render cycle for mutated properties
      this.requestUpdate();

      this.animationFrameId = requestAnimationFrame(animate);
    };

    this.animationFrameId = requestAnimationFrame(animate);
  };

  render() {
    return html`
      <svg viewBox="0 0 1920 1080">
        <defs>
          <radialGradient id="fadeout" cx="50%" cy="50%" r="65%" fx="50%" fy="50%" spreadMethod="pad">
            <stop offset="0%" style="stop-color:white; stop-opacity:1"></stop>
            <stop offset="90%" style="stop-color:white; stop-opacity:1"></stop>
            <stop offset="100%" style="stop-color:black; stop-opacity:1"></stop>
          </radialGradient>
          <linearGradient id="left-to-middle-to-right" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:black; stop-opacity:1"></stop>
            <stop offset="15%" style="stop-color:black; stop-opacity:0"></stop>
            <stop offset="85%" style="stop-color:black; stop-opacity:0"></stop>
            <stop offset="100%" style="stop-color:black; stop-opacity:1"></stop>
          </linearGradient>
          <linearGradient id="top-to-middle-to-bottom" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:black; stop-opacity:1"></stop>
            <stop offset="15%" style="stop-color:black; stop-opacity:0"></stop>
            <stop offset="85%" style="stop-color:black; stop-opacity:0"></stop>
            <stop offset="100%" style="stop-color:black; stop-opacity:1"></stop>
          </linearGradient>
          <mask id="mask">
            <rect width="100%" height="100%" fill="white"></rect>
            <rect width="100%" height="100%" fill="url(#fadeout)"></rect>
            <rect width="100%" height="100%" fill="url(#left-to-middle-to-right)"></rect>
            <rect width="100%" height="100%" fill="url(#top-to-middle-to-bottom)"></rect>
          </mask>
        </defs>

        <g 
          mask="url(#mask)"
          style="transform: translate(${this.viewCoords.x}px, ${this.viewCoords.y}px);"
        >
          ${this.parallaxNodes.map(node => svg`
            <rect
              x="${node.targetX}"
              y="${node.currentY}"
              width="96"
              height="32"
              rx="4"
              ry="4"
              class="parallax-node"
            ></rect>
          `)}
        </g>
      </svg>
    `;
  }
}

// =========================================================================
// REACT INTEGRATION
// =========================================================================
// As per Lit's documentation for React (https://lit.dev/docs/frameworks/react/),
// you can export a React wrapper for this component using '@lit/react':
// 
// import React from 'react';
// import { createComponent } from '@lit/react';
// 
// export const ParallaxHeroReact = createComponent({
//   tagName: 'parallax-hero',
//   elementClass: ParallaxHero,
//   react: React,
//   events: {} // Mapping CustomEvents if there were any
// });
// =========================================================================
