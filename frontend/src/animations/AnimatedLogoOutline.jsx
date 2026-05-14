// AnimatedLogoParticles.jsx
// Particles float randomly — on hover they assemble into the Ab logo, on mouse leave they disperse back
//
// Usage:
//   <AnimatedLogoParticles size={120} color="#a78bfa" />
//
// Wrap your button with position:relative and pass the hover state down,
// OR use the built-in hover detection by wrapping in the exported container:
//   <ParticleButton color="#a78bfa" size={40} onClick={...}>Open</ParticleButton>

import { useEffect, useRef, useState, useCallback } from "react";

// ── Core canvas component ─────────────────────────────────────────────────────
export default function AnimatedLogoParticles({ size = 120, color = "#a78bfa", assembled = false }) {
    const canvasRef = useRef(null);
    const stateRef  = useRef({ particles: [], targets: [], sampled: false, progress: 0, animId: null });

    const h = Math.round(size * (110 / 175));

    // Parse color once
    const rgbRef = useRef(null);
    useEffect(() => {
        const tmp = document.createElement("div");
        tmp.style.color = color;
        document.body.appendChild(tmp);
        const rgb = getComputedStyle(tmp).color;
        document.body.removeChild(tmp);
        rgbRef.current = rgb.match(/\d+/g).map(Number);
    }, [color]);

    // Sample logo pixels into target positions
    const buildTargets = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || stateRef.current.sampled) return;

        const off  = document.createElement("canvas");
        off.width  = canvas.width;
        off.height = canvas.height;
        const octx = off.getContext("2d");

        const scaleX = canvas.width  / 175;
        const scaleY = canvas.height / 110;
        octx.save();
        octx.scale(scaleX, scaleY);
        octx.translate(-448, -383);
        octx.fillStyle = "#fff";

        const PATHS = [
            "M489.221069,472.956482 C487.727539,472.571533 486.636292,472.247467 485.099243,471.791016 C487.547180,466.109497 489.790283,460.640961 492.317780,455.307190 C492.718292,454.461975 494.400757,453.774994 495.490570,453.774902 C506.859497,453.774048 516.459290,449.033417 525.400269,442.662903 C536.098389,435.040436 546.215698,426.494019 557.403748,419.696075 C570.749695,411.586945 584.980591,410.401184 598.943237,419.235748 C611.398865,427.116821 618.483765,444.010834 615.670532,459.330292 C612.750671,475.230255 602.317566,486.451050 587.560608,489.562531 C574.197144,492.380157 562.992432,486.952789 557.078125,474.638733 C555.209290,470.747772 553.653381,466.704559 552.006287,462.709595 C549.652161,456.999695 550.667297,454.461365 556.684875,450.796265 C560.256104,448.621155 565.326782,449.655670 568.094299,453.655640 C569.759094,456.061829 571.138062,458.910797 571.752075,461.753754 C573.700806,470.776123 584.045044,472.492401 590.374023,467.237701 C596.006592,462.561096 598.166260,452.139801 594.985962,444.165955 C592.082031,436.885101 584.768555,431.644470 577.236572,433.437347 C571.131592,434.890564 565.203979,438.121735 559.882202,441.609009 C550.028015,448.066406 540.795410,455.463562 531.082214,462.147125 C518.624878,470.718933 504.988983,475.294769 489.221069,472.956482 Z",
            "M529.735840,431.686676 C525.070557,435.377197 520.671875,438.831024 515.738281,442.704865 C511.698303,433.981018 508.046692,426.095917 503.955688,417.261902 C499.385986,427.182617 495.146515,436.271606 491.005096,445.405060 C485.241882,458.115234 479.456268,470.817047 473.891937,483.614471 C472.314819,487.241638 470.449249,489.105499 466.122406,488.743256 C460.523560,488.274506 454.855835,488.628937 448.395172,488.628937 C449.425812,485.926544 450.153442,483.643494 451.143036,481.480286 C464.762451,451.708130 478.484650,421.982574 491.970428,392.150177 C493.459381,388.856384 495.385803,388.394714 498.628571,387.822662 C510.057343,385.806396 516.113953,390.357849 519.533813,401.276428 C522.193848,409.768951 526.948242,417.590820 530.445923,425.848785 C531.093994,427.378723 530.190063,429.566040 529.735840,431.686676 Z",
            "M551.211304,387.667389 C556.963257,388.942078 559.327393,392.719147 559.754089,397.777039 C560.018188,400.907990 559.721497,404.096954 559.539978,407.252045 C559.322144,411.037628 557.535156,413.740417 554.043945,415.514496 C550.497986,417.316345 547.150208,419.508057 543.181152,421.843506 C542.413391,421.176849 541.210327,420.370514 540.307983,419.308563 C535.892578,414.112122 534.609558,397.923889 538.122192,392.218323 C541.121155,387.347229 545.756165,386.852478 551.211304,387.667389 Z",
            "M550.502380,471.308533 C553.296387,477.118927 555.895996,482.607391 558.798096,488.734406 C551.370117,488.734406 544.765320,488.875549 538.177673,488.603363 C537.002441,488.554810 535.454956,487.014832 534.838623,485.783478 C532.324341,480.760040 530.104919,475.589020 527.575073,470.028992 C533.114990,466.467987 538.473694,463.023468 544.329712,459.259338 C546.441223,463.401398 548.374634,467.194000 550.502380,471.308533 Z",
        ];
        PATHS.forEach(d => { const p = new Path2D(d); octx.fill(p); });
        octx.restore();

        const imgData = octx.getImageData(0, 0, canvas.width, canvas.height);
        const targets = [];
        const step = Math.max(2, Math.floor(size / 50));
        for (let y = 0; y < canvas.height; y += step) {
            for (let x = 0; x < canvas.width; x += step) {
                if (imgData.data[(y * canvas.width + x) * 4 + 3] > 128) {
                    targets.push({ x, y });
                }
            }
        }

        // Particles start at random positions across the FULL larger canvas
        const W = canvas.width;
        const H = canvas.height;
        stateRef.current.particles = targets.map(t => ({
            tx: t.x, ty: t.y,
            fx: Math.random() * W,  // float anywhere in full canvas
            fy: Math.random() * H,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            r:  0.8 + Math.random() * (size / 100),
        }));
        stateRef.current.targets  = targets;
        stateRef.current.sampled  = true;
    }, [size]);

    // Main animation loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        buildTargets();

        let lastTime = null;

        function ease(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

        function frame(ts) {
            if (!lastTime) lastTime = ts;
            const dt = Math.min((ts - lastTime) / 1000, 0.05); // seconds, capped
            lastTime = ts;

            const S    = stateRef.current;
            const [r,g,b] = rgbRef.current || [167,139,250];

            // Animate progress toward target (0=dispersed, 1=assembled)
            const target = assembled ? 1 : 0;
            const speed  = assembled ? 2.5 : 1.8; // assemble faster than disperse
            S.progress += (target - S.progress) * speed * dt;
            S.progress  = Math.max(0, Math.min(1, S.progress));

            const p = ease(S.progress);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = `rgb(${r},${g},${b})`;

            S.particles.forEach(pt => {
                // Float position drifts slowly
                if (S.progress < 0.98) {
                    pt.fx += pt.vx;
                    pt.fy += pt.vy;
                    // Bounce off edges
                    if (pt.fx < 0 || pt.fx > canvas.width)  pt.vx *= -1;
                    if (pt.fy < 0 || pt.fy > canvas.height) pt.vy *= -1;
                }

                const x = pt.fx + (pt.tx - pt.fx) * p;
                const y = pt.fy + (pt.ty - pt.fy) * p;

                ctx.globalAlpha = 0.4 + p * 0.6;
                ctx.beginPath();
                ctx.arc(x, y, pt.r, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;

            stateRef.current.animId = requestAnimationFrame(frame);
        }

        stateRef.current.animId = requestAnimationFrame(frame);
        return () => { if (stateRef.current.animId) cancelAnimationFrame(stateRef.current.animId); };
    }, [assembled, buildTargets]);

    return (
        <canvas
            ref={canvasRef}
            width={size}
            height={h}
            style={{ display:"block", pointerEvents:"none" }}
        />
    );
}

// ── Ready-to-use button wrapper ───────────────────────────────────────────────
// Replaces your CTA button entirely — particles float, hover assembles logo
//
// Usage:
//   <ParticleButton color="#a78bfa" particleSize={50} onClick={...} style={...}>
//     Open AccountBud
//   </ParticleButton>

export function ParticleButton({ children, color = "#a78bfa", particleSize = 50, onClick, style = {},textColor }) {
    const [hovered, setHovered] = useState(false);

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                background: "transparent",
                border: `1px solid ${color}40`,
                borderRadius: 12,
                padding: "12px 28px",
                color: textColor || "#fff",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Outfit', sans-serif",
                transition: "border-color 0.3s, background 0.3s",
                backdropFilter: "blur(8px)",
                ...(hovered ? { borderColor: color, background: `${color}15` } : {}),
                ...style,
            }}
        >
            <AnimatedLogoParticles size={particleSize} color={color} assembled={hovered} />
            {children}
        </button>
    );
}