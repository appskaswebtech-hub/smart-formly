import { Card, BlockStack, Text, InlineStack, Select } from "@shopify/polaris";
import { useState } from "react";

type TrendPoint = {
  date: string;
  count: number;
};

type Props = {
  trend: TrendPoint[];
};

export function SubmissionChart({ trend = [] }: Props) {
  const [range, setRange] = useState("7");

  const max   = Math.max(...trend.map((t) => t.count), 1);
  const W     = 600;
  const H     = 160;
  const padX  = 10;
  const padY  = 16;
  const pts   = trend.map((t, i) => {
    const x = padX + (i / Math.max(trend.length - 1, 1)) * (W - padX * 2);
    const y = padY + (1 - t.count / max) * (H - padY * 2);
    return { x, y, ...t };
  });

  const linePath  = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath  = pts.length > 0
    ? `${linePath} L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`
    : "";

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((v) =>
    padY + (1 - v) * (H - padY * 2)
  );

  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="center">
          <Text as="h2" variant="headingMd">
            Submission trends
          </Text>
          <Select
            label=""
            labelHidden
            options={[
              { label: "Last 7 days",  value: "7"  },
              { label: "Last 14 days", value: "14" },
              { label: "Last 30 days", value: "30" },
            ]}
            value={range}
            onChange={setRange}
          />
        </InlineStack>

        {/* Chart */}
        <div style={{ overflowX: "auto" }}>
          <svg
            viewBox={`0 0 ${W} ${H + 24}`}
            width="100%"
            style={{ display: "block" }}
          >
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#5C6AC4" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#5C6AC4" stopOpacity="0"    />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {gridLines.map((y, i) => (
              <line
                key={i}
                x1={padX}
                y1={y}
                x2={W - padX}
                y2={y}
                stroke="#E5E7EB"
                strokeWidth="0.8"
              />
            ))}

            {/* Area fill */}
            {areaPath && (
              <path d={areaPath} fill="url(#areaGrad)" />
            )}

            {/* Line */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="#5C6AC4"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data points */}
            {pts.map((p, i) => (
              p.count > 0 && (
                <circle key={i} cx={p.x} cy={p.y} r="4" fill="#5C6AC4" />
              )
            ))}

            {/* X-axis labels */}
            {pts.map((p, i) => {
              const d    = new Date(p.date);
              const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              const showEvery = pts.length <= 7 ? 1 : Math.ceil(pts.length / 7);
              if (i % showEvery !== 0 && i !== pts.length - 1) return null;
              return (
                <text
                  key={i}
                  x={p.x}
                  y={H + 16}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#9CA3AF"
                  fontFamily="sans-serif"
                >
                  {label}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Empty state */}
        {trend.every((t) => t.count === 0) && (
          <Text as="p" tone="subdued" alignment="center">
            No submissions yet in this period
          </Text>
        )}
      </BlockStack>
    </Card>
  );
}