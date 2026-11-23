/**
 * Testimonial corridor — a plain three.js scene (no react-three-fiber).
 *
 * A long ivory hall with soft-black fins and ceiling, burnt-orange light bars, and six
 * free-standing screens alternating left / right. Scroll progress (0→1) is a pure function
 * of the camera pose: start (looking down the hall) → screen 1 (left) → screen 2 (right) → …
 * → screen 6 → walk on into the fog. Between two poses the camera arcs through the middle
 * of the hall (quadratic bezier for position and look target), so each step reads as
 * "move forward, then turn to the next screen".
 *
 * Each screen's face is a CanvasTexture drawn with the site fonts (Anton + Archivo).
 */
import * as THREE from "three";
import type { Testimonial } from "./testimonials";
import { LOGO_MARK, LOGO_ORANGE, LOGO_WORD } from "./logoPaths";

const IVORY = 0xe6d5bd;
const IVORY_DARK = 0xcdbb9f;
const BLACK = 0x101010;
const ORANGE = 0xd5360c;

export const SCREEN_COUNT = 6;
/** poses: start, one per screen, walk-out */
export const POSE_COUNT = SCREEN_COUNT + 2;

const SPACING = 7;
const FIRST_Z = -8;
const SIDE_X = 2.3;
const SCREEN_Y = 1.9;
const SCREEN_W = 3.2;
const SCREEN_H = 2;
const YAW = 0.55;
const EYE_Y = 1.75;
const HALL_HALF_W = 4.5;
const HALL_H = 5.2;
const HALL_FRONT = 16;
const HALL_BACK = FIRST_Z - SPACING * (SCREEN_COUNT - 1) - 45;

type Pose = { pos: THREE.Vector3; target: THREE.Vector3 };

export type CorridorOptions = {
  testimonials: Testimonial[];
  lookName: (slug: string) => string;
  sample: boolean;
  fonts: { display: string; body: string };
  /** cap for devicePixelRatio */
  maxDpr: number;
};

const screenZ = (i: number) => FIRST_Z - SPACING * i;
const screenSide = (i: number) => (i % 2 === 0 ? -1 : 1); // left first
const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const bez = (a: number, m: number, b: number, t: number) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * m + t * t * b;

export class CorridorScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(45, 1, 0.1, 140);
  private poses: Pose[] = [];
  private progress = 0;
  private start = performance.now();
  private tmpPos = new THREE.Vector3();
  private tmpTarget = new THREE.Vector3();

  constructor(private canvas: HTMLCanvasElement, private opts: CorridorOptions) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.scene.background = new THREE.Color(IVORY);
    this.scene.fog = new THREE.Fog(IVORY, 16, 52);
    this.buildHall();
    this.buildScreens();
  }

  /* ---------------- geometry ---------------- */

  private buildHall() {
    const s = this.scene;
    s.add(new THREE.HemisphereLight(0xfff4e6, 0x6b5642, 2.2));
    s.add(new THREE.AmbientLight(0xffffff, 0.25));

    const length = HALL_FRONT - HALL_BACK;
    const midZ = (HALL_FRONT + HALL_BACK) / 2;
    const orangeGlow = new THREE.MeshBasicMaterial({ color: ORANGE, toneMapped: false });
    const black = new THREE.MeshStandardMaterial({ color: BLACK, roughness: 0.6, metalness: 0.1 });

    // floor — slightly darker ivory with a soft sheen
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(HALL_HALF_W * 2, length),
      new THREE.MeshStandardMaterial({ color: IVORY_DARK, roughness: 0.42, metalness: 0.05 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, midZ);
    s.add(floor);

    // walls — warm ivory
    const wallMat = new THREE.MeshStandardMaterial({ color: IVORY, roughness: 0.95 });
    for (const side of [-1, 1]) {
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(length, HALL_H), wallMat);
      wall.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
      wall.position.set(side * HALL_HALF_W, HALL_H / 2, midZ);
      s.add(wall);

      // glowing baseboard along each wall
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, length), orangeGlow);
      base.position.set(side * (HALL_HALF_W - 0.04), 0.03, midZ);
      s.add(base);
    }

    // ceiling — soft black
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(HALL_HALF_W * 2, length), black);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, HALL_H, midZ);
    s.add(ceiling);

    // rhythm: black fins on both walls (with an orange edge) + orange ceiling bars
    const finStep = 3.5;
    const finCount = Math.floor(length / finStep);
    const fins = new THREE.InstancedMesh(new THREE.BoxGeometry(0.28, HALL_H, 0.5), black, finCount * 2);
    const edges = new THREE.InstancedMesh(new THREE.BoxGeometry(0.03, HALL_H - 0.6, 0.05), orangeGlow, finCount * 2);
    const bars = new THREE.InstancedMesh(new THREE.BoxGeometry(2.8, 0.05, 0.16), orangeGlow, finCount);
    const m = new THREE.Matrix4();
    for (let k = 0; k < finCount; k++) {
      const z = HALL_FRONT - 1 - k * finStep;
      for (const [j, side] of [-1, 1].entries()) {
        m.makeTranslation(side * (HALL_HALF_W - 0.14), HALL_H / 2, z);
        fins.setMatrixAt(k * 2 + j, m);
        m.makeTranslation(side * (HALL_HALF_W - 0.3), HALL_H / 2, z);
        edges.setMatrixAt(k * 2 + j, m);
      }
      m.makeTranslation(0, HALL_H - 0.04, z);
      bars.setMatrixAt(k, m);
    }
    s.add(fins, edges, bars);
  }

  private buildScreens() {
    const { testimonials } = this.opts;
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x0b0b0b, roughness: 0.5, metalness: 0.2 });
    const glow = new THREE.MeshBasicMaterial({ color: ORANGE, toneMapped: false });
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();

    for (let i = 0; i < SCREEN_COUNT; i++) {
      const t = testimonials[i % testimonials.length];
      const side = screenSide(i);
      const g = new THREE.Group();
      g.position.set(side * SIDE_X, SCREEN_Y, screenZ(i));
      g.rotation.y = side < 0 ? YAW : -YAW;

      const tex = new THREE.CanvasTexture(drawTestimonial(t, i, this.opts));
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = maxAniso;
      const face = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_W, SCREEN_H), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
      face.position.z = 0.002;
      g.add(face);

      const back = new THREE.Mesh(new THREE.BoxGeometry(SCREEN_W + 0.18, SCREEN_H + 0.18, 0.14), frameMat);
      back.position.z = -0.075;
      g.add(back);

      // orange light bar under the screen + a thin one along the top
      const under = new THREE.Mesh(new THREE.BoxGeometry(SCREEN_W + 0.18, 0.05, 0.06), glow);
      under.position.set(0, -SCREEN_H / 2 - 0.12, 0.02);
      g.add(under);

      // stand: post + slab on the floor, slab with a glowing front edge
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, SCREEN_Y - SCREEN_H / 2, 0.2), frameMat);
      post.position.set(0, -SCREEN_Y + (SCREEN_Y - SCREEN_H / 2) / 2, -0.1);
      g.add(post);
      const slab = new THREE.Mesh(new THREE.BoxGeometry(SCREEN_W * 0.75, 0.1, 1), frameMat);
      slab.position.set(0, -SCREEN_Y + 0.05, 0.1);
      g.add(slab);
      const lip = new THREE.Mesh(new THREE.BoxGeometry(SCREEN_W * 0.75, 0.025, 0.03), glow);
      lip.position.set(0, -SCREEN_Y + 0.1, 0.6);
      g.add(lip);

      // warm pool of light on the floor in front of the screen
      const lamp = new THREE.PointLight(ORANGE, 9, 7, 1.6);
      lamp.position.set(0, -SCREEN_Y + 0.5, 1.4);
      g.add(lamp);

      this.scene.add(g);
    }
  }

  /* ---------------- camera ---------------- */

  private buildPoses() {
    const aspect = this.camera.aspect;
    this.camera.fov = aspect < 1 ? 60 : 45;
    const tan = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    // distance at which the screen fits with a margin (height on wide screens, width on tall ones)
    const d = Math.min(7, Math.max((SCREEN_H * 1.9) / (2 * tan), (SCREEN_W * 1.12) / (2 * tan * aspect)));

    const poses: Pose[] = [{ pos: new THREE.Vector3(0, EYE_Y, 11), target: new THREE.Vector3(0, 1.7, -30) }];
    for (let i = 0; i < SCREEN_COUNT; i++) {
      const side = screenSide(i);
      const center = new THREE.Vector3(side * SIDE_X, SCREEN_Y, screenZ(i));
      const normal = new THREE.Vector3(-side * Math.sin(YAW), 0, Math.cos(YAW));
      const pos = center.clone().addScaledVector(normal, d);
      pos.y = EYE_Y;
      // aim a touch above centre so the screen sits below the fixed navbar
      poses.push({ pos, target: center.clone().setY(SCREEN_Y + 0.12) });
    }
    const lastZ = screenZ(SCREEN_COUNT - 1);
    poses.push({ pos: new THREE.Vector3(0, EYE_Y, lastZ - 8), target: new THREE.Vector3(0, 1.7, lastZ - 40) });
    this.poses = poses;
    this.camera.updateProjectionMatrix();
  }

  private placeCamera(time: number) {
    const f = Math.min(Math.max(this.progress, 0), 1) * (POSE_COUNT - 1);
    const k = Math.min(Math.floor(f), POSE_COUNT - 2);
    const e = smoother(f - k);
    const a = this.poses[k];
    const b = this.poses[k + 1];
    const mz = (a.pos.z + b.pos.z) / 2;
    const tz = Math.min(a.target.z, b.target.z) - 6;
    this.tmpPos.set(bez(a.pos.x, 0, b.pos.x, e), bez(a.pos.y, EYE_Y + 0.05, b.pos.y, e), bez(a.pos.z, mz, b.pos.z, e));
    this.tmpTarget.set(bez(a.target.x, 0, b.target.x, e), bez(a.target.y, 1.7, b.target.y, e), bez(a.target.z, tz, b.target.z, e));
    // a breath of handheld drift so the hall never feels frozen
    this.tmpPos.x += Math.sin(time * 0.55) * 0.018;
    this.tmpPos.y += Math.sin(time * 0.8) * 0.012;
    this.camera.position.copy(this.tmpPos);
    this.camera.lookAt(this.tmpTarget);
  }

  /* ---------------- public API ---------------- */

  resize(width: number, height: number) {
    const dpr = Math.min(window.devicePixelRatio || 1, this.opts.maxDpr);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / Math.max(height, 1);
    this.buildPoses();
  }

  setProgress(p: number) {
    this.progress = p;
  }

  render() {
    if (!this.poses.length) return;
    this.placeCamera((performance.now() - this.start) / 1000);
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      mesh.geometry?.dispose();
      const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
      for (const mat of mats) {
        (mat as THREE.MeshBasicMaterial).map?.dispose();
        mat.dispose();
      }
    });
    this.renderer.dispose();
  }
}

/* ---------------- screen face ---------------- */

const TEX_W = 1600;
const TEX_H = 1000;

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function drawTestimonial(t: Testimonial, i: number, { fonts, lookName, sample }: CorridorOptions) {
  const c = document.createElement("canvas");
  c.width = TEX_W;
  c.height = TEX_H;
  const ctx = c.getContext("2d")!;
  const ivory = "#E6D5BD";
  const orange = "#D5360C";
  const X = 96;

  // soft-black panel with a warm orange bloom in the corner
  ctx.fillStyle = "#101010";
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  const glow = ctx.createRadialGradient(TEX_W, 0, 40, TEX_W, 0, 900);
  glow.addColorStop(0, "rgba(213,54,12,0.30)");
  glow.addColorStop(1, "rgba(213,54,12,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  // top row: logo (mark + wordmark), counter
  ctx.textBaseline = "middle";
  const markH = 72;
  const markS = markH / LOGO_MARK.height;
  ctx.save();
  ctx.translate(X, 110 - markH / 2);
  ctx.scale(markS, markS);
  ctx.fillStyle = LOGO_ORANGE;
  ctx.fill(new Path2D(LOGO_MARK.orange), "evenodd");
  ctx.fillStyle = ivory;
  ctx.fill(new Path2D(LOGO_MARK.dark), "evenodd");
  ctx.restore();
  const wordH = 28;
  const wordS = wordH / LOGO_WORD.height;
  ctx.save();
  ctx.translate(X + LOGO_MARK.width * markS + 18, 110 - wordH / 2);
  ctx.scale(wordS, wordS);
  ctx.fillStyle = ivory;
  ctx.fill(new Path2D(LOGO_WORD.dark), "evenodd");
  ctx.restore();
  ctx.textAlign = "right";
  ctx.font = `700 28px ${fonts.body}`;
  ctx.letterSpacing = "4px";
  ctx.fillStyle = "rgba(230,213,189,0.6)";
  ctx.fillText(`${String(i + 1).padStart(2, "0")} / ${String(SCREEN_COUNT).padStart(2, "0")}`, TEX_W - X, 112);

  // eyebrow (+ sample tag while reviews are placeholders)
  ctx.textAlign = "left";
  ctx.fillStyle = orange;
  ctx.font = `800 24px ${fonts.body}`;
  ctx.letterSpacing = "7px";
  ctx.fillText("CUSTOMER STORY", X, 232);
  if (sample) {
    ctx.font = `700 20px ${fonts.body}`;
    ctx.letterSpacing = "4px";
    const label = "SAMPLE REVIEW";
    const w = ctx.measureText(label).width + 36;
    ctx.strokeStyle = "rgba(230,213,189,0.45)";
    ctx.lineWidth = 2;
    ctx.strokeRect(TEX_W - X - w, 212, w, 42);
    ctx.fillStyle = "rgba(230,213,189,0.75)";
    ctx.textAlign = "center";
    ctx.fillText(label, TEX_W - X - w / 2 + 2, 234);
    ctx.textAlign = "left";
  }

  // quote — mark + text centred as one block between the eyebrow and the divider
  ctx.letterSpacing = "0px";
  ctx.textBaseline = "alphabetic";
  ctx.font = `600 66px ${fonts.body}`;
  const lines = wrap(ctx, t.quote, TEX_W - X * 2 - 40).slice(0, 4);
  const LH = 84;
  const blockH = 105 + lines.length * LH; // ~75px mark, 30px gap, then the lines
  const top = 285 + (495 - blockH) / 2;
  ctx.fillStyle = orange;
  ctx.font = `400 210px ${fonts.display}`;
  ctx.fillText("“", X - 8, top + 180); // Anton's quote glyph sits ~180px above its baseline
  ctx.fillStyle = ivory;
  ctx.font = `600 66px ${fonts.body}`;
  lines.forEach((l, k) => ctx.fillText(l, X, top + 105 + 52 + k * LH));

  // divider
  ctx.fillStyle = "rgba(230,213,189,0.16)";
  ctx.fillRect(X, 800, TEX_W - X * 2, 2);

  // name, city · look, stars
  ctx.fillStyle = ivory;
  ctx.font = `400 54px ${fonts.display}`;
  ctx.letterSpacing = "1px";
  ctx.fillText(t.name.toUpperCase(), X, 878);
  ctx.fillStyle = "rgba(230,213,189,0.62)";
  ctx.font = `600 28px ${fonts.body}`;
  ctx.letterSpacing = "0px";
  ctx.fillText(`${t.city}  ·  ${lookName(t.look)}`, X, 928);
  // stars: filled ones in orange, the rest faint, right-aligned as a row of five
  ctx.font = `400 46px ${fonts.body}`;
  ctx.letterSpacing = "6px";
  const on = "★".repeat(t.rating);
  const x0 = TEX_W - X - ctx.measureText("★".repeat(5)).width;
  ctx.fillStyle = orange;
  ctx.fillText(on, x0, 880);
  ctx.fillStyle = "rgba(230,213,189,0.22)";
  ctx.fillText("★".repeat(5 - t.rating), x0 + ctx.measureText(on).width, 880);

  // orange bar along the bottom edge
  ctx.fillStyle = orange;
  ctx.fillRect(0, TEX_H - 14, TEX_W, 14);
  return c;
}
