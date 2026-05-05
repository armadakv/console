import { EdgeProps, getStraightPath, useInternalNode } from '@xyflow/react';
import React from 'react';

function getBorderIntersection(
  nodeX: number,
  nodeY: number,
  nodeW: number,
  nodeH: number,
  targetX: number,
  targetY: number,
): { x: number; y: number } {
  const cx = nodeX + nodeW / 2;
  const cy = nodeY + nodeH / 2;
  const dx = targetX - cx;
  const dy = targetY - cy;

  if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return { x: cx, y: cy };

  const hw = nodeW / 2 - 2;
  const hh = nodeH / 2 - 2;

  const scaleX = Math.abs(dx) > 0 ? hw / Math.abs(dx) : Infinity;
  const scaleY = Math.abs(dy) > 0 ? hh / Math.abs(dy) : Infinity;
  const scale = Math.min(scaleX, scaleY);

  return { x: cx + dx * scale, y: cy + dy * scale };
}

function truncateTableList(csv: string, max = 2): string {
  const parts = csv.split(', ');
  if (parts.length <= max) return csv;
  return `${parts.slice(0, max).join(', ')} +${parts.length - max}`;
}

interface FloatingEdgeData {
  variant?: 'peer' | 'replication';
  forwardLabel?: string;
  reverseLabel?: string;
  bidirectional?: boolean;
  [key: string]: unknown;
}

interface FloatingEdgeProps extends EdgeProps {
  data?: FloatingEdgeData;
}

const FloatingEdge: React.FC<FloatingEdgeProps> = ({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  markerStart,
  style,
  animated,
  data,
}) => {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  let sx = sourceX;
  let sy = sourceY;
  let tx = targetX;
  let ty = targetY;

  if (
    sourceNode?.internals?.positionAbsolute &&
    targetNode?.internals?.positionAbsolute &&
    sourceNode.measured?.width &&
    targetNode.measured?.width
  ) {
    const sw = sourceNode.measured.width;
    const sh = sourceNode.measured.height ?? 120;
    const tw = targetNode.measured.width;
    const th = targetNode.measured.height ?? 120;
    const spx = sourceNode.internals.positionAbsolute.x;
    const spy = sourceNode.internals.positionAbsolute.y;
    const tpx = targetNode.internals.positionAbsolute.x;
    const tpy = targetNode.internals.positionAbsolute.y;

    const sp = getBorderIntersection(spx, spy, sw, sh, tpx + tw / 2, tpy + th / 2);
    const tp = getBorderIntersection(tpx, tpy, tw, th, spx + sw / 2, spy + sh / 2);
    sx = sp.x;
    sy = sp.y;
    tx = tp.x;
    ty = tp.y;
  }

  const [path] = getStraightPath({ sourceX: sx, sourceY: sy, targetX: tx, targetY: ty });

  const midX = (sx + tx) / 2;
  const midY = (sy + ty) / 2;

  const fwd = data?.forwardLabel;
  const rev = data?.reverseLabel;
  const isBidi = data?.bidirectional;

  let labelContent: React.ReactNode = null;
  if (fwd) {
    const line1 = `\u2192 ${truncateTableList(fwd)}`;
    const line2 = rev ? `\u2190 ${truncateTableList(rev)}` : null;
    const longest = line2 && line2.length > line1.length ? line2 : line1;
    const width = Math.min(Math.max(longest.length * 5.5 + 14, 70), 220);
    const height = line2 ? 30 : 18;

    labelContent = (
      <foreignObject
        x={midX - width / 2}
        y={midY - height / 2}
        width={width}
        height={height}
        style={{ overflow: 'visible', pointerEvents: 'none' }}
      >
        <div
          style={{
            fontSize: 9,
            color: '#60a5fa',
            background: '#0f172a',
            borderRadius: 4,
            padding: '2px 5px',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            border: '1px solid #1e3a5f',
            opacity: 0.92,
            lineHeight: '13px',
          }}
          title={isBidi ? `\u2192 ${fwd}\n\u2190 ${rev}` : fwd}
        >
          <div>{line1}</div>
          {line2 && <div>{line2}</div>}
        </div>
      </foreignObject>
    );
  }

  return (
    <>
      <path
        id={id}
        d={path}
        fill="none"
        className={animated ? 'animated' : ''}
        style={style}
        markerEnd={markerEnd}
        markerStart={markerStart}
      />
      {labelContent}
    </>
  );
};

export default FloatingEdge;
