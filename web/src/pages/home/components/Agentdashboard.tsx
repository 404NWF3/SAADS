import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import './AgentDashboard.css';

// ─── 类型定义 ───────────────────────────────────────────────────────────────────
interface AgentData {
    id: string;
    name: string;
    nameShort: string;
    role: string;
    team: string;
    tag: string;
    color: number;
    css: string;
    angle: number;
    elev: number;
    desc: string;
    outputs: string[];
}

interface PanelState {
    visible: boolean;
    eyebrow: string;
    id: string;
    title: string;
    role: string;
    desc: string;
    accentColor: string;
    tags: Array<{ label: string; color: string }>;
}

// ─── 静态数据 ─────────────────────────────────────────────────────────────
const AGENTS: AgentData[] = [
    {
        id: 'WP1-1', name: '情报采集', nameShort: '情报',
        role: '威胁发现者', team: '红队', tag: '感知层',
        color: 0xb84825, css: '#b84825',
        angle: Math.PI / 2, elev: 0.9,
        desc: '从 arXiv、GitHub、NVD、暗网等多源实时采集威胁情报，利用 LLM + CoT 推理将非结构化数据标准化为 STIX 2.1 格式，驱动后续测试智能体',
        outputs: ['attack_pool', 'STIX 2.1', 'IoC 指标', 'CVE 关联'],
    },
    {
        id: 'WP1-2', name: '对抗检测', nameShort: '对抗',
        role: '漏洞验证者', team: '红队', tag: '执行层',
        color: 0x8a2f48, css: '#8a2f48',
        angle: 0, elev: -0.5,
        desc: '将静态情报转化为动态攻击，遗传算法迭代变异 Prompt，LangGraph 多轮状态机编排复杂攻击，LLM-as-Judge 语义级研判并输出 CVSS 评分',
        outputs: ['vuln_reports', 'CVSS 评分', '修复建议', '攻击脚本'],
    },
    {
        id: 'WP1-3', name: '沙盒模拟', nameShort: '沙盒',
        role: '攻击执行者', team: '算法团队', tag: '环境层',
        color: 0x8a6012, css: '#8a6012',
        angle: -Math.PI / 2, elev: 0.3,
        desc: 'gVisor 内核级隔离容器，eBPF + tcpdump 捕获全流量与系统调用，Presidio 自动脱敏，生成带 Label 的 (Prompt, Response, Label) 高质量训练数据集',
        outputs: ['labeled_data', 'PCAP 日志', 'Syscall 特征', '行为图谱'],
    },
    {
        id: 'WP1-4', name: '入侵检测', nameShort: '检测',
        role: '防御建设者', team: '蓝队', tag: '防御层',
        color: 0x256050, css: '#256050',
        angle: Math.PI, elev: -0.2,
        desc: '基于沙盒实时标注数据，MLOps 流水线持续微调 BERT/DeBERTa 检测模型，漂移自适应更新 LoRA 适配器，防御结果反馈驱动红队进化闭环',
        outputs: ['detection_models', '告警规则', 'LoRA 权重', '防御报告'],
    },
];

const STORE_LABELS = [
    { text: 'attack_pool', color: '#b84825', pos: new THREE.Vector3(2.6, 0.6, -1.8) },
    { text: 'vuln_reports', color: '#8a2f48', pos: new THREE.Vector3(2.3, -0.8, 2.2) },
    { text: 'labeled_data', color: '#8a6012', pos: new THREE.Vector3(-2.5, -0.5, -1.9) },
    { text: 'models', color: '#256050', pos: new THREE.Vector3(-2.1, 0.8, 2.0) },
];

const ORBIT = 5.4;

// ─── 辅助函数 ─────────────────────────────────────────────────────────────────
function makeSprite(
    drawFn: (ctx: CanvasRenderingContext2D, cw: number, ch: number) => void,
    cw: number, ch: number, scaleX: number, scaleY: number
): THREE.Sprite {
    const cv = document.createElement('canvas');
    cv.width = cw; cv.height = ch;
    const ctx = cv.getContext('2d')!;
    drawFn(ctx, cw, ch);
    const tex = new THREE.CanvasTexture(cv);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    sp.scale.set(scaleX, scaleY, 1);
    return sp;
}

function mkRing(r: number, tube: number, col: number, op: number, rx: number, rz = 0): THREE.Mesh {
    const m = new THREE.MeshStandardMaterial({
        color: col, metalness: 0.55, roughness: 0.25,
        transparent: true, opacity: op,
        emissive: col, emissiveIntensity: 0.12,
    });
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 200), m);
    mesh.rotation.x = rx; mesh.rotation.z = rz;
    return mesh;
}

function agentLabelSprite(agent: AgentData): THREE.Sprite {
    const cw = 512, ch = 88;
    return makeSprite((ctx) => {
        ctx.textAlign = 'center';
        ctx.font = '400 18px JetBrains Mono, monospace';
        ctx.fillStyle = agent.css;
        ctx.globalAlpha = 0.55;
        ctx.fillText(agent.id, cw / 2, 22);
        ctx.font = '900 38px Noto Serif SC, serif';
        ctx.fillStyle = '#1c1208';
        ctx.globalAlpha = 0.82;
        ctx.fillText(agent.name, cw / 2, 62);
        ctx.font = '300 15px JetBrains Mono, monospace';
        ctx.fillStyle = '#7a6a58';
        ctx.globalAlpha = 0.45;
        ctx.fillText(agent.role, cw / 2, 82);
    }, cw, ch, cw / 220, ch / 220);
}

// ─── 组件 ───────────────────────────────────────────────────────────────
export default function AgentDashboard() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [panel, setPanel] = useState<PanelState>({
        visible: false,
        eyebrow: '', id: '', title: '', role: '', desc: '',
        accentColor: '#c0502a', tags: [],
    });

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // ── 渲染器 ──
        const W = container.clientWidth;
        const H = container.clientHeight;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(W, H);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.28;
        container.appendChild(renderer.domElement);

        // ── 场景与相机 ──
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xFAF9F5);
        scene.fog = new THREE.Fog(0xFAF9F5, 26, 45);

        const cam = new THREE.PerspectiveCamera(50, W / H, 0.1, 200);
        cam.position.set(0, 3.5, 15);
        cam.lookAt(0, 0, 0);

        // ── 灯光 ──
        scene.add(new THREE.AmbientLight(0xfff8f0, 2.2));
        const sun = new THREE.DirectionalLight(0xfff4e8, 1.9);
        sun.position.set(10, 14, 10); sun.castShadow = true; sun.shadow.mapSize.setScalar(2048);
        scene.add(sun);
        const fill = new THREE.DirectionalLight(0xe8f0f8, 0.55);
        fill.position.set(-9, -4, -7); scene.add(fill);
        const rimL = new THREE.PointLight(0xd08030, 1.1, 35);
        rimL.position.set(0, 9, -6); scene.add(rimL);
        const warmL = new THREE.PointLight(0xf0a050, 0.6, 20);
        warmL.position.set(5, -4, 8); scene.add(warmL);

        // ── 轨道环 ──
        const orbitMesh = new THREE.Mesh(
            new THREE.TorusGeometry(ORBIT, 0.013, 4, 256),
            new THREE.MeshBasicMaterial({ color: 0xb8a890, transparent: true, opacity: 0.28 })
        );
        orbitMesh.rotation.x = Math.PI / 2;
        scene.add(orbitMesh);

        // ── 中央知识库 ──
        const haloMesh = new THREE.Mesh(
            new THREE.SphereGeometry(2.6, 32, 32),
            new THREE.MeshStandardMaterial({ color: 0xe8d8b8, transparent: true, opacity: 0.09, side: THREE.BackSide })
        );
        scene.add(haloMesh);

        const atmosMesh = new THREE.Mesh(
            new THREE.SphereGeometry(1.85, 32, 32),
            new THREE.MeshStandardMaterial({ color: 0xd4a060, transparent: true, opacity: 0.07, side: THREE.BackSide })
        );
        scene.add(atmosMesh);

        const coreMat = new THREE.MeshStandardMaterial({
            color: 0xf0e8d4, metalness: 0.22, roughness: 0.48,
            emissive: 0xc87828, emissiveIntensity: 0.08,
        });
        const coreMesh = new THREE.Mesh(new THREE.SphereGeometry(1.42, 64, 64), coreMat);
        coreMesh.castShadow = true; coreMesh.receiveShadow = true;
        scene.add(coreMesh);

        // 用于悬停缩放的核心组
        const coreGroup = new THREE.Group();
        coreGroup.add(haloMesh);
        coreGroup.add(atmosMesh);
        coreGroup.add(coreMesh);

        const cRings = [
            mkRing(2.00, 0.023, 0xc87020, 0.55, Math.PI / 2 - 0.22, 0.14),
            mkRing(2.42, 0.014, 0xa85818, 0.32, Math.PI / 2 + 0.44, -0.28),
            mkRing(1.65, 0.017, 0xd09030, 0.38, 0.28, 0.76),
            mkRing(2.80, 0.009, 0xb06820, 0.18, Math.PI / 2 + 0.12, 0.50),
        ];
        cRings.forEach(r => coreGroup.add(r));
        scene.add(coreGroup);

        // 核心标签
        const coreLabel = makeSprite((ctx, cw, _ch) => {
            ctx.font = '400 11px JetBrains Mono, monospace';
            ctx.fillStyle = 'rgba(120,90,50,0.55)';
            ctx.textAlign = 'center';
            ctx.fillText('CENTRAL STORE', cw / 2, 22);
            ctx.font = '700 28px Noto Serif SC, serif';
            ctx.fillStyle = 'rgba(28,18,8,0.82)';
            ctx.fillText('中央知识库', cw / 2, 56);
        }, 320, 68, 320 / 72, 68 / 72);
        coreLabel.position.set(0, 2.4, 0);
        scene.add(coreLabel);

        // 存储库标签
        STORE_LABELS.forEach(sl => {
            const sp = makeSprite((ctx, _cw, ch) => {
                ctx.font = '500 13px JetBrains Mono, monospace';
                ctx.fillStyle = sl.color;
                ctx.globalAlpha = 0.78;
                ctx.beginPath(); ctx.arc(8, ch / 2, 3.5, 0, Math.PI * 2); ctx.fill();
                ctx.fillText(sl.text, 22, ch / 2 + 5);
            }, 220, 30, 220 / 88, 30 / 88);
            sp.position.copy(sl.pos);
            scene.add(sp);
        });

        // ── 智能体节点 ──
        const agGroups: THREE.Group[] = [];

        AGENTS.forEach((a, i) => {
            const group = new THREE.Group();

            const geo = new THREE.IcosahedronGeometry(1.0, 4);
            const mat = new THREE.MeshStandardMaterial({
                color: a.color, metalness: 0.14, roughness: 0.58,
                emissive: a.color, emissiveIntensity: 0.08,
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.castShadow = true;
            mesh.userData.idx = i;
            group.add(mesh);

            const wmesh = new THREE.Mesh(
                new THREE.IcosahedronGeometry(1.1, 1),
                new THREE.MeshBasicMaterial({ color: a.color, wireframe: true, transparent: true, opacity: 0.11 })
            );
            group.add(wmesh);

            const glow = new THREE.Mesh(
                new THREE.SphereGeometry(1.5, 16, 16),
                new THREE.MeshBasicMaterial({ color: a.color, transparent: true, opacity: 0.05, side: THREE.BackSide })
            );
            group.add(glow);

            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(1.3, 0.012, 4, 80),
                new THREE.MeshBasicMaterial({ color: a.color, transparent: true, opacity: 0.28 })
            );
            ring.rotation.x = 0.4 + i * 0.35; ring.rotation.z = i * 0.6;
            group.add(ring);

            const labelSp = agentLabelSprite(a);
            labelSp.position.set(0, 1.6, 0);
            group.add(labelSp);

            group.userData = { a, mesh, wmesh, glow, ring };
            scene.add(group);
            agGroups.push(group);
        });

        // ── 背景粒子 ──
        {
            const N = 900;
            const pos = new Float32Array(N * 3);
            const col = new Float32Array(N * 3);
            for (let i = 0; i < N; i++) {
                const r = 20 + Math.random() * 22;
                const th = Math.random() * Math.PI * 2;
                const ph = Math.acos(2 * Math.random() - 1);
                pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
                pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
                pos[i * 3 + 2] = r * Math.cos(ph);
                const w = 0.5 + Math.random() * 0.5;
                col[i * 3] = 0.74 * w; col[i * 3 + 1] = 0.66 * w; col[i * 3 + 2] = 0.54 * w;
            }
            const bg = new THREE.BufferGeometry();
            bg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            bg.setAttribute('color', new THREE.BufferAttribute(col, 3));
            scene.add(new THREE.Points(bg, new THREE.PointsMaterial({
                size: 0.07, vertexColors: true, transparent: true, opacity: 0.4,
            })));
        }

        // ── 流动点 ──
        class Dot {
            f: THREE.Vector3; t: THREE.Vector3;
            p: number; sp: number; rev: boolean;
            m: THREE.Mesh;
            constructor(f: THREE.Vector3, t: THREE.Vector3, col: number, rev = false) {
                this.f = f.clone(); this.t = t.clone();
                this.p = Math.random(); this.sp = 0.0022 + Math.random() * 0.003; this.rev = rev;
                this.m = new THREE.Mesh(
                    new THREE.SphereGeometry(0.036, 4, 4),
                    new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.8 })
                );
                scene.add(this.m);
            }
            update() {
                this.p = (this.p + this.sp) % 1;
                const s = this.rev ? 1 - this.p : this.p, q = 1 - s;
                const mx = (this.f.x + this.t.x) / 2;
                const my = Math.max(this.f.y, this.t.y) + 1.8;
                const mz = (this.f.z + this.t.z) / 2;
                this.m.position.set(
                    q * q * this.f.x + 2 * q * s * mx + s * s * this.t.x,
                    q * q * this.f.y + 2 * q * s * my + s * s * this.t.y,
                    q * q * this.f.z + 2 * q * s * mz + s * s * this.t.z
                );
                (this.m.material as THREE.MeshBasicMaterial).opacity = Math.sin(s * Math.PI) * 0.82;
            }
        }

        const dots: Dot[] = [];
        let dotsReady = false;

        function initDots() {
            const O = new THREE.Vector3();
            agGroups.forEach((g, i) => {
                const pos = g.position.clone(), col = AGENTS[i].color;
                for (let k = 0; k < 3; k++) { const d = new Dot(O, pos, col, false); d.p = k / 3; dots.push(d); }
                for (let k = 0; k < 2; k++) { const d = new Dot(O, pos, col, true); d.p = k / 2 + 0.16; dots.push(d); }
            });
            ([[0, 1], [1, 2], [2, 3], [3, 0]] as [number, number][]).forEach(([a, b]) => {
                const d = new Dot(agGroups[a].position.clone(), agGroups[b].position.clone(), 0xaa8855);
                d.sp = 0.0016; d.p = Math.random(); dots.push(d);
            });
            dotsReady = true;
        }

        // ── 交互状态 ──
        let drag = false, pmx = 0, pmy = 0;
        let tRY = 0.12, tRX = 0.14, cRY = 0.12, cRX = 0.14;
        let tD = 15, cD = 15;
        // 核心的悬停缩放状态
        let coreHovered = false;
        let tCoreScale = 1.0, cCoreScale = 1.0;

        const ray = new THREE.Raycaster();
        const mv = new THREE.Vector2();
        const clickables = agGroups.map(g => g.userData.mesh as THREE.Mesh);
        clickables.push(coreMesh);

        function getContainerSize() {
            return { W: container!.clientWidth, H: container!.clientHeight };
        }

        function onMouseDown(e: MouseEvent) {
            drag = false; pmx = e.clientX; pmy = e.clientY;
            window.addEventListener('mousemove', onDrag);
            window.addEventListener('mouseup', onUp);
        }
        function onDrag(e: MouseEvent) {
            const dx = e.clientX - pmx, dy = e.clientY - pmy;
            if (Math.abs(dx) + Math.abs(dy) > 3) drag = true;
            tRY += dx * 0.0044; tRX += dy * 0.0024;
            tRX = Math.max(-0.76, Math.min(0.76, tRX));
            pmx = e.clientX; pmy = e.clientY;
        }
        function onUp(e: MouseEvent) {
            window.removeEventListener('mousemove', onDrag);
            window.removeEventListener('mouseup', onUp);
            if (!drag) doClick(e);
        }

        function toNDC(e: MouseEvent) {
            const rect = renderer.domElement.getBoundingClientRect();
            mv.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mv.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        }

        function doClick(e: MouseEvent) {
            toNDC(e);
            ray.setFromCamera(mv, cam);
            const h = ray.intersectObjects(clickables);
            if (!h.length) { setPanel(p => ({ ...p, visible: false })); return; }
            const obj = h[0].object;
            if (obj === coreMesh) {
                setPanel({
                    visible: true,
                    eyebrow: '中枢架构 · 知识库',
                    id: 'CENTRAL STORE',
                    title: '中央知识库',
                    role: '四智能体协同枢纽',
                    desc: '所有智能体通过中央知识库解耦通信，事件驱动 Pipeline 跨系统触发，渐进式存储（文件系统 → 数据库 → 向量存储），蓝队防御结果持续反馈驱动红队下轮攻击进化',
                    accentColor: '#c0502a',
                    tags: ['attack_pool', 'vuln_reports', 'labeled_data', 'models', 'STIX 2.1', '向量索引']
                        .map(o => ({ label: o, color: '#c0502a' })),
                });
            } else if (obj.userData.idx !== undefined) {
                const a = AGENTS[obj.userData.idx as number];
                setPanel({
                    visible: true,
                    eyebrow: a.tag + ' · 智能体',
                    id: a.id,
                    title: a.name,
                    role: a.role + ' · ' + a.team,
                    desc: a.desc,
                    accentColor: a.css,
                    tags: a.outputs.map(o => ({ label: o, color: a.css })),
                });
            }
        }

        function onMouseMove(e: MouseEvent) {
            toNDC(e);
            ray.setFromCamera(mv, cam);
            const h = ray.intersectObjects(clickables);
            renderer.domElement.style.cursor = h.length ? 'pointer' : 'default';

            // 核心悬停检测
            const hitCore = h.length > 0 && h[0].object === coreMesh;
            if (hitCore !== coreHovered) {
                coreHovered = hitCore;
                tCoreScale = coreHovered ? 1.18 : 1.0;
            }

            // 智能体悬停发光效果
            agGroups.forEach((g, i) => {
                const hov = h.length > 0 && (h[0].object as THREE.Mesh).userData?.idx === i;
                (g.userData.glow as THREE.Mesh).material = Object.assign(
                    (g.userData.glow as THREE.Mesh).material as THREE.MeshBasicMaterial,
                    { opacity: hov ? 0.20 : 0.05 }
                );
                (g.userData.mesh as THREE.Mesh).material = Object.assign(
                    (g.userData.mesh as THREE.Mesh).material as THREE.MeshStandardMaterial,
                    { emissiveIntensity: hov ? 0.22 : 0.08 }
                );
            });
        }

        renderer.domElement.addEventListener('mousedown', onMouseDown);
        renderer.domElement.addEventListener('mousemove', onMouseMove);

        // ── 动画循环 ──
        const clk = new THREE.Clock();
        let T = 0, flowDone = false;
        let animId: number;

        function loop() {
            animId = requestAnimationFrame(loop);
            const dt = clk.getDelta(); T += dt;

            // 相机
            cRX += (tRX - cRX) * 0.05;
            cRY += (tRY - cRY) * 0.05;
            cD += (tD - cD) * 0.05;
            tRY += 0.00055;
            cam.position.set(
                Math.sin(cRY) * Math.cos(cRX) * cD,
                Math.sin(cRX) * cD,
                Math.cos(cRY) * Math.cos(cRX) * cD
            );
            cam.lookAt(0, 0.5, 0);

            // 核心悬停平滑缩放
            cCoreScale += (tCoreScale - cCoreScale) * 0.08;
            const basePulse = 1 + Math.sin(T * 1.35) * 0.026;
            const finalScale = basePulse * cCoreScale;
            coreGroup.scale.setScalar(finalScale);
            coreMat.emissiveIntensity = (0.08 + Math.sin(T * 1.8) * 0.028) * (coreHovered ? 1.5 : 1.0);

            // 圆环
            cRings[0].rotation.z += 0.0033;
            cRings[1].rotation.z -= 0.0023;
            cRings[2].rotation.y += 0.004; cRings[2].rotation.x += 0.002;
            cRings[3].rotation.z += 0.0014; cRings[3].rotation.y -= 0.0018;

            // 核心标签浮动效果
            coreLabel.position.y = 2.4 + Math.sin(T * 0.8) * 0.07;

            // 智能体
            agGroups.forEach((g, i) => {
                const a = AGENTS[i];
                const ang = a.angle + T * 0.088;
                g.position.set(
                    Math.cos(ang) * ORBIT,
                    Math.sin(T * 0.65 + a.angle * 1.25) * 0.88 + a.elev * 0.5,
                    Math.sin(ang) * ORBIT
                );
                g.rotation.y += 0.005;
                (g.userData.wmesh as THREE.Mesh).rotation.y -= 0.009;
                (g.userData.ring as THREE.Mesh).rotation.z += 0.016;
            });

            // 流动点
            if (!flowDone && T > 0.2) { initDots(); flowDone = true; }
            if (dotsReady) {
                const N = agGroups.length;
                dots.forEach((d, pi) => {
                    const ai = Math.floor(pi / 5);
                    if (pi < N * 5 && ai < N) {
                        const p2 = agGroups[ai].position;
                        pi % 5 < 3 ? d.t.copy(p2) : d.f.copy(p2);
                    }
                    if (pi >= N * 5) {
                        const li = pi - N * 5;
                        const pairs: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 0]];
                        if (li < pairs.length) {
                            d.f.copy(agGroups[pairs[li][0]].position);
                            d.t.copy(agGroups[pairs[li][1]].position);
                        }
                    }
                    d.update();
                });
            }

            rimL.position.x = Math.sin(T * 0.38) * 3;
            rimL.intensity = 1.1 + Math.sin(T * 1.0) * 0.25;

            renderer.render(scene, cam);
        }
        loop();

        // ── 窗口大小改变观察者 ──
        const ro = new ResizeObserver(() => {
            const { W: nW, H: nH } = getContainerSize();
            renderer.setSize(nW, nH);
            cam.aspect = nW / nH;
            cam.updateProjectionMatrix();
        });
        ro.observe(container!);

        // ── 清理函数 ──
        return () => {
            cancelAnimationFrame(animId);
            ro.disconnect();
            renderer.domElement.removeEventListener('mousedown', onMouseDown);
            renderer.domElement.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mousemove', onDrag);
            window.removeEventListener('mouseup', onUp);
            renderer.dispose();
            if (container!.contains(renderer.domElement)) {
                container!.removeChild(renderer.domElement);
            }
        };
    }, []);

    return (
        <div className="agent-dashboard">
            {/* Three.js 画布挂载点 */}
            <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />

            {/* 噪点遮罩层 */}
            <div className="agent-dashboard__noise" />

            {/* 头部 */}
            <div className="agent-dashboard__header">
                <div>
                    <div className="agent-dashboard__eyebrow">AI Security · Agentic Platform</div>
                    <div className="agent-dashboard__title">
                        四智能体<em>闭环协同</em>
                    </div>
                </div>
                <div className="agent-dashboard__header-right">
                    <div className="agent-dashboard__sub">
                        情报 · 测试 · 沙盒 · 检测<br />
                        中央知识库驱动 · 攻防自进化
                    </div>
                </div>
            </div>

            {/* 信息面板 */}
            <div className={`agent-dashboard__panel${panel.visible ? ' agent-dashboard__panel--show' : ''}`}>
                <div className="agent-dashboard__p-accent" style={{ background: panel.accentColor }} />
                <div className="agent-dashboard__p-eyebrow" style={{ color: panel.accentColor }}>
                    {panel.eyebrow}
                </div>
                <div className="agent-dashboard__p-id">{panel.id}</div>
                <div className="agent-dashboard__p-title">{panel.title}</div>
                <div className="agent-dashboard__p-role">{panel.role}</div>
                <div className="agent-dashboard__p-div" />
                <div className="agent-dashboard__p-desc">{panel.desc}</div>
                <div className="agent-dashboard__p-tags">
                    {panel.tags.map((t, i) => (
                        <span
                            key={i}
                            className="agent-dashboard__ptag"
                            style={{
                                color: t.color,
                                borderColor: t.color + '44',
                                background: t.color + '12',
                            }}
                        >
                            {t.label}
                        </span>
                    ))}
                </div>
            </div>

            {/* 图例 */}
            <div className="agent-dashboard__legend">
                <div className="agent-dashboard__leg-item">
                    <span>数据写入</span>
                    <span className="agent-dashboard__leg-dot" style={{ background: '#c0502a' }} />
                </div>
                <div className="agent-dashboard__leg-item">
                    <span>数据读取</span>
                    <span className="agent-dashboard__leg-dot" style={{ background: '#5a8870' }} />
                </div>
                <div className="agent-dashboard__leg-item">
                    <span>反馈回路</span>
                    <span className="agent-dashboard__leg-dot" style={{ background: '#7a6850' }} />
                </div>
            </div>

            {/* 操作提示 */}
            <div className="agent-dashboard__controls">
                <div className="agent-dashboard__ctrl">拖拽旋转</div>
                <div className="agent-dashboard__ctrl">点击节点</div>
            </div>
        </div>
    );
}
