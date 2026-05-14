// AnimatedLogoOutline.jsx
// A single continuous stroke that traces the outline of A then b — elegant, pen-drawing effect
// Loops continuously with easeInOut
//
// Usage:
//   <AnimatedLogoOutline size={120} color="#a78bfa" />
//   <AnimatedLogoOutline size={40} color="white" />
//
// Props:
//   size  — width in px. Height auto from aspect ratio.
//   color — stroke color

import { useEffect, useRef, useState } from "react";

// Single continuous outline path tracing A first, then b
// Drawn as one connected stroke for the pen-drawing effect
const OUTLINE_PATHS = [
    // A — outer contour (the full A shape as one stroke)
    "M489.221069,472.956482 C487.727539,472.571533 486.636292,472.247467 485.099243,471.791016 C487.547180,466.109497 489.790283,460.640961 492.317780,455.307190 C492.718292,454.461975 494.400757,453.774994 495.490570,453.774902 C506.859497,453.774048 516.459290,449.033417 525.400269,442.662903 C536.098389,435.040436 546.215698,426.494019 557.403748,419.696075 C570.749695,411.586945 584.980591,410.401184 598.943237,419.235748 C611.398865,427.116821 618.483765,444.010834 615.670532,459.330292 C612.750671,475.230255 602.317566,486.451050 587.560608,489.562531 C574.197144,492.380157 562.992432,486.952789 557.078125,474.638733 C555.209290,470.747772 553.653381,466.704559 552.006287,462.709595 C549.652161,456.999695 550.667297,454.461365 556.684875,450.796265 C560.256104,448.621155 565.326782,449.655670 568.094299,453.655640 C569.759094,456.061829 571.138062,458.910797 571.752075,461.753754 C573.700806,470.776123 584.045044,472.492401 590.374023,467.237701 C596.006592,462.561096 598.166260,452.139801 594.985962,444.165955 C592.082031,436.885101 584.768555,431.644470 577.236572,433.437347 C571.131592,434.890564 565.203979,438.121735 559.882202,441.609009 C550.028015,448.066406 540.795410,455.463562 531.082214,462.147125 C518.624878,470.718933 504.988983,475.294769 489.221069,472.956482 Z",
    // A — left leg stroke
    "M529.735840,431.686676 C525.070557,435.377197 520.671875,438.831024 515.738281,442.704865 C511.698303,433.981018 508.046692,426.095917 503.955688,417.261902 C499.385986,427.182617 495.146515,436.271606 491.005096,445.405060 C485.241882,458.115234 479.456268,470.817047 473.891937,483.614471 C472.314819,487.241638 470.449249,489.105499 466.122406,488.743256 C460.523560,488.274506 454.855835,488.628937 448.395172,488.628937 C449.425812,485.926544 450.153442,483.643494 451.143036,481.480286 C464.762451,451.708130 478.484650,421.982574 491.970428,392.150177 C493.459381,388.856384 495.385803,388.394714 498.628571,387.822662 C510.057343,385.806396 516.113953,390.357849 519.533813,401.276428 C522.193848,409.768951 526.948242,417.590820 530.445923,425.848785 C531.093994,427.378723 530.190063,429.566040 529.735840,431.686676 Z",
    // b — upper bump
    "M551.211304,387.667389 C556.963257,388.942078 559.327393,392.719147 559.754089,397.777039 C560.018188,400.907990 559.721497,404.096954 559.539978,407.252045 C559.322144,411.037628 557.535156,413.740417 554.043945,415.514496 C550.497986,417.316345 547.150208,419.508057 543.181152,421.843506 C542.413391,421.176849 541.210327,420.370514 540.307983,419.308563 C535.892578,414.112122 534.609558,397.923889 538.122192,392.218323 C541.121155,387.347229 545.756165,386.852478 551.211304,387.667389 Z",
    // b — lower bump
    "M550.502380,471.308533 C553.296387,477.118927 555.895996,482.607391 558.798096,488.734406 C551.370117,488.734406 544.765320,488.875549 538.177673,488.603363 C537.002441,488.554810 535.454956,487.014832 534.838623,485.783478 C532.324341,480.760040 530.104919,475.589020 527.575073,470.028992 C533.114990,466.467987 538.473694,463.023468 544.329712,459.259338 C546.441223,463.401398 548.374634,467.194000 550.502380,471.308533 Z",
];

export default function AnimatedLogoOutline({ size = 120, color = "#a78bfa" }) {
    const svgRef = useRef(null);
    const [uid]  = useState(() => `alo${Math.random().toString(36).slice(2,7)}`);
    const [lens, setLens] = useState(null);

    useEffect(() => {
        if (!svgRef.current) return;
        const paths = svgRef.current.querySelectorAll("path");
        setLens(Array.from(paths).map(p => Math.ceil(p.getTotalLength())));
    }, [size]);

    const h  = Math.round(size * (110 / 175));
    const sw = Math.max(1, size / 60); // thinner stroke than loading version

    // Timing:
    // Each path draws one after another in sequence
    // Total draw time: 2.4s, hold: 0.4s, fade: 0.4s = 3.2s loop
    // path 0: 0%→25%
    // path 1: 20%→45%   (overlaps slightly for fluidity)
    // path 2: 42%→62%
    // path 3: 58%→75%
    // all hold: 75%→87%
    // all fade: 87%→99%
    // reset: 100%

    const TIMING = [
        { start: 0,  drawEnd: 27, fadeStart: 84 },
        { start: 22, drawEnd: 48, fadeStart: 84 },
        { start: 44, drawEnd: 64, fadeStart: 84 },
        { start: 60, drawEnd: 78, fadeStart: 84 },
    ];

    const css = lens ? OUTLINE_PATHS.map((_, i) => {
        const L = lens[i];
        const { start, drawEnd, fadeStart } = TIMING[i];
        const name = `${uid}p${i}`;
        return `
      @keyframes ${name} {
        0%          { stroke-dashoffset:${L}px; opacity:0; }
        ${start > 0 ? `${start - 1}%  { stroke-dashoffset:${L}px; opacity:0; }` : ""}
        ${start}%   { stroke-dashoffset:${L}px; opacity:1; }
        ${drawEnd}% { stroke-dashoffset:0; opacity:1; }
        ${fadeStart}% { stroke-dashoffset:0; opacity:1; }
        99%         { stroke-dashoffset:0; opacity:0; }
        100%        { stroke-dashoffset:${L}px; opacity:0; }
      }
      .${name} {
        stroke-dasharray:${L}px;
        animation:${name} 3.2s cubic-bezier(0.37,0,0.63,1) infinite;
      }
    `;
    }).join("") : "";

    return (
        <>
            {css && <style>{css}</style>}
            <svg
                ref={svgRef}
                width={size}
                height={h}
                viewBox="448 383 175 110"
                xmlns="http://www.w3.org/2000/svg"
                style={{ display:"block" }}
            >
                {OUTLINE_PATHS.map((d, i) => (
                    <path
                        key={i}
                        d={d}
                        fill="none"
                        stroke={color}
                        strokeWidth={sw}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={lens ? `${uid}p${i}` : ""}
                        style={{ opacity:0 }}
                    />
                ))}
            </svg>
        </>
    );
}