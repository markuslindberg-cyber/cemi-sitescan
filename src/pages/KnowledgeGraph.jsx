import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileJson } from 'lucide-react';

// ── DATA ──────────────────────────────────────────────────────────────────────

const NODES = [
  // Entities
  { id: 'Customer',         type: 'entity',   label: 'Customer',              desc: 'Kundregister – namn, kategori, kontakt, ansvarig account manager' },
  { id: 'Site',             type: 'entity',   label: 'Site',                  desc: 'Plats/objekt kopplad till kund – karta (uppladdad eller Google Maps), platsansvarig' },
  { id: 'Inspection',       type: 'entity',   label: 'Inspection',            desc: 'Inspektion på en plats – datum, besiktningsman, anledning, status (in_progress / completed)' },
  { id: 'InspectionPoint',  type: 'entity',   label: 'InspectionPoint',       desc: 'Punkt på kartan – koordinater, typ, allvarlighetsgrad (low–critical), noteringar och foton' },
  { id: 'UserFavoriteSite', type: 'entity',   label: 'UserFavoriteSite',      desc: 'M2M-koppling: vilken användare har favoritmärkt vilken plats' },
  { id: 'Trash',            type: 'entity',   label: 'Trash',                 desc: 'Mjukt borttagna entiteter med 30-dagars återhämtningsfönster' },
  { id: 'Invitation',       type: 'entity',   label: 'Invitation',            desc: 'Väntande inbjudningar – admin-only läs/skriv-åtkomst' },
  { id: 'User',             type: 'entity',   label: 'User',                  desc: 'Inbyggd Base44-entitet – roll: admin / user' },

  // Pages
  { id: 'page_Landing',     type: 'page',     label: 'Landing',               desc: 'Startsida med navigationsmenyer och favoritmärkta platser' },
  { id: 'page_Home',        type: 'page',     label: 'Home',                  desc: 'Platsöversikt – filter, sökning, grid/list-vy, Excel-import, skapa plats' },
  { id: 'page_Customers',   type: 'page',     label: 'Customers',             desc: 'Kundlista med filter och skapande av nya kunder' },
  { id: 'page_Customer',    type: 'page',     label: 'Customer',              desc: 'Kunddetaljer med tillhörande platser och inspektionsstatistik' },
  { id: 'page_Site',        type: 'page',     label: 'Site',                  desc: 'Platsdetaljer, inspektionshistorik, karta, skapa ny inspektion' },
  { id: 'page_Inspection',  type: 'page',     label: 'Inspection',            desc: 'Aktiv inspektion – klicka på kartan för att lägga till punkter (uppladdad karta eller Google Maps)' },
  { id: 'page_Report',      type: 'page',     label: 'Report',                desc: 'Slutförd inspektionsrapport – redigera titel, PDF-nedladdning' },
  { id: 'page_Inspections', type: 'page',     label: 'Inspections',           desc: 'Alla inspektioner med avancerade filter (kund, plats, inspektör, platsansvarig)' },
  { id: 'page_Users',       type: 'page',     label: 'Users',                 desc: 'Användarhantering – roller, bjud in, blockera, redigera (admin-only)' },
  { id: 'page_Trash',       type: 'page',     label: 'Trash',                 desc: 'Papperskorg – återhämta eller permanent radera borttagna objekt' },

  // Backend functions
  { id: 'fn_generatePdf',   type: 'function', label: 'generatePdf',           desc: 'Genererar PDF-rapport med logo, karta, markeringar och inspektionspunkter. Anropas från Report-sidan.' },
  { id: 'fn_getUsers',      type: 'function', label: 'getUsers',              desc: 'Hämtar alla användare via service role. Används på Home, Site och Users-sidorna.' },
  { id: 'fn_cleanupTrash',  type: 'function', label: 'cleanupTrash',          desc: 'Schemalagd funktion: raderar automatiskt Trash-poster vars expires_at passerat.' },
  { id: 'fn_generateNr',    type: 'function', label: 'generateInspectionNr',  desc: 'Entity trigger (on create): auto-genererar löpnummer INS-XXXX för nya inspektioner.' },
  { id: 'fn_backfill',      type: 'function', label: 'backfillProjects',      desc: 'Admin-funktion: kopierar projektnummer från Customer → Site för platser som saknar det.' },
];

const EDGES = [
  // Entity → Entity (foreign keys)
  { from: 'Site',             to: 'Customer',        label: 'customer_id',  type: 'entity-entity' },
  { from: 'Inspection',       to: 'Site',            label: 'site_id',      type: 'entity-entity' },
  { from: 'InspectionPoint',  to: 'Inspection',      label: 'inspection_id',type: 'entity-entity' },
  { from: 'UserFavoriteSite', to: 'User',            label: 'user_id',      type: 'entity-entity' },
  { from: 'UserFavoriteSite', to: 'Site',            label: 'site_id',      type: 'entity-entity' },

  // Page → Entity
  { from: 'page_Landing',     to: 'Site',            label: 'reads',   type: 'page-entity' },
  { from: 'page_Landing',     to: 'UserFavoriteSite',label: 'reads',   type: 'page-entity' },
  { from: 'page_Home',        to: 'Site',            label: 'CRUD',    type: 'page-entity' },
  { from: 'page_Home',        to: 'Customer',        label: 'reads',   type: 'page-entity' },
  { from: 'page_Home',        to: 'UserFavoriteSite',label: 'CRUD',    type: 'page-entity' },
  { from: 'page_Customers',   to: 'Customer',        label: 'CRUD',    type: 'page-entity' },
  { from: 'page_Customer',    to: 'Customer',        label: 'CRUD',    type: 'page-entity' },
  { from: 'page_Customer',    to: 'Site',            label: 'CRUD',    type: 'page-entity' },
  { from: 'page_Site',        to: 'Site',            label: 'CRUD',    type: 'page-entity' },
  { from: 'page_Site',        to: 'Inspection',      label: 'creates', type: 'page-entity' },
  { from: 'page_Site',        to: 'Trash',           label: 'creates', type: 'page-entity' },
  { from: 'page_Inspection',  to: 'Inspection',      label: 'CRUD',    type: 'page-entity' },
  { from: 'page_Inspection',  to: 'InspectionPoint', label: 'CRUD',    type: 'page-entity' },
  { from: 'page_Inspection',  to: 'Trash',           label: 'creates', type: 'page-entity' },
  { from: 'page_Report',      to: 'Inspection',      label: 'reads',   type: 'page-entity' },
  { from: 'page_Report',      to: 'InspectionPoint', label: 'reads',   type: 'page-entity' },
  { from: 'page_Inspections', to: 'Inspection',      label: 'reads',   type: 'page-entity' },
  { from: 'page_Inspections', to: 'Site',            label: 'reads',   type: 'page-entity' },
  { from: 'page_Users',       to: 'User',            label: 'CRUD',    type: 'page-entity' },
  { from: 'page_Users',       to: 'Invitation',      label: 'CRUD',    type: 'page-entity' },
  { from: 'page_Trash',       to: 'Trash',           label: 'CRUD',    type: 'page-entity' },

  // Page → Function
  { from: 'page_Report',      to: 'fn_generatePdf',  label: 'invokes', type: 'page-function' },
  { from: 'page_Users',       to: 'fn_getUsers',     label: 'invokes', type: 'page-function' },
  { from: 'page_Home',        to: 'fn_getUsers',     label: 'invokes', type: 'page-function' },
  { from: 'page_Site',        to: 'fn_getUsers',     label: 'invokes', type: 'page-function' },

  // Function → Entity
  { from: 'fn_generatePdf',   to: 'Inspection',      label: 'reads',   type: 'function-entity' },
  { from: 'fn_generatePdf',   to: 'InspectionPoint', label: 'reads',   type: 'function-entity' },
  { from: 'fn_generatePdf',   to: 'Site',            label: 'reads',   type: 'function-entity' },
  { from: 'fn_generatePdf',   to: 'Customer',        label: 'reads',   type: 'function-entity' },
  { from: 'fn_getUsers',      to: 'User',            label: 'reads',   type: 'function-entity' },
  { from: 'fn_cleanupTrash',  to: 'Trash',           label: 'deletes', type: 'function-entity' },
  { from: 'fn_generateNr',    to: 'Inspection',      label: 'updates', type: 'function-entity' },
  { from: 'fn_backfill',      to: 'Site',            label: 'updates', type: 'function-entity' },
  { from: 'fn_backfill',      to: 'Customer',        label: 'reads',   type: 'function-entity' },
];

// ── LAYOUT ────────────────────────────────────────────────────────────────────

const W = 1500;
const H = 580;
const ENTITY_Y  = 85;
const PAGE_Y    = 295;
const FUNC_Y    = 510;

const POSITIONS = {
  Customer:          { x: 94,   y: ENTITY_Y },
  Site:              { x: 281,  y: ENTITY_Y },
  Inspection:        { x: 469,  y: ENTITY_Y },
  InspectionPoint:   { x: 656,  y: ENTITY_Y },
  UserFavoriteSite:  { x: 844,  y: ENTITY_Y },
  Trash:             { x: 1031, y: ENTITY_Y },
  Invitation:        { x: 1219, y: ENTITY_Y },
  User:              { x: 1406, y: ENTITY_Y },

  page_Landing:      { x: 75,   y: PAGE_Y },
  page_Home:         { x: 225,  y: PAGE_Y },
  page_Customers:    { x: 375,  y: PAGE_Y },
  page_Customer:     { x: 525,  y: PAGE_Y },
  page_Site:         { x: 675,  y: PAGE_Y },
  page_Inspection:   { x: 825,  y: PAGE_Y },
  page_Report:       { x: 975,  y: PAGE_Y },
  page_Inspections:  { x: 1125, y: PAGE_Y },
  page_Users:        { x: 1275, y: PAGE_Y },
  page_Trash:        { x: 1425, y: PAGE_Y },

  fn_generatePdf:    { x: 150,  y: FUNC_Y },
  fn_getUsers:       { x: 450,  y: FUNC_Y },
  fn_cleanupTrash:   { x: 750,  y: FUNC_Y },
  fn_generateNr:     { x: 1050, y: FUNC_Y },
  fn_backfill:       { x: 1350, y: FUNC_Y },
};

const NODE_DIMS = {
  entity:   { w: 162, h: 38 },
  page:     { w: 120, h: 38 },
  function: { w: 208, h: 50 },
};

const EDGE_COLORS = {
  'entity-entity':  '#94a3b8',
  'page-entity':    '#10b981',
  'page-function':  '#f59e0b',
  'function-entity':'#f97316',
};

const NODE_STYLES = {
  entity:   { fill: '#ecfdf5', stroke: '#059669', text: '#064e3b' },
  page:     { fill: '#eff6ff', stroke: '#3b82f6', text: '#1e3a8a' },
  function: { fill: '#fffbeb', stroke: '#d97706', text: '#78350f' },
};

function getEdgePath(fromId, toId) {
  const a = POSITIONS[fromId];
  const b = POSITIONS[toId];
  if (!a || !b) return null;
  const dy = b.y - a.y;
  const absDy = Math.abs(dy);
  if (absDy < 20) {
    // Same row – arc above
    const arc = a.x < b.x ? -52 : 52;
    return `M ${a.x} ${a.y} C ${a.x} ${a.y + arc}, ${b.x} ${b.y + arc}, ${b.x} ${b.y}`;
  }
  const t = 0.44;
  if (dy < 0) {
    return `M ${a.x} ${a.y} C ${a.x} ${a.y - absDy * t}, ${b.x} ${b.y + absDy * t}, ${b.x} ${b.y}`;
  }
  return `M ${a.x} ${a.y} C ${a.x} ${a.y + absDy * t}, ${b.x} ${b.y - absDy * t}, ${b.x} ${b.y}`;
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────

export default function KnowledgeGraph() {
  const svgRef       = useRef(null);
  const containerRef = useRef(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [tooltip, setTooltip]     = useState(null);

  const isConnected = (nodeId) => {
    if (!hoveredId || nodeId === hoveredId) return false;
    return EDGES.some(e => (e.from === hoveredId && e.to === nodeId) || (e.to === hoveredId && e.from === nodeId));
  };

  const updateTooltip = (e, node) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTooltip({
      x: Math.min(e.clientX - rect.left + 14, rect.width - 240),
      y: e.clientY - rect.top + 14,
      node,
    });
  };

  const downloadJSON = () => {
    const payload = {
      app: 'CEMI Platsbesiktningssystem',
      generated: new Date().toISOString(),
      summary: {
        entities: NODES.filter(n => n.type === 'entity').length,
        pages: NODES.filter(n => n.type === 'page').length,
        backendFunctions: NODES.filter(n => n.type === 'function').length,
        edges: EDGES.length,
      },
      nodes: NODES,
      edges: EDGES,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'cemi-knowledge-graph.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSVG = () => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const clone = svgEl.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'cemi-knowledge-graph.svg'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 min-h-screen bg-gray-50">
      <div className="max-w-full">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Knowledge Graph</h1>
            <p className="text-sm text-gray-500 mt-1">
              Appens arkitektur – {NODES.filter(n=>n.type==='entity').length} entiteter · {NODES.filter(n=>n.type==='page').length} sidor · {NODES.filter(n=>n.type==='function').length} backend-funktioner · {EDGES.length} kopplingar
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button onClick={downloadJSON} variant="outline" size="sm" className="gap-2">
              <FileJson className="w-4 h-4" /> Ladda ned JSON
            </Button>
            <Button onClick={downloadSVG} variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" /> Ladda ned SVG
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-5 gap-y-2 mb-4 text-xs text-gray-600">
          {[
            { fill: '#ecfdf5', stroke: '#059669', label: 'Entitet' },
            { fill: '#eff6ff', stroke: '#3b82f6', label: 'Sida' },
            { fill: '#fffbeb', stroke: '#d97706', label: 'Backend-funktion' },
          ].map(({ fill, stroke, label }) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className="w-4 h-3 rounded inline-block border" style={{ background: fill, borderColor: stroke }} />
              {label}
            </span>
          ))}
          {[
            { color: '#94a3b8', label: 'FK-relation' },
            { color: '#10b981', label: 'Sida → Entitet' },
            { color: '#f59e0b', label: 'Sida → Funktion' },
            { color: '#f97316', label: 'Funktion → Entitet' },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className="inline-block w-5 h-0.5 rounded" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>

        {/* Graph */}
        <div
          ref={containerRef}
          className="relative bg-white rounded-xl border shadow-sm overflow-x-auto"
        >
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            style={{ width: '100%', minWidth: '820px', height: 'auto' }}
          >
            <defs>
              <filter id="kg-shadow" x="-15%" y="-15%" width="130%" height="130%">
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.13" />
              </filter>
            </defs>

            {/* Row bands */}
            <rect x={0} y={57}  width={W} height={56} fill="#f0fdf4" opacity="0.55" />
            <rect x={0} y={268} width={W} height={55} fill="#eff6ff" opacity="0.55" />
            <rect x={0} y={482} width={W} height={60} fill="#fffbeb" opacity="0.55" />

            {/* Row labels */}
            {[
              { x: 14, y: ENTITY_Y + 4, text: 'ENTITETER' },
              { x: 14, y: PAGE_Y   + 4, text: 'SIDOR' },
              { x: 14, y: FUNC_Y   + 4, text: 'FUNKTIONER' },
            ].map(({ x, y, text }) => (
              <text key={text} x={x} y={y} fontSize="8" fontFamily="sans-serif" fill="#9ca3af" letterSpacing="0.8">
                {text}
              </text>
            ))}

            {/* Edges */}
            {EDGES.map((edge, i) => {
              const d = getEdgePath(edge.from, edge.to);
              if (!d) return null;
              const active = hoveredId && (edge.from === hoveredId || edge.to === hoveredId);
              const dimmed = hoveredId && !active;
              const color  = EDGE_COLORS[edge.type];
              return (
                <path
                  key={i} d={d} fill="none"
                  stroke={color}
                  strokeWidth={active ? 2.4 : 1.1}
                  strokeOpacity={dimmed ? 0.04 : active ? 0.95 : 0.17}
                  style={{ transition: 'stroke-opacity 0.1s, stroke-width 0.1s' }}
                />
              );
            })}

            {/* Nodes */}
            {NODES.map((node) => {
              const pos  = POSITIONS[node.id];
              if (!pos) return null;
              const dim    = NODE_DIMS[node.type];
              const style  = NODE_STYLES[node.type];
              const hovered    = hoveredId === node.id;
              const connected  = isConnected(node.id);
              const dimmed     = hoveredId && !hovered && !connected;
              const nx = pos.x - dim.w / 2;
              const ny = pos.y - dim.h / 2;
              const fontSize   = node.label.length > 19 ? 8 : node.label.length > 13 ? 9 : 10;

              return (
                <g
                  key={node.id}
                  transform={`translate(${nx}, ${ny})`}
                  style={{ cursor: 'default', opacity: dimmed ? 0.12 : 1, transition: 'opacity 0.1s' }}
                  onMouseEnter={(e) => { setHoveredId(node.id); updateTooltip(e, node); }}
                  onMouseMove={(e)  => updateTooltip(e, node)}
                  onMouseLeave={()  => { setHoveredId(null); setTooltip(null); }}
                >
                  <rect
                    width={dim.w} height={dim.h} rx="7"
                    fill={style.fill} stroke={style.stroke}
                    strokeWidth={hovered || connected ? 2 : 1}
                    filter={hovered ? 'url(#kg-shadow)' : ''}
                  />
                  <text
                    x={dim.w / 2}
                    y={node.type === 'function' ? 19 : dim.h / 2 + 4}
                    textAnchor="middle"
                    fontSize={fontSize}
                    fontFamily="ui-monospace, 'Cascadia Code', monospace"
                    fontWeight="600"
                    fill={style.text}
                  >
                    {node.label}
                  </text>
                  {node.type === 'function' && (
                    <text
                      x={dim.w / 2} y={33}
                      textAnchor="middle" fontSize="7"
                      fontFamily="sans-serif" fill={style.text} opacity="0.6"
                    >
                      backend fn
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Tooltip */}
          {tooltip && (
            <div
              className="absolute pointer-events-none z-20 bg-gray-900 text-white text-xs rounded-lg px-3 py-2.5 shadow-xl"
              style={{ left: tooltip.x, top: tooltip.y, maxWidth: 230 }}
            >
              <div className="font-mono font-bold text-sm mb-1 leading-tight">{tooltip.node.label}</div>
              <div className="text-gray-300 leading-relaxed">{tooltip.node.desc}</div>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-3 text-center">
          Hovra över en nod för att se kopplingar &nbsp;·&nbsp; Ladda ned som JSON eller SVG
        </p>
      </div>
    </div>
  );
}