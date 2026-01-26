"use client";
import React, { useMemo, useState, useEffect } from 'react';
import ReactFlow, {
    Background,
    Controls,
    Edge,
    Node,
    Handle,
    Position,
    useNodesState,
    useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom Node for AURA Family Tree
const FamilyNode = ({ data }: { data: any }) => {
    const isAncestor = data.isAncestor;
    const isActive = !isAncestor;

    // Status color
    let statusColor = "border-white/20";
    if (data.role?.toLowerCase().includes('grand')) statusColor = "border-aura-gold/50 shadow-[0_0_15px_rgba(255,215,0,0.2)]";
    else if (data.role?.toLowerCase().includes('father') || data.role?.toLowerCase().includes('mother')) statusColor = "border-aura-cyan/50 shadow-[0_0_15px_rgba(0,240,255,0.2)]";
    else if (data.role?.toLowerCase().includes('son') || data.role?.toLowerCase().includes('daughter')) statusColor = "border-aura-green/50";

    return (
        <div className={`p-4 rounded-3xl border-2 bg-gradient-to-b from-gray-900 to-black flex flex-col items-center min-w-[200px] max-w-[240px] transition-all hover:scale-105 hover:z-50 ${statusColor}`}>
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-aura-cyan border-2 border-black !top-[-6px]" />

            <div className="relative mb-2">
                <div className="text-5xl drop-shadow-lg transform hover:rotate-12 transition-transform cursor-pointer">
                    {data.icon || '👤'}
                </div>
                {data.status && !isAncestor && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gray-800 border border-white/20 flex items-center justify-center text-[10px]">
                        {data.status === 'home' ? '🏠' : data.status === 'work' ? '💼' : '📍'}
                    </div>
                )}
            </div>

            <div className="text-center w-full">
                <div className={`font-bold text-sm mb-0.5 ${data.role?.includes('Grand') ? 'text-aura-gold' : 'text-white'}`}>
                    {data.fullName || data.name}
                </div>
                <div className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">
                    {data.role}
                </div>

                {/* Detailed Info */}
                <div className="mt-2 pt-2 border-t border-white/10 text-left space-y-0.5 w-full">
                    {data.profession && (
                        <div className="text-[9px] text-gray-300 flex items-center gap-1 truncate">
                            <span>💼</span> {data.profession}
                        </div>
                    )}
                    {data.education && (
                        <div className="text-[9px] text-gray-400 flex items-center gap-1 truncate">
                            <span>🎓</span> {data.education}
                        </div>
                    )}
                    {data.bio && (
                        <div className="text-[8px] text-gray-500 italic line-clamp-2 mt-1">
                            "{data.bio}"
                        </div>
                    )}
                </div>

                {(data.birth || data.death) && (
                    <div className="text-[9px] text-gray-600 mt-2 font-mono">
                        {data.birth || '?'} - {data.death || (isAncestor ? '?' : 'Now')}
                    </div>
                )}
            </div>

            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-aura-cyan border-2 border-black !bottom-[-6px]" />
        </div>
    );
};

const nodeTypes = {
    familyNode: FamilyNode,
};

interface FamilyTreeProps {
    ancestors: any[];
    familyMembers: any[];
    onAncestorClick?: (anc: any) => void;
}

// Helper to determine generation score if explicit links are missing
const guessGeneration = (role: string, birthYear?: number): number => {
    const r = role.toLowerCase();
    if (r.includes('great-great-grand')) return -4;
    if (r.includes('great-grand')) return -3;
    if (r.includes('grand')) return -2;
    if (r.includes('father') || r.includes('mother') || r.includes('parent')) return -1;
    if (r.includes('son') || r.includes('daughter') || r.includes('child')) return 1;
    if (r.includes('grandson') || r.includes('granddaughter')) return 2;
    return 0; // Self, Spouse, Brother, Sister
};

export default function FamilyTree({ ancestors, familyMembers, onAncestorClick }: FamilyTreeProps) {
    // We use ReactFlow standard hooks for better control if needed, primarily for layout re-calc
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    useEffect(() => {
        // --- 1. DATA UNIFICATION & NORMALIZATION ---
        const allPeople = [
            ...ancestors.map(a => ({ ...a, type: 'ancestor', isAncestor: true })),
            ...familyMembers.map(m => ({ ...m, type: 'member', isAncestor: false }))
        ];

        // --- 2. GENERATION ASSIGNMENT SCORES ---
        // Base score: 0 (Current Head/Peer Generation)
        // We link nodes by ID if `fatherId` or `motherId` exists.
        // If not, we fall back to `guessGeneration` score.

        const nodeMap = new Map();
        allPeople.forEach(p => {
            // Heuristic scoring for "vertical" placement
            let genScore = guessGeneration(p.role, p.birth ? parseInt(p.birth) : undefined);

            // Adjust for ancestors explicitly by birth year if available to spread them
            // This is a naive sort, effectively. 
            // Better: Group by Role-Gen, then sort by Birth Year.

            nodeMap.set(p.id, { ...p, genScore });
        });

        // --- 3. EXPLICIT LINKING OVERRIDE (If IDs exist) ---
        // TODO: Traversing the graph to correct genScores based on parent relationships would go here.
        // For now, we rely on the Role/Heuristic as the primary layout driver since explicit links 
        // are likely empty in the current data set.

        // --- 4. LAYOUT CALCULATION (Grid/Layered) ---
        const ROW_HEIGHT = 180;
        const NODE_WIDTH = 220;

        // Group by Generation Score
        const levels: Record<number, any[]> = {};
        allPeople.forEach(p => {
            const score = nodeMap.get(p.id).genScore;
            if (!levels[score]) levels[score] = [];
            levels[score].push(p);
        });

        // Generate Nodes
        const flowNodes: Node[] = [];
        const flowEdges: Edge[] = [];

        Object.keys(levels).sort((a, b) => Number(a) - Number(b)).forEach((levelKey) => {
            const levelNum = Number(levelKey);
            const peopleInLevel = levels[levelNum];

            // Sort by birth year or name to keep siblings consistent
            peopleInLevel.sort((a, b) => (a.birth || '9999').localeCompare(b.birth || '9999'));

            const totalWidth = peopleInLevel.length * NODE_WIDTH;
            const startX = -(totalWidth / 2);

            peopleInLevel.forEach((p, index) => {
                const x = startX + (index * NODE_WIDTH);
                const y = levelNum * ROW_HEIGHT;

                let icon = '👤';
                if (p.role.includes('Father') || p.role.includes('Grandfather')) icon = '👨';
                if (p.role.includes('Mother') || p.role.includes('Grandmother')) icon = '👩';
                if (p.role.includes('Son') || p.role.includes('Brother')) icon = '👦';
                if (p.role.includes('Daughter') || p.role.includes('Sister') || p.role.includes('Kelin')) icon = '👧';
                if (p.isAncestor && p.role.includes('Grand')) icon = p.role.includes('Mother') ? '👵' : '👴';
                if (p.role.includes('Spouse')) icon = '❤️';

                flowNodes.push({
                    id: p.id,
                    type: 'familyNode',
                    position: { x, y },
                    data: { ...p, icon }
                });
            });
        });

        // --- 5. EDGE GENERATION (Heuristic + Explicit) ---
        // If we have explicit fatherId/motherId, use those.
        // Otherwise, try to link generations loosely (Visual Guide lines)
        // OR link "Head" (Gen 0) to "Father" (Gen -1) if only one Father exists etc.

        // Heuristic Linking for "Tree Look":
        // Link every Gen N node to the "Center" of Gen N-1? No, that's messy.
        // Link specific roles if unique.

        const fathers = allPeople.filter(p => p.role === 'Father');
        const mothers = allPeople.filter(p => p.role === 'Mother');
        const children = allPeople.filter(p => ['Son', 'Daughter'].includes(p.role));

        // Link Father/Mother -> Children
        // This assumes the ACTIVE user is the parent of the children, or the children are siblings of the active user?
        // Usually in this app context: User is "Head". 'Son'/'Daughter' are their kids. 'Father'/'Mother' are their parents.

        // 1. Link Head (Gen 0) parents to Head.
        // Find "Head" or "Father" (Active Group Owner)
        // If multiple Gen 0, it's tricky.

        // VISUAL CONNECTORS (Dashed)
        // Connect Gen -1 to Gen 0
        // Connect Gen 0 to Gen 1

        // Simple "Phantom" Edges for visual hierarchy structure if explicit links missing
        Object.keys(levels).map(Number).sort((a, b) => a - b).forEach((level, idx, arr) => {
            if (idx === 0) return;
            const prevLevel = arr[idx - 1];

            // Create a conceptual link between layers to suggest flow
            // Actually, let's just create edges if we can guess relationship.

            // Example: Link all Gen -1 to Gen 0 (Parents -> Me)
            const parents = levels[prevLevel]; // Origins
            const current = levels[level];     // Targets

            // Since we don't know EXACTLY who is who's child without IDs, 
            // we will just draw faint lines from the "Center" of previous layer to "Center" of current layer
            // to show flow, OR just leave them floating but ordered.

            // BETTER: If we found explicit IDs (fatherId), use them.
            current.forEach(person => {
                if (person.fatherId && nodeMap.has(person.fatherId)) {
                    flowEdges.push({
                        id: `e-${person.fatherId}-${person.id}`,
                        source: person.fatherId,
                        target: person.id,
                        type: 'smoothstep',
                        animated: true,
                        style: { stroke: '#0af', strokeWidth: 2, opacity: 0.6 }
                    });
                }
                if (person.motherId && nodeMap.has(person.motherId)) {
                    flowEdges.push({
                        id: `e-${person.motherId}-${person.id}`,
                        source: person.motherId,
                        target: person.id,
                        type: 'smoothstep',
                        animated: true,
                        style: { stroke: '#f0a', strokeWidth: 2, opacity: 0.6 }
                    });
                }
            });
        });

        setNodes(flowNodes);
        setEdges(flowEdges);

    }, [ancestors, familyMembers]);

    return (
        <div style={{ width: '100%', height: '100%' }} className="bg-black/20 relative cursor-grab active:cursor-grabbing">
            <div className="absolute top-4 left-4 z-10 opacity-50 text-[10px] text-gray-500 pointer-events-none">
                {ancestors.length + familyMembers.length} Members • 50 Generation Capacity Engine
            </div>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodeClick={(_, node) => {
                    if (onAncestorClick) {
                        const originalData = ancestors.find(a => a.id === node.id) || familyMembers.find(m => m.id === node.id);
                        if (originalData) onAncestorClick(originalData);
                    }
                }}
                fitView
                minZoom={0.1}
                maxZoom={2}
                className="family-flow"
            >
                <Background color="#333" gap={30} size={1} />
                <Controls className="bg-white/10 border-white/20 !mb-12 !ml-4" />
            </ReactFlow>
        </div>
    );
}
