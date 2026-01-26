"use client";
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import ReactFlow, {
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    MiniMap,
    Connection,
    Edge,
    Node,
    MarkerType,
    Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import MemberNode, { MemberNodeData } from './MemberNode';
import { FamilyMember, Ancestor } from '@/services/familyService';

interface FamilyTreeProps {
    ancestors: Ancestor[];
    familyMembers: FamilyMember[];
    onNodeClick?: (memberId: string) => void;
    onAddRelative?: (memberId: string) => void;
    onEdit?: (memberId: string) => void;
    centerMemberId?: string;
}

const nodeTypes = {
    memberNode: MemberNode,
};

export default function FamilyTree({ ancestors, familyMembers, onNodeClick, onAddRelative, onEdit, centerMemberId }: FamilyTreeProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // --- AUTO LAYOUT LOGIC ---
    useEffect(() => {
        const allMembers = [...ancestors, ...familyMembers];
        if (allMembers.length === 0) return;

        // 1. Calculate Generations
        const getGeneration = (m: any) => {
            const year = m.birth ? new Date(m.birth).getFullYear() : (m.birthDate ? new Date(m.birthDate).getFullYear() : 0);
            if (year === 0) return 0; // Unknown
            // Base generation logic (simplified)
            // Ideally we should use graph traversal (BFS) from root to determine gen
            // But for now, let's cluster by year roughly 25 years
            // Let's assume 2000 is Gen 0 (Current)
            // >2015 = Gen -1 (Kids)
            // 1975-2000 = Gen 0 (Adults)
            // 1950-1975 = Gen 1 (Parents)
            // <1950 = Gen 2 (Grandparents)

            if (year >= 2015) return 0; // Kids layer (Bottom)
            if (year >= 1985) return 1; // Me layer
            if (year >= 1960) return 2; // Parents
            if (year >= 1930) return 3; // Grandparents
            return 4; // Great Grandparents
        };

        // Group by Gen
        const levels: { [key: number]: any[] } = {};
        allMembers.forEach(m => {
            const gen = getGeneration(m);
            if (!levels[gen]) levels[gen] = [];
            levels[gen].push(m);
        });

        // 2. Create Nodes
        const newNodes: Node[] = [];
        const newEdges: Edge[] = [];

        // Sorting keys reversed because 4 is top, 0 is bottom? No:
        // Let's standardize: Y increases downwards.
        // Gen 4 (Oldest) at Y = 0
        // Gen 3 at Y = 200
        // ...
        // Gen 0 (Kids) at Y = 800

        const sortedGens = Object.keys(levels).map(Number).sort((a, b) => b - a); // 4, 3, 2, 1, 0

        const LEVEL_HEIGHT = 200;
        const NODE_WIDTH = 220;

        sortedGens.forEach((gen, index) => {
            const members = levels[gen] as any[];
            // Sort to keep couples together if possible (Simple name sort for now)
            members.sort((a, b) => (a.birthDate || a.birth || '').localeCompare(b.birthDate || b.birth || ''));

            const totalWidth = members.length * NODE_WIDTH;
            const startX = -totalWidth / 2;

            members.forEach((m, mIdx) => {
                newNodes.push({
                    id: m.id,
                    type: 'memberNode',
                    data: {
                        member: m,
                        isCenter: m.id === centerMemberId,
                        onEdit: onEdit,
                        onAddRelative: onAddRelative
                    },
                    position: { x: startX + (mIdx * NODE_WIDTH), y: index * LEVEL_HEIGHT },
                });

                // 3. Create Edges
                // Process Parent Links
                if (m.fatherId && allMembers.find(x => x.id === m.fatherId)) {
                    newEdges.push({
                        id: `e-${m.fatherId}-${m.id}`,
                        source: m.fatherId,
                        target: m.id,
                        sourceHandle: 'bottom',
                        targetHandle: 'top',
                        type: 'smoothstep',
                        markerEnd: { type: MarkerType.ArrowClosed, color: '#aaa' },
                        style: { stroke: '#555' }
                    });
                }
                if (m.motherId && allMembers.find(x => x.id === m.motherId)) {
                    newEdges.push({
                        id: `e-${m.motherId}-${m.id}`,
                        source: m.motherId,
                        target: m.id,
                        sourceHandle: 'bottom',
                        targetHandle: 'top',
                        type: 'smoothstep',
                        markerEnd: { type: MarkerType.ArrowClosed, color: '#aaa' },
                        style: { stroke: '#555' }
                    });
                }
                // Process Spouse Links
                if (m.spouseId && allMembers.find(x => x.id === m.spouseId)) {
                    // Avoid duplicate edges (if A->B exists, don't add B->A)
                    const linkId1 = `e-spouse-${m.id}-${m.spouseId}`;
                    const linkId2 = `e-spouse-${m.spouseId}-${m.id}`;
                    if (!newEdges.find(e => e.id === linkId2)) {
                        newEdges.push({
                            id: linkId1,
                            source: m.id,
                            target: m.spouseId,
                            sourceHandle: 'right',
                            targetHandle: 'left',
                            type: 'straight',
                            style: { stroke: '#D4AF37', strokeWidth: 2, strokeDasharray: '5,5' },
                            label: '❤️',
                            labelStyle: { fill: '#fff', fontSize: 10 }
                        });
                    }
                }
            });
        });

        setNodes(newNodes);
        setEdges(newEdges);

    }, [ancestors, familyMembers, centerMemberId, onAddRelative, setNodes, setEdges]);

    // Add missing styles for React Flow if needed (usually handled by css import)

    return (
        <div className="w-full h-[600px] bg-black/20 rounded-3xl border border-white/5 overflow-hidden">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                onNodeClick={(_, node) => onNodeClick?.(node.id)}
                fitView
                className="bg-dots-pattern" // Custom class or default
            >
                <Background color="#aaa" gap={16} size={1} style={{ opacity: 0.1 }} />
                <Controls className="bg-white/10 border border-white/10 text-white rounded-lg overflow-hidden fill-white" />
                <MiniMap
                    nodeColor={() => '#00F0FF'}
                    maskColor="rgba(0,0,0, 0.6)"
                    className="bg-black/50 border border-white/10 rounded-lg"
                />
            </ReactFlow>
        </div>
    );
}
