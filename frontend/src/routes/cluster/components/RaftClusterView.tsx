import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  Edge,
  EdgeTypes,
  MarkerType,
  Node,
  NodeTypes,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import React, { useCallback, useEffect } from 'react';

import FloatingEdge from './FloatingEdge';
import RaftMemberNode, { RaftMemberNodeData } from './RaftMemberNode';

import { ClusterInfo, StatusResponse } from '@/types';

interface RaftClusterViewProps {
  status: StatusResponse | undefined;
  clusterInfo: ClusterInfo | undefined;
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
}

const nodeTypes: NodeTypes = { raftMember: RaftMemberNode };
const edgeTypes: EdgeTypes = { floating: FloatingEdge };

/** Place n nodes evenly on a circle */
function circleLayout(n: number, radius = 220): { x: number; y: number }[] {
  if (n === 1) return [{ x: 0, y: 0 }];
  return Array.from({ length: n }, (_, i) => ({
    x: Math.round(radius * Math.cos((2 * Math.PI * i) / n - Math.PI / 2)),
    y: Math.round(radius * Math.sin((2 * Math.PI * i) / n - Math.PI / 2)),
  }));
}

function buildGraph(
  status: StatusResponse | undefined,
  clusterInfo: ClusterInfo | undefined,
  currentNodeId: string | null,
): { nodes: Node[]; edges: Edge[] } {
  const members = clusterInfo?.members ?? [];

  if (members.length === 0) {
    // No cluster info — fall back to status servers
    const servers = status?.servers ?? [];
    const positions = circleLayout(servers.length, 220);
    const nodes: Node[] = servers.map((s, i) => {
      const tableEntries = Object.entries(s.tables ?? {});
      const maxTerm = tableEntries.reduce((m, [, ts]) => Math.max(m, ts.raftTerm), 0);
      const maxIndex = tableEntries.reduce((m, [, ts]) => Math.max(m, ts.raftIndex), 0);

      return {
        id: s.id,
        type: 'raftMember',
        position: { x: positions[i].x + 400, y: positions[i].y + 300 },
        data: {
          label: s.name || s.id.substring(0, 8),
          nodeId: s.id,
          status: s.status,
          isCurrent: s.id === currentNodeId,
          clientURL: '',
          peerURL: '',
          totalTables: tableEntries.length,
          highestRaftTerm: maxTerm,
          highestRaftIndex: maxIndex,
          errors: s.errors ?? [],
        } satisfies RaftMemberNodeData,
      };
    });
    return { nodes, edges: buildEdges(nodes, status) };
  }

  const positions = circleLayout(members.length, Math.max(220, members.length * 70));
  const nodes: Node[] = members.map((m, i) => {
    const server = status?.servers?.find((s) => s.id === m.id);
    const tableEntries = Object.entries(server?.tables ?? {});
    const maxTerm = tableEntries.reduce((max, [, ts]) => Math.max(max, ts.raftTerm), 0);
    const maxIndex = tableEntries.reduce((max, [, ts]) => Math.max(max, ts.raftIndex), 0);

    return {
      id: m.id,
      type: 'raftMember',
      position: { x: positions[i].x + 400, y: positions[i].y + 300 },
      data: {
        label: m.name || m.id.substring(0, 8),
        nodeId: m.id,
        status: server?.status ?? 'unknown',
        isCurrent: m.id === currentNodeId,
        clientURL: m.clientURLs?.[0] ?? '',
        peerURL: m.peerURLs?.[0] ?? '',
        totalTables: tableEntries.length,
        highestRaftTerm: maxTerm,
        highestRaftIndex: maxIndex,
        errors: server?.errors ?? [],
      } satisfies RaftMemberNodeData,
    };
  });

  return { nodes, edges: buildEdges(nodes, status) };
}

function buildEdges(nodes: Node[], status: StatusResponse | undefined): Edge[] {
  const edges: Edge[] = [];
  const ids = nodes.map((n) => n.id);

  // All-to-all peer connections (dashed, subtle)
  const peerSeen = new Set<string>();
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const edgeId = [ids[i], ids[j]].sort().join('--peer--');
      if (!peerSeen.has(edgeId)) {
        peerSeen.add(edgeId);
        edges.push({
          id: edgeId,
          source: ids[i],
          target: ids[j],
          type: 'floating',
          data: { variant: 'peer' },
          style: { stroke: '#334155', strokeDasharray: '5 5', strokeWidth: 1 },
          animated: false,
        });
      }
    }
  }

  // Build replication map: leaderId → followerId → Set<tableName>
  const servers = status?.servers ?? [];
  const repMap = new Map<string, Map<string, Set<string>>>();
  for (const server of servers) {
    for (const [tableName, ts] of Object.entries(server.tables ?? {})) {
      const leaderId = ts.leader;
      if (!leaderId || leaderId === server.id) continue;
      if (!repMap.has(leaderId)) repMap.set(leaderId, new Map());
      const fm = repMap.get(leaderId)!;
      if (!fm.has(server.id)) fm.set(server.id, new Set());
      fm.get(server.id)!.add(tableName);
    }
  }

  // One edge per sorted node-pair — merge bidirectional flows into a single edge
  const repSeen = new Set<string>();
  for (const [leaderId, followers] of Array.from(repMap)) {
    for (const [followerId, tables] of Array.from(followers)) {
      const pairKey = [leaderId, followerId].sort().join('~~');
      if (repSeen.has(pairKey)) continue;
      repSeen.add(pairKey);

      const forwardTables = Array.from(tables);
      const reverseTables = Array.from(repMap.get(followerId)?.get(leaderId) ?? new Set<string>());
      const isBidi = reverseTables.length > 0;

      edges.push({
        id: `rep--${pairKey}`,
        source: leaderId,
        target: followerId,
        type: 'floating',
        data: {
          variant: 'replication',
          forwardLabel: forwardTables.join(', '),
          reverseLabel: isBidi ? reverseTables.join(', ') : undefined,
          bidirectional: isBidi,
        },
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6', width: 16, height: 16 },
        ...(isBidi && {
          markerStart: { type: MarkerType.ArrowClosed, color: '#3b82f6', width: 16, height: 16 },
        }),
        style: { stroke: '#3b82f6', strokeWidth: 1.5 },
      });
    }
  }

  return edges;
}

const RaftClusterView: React.FC<RaftClusterViewProps> = ({
  status,
  clusterInfo,
  selectedNodeId,
  onNodeSelect,
}) => {
  const { nodes: initialNodes, edges: initialEdges } = buildGraph(
    status,
    clusterInfo,
    clusterInfo?.nodeId ?? null,
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Rebuild whenever data changes — preserve existing positions so nodes don't jump on refresh
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = buildGraph(
      status,
      clusterInfo,
      clusterInfo?.nodeId ?? null,
    );
    setNodes((existingNodes) => {
      const positionMap = new Map(existingNodes.map((n) => [n.id, n.position]));
      return newNodes.map((n) => ({
        ...n,
        position: positionMap.get(n.id) ?? n.position,
      }));
    });
    setEdges(newEdges);
  }, [status, clusterInfo, setNodes, setEdges]);

  // Highlight selected node
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        selected: n.id === selectedNodeId,
      })),
    );
  }, [selectedNodeId, setNodes]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeSelect(node.id === selectedNodeId ? null : node.id);
    },
    [selectedNodeId, onNodeSelect],
  );

  const onPaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      minZoom={0.3}
      maxZoom={2}
      colorMode="dark"
      connectionMode={ConnectionMode.Loose}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#1e293b" />
      <Controls showInteractive={false} className="!bg-slate-800 !border-slate-700 !rounded-lg" />
    </ReactFlow>
  );
};

export default RaftClusterView;
