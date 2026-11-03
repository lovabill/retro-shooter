import Phaser from 'phaser';

export class TextureGenerator {
  public static generateAll(scene: Phaser.Scene): void {
    const tm = scene.textures;

    // Helper to create canvas and add to Phaser
    const createCanvas = (key: string, width: number, height: number, drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) => {
      if (tm.exists(key)) return;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Disable smoothing for sharp pixel art
        ctx.imageSmoothingEnabled = false;
        drawFn(ctx, width, height);
        tm.addCanvas(key, canvas);
      }
    };

    // 1. PLAYER SHIP (32x36)
    createCanvas('player_ship', 32, 36, (ctx, w, h) => {
      // Main fuselage (sleek cobalt blue / steel grey)
      ctx.fillStyle = '#1c2b42';
      ctx.beginPath();
      ctx.moveTo(16, 2);
      ctx.lineTo(24, 24);
      ctx.lineTo(28, 30);
      ctx.lineTo(24, 34);
      ctx.lineTo(8, 34);
      ctx.lineTo(4, 30);
      ctx.lineTo(8, 24);
      ctx.closePath();
      ctx.fill();

      // Armor plating highlights
      ctx.fillStyle = '#2c4b72';
      ctx.beginPath();
      ctx.moveTo(16, 4);
      ctx.lineTo(22, 22);
      ctx.lineTo(19, 32);
      ctx.lineTo(13, 32);
      ctx.lineTo(10, 22);
      ctx.closePath();
      ctx.fill();

      // Wing extensions (Xenon swept forward style)
      ctx.fillStyle = '#3a6696';
      // Right wing
      ctx.beginPath();
      ctx.moveTo(22, 16);
      ctx.lineTo(31, 26);
      ctx.lineTo(30, 32);
      ctx.lineTo(24, 28);
      ctx.closePath();
      ctx.fill();
      // Left wing
      ctx.beginPath();
      ctx.moveTo(10, 16);
      ctx.lineTo(1, 26);
      ctx.lineTo(2, 32);
      ctx.lineTo(8, 28);
      ctx.closePath();
      ctx.fill();

      // Wingtips (ruby warning lights)
      ctx.fillStyle = '#ff2b54';
      ctx.fillRect(0, 26, 3, 4);
      ctx.fillRect(29, 26, 3, 4);

      // Cockpit canopy (cyan glowing glass)
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.ellipse(16, 14, 3, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(15, 11, 2, 4); // shine

      // Dual weapon barrels
      ctx.fillStyle = '#d0d8e4';
      ctx.fillRect(11, 6, 2, 8);
      ctx.fillRect(19, 6, 2, 8);
      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(11, 4, 2, 2);
      ctx.fillRect(19, 4, 2, 2);

      // Twin thrusters
      ctx.fillStyle = '#ff6600';
      ctx.fillRect(10, 33, 4, 3);
      ctx.fillRect(18, 33, 4, 3);
    });

    // 2. PLAYER ENGINE FLAMES (frames 1 & 2)
    createCanvas('player_flame_1', 16, 12, (ctx, w, h) => {
      // Left flame
      ctx.fillStyle = '#ff9900';
      ctx.beginPath();
      ctx.moveTo(2, 0); ctx.lineTo(6, 0); ctx.lineTo(4, 9); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffff66';
      ctx.beginPath();
      ctx.moveTo(3, 0); ctx.lineTo(5, 0); ctx.lineTo(4, 6); ctx.closePath(); ctx.fill();

      // Right flame
      ctx.fillStyle = '#ff9900';
      ctx.beginPath();
      ctx.moveTo(10, 0); ctx.lineTo(14, 0); ctx.lineTo(12, 9); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffff66';
      ctx.beginPath();
      ctx.moveTo(11, 0); ctx.lineTo(13, 0); ctx.lineTo(12, 6); ctx.closePath(); ctx.fill();
    });

    createCanvas('player_flame_2', 16, 12, (ctx, w, h) => {
      // Left flame longer
      ctx.fillStyle = '#ff5500';
      ctx.beginPath();
      ctx.moveTo(2, 0); ctx.lineTo(6, 0); ctx.lineTo(4, 12); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffff99';
      ctx.beginPath();
      ctx.moveTo(3, 0); ctx.lineTo(5, 0); ctx.lineTo(4, 8); ctx.closePath(); ctx.fill();

      // Right flame longer
      ctx.fillStyle = '#ff5500';
      ctx.beginPath();
      ctx.moveTo(10, 0); ctx.lineTo(14, 0); ctx.lineTo(12, 12); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffff99';
      ctx.beginPath();
      ctx.moveTo(11, 0); ctx.lineTo(13, 0); ctx.lineTo(12, 8); ctx.closePath(); ctx.fill();
    });

    // 3. WINGMAN DRONE (16x16)
    createCanvas('drone_wingman', 16, 16, (ctx, w, h) => {
      ctx.fillStyle = '#223854';
      ctx.beginPath();
      ctx.arc(8, 8, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(8, 8, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(7, 0, 2, 4); // forward turret
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(8, 7, 2, 2);
    });

    // 4. ENEMY 1: SCOUT DRONE (24x24) - Agile red/copper biomech flyer
    createCanvas('enemy_scout', 24, 24, (ctx, w, h) => {
      ctx.fillStyle = '#5a1e28';
      ctx.beginPath();
      ctx.moveTo(12, 22);
      ctx.lineTo(2, 4);
      ctx.lineTo(12, 8);
      ctx.lineTo(22, 4);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#a62d3a';
      ctx.beginPath();
      ctx.moveTo(12, 20);
      ctx.lineTo(5, 6);
      ctx.lineTo(12, 10);
      ctx.lineTo(19, 6);
      ctx.closePath();
      ctx.fill();

      // Pulsing bio-eye
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath();
      ctx.arc(12, 13, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(11, 12, 2, 2);
    });

    // 5. ENEMY 2: BIO-STINGER (28x28) - Organic wasp with emerald wings
    createCanvas('enemy_stinger', 28, 28, (ctx, w, h) => {
      // Wings (translucent emerald)
      ctx.fillStyle = 'rgba(0, 255, 170, 0.6)';
      ctx.beginPath();
      ctx.ellipse(5, 10, 6, 10, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(23, 10, 6, 10, 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Carapace abdomen
      ctx.fillStyle = '#301844';
      ctx.beginPath();
      ctx.ellipse(14, 14, 5, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Segments
      ctx.fillStyle = '#8338ec';
      ctx.fillRect(10, 8, 8, 2);
      ctx.fillRect(10, 13, 8, 2);
      ctx.fillRect(11, 18, 6, 2);

      // Stinger needle
      ctx.fillStyle = '#ff0055';
      ctx.beginPath();
      ctx.moveTo(13, 24); ctx.lineTo(15, 24); ctx.lineTo(14, 28); ctx.closePath(); ctx.fill();

      // Eyes
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(11, 5, 2, 2);
      ctx.fillRect(15, 5, 2, 2);
    });

    // 6. ENEMY 3: HEAVY CARAPACE GUNSHIP (38x36) - Armored cybernetic beetle
    createCanvas('enemy_heavy', 38, 36, (ctx, w, h) => {
      // Heavy shell
      ctx.fillStyle = '#263238';
      ctx.beginPath();
      ctx.ellipse(19, 18, 16, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bronze chitin armor plates
      ctx.fillStyle = '#78542a';
      ctx.beginPath();
      ctx.ellipse(19, 16, 12, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dual heavy cannon pods
      ctx.fillStyle = '#90a4ae';
      ctx.fillRect(4, 16, 5, 16);
      ctx.fillRect(29, 16, 5, 16);
      ctx.fillStyle = '#ff3300';
      ctx.fillRect(5, 30, 3, 4);
      ctx.fillRect(30, 30, 3, 4);

      // Glowing core
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.arc(19, 16, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(18, 15, 2, 2);
    });

    // 7. ENEMY 4: VOID CRUISER (44x42) - Elite dreadnought with shields
    createCanvas('enemy_cruiser', 44, 42, (ctx, w, h) => {
      // Main body
      ctx.fillStyle = '#1a1d29';
      ctx.beginPath();
      ctx.moveTo(22, 38);
      ctx.lineTo(6, 12);
      ctx.lineTo(12, 4);
      ctx.lineTo(32, 4);
      ctx.lineTo(38, 12);
      ctx.closePath();
      ctx.fill();

      // Steel trims
      ctx.fillStyle = '#455a64';
      ctx.beginPath();
      ctx.moveTo(22, 34);
      ctx.lineTo(10, 14);
      ctx.lineTo(15, 8);
      ctx.lineTo(29, 8);
      ctx.lineTo(34, 14);
      ctx.closePath();
      ctx.fill();

      // Side wings with energy conduits
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(2, 12, 4, 14);
      ctx.fillRect(38, 12, 4, 14);

      // Center reactor
      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.arc(22, 20, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(21, 19, 2, 2);

      // Cannons
      ctx.fillStyle = '#b0bec5';
      ctx.fillRect(16, 28, 3, 8);
      ctx.fillRect(25, 28, 3, 8);
    });

    // 8. BOSS 1: NAUTILOID BEHEMOTH (84x76) - Organic Cyber-Cephalopod (Level 1)
    createCanvas('boss_nautiloid', 84, 76, (ctx, w, h) => {
      // Main armored nautilus shell
      ctx.fillStyle = '#2d3748';
      ctx.beginPath();
      ctx.ellipse(42, 32, 36, 28, 0, 0, Math.PI * 2);
      ctx.fill();

      // Spiral shell rings (Xenon 2 organic style)
      ctx.strokeStyle = '#4a5568';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(42, 30, 28, 0, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(42, 26, 18, 0, Math.PI);
      ctx.stroke();

      // Metallic carapace plates
      ctx.fillStyle = '#744210';
      ctx.beginPath();
      ctx.arc(42, 32, 24, 0.2, Math.PI - 0.2);
      ctx.fill();

      // Giant glowing optic eye
      ctx.fillStyle = '#ff6b00';
      ctx.beginPath();
      ctx.arc(42, 34, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffee00';
      ctx.beginPath();
      ctx.arc(42, 34, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.fillRect(39, 32, 6, 4); // slit pupil
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(43, 30, 3, 3);

      // Mechanical bio-tentacles / cannons
      const tentacleColors = ['#1a202c', '#2d3748'];
      const xPositions = [12, 26, 42, 58, 72];
      xPositions.forEach((x, i) => {
        ctx.fillStyle = tentacleColors[i % 2];
        ctx.fillRect(x - 4, 52, 8, 20);
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(x - 2, 68, 4, 4); // plasma emitter tip
      });
    });

    // 9. BOSS 2: GIGA-CARAPACE TITAN (96x84) - Arachnid War Machine (Level 2)
    createCanvas('boss_giga_carapace', 96, 84, (ctx, w, h) => {
      // Heavy obsidian carapace body
      ctx.fillStyle = '#181a1b';
      ctx.beginPath();
      ctx.ellipse(48, 38, 42, 30, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bio-luminescent toxic plating
      ctx.fillStyle = '#2e4a28';
      ctx.beginPath();
      ctx.ellipse(48, 36, 32, 22, 0, 0, Math.PI * 2);
      ctx.fill();

      // Mechanical spider limbs
      ctx.strokeStyle = '#3f4953';
      ctx.lineWidth = 6;
      // Left legs
      ctx.beginPath();
      ctx.moveTo(20, 20); ctx.lineTo(4, 10); ctx.lineTo(2, 35);
      ctx.moveTo(18, 35); ctx.lineTo(2, 45); ctx.lineTo(6, 65);
      ctx.stroke();
      // Right legs
      ctx.beginPath();
      ctx.moveTo(76, 20); ctx.lineTo(92, 10); ctx.lineTo(94, 35);
      ctx.moveTo(78, 35); ctx.lineTo(94, 45); ctx.lineTo(90, 65);
      ctx.stroke();

      // Heavy plasma mandibles
      ctx.fillStyle = '#52796f';
      ctx.beginPath();
      ctx.moveTo(34, 56); ctx.lineTo(30, 78); ctx.lineTo(38, 72); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(62, 56); ctx.lineTo(66, 78); ctx.lineTo(58, 72); ctx.closePath(); ctx.fill();

      // Acid glowing core
      ctx.fillStyle = '#39ff14';
      ctx.beginPath();
      ctx.arc(48, 38, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e8ffb0';
      ctx.beginPath();
      ctx.arc(48, 38, 8, 0, Math.PI * 2);
      ctx.fill();

      // Multi-eyes
      ctx.fillStyle = '#ff0055';
      const eyeXs = [36, 42, 48, 54, 60];
      eyeXs.forEach(x => {
        ctx.fillRect(x - 2, 52, 4, 4);
      });
    });

    // 10. BOSS 3: MEGABLAST OMEGA CORE (104x92) - Final Fortress Boss (Level 3)
    createCanvas('boss_megablast_omega', 104, 92, (ctx, w, h) => {
      // Fortress hull (dark gunmetal)
      ctx.fillStyle = '#0f111a';
      ctx.fillRect(12, 10, 80, 50);

      // Sloped armor wings
      ctx.fillStyle = '#1f2438';
      ctx.beginPath();
      ctx.moveTo(12, 10); ctx.lineTo(0, 35); ctx.lineTo(12, 60); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(92, 10); ctx.lineTo(104, 35); ctx.lineTo(92, 60); ctx.closePath(); ctx.fill();

      // Twin mega laser turrets
      ctx.fillStyle = '#798ba8';
      ctx.fillRect(16, 50, 12, 28);
      ctx.fillRect(76, 50, 12, 28);
      ctx.fillStyle = '#ff0033';
      ctx.fillRect(19, 74, 6, 8);
      ctx.fillRect(79, 74, 6, 8);

      // Rotating energy barrier ring (outer circle)
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(52, 38, 26, 0, Math.PI * 2);
      ctx.stroke();

      // Central antimatter singularity core
      ctx.fillStyle = '#ff0055';
      ctx.beginPath();
      ctx.arc(52, 38, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff77aa';
      ctx.beginPath();
      ctx.arc(52, 38, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(52, 38, 4, 0, Math.PI * 2);
      ctx.fill();

      // Heat sinks / vent radiators
      ctx.fillStyle = '#ffaa00';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(36 + i * 9, 64, 5, 8);
      }
    });

    // 11. PROJECTILES
    // A) Pulse laser (6x14)
    createCanvas('proj_pulse', 6, 14, (ctx, w, h) => {
      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(0, 0, 6, 14);
      ctx.fillStyle = '#ffff66';
      ctx.fillRect(1, 2, 4, 10);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(2, 4, 2, 6);
    });

    // B) Wave spreader / Side shot (20x10)
    createCanvas('proj_wave', 20, 10, (ctx, w, h) => {
      ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.beginPath();
      ctx.ellipse(10, 5, 9, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(10, 7, 7, Math.PI, 0, false);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    });

    // B2) Piercing Laser Beam (8x26)
    createCanvas('proj_laser', 8, 26, (ctx, w, h) => {
      ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.fillRect(0, 0, 8, 26);
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(2, 1, 4, 24);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(3, 3, 2, 20);
    });

    // B3) Flank / Side Dart (8x10)
    createCanvas('proj_side', 8, 10, (ctx, w, h) => {
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.moveTo(4, 0); ctx.lineTo(8, 8); ctx.lineTo(4, 6); ctx.lineTo(0, 8); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(3, 2, 2, 4);
    });

    // B4) Rear Blaster Tracer (6x12)
    createCanvas('proj_rear', 6, 12, (ctx, w, h) => {
      ctx.fillStyle = '#ff3366';
      ctx.fillRect(0, 0, 6, 12);
      ctx.fillStyle = '#ff99aa';
      ctx.fillRect(1, 2, 4, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(2, 4, 2, 4);
    });

    // C) Heavy Plasma (16x16)
    createCanvas('proj_plasma', 16, 16, (ctx, w, h) => {
      ctx.fillStyle = 'rgba(57, 255, 20, 0.35)';
      ctx.beginPath();
      ctx.arc(8, 8, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#39ff14';
      ctx.beginPath();
      ctx.arc(8, 8, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(7, 7, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // D) Homing Missile (8x16)
    createCanvas('proj_missile', 8, 16, (ctx, w, h) => {
      ctx.fillStyle = '#d0d8e4';
      ctx.fillRect(2, 3, 4, 11);
      ctx.fillStyle = '#ff2b54'; // nosecone
      ctx.beginPath();
      ctx.moveTo(2, 3); ctx.lineTo(6, 3); ctx.lineTo(4, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#3a4b64'; // fins
      ctx.fillRect(0, 11, 2, 4);
      ctx.fillRect(6, 11, 2, 4);
      ctx.fillStyle = '#ff9900'; // exhaust glow
      ctx.fillRect(3, 14, 2, 2);
    });

    // E) Enemy Orb (10x10)
    createCanvas('proj_enemy_orb', 10, 10, (ctx, w, h) => {
      ctx.fillStyle = 'rgba(255, 30, 60, 0.4)';
      ctx.beginPath();
      ctx.arc(5, 5, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff1e3c';
      ctx.beginPath();
      ctx.arc(5, 5, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, 4, 2, 2);
    });

    // F) Enemy Beam (8x20)
    createCanvas('proj_enemy_beam', 8, 20, (ctx, w, h) => {
      ctx.fillStyle = 'rgba(180, 0, 255, 0.4)';
      ctx.fillRect(0, 0, 8, 20);
      ctx.fillStyle = '#c724ff';
      ctx.fillRect(2, 2, 4, 16);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(3, 4, 2, 12);
    });

    // G) Boss Mega Orb (18x18)
    createCanvas('proj_boss_orb', 18, 18, (ctx, w, h) => {
      ctx.fillStyle = 'rgba(255, 120, 0, 0.4)';
      ctx.beginPath();
      ctx.arc(9, 9, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff5500';
      ctx.beginPath();
      ctx.arc(9, 9, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffee00';
      ctx.beginPath();
      ctx.arc(9, 9, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(8, 8, 2, 2);
    });

    // 12. PICKUPS
    // A) Credit Coin (14x14) Tyrian style gold coin
    createCanvas('pickup_credit', 14, 14, (ctx, w, h) => {
      ctx.fillStyle = '#e69500';
      ctx.beginPath();
      ctx.arc(7, 7, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(7, 7, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7a4e00';
      ctx.font = 'bold 8px Courier';
      ctx.fillText('¢', 4.5, 10);
    });

    // B) Biocrystal / High Credit Gem (14x16)
    createCanvas('pickup_gem', 14, 16, (ctx, w, h) => {
      ctx.fillStyle = '#00bcd4';
      ctx.beginPath();
      ctx.moveTo(7, 0); ctx.lineTo(13, 6); ctx.lineTo(7, 16); ctx.lineTo(1, 6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#80deea';
      ctx.beginPath();
      ctx.moveTo(7, 2); ctx.lineTo(11, 6); ctx.lineTo(7, 13); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(6, 4, 2, 3);
    });

    // C) Nano Repair Pod (14x14)
    createCanvas('pickup_repair', 14, 14, (ctx, w, h) => {
      ctx.fillStyle = 'rgba(0, 230, 118, 0.4)';
      ctx.beginPath();
      ctx.arc(7, 7, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#00e676';
      // Cross
      ctx.fillRect(5, 2, 4, 10);
      ctx.fillRect(2, 5, 10, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(6, 6, 2, 2);
    });

    // 13. SHIELD BUBBLE (52x52)
    createCanvas('shield_bubble', 52, 52, (ctx, w, h) => {
      const grad = ctx.createRadialGradient(26, 26, 12, 26, 26, 25);
      grad.addColorStop(0, 'rgba(0, 240, 255, 0.05)');
      grad.addColorStop(0.7, 'rgba(0, 240, 255, 0.3)');
      grad.addColorStop(1, 'rgba(0, 240, 255, 0.85)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(26, 26, 24, 0, Math.PI * 2);
      ctx.fill();
      // Outer rim
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(26, 26, 24, 0, Math.PI * 2);
      ctx.stroke();
    });

    // 14. PARTICLES
    createCanvas('particle_spark', 4, 4, (ctx) => {
      ctx.fillStyle = '#ffff55';
      ctx.fillRect(0, 0, 4, 4);
    });

    createCanvas('particle_fire', 6, 6, (ctx) => {
      ctx.fillStyle = '#ff5500';
      ctx.fillRect(0, 0, 6, 6);
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(1, 1, 4, 4);
    });

    createCanvas('particle_smoke', 8, 8, (ctx) => {
      ctx.fillStyle = 'rgba(150, 160, 175, 0.6)';
      ctx.beginPath();
      ctx.arc(4, 4, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    createCanvas('particle_cyan', 4, 4, (ctx) => {
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(0, 0, 4, 4);
    });

    // 15. BACKGROUND TILES (PARALLAX TEXTURES)
    // A) Planet Tyria Sphere (420x420) - Tyrian Level 1 Majestic Orbital Planet
    createCanvas('planet_tyria', 420, 420, (ctx, w, h) => {
      const cx = 210;
      const cy = 210;
      const radius = 190;

      // Outer atmospheric Rayleigh scattering halo
      const atmoGrad = ctx.createRadialGradient(cx, cy, radius * 0.85, cx, cy, radius * 1.08);
      atmoGrad.addColorStop(0, 'rgba(0, 220, 255, 0.5)');
      atmoGrad.addColorStop(0.5, 'rgba(0, 160, 255, 0.25)');
      atmoGrad.addColorStop(1, 'rgba(0, 40, 120, 0)');
      ctx.fillStyle = atmoGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.08, 0, Math.PI * 2);
      ctx.fill();

      // Clip to planet sphere
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();

      // Deep ocean base
      const oceanGrad = ctx.createRadialGradient(cx - 50, cy - 50, 40, cx, cy, radius);
      oceanGrad.addColorStop(0, '#1a5bc2');
      oceanGrad.addColorStop(0.6, '#0d3284');
      oceanGrad.addColorStop(1, '#05143a');
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, w, h);

      // Turquoise shallow coastal reefs
      ctx.fillStyle = '#00a896';
      ctx.beginPath();
      ctx.ellipse(cx - 30, cy - 20, 120, 90, 0.3, 0, Math.PI * 2);
      ctx.ellipse(cx + 60, cy + 50, 90, 70, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Continents (verdant green and warm terra cotta mountain terrain)
      ctx.fillStyle = '#2d6a4f';
      ctx.beginPath();
      ctx.ellipse(cx - 40, cy - 25, 100, 75, 0.3, 0, Math.PI * 2);
      ctx.ellipse(cx + 55, cy + 45, 75, 55, -0.2, 0, Math.PI * 2);
      ctx.ellipse(cx - 70, cy + 80, 50, 40, 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Highlands & mountain ridges
      ctx.fillStyle = '#744210';
      ctx.beginPath();
      ctx.ellipse(cx - 35, cy - 35, 60, 35, 0.4, 0, Math.PI * 2);
      ctx.ellipse(cx + 60, cy + 40, 45, 25, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // Mountain snowcaps
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(cx - 35, cy - 38, 25, 10, 0.4, 0, Math.PI * 2);
      ctx.ellipse(cx + 60, cy + 38, 18, 8, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // Swirling atmospheric white cloud bands
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.beginPath();
      ctx.ellipse(cx - 10, cy - 60, 140, 22, -0.15, 0, Math.PI * 2);
      ctx.ellipse(cx + 20, cy + 10, 160, 28, 0.1, 0, Math.PI * 2);
      ctx.ellipse(cx - 30, cy + 90, 130, 20, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Cloud swirl hurricane
      ctx.beginPath();
      ctx.arc(cx + 80, cy - 50, 25, 0, Math.PI * 1.7);
      ctx.lineWidth = 10;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.stroke();

      // Terminator shadow / Day-to-night crescent shading
      const shadowGrad = ctx.createRadialGradient(cx - 60, cy - 60, radius * 0.4, cx + 40, cy + 40, radius * 1.1);
      shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      shadowGrad.addColorStop(0.55, 'rgba(0, 0, 0, 0.2)');
      shadowGrad.addColorStop(0.85, 'rgba(0, 5, 20, 0.85)');
      shadowGrad.addColorStop(1, 'rgba(0, 2, 10, 0.98)');
      ctx.fillStyle = shadowGrad;
      ctx.fillRect(0, 0, w, h);

      ctx.restore();
    });

    // A2) Atmospheric Cloud Wisps (480x640)
    createCanvas('bg_clouds', 480, 640, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      for (let i = 0; i < 7; i++) {
        const y = i * 95 + 40;
        ctx.beginPath();
        ctx.ellipse(120 + (i % 3) * 110, y, 160, 32, 0.12, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // A) Deep Starfield (480x640)
    createCanvas('bg_stars', 480, 640, (ctx, w, h) => {
      ctx.fillStyle = '#060810';
      ctx.fillRect(0, 0, w, h);

      // Distant stars
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 180; i++) {
        const x = Math.floor(Math.random() * w);
        const y = Math.floor(Math.random() * h);
        const alpha = Math.random() * 0.7 + 0.3;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillRect(x, y, 1, 1);
      }
      // Brighter colored stars
      const starColors = ['#00f0ff', '#ffaa44', '#ff44aa', '#88eeff'];
      for (let i = 0; i < 40; i++) {
        const x = Math.floor(Math.random() * w);
        const y = Math.floor(Math.random() * h);
        ctx.fillStyle = starColors[i % starColors.length];
        ctx.fillRect(x, y, 2, 2);
      }
    });

    // B) Nebula & Space Dust (480x640)
    createCanvas('bg_nebula', 480, 640, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      // Soft translucent cosmic cloud streaks
      const grad1 = ctx.createRadialGradient(120, 200, 30, 120, 200, 180);
      grad1.addColorStop(0, 'rgba(80, 20, 120, 0.25)');
      grad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad1;
      ctx.beginPath();
      ctx.arc(120, 200, 180, 0, Math.PI * 2);
      ctx.fill();

      const grad2 = ctx.createRadialGradient(380, 450, 40, 380, 450, 220);
      grad2.addColorStop(0, 'rgba(0, 100, 160, 0.2)');
      grad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad2;
      ctx.beginPath();
      ctx.arc(380, 450, 220, 0, Math.PI * 2);
      ctx.fill();
    });

    // C) Biomechanical Xenon Terrain Layer (480x640)
    createCanvas('bg_biomech', 480, 640, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(40, 65, 80, 0.45)';
      ctx.lineWidth = 2;

      // Draw scrolling organic tech rib cages and conduits on the sides
      // Left border conduits
      for (let y = 0; y < h; y += 40) {
        ctx.strokeRect(0, y, 36, 32);
        ctx.fillStyle = 'rgba(25, 40, 50, 0.5)';
        ctx.fillRect(2, y + 2, 32, 28);
        ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.fillRect(32, y + 14, 4, 4); // glowing terminal node
      }

      // Right border conduits
      for (let y = 20; y < h; y += 40) {
        ctx.strokeRect(w - 36, y, 36, 32);
        ctx.fillStyle = 'rgba(25, 40, 50, 0.5)';
        ctx.fillRect(w - 34, y + 2, 32, 28);
        ctx.fillStyle = 'rgba(255, 80, 0, 0.4)';
        ctx.fillRect(w - 36, y + 14, 4, 4);
      }
    });
  }
}
