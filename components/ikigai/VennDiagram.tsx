"use client";

import React from "react";

interface VennDiagramProps {
  quadrantItems?: {
    love: string[];
    skill: string[];
    world: string[];
    paid: string[];
  };
}

const R = 130;

const CIRCLES = [
  {
    key: "love" as const,
    cx: 210, cy: 210,
    color: "#e8845a",
    labelLines: ["What You", "Love"],
    ax: 133, ay: 112,
  },
  {
    key: "skill" as const,
    cx: 370, cy: 210,
    color: "#4ecdc4",
    labelLines: ["What You're", "Good At"],
    ax: 447, ay: 112,
  },
  {
    key: "world" as const,
    cx: 210, cy: 370,
    color: "#9b6dff",
    labelLines: ["What The", "World Needs"],
    ax: 133, ay: 445,
  },
  {
    key: "paid" as const,
    cx: 370, cy: 370,
    color: "#f5c842",
    labelLines: ["What You Can", "Be Paid For"],
    ax: 447, ay: 445,
  },
] as const;

const INTERSECTIONS = [
  { label: "PASSION",    x: 290, y: 158 },
  { label: "MISSION",    x: 159, y: 290 },
  { label: "PROFESSION", x: 421, y: 290 },
  { label: "VOCATION",   x: 290, y: 422 },
];

export function VennDiagram({ quadrantItems }: VennDiagramProps) {
  if (!quadrantItems) return null;

  return (
    <svg
      viewBox="0 0 580 580"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", maxWidth: 560, display: "block", margin: "0 auto" }}
      aria-hidden="true"
    >
      {/* Circle fills */}
      {CIRCLES.map(({ key, cx, cy, color }) => (
        <circle
          key={key}
          cx={cx} cy={cy} r={R}
          fill={color} fillOpacity={0.15}
          stroke={color} strokeWidth={1.5} strokeOpacity={0.5}
        />
      ))}

      {/* Intersection labels */}
      {INTERSECTIONS.map(({ label, x, y }) => (
        <text
          key={label}
          x={x} y={y}
          textAnchor="middle"
          fontSize={8}
          fill="white" fillOpacity={0.35}
          letterSpacing="0.1em"
          fontFamily="system-ui, sans-serif"
        >
          {label}
        </text>
      ))}

      {/* Center IKIGAI */}
      <text
        x={290} y={287}
        textAnchor="middle"
        fontSize={10.5}
        fill="white" fillOpacity={0.82}
        letterSpacing="0.22em"
        fontWeight="500"
        fontFamily="system-ui, sans-serif"
      >
        IKIGAI
      </text>

      {/* Per-circle: label lines + items */}
      {CIRCLES.map(({ key, color, labelLines, ax, ay }) => {
        const items = quadrantItems[key];
        return (
          <g key={key}>
            {labelLines.map((line, i) => (
              <text
                key={i}
                x={ax} y={ay + i * 11}
                textAnchor="middle"
                fontSize={8}
                fill={color} fillOpacity={0.7}
                fontWeight="500"
                letterSpacing="0.03em"
                fontFamily="system-ui, sans-serif"
              >
                {line}
              </text>
            ))}
            {items.slice(0, 3).map((item, i) => (
              <text
                key={i}
                x={ax}
                y={ay + labelLines.length * 11 + 5 + i * 10}
                textAnchor="middle"
                fontSize={7}
                fill="white" fillOpacity={0.42}
                fontFamily="system-ui, sans-serif"
              >
                {item.length > 22 ? item.slice(0, 21) + "..." : item}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}
