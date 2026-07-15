export function exportDashboard(nodes, edges, metrics, coverage, validation, quality) {
  const data = {
    nodes: nodes.map(n => ({
      id: n.id,
      type: n.type,
      domain: n.domain,
      label: n.metadata.label,
      summary: n.metadata.summary,
      status: n.metadata.status,
      file: n.sourceFile
    })),
    edges,
    metrics,
    coverage,
    validation,
    quality
  };
  
  const serializedData = JSON.stringify(data, null, 2);
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trothix Knowledge Infrastructure Dashboard</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-main: #0b0f19;
      --bg-card: #151d30;
      --bg-hover: #1e2942;
      --border-color: #2a3754;
      --text-primary: #f1f5f9;
      --text-secondary: #94a3b8;
      --accent-color: #14b8a6;
      --accent-hover: #0d9488;
      --color-concept: #0f766e;
      --color-rule: #3730a3;
      --color-dt: #b45309;
      --color-entity: #047857;
      --color-action: #6d28d9;
      --color-source: #0369a1;
      --color-example: #44403c;
      --color-exception: #b91c1c;
      --color-template: #be185d;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Inter', sans-serif;
      background-color: var(--bg-main);
      color: var(--text-primary);
      line-height: 1.5;
      padding: 24px;
      overflow-x: hidden;
    }
    
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border-color);
    }
    
    header h1 {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.025em;
      background: linear-gradient(135deg, #38bdf8, #14b8a6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .timestamp {
      font-size: 12px;
      color: var(--text-secondary);
    }
    
    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .kpi-card {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 16px;
      text-align: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(20, 184, 166, 0.1);
      border-color: rgba(20, 184, 166, 0.3);
    }
    
    .kpi-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    
    .kpi-value {
      font-size: 28px;
      font-weight: 700;
      color: var(--accent-color);
    }
    
    /* Layout Panels */
    .dashboard-layout {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 24px;
      align-items: start;
    }
    
    .nav-panel {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 16px;
    }
    
    .nav-tabs {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .nav-tab {
      background: none;
      border: none;
      color: var(--text-secondary);
      padding: 12px 16px;
      text-align: left;
      font-size: 14px;
      font-weight: 500;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.2s, color 0.2s;
    }
    
    .nav-tab:hover, .nav-tab.active {
      background-color: var(--bg-hover);
      color: var(--text-primary);
    }
    
    .nav-tab.active {
      border-left: 3px solid var(--accent-color);
    }
    
    /* Tab View Content */
    .content-panel {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 24px;
      min-height: 500px;
    }
    
    .tab-content {
      display: none;
    }
    
    .tab-content.active {
      display: block;
    }
    
    /* Explorer Panel */
    .explorer-grid {
      display: grid;
      grid-template-columns: 340px 1fr;
      gap: 20px;
    }
    
    .search-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .search-box {
      width: 100%;
      background-color: var(--bg-main);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 14px;
    }
    
    .search-box:focus {
      outline: none;
      border-color: var(--accent-color);
    }
    
    .filter-select {
      width: 100%;
      background-color: var(--bg-main);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 10px;
      border-radius: 8px;
      font-size: 14px;
    }
    
    .node-list {
      max-height: 400px;
      overflow-y: auto;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background-color: var(--bg-main);
    }
    
    .node-item {
      padding: 10px 12px;
      border-bottom: 1px solid var(--border-color);
      cursor: pointer;
      font-size: 13px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: background-color 0.2s;
    }
    
    .node-item:hover {
      background-color: var(--bg-hover);
    }
    
    .badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
      text-transform: uppercase;
      color: #fff;
    }
    
    /* Badges types */
    .badge-concept { background-color: var(--color-concept); }
    .badge-rule { background-color: var(--color-rule); }
    .badge-decision_table { background-color: var(--color-dt); }
    .badge-entity { background-color: var(--color-entity); }
    .badge-action { background-color: var(--color-action); }
    .badge-source { background-color: var(--color-source); }
    .badge-example { background-color: var(--color-example); }
    .badge-exception { background-color: var(--color-exception); }
    .badge-template { background-color: var(--color-template); }
    .badge-other { background-color: #475569; }
    
    /* Dependency mini-map (R3): lightweight, dependency-free SVG
       neighborhood view rendered inline in the node details panel. */
    .minimap-section {
      margin-top: 16px;
      margin-bottom: 16px;
    }
    
    .minimap-section h4 {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: var(--text-secondary);
      margin-bottom: 8px;
    }
    
    .minimap-svg-wrap {
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background-color: var(--bg-main);
      overflow: hidden;
    }
    
    .minimap-svg-wrap svg {
      display: block;
      width: 100%;
      height: auto;
    }
    
    .minimap-edge {
      stroke: var(--border-color);
      stroke-width: 1;
    }
    
    .minimap-node {
      cursor: pointer;
      stroke: var(--bg-main);
      stroke-width: 1.5;
    }
    
    .minimap-node:hover {
      stroke: var(--text-primary);
      stroke-width: 2;
    }
    
    .minimap-node.is-center {
      stroke: var(--accent-color);
      stroke-width: 2.5;
    }
    
    .minimap-label {
      font-size: 8px;
      font-family: 'Inter', sans-serif;
      fill: var(--text-secondary);
      pointer-events: none;
      text-anchor: middle;
    }
    
    .minimap-label.is-center {
      fill: var(--text-primary);
      font-weight: 600;
      font-size: 9px;
    }
    
    .minimap-empty {
      font-size: 12px;
      color: var(--text-secondary);
      padding: 12px;
      text-align: center;
    }
    
    .node-details {
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 20px;
      background-color: var(--bg-main);
    }
    
    .details-title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .details-id {
      font-family: 'Fira Code', monospace;
      font-size: 12px;
      color: var(--text-secondary);
      margin-bottom: 16px;
    }
    
    .details-meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 16px;
      background-color: rgba(255, 255, 255, 0.02);
      padding: 12px;
      border-radius: 8px;
    }
    
    .meta-item label {
      font-size: 10px;
      color: var(--text-secondary);
      text-transform: uppercase;
      display: block;
      margin-bottom: 2px;
    }
    
    .meta-item span {
      font-size: 13px;
      font-weight: 500;
    }
    
    .details-summary {
      font-size: 14px;
      margin-bottom: 20px;
      color: var(--text-primary);
    }
    
    .relation-section {
      margin-top: 16px;
    }
    
    .relation-section h4 {
      font-size: 12px;
      text-transform: uppercase;
      color: var(--text-secondary);
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    
    .relation-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    
    .relation-item {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      padding: 6px 8px;
      background-color: rgba(255, 255, 255, 0.01);
      border-radius: 6px;
    }
    
    .relation-item a {
      color: var(--accent-color);
      text-decoration: none;
      font-family: 'Fira Code', monospace;
    }
    
    .relation-item a:hover {
      text-decoration: underline;
    }
    
    /* Table styling */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }
    
    th, td {
      padding: 10px 12px;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
      font-size: 13px;
    }
    
    th {
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      font-size: 11px;
    }
    
    tr:hover td {
      background-color: rgba(255, 255, 255, 0.01);
    }
    
    /* Alerts and lists */
    .alert-box {
      border-left: 4px solid var(--accent-color);
      padding: 12px;
      background-color: rgba(20, 184, 166, 0.05);
      border-radius: 0 8px 8px 0;
      margin-bottom: 16px;
      font-size: 13px;
    }
    
    .alert-box.warning {
      border-color: #ef4444;
      background-color: rgba(239, 68, 68, 0.05);
    }
    
    .path-trace {
      font-family: 'Fira Code', monospace;
      font-size: 11px;
      background-color: var(--bg-main);
      padding: 8px;
      border-radius: 4px;
      overflow-x: auto;
      border: 1px solid var(--border-color);
      white-space: nowrap;
    }
  </style>
</head>
<body>

  <header>
    <div>
      <h1>Trothix Knowledge Analysis Dashboard</h1>
      <div class="timestamp">Live Ontology Audit & Dependency Graph Analysis</div>
    </div>
    <div id="date-stamp" class="timestamp"></div>
  </header>

  <!-- KPI Grid -->
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Knowledge Score</div>
      <div class="kpi-value" id="kpi-score">0/100</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Rule Coverage</div>
      <div class="kpi-value" id="kpi-coverage">0%</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Graph Density</div>
      <div class="kpi-value" id="kpi-density">0</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Nodes / Edges</div>
      <div class="kpi-value" id="kpi-nodes-edges">0 / 0</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Detected Cycles</div>
      <div class="kpi-value" id="kpi-cycles" style="color: #ef4444;">0</div>
    </div>
  </div>

  <!-- Main Layout -->
  <div class="dashboard-layout">
    <div class="nav-panel">
      <div class="nav-tabs">
        <button class="nav-tab active" onclick="switchTab('explorer')">Dependency Explorer</button>
        <button class="nav-tab" onclick="switchTab('health')">Quality & Health Gate</button>
        <button class="nav-tab" onclick="switchTab('matrix')">Knowledge Matrix</button>
        <button class="nav-tab" onclick="switchTab('complexity')">Complexity Index</button>
      </div>
    </div>
    
    <div class="content-panel">
      
      <!-- TAB 1: Explorer -->
      <div id="tab-explorer" class="tab-content active">
        <div class="explorer-grid">
          <div class="search-section">
            <input type="text" id="search-input" class="search-box" placeholder="Search by ID or label..." oninput="filterNodes()">
            <select id="type-filter" class="filter-select" onchange="filterNodes()">
              <option value="all">All Types</option>
              <option value="concept">Concepts</option>
              <option value="rule">Rules</option>
              <option value="decision_table">Decision Tables</option>
              <option value="entity">Entities</option>
              <option value="action">Actions</option>
              <option value="source">Sources</option>
              <option value="example">Examples</option>
              <option value="exception">Exceptions</option>
              <option value="template">Templates</option>
            </select>
            <div class="node-list" id="node-list-container">
              <!-- Render nodes dynamically -->
            </div>
          </div>
          
          <div>
            <div id="details-panel" class="node-details">
              <div class="details-title">Select a Node</div>
              <div class="details-summary">Click on any node in the list to explore its attributes, incoming dependents, outgoing dependencies, and execution trace paths.</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- TAB 2: Health & Gates -->
      <div id="tab-health" class="tab-content">
        <h3 style="margin-bottom: 12px;">Quality Gate Status</h3>
        <div id="gates-container" style="margin-bottom: 24px;"></div>
        
        <h3 style="margin-bottom: 12px;">Orphan Nodes</h3>
        <div id="orphans-container" style="max-height: 200px; overflow-y: auto; margin-bottom: 24px;"></div>
        
        <h3 style="margin-bottom: 12px;">Dangling References</h3>
        <div id="dangling-container" style="max-height: 200px; overflow-y: auto; margin-bottom: 24px;"></div>
        
        <h3 style="margin-bottom: 12px;">Active Graph Cycles</h3>
        <div id="cycles-container" style="max-height: 200px; overflow-y: auto;"></div>
      </div>
      
      <!-- TAB 3: Matrix -->
      <div id="tab-matrix" class="tab-content">
        <h3 style="margin-bottom: 12px;">Domain Inventory Matrix</h3>
        <div style="overflow-x: auto;">
          <table id="matrix-table">
            <thead>
              <tr>
                <th>Domain</th>
                <th style="text-align: right;">Concepts</th>
                <th style="text-align: right;">Rules</th>
                <th style="text-align: right;">Decision Tables</th>
                <th style="text-align: right;">Entities</th>
                <th style="text-align: right;">Actions</th>
                <th style="text-align: right;">Sources</th>
                <th style="text-align: right;">Examples</th>
                <th style="text-align: right;">Templates</th>
                <th style="text-align: right;">Reachability</th>
              </tr>
            </thead>
            <tbody id="matrix-table-body">
              <!-- Rendered dynamically -->
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- TAB 4: Complexity -->
      <div id="tab-complexity" class="tab-content">
        <h3 style="margin-bottom: 12px;">Domain Complexity Index</h3>
        <div style="overflow-x: auto; margin-bottom: 24px;">
          <table id="domain-complexity-table">
            <thead>
              <tr>
                <th>Domain</th>
                <th style="text-align: right;">Nodes</th>
                <th style="text-align: right;">Edges</th>
                <th style="text-align: right;">Complexity Index</th>
              </tr>
            </thead>
            <tbody id="domain-complexity-body">
              <!-- Rendered dynamically -->
            </tbody>
          </table>
        </div>
        
        <h3 style="margin-bottom: 12px;">Top 10 Most Complex Rules (Nested Logic)</h3>
        <div style="overflow-x: auto;">
          <table id="rule-complexity-table">
            <thead>
              <tr>
                <th>Rule ID</th>
                <th>Domain</th>
                <th>Status</th>
                <th style="text-align: right;">Logical Conditions Count</th>
              </tr>
            </thead>
            <tbody id="rule-complexity-body">
              <!-- Rendered dynamically -->
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  </div>

  <script>
    // Embed the payload directly
    const auditData = ${serializedData};
    
    document.getElementById('date-stamp').innerText = 'Generated: ' + new Date().toISOString().split('T')[0];
    
    // Initialize Dashboard KPIs
    document.getElementById('kpi-score').innerText = auditData.quality.score.overall + '/100';
    document.getElementById('kpi-coverage').innerText = auditData.quality.score.coverage + '%';
    document.getElementById('kpi-density').innerText = auditData.metrics.density.toFixed(5);
    document.getElementById('kpi-nodes-edges').innerText = auditData.metrics.totalNodes + ' / ' + auditData.metrics.totalEdges;
    
    const numCycles = auditData.validation.cycles.length;
    const cycleKPI = document.getElementById('kpi-cycles');
    cycleKPI.innerText = numCycles;
    if (numCycles > 7) {
      cycleKPI.style.color = '#ef4444';
    } else {
      cycleKPI.style.color = '#10b981';
    }
    
    // Switch Tabs
    function switchTab(tabId) {
      document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      const tabButton = Array.from(document.querySelectorAll('.nav-tab')).find(btn => btn.getAttribute('onclick').includes(tabId));
      if (tabButton) tabButton.classList.add('active');
      
      document.getElementById('tab-' + tabId).classList.add('active');
    }
    
    // Nodes Explorer
    const listContainer = document.getElementById('node-list-container');
    
    function renderNodeList(filteredNodes) {
      listContainer.innerHTML = '';
      if (filteredNodes.length === 0) {
        listContainer.innerHTML = '<div style="padding:12px;color:var(--text-secondary);text-align:center;">No matching nodes found</div>';
        return;
      }
      
      filteredNodes.forEach(node => {
        const item = document.createElement('div');
        item.className = 'node-item';
        item.onclick = () => showDetails(node.id);
        
        const labelText = document.createElement('span');
        labelText.innerText = node.id;
        labelText.style.fontWeight = '500';
        labelText.style.fontFamily = 'monospace';
        
        const badge = document.createElement('span');
        badge.className = 'badge badge-' + node.type;
        badge.innerText = node.type;
        
        item.appendChild(labelText);
        item.appendChild(badge);
        listContainer.appendChild(item);
      });
    }
    
    function filterNodes() {
      const q = document.getElementById('search-input').value.toLowerCase().trim();
      const type = document.getElementById('type-filter').value;
      
      const filtered = auditData.nodes.filter(n => {
        const matchesQuery = n.id.toLowerCase().includes(q) || (n.label && n.label.toLowerCase().includes(q));
        const matchesType = type === 'all' || n.type === type;
        return matchesQuery && matchesType;
      });
      
      renderNodeList(filtered);
    }
    
    // Dependency mini-map (R3): node-type fill colors, reusing the same
    // --color-* CSS variables the badges already use (see .badge-*
    // rules above) so the mini-map stays visually consistent with the
    // rest of the dashboard without a second color system to maintain.
    const MINIMAP_TYPE_FILL = {
      concept: 'var(--color-concept)',
      rule: 'var(--color-rule)',
      decision_table: 'var(--color-dt)',
      entity: 'var(--color-entity)',
      action: 'var(--color-action)',
      source: 'var(--color-source)',
      example: 'var(--color-example)',
      exception: 'var(--color-exception)',
      template: 'var(--color-template)'
    };

    // Deterministic 2-hop neighborhood (center + direct neighbors +
    // their direct neighbors), capped at ~30 nodes total so the SVG
    // stays readable. No physics/force simulation — the neighborhood
    // is small and bounded, so a fixed radial layout (center, 1-hop
    // ring, 2-hop ring) is cheap and fully deterministic.
    function buildMiniMapNeighborhood(centerId, maxNodes) {
      const neighborsOf = (id) => {
        const out = [];
        for (const e of auditData.edges) {
          if (e.source === id && e.target !== id) out.push(e.target);
          if (e.target === id && e.source !== id) out.push(e.source);
        }
        return out;
      };

      const seen = new Set([centerId]);
      const level1 = [];
      neighborsOf(centerId).forEach(id => {
        if (!seen.has(id)) { seen.add(id); level1.push(id); }
      });

      let level2 = [];
      level1.forEach(n => {
        neighborsOf(n).forEach(id => {
          if (!seen.has(id)) { seen.add(id); level2.push(id); }
        });
      });

      // Budget: center always included; 1-hop nodes take priority over
      // 2-hop nodes when the neighborhood is larger than the cap.
      let trimmedLevel1 = level1;
      if (1 + trimmedLevel1.length > maxNodes) {
        trimmedLevel1 = trimmedLevel1.slice(0, Math.max(0, maxNodes - 1));
        level2 = [];
      } else {
        const budget = maxNodes - 1 - trimmedLevel1.length;
        level2 = level2.slice(0, Math.max(0, budget));
      }

      return { level1: trimmedLevel1, level2 };
    }

    function renderMiniMap(container, centerId) {
      const MAX_NODES = 30;
      const { level1, level2 } = buildMiniMapNeighborhood(centerId, MAX_NODES);

      if (level1.length === 0 && level2.length === 0) {
        container.innerHTML = '<div class="minimap-empty">No connected nodes to visualize.</div>';
        return;
      }

      const width = 380;
      const height = 380;
      const cx = width / 2;
      const cy = height / 2;
      const r1 = 100;
      const r2 = 170;

      const positions = {};
      positions[centerId] = { x: cx, y: cy };

      level1.forEach((id, i) => {
        const angle = (2 * Math.PI * i) / level1.length - Math.PI / 2;
        positions[id] = { x: cx + r1 * Math.cos(angle), y: cy + r1 * Math.sin(angle) };
      });

      level2.forEach((id, i) => {
        const denom = Math.max(level2.length, 1);
        const angle = (2 * Math.PI * i) / denom - Math.PI / 2;
        positions[id] = { x: cx + r2 * Math.cos(angle), y: cy + r2 * Math.sin(angle) };
      });

      const visibleIds = Object.keys(positions);
      const visibleIdSet = new Set(visibleIds);
      const visibleEdges = auditData.edges.filter(e => visibleIdSet.has(e.source) && visibleIdSet.has(e.target));

      const nodeById = {};
      auditData.nodes.forEach(n => { nodeById[n.id] = n; });

      let svg = '<svg viewBox="0 0 ' + width + ' ' + height + '" xmlns="http://www.w3.org/2000/svg">';

      visibleEdges.forEach(e => {
        const a = positions[e.source];
        const b = positions[e.target];
        if (!a || !b) return;
        svg += '<line class="minimap-edge" x1="' + a.x.toFixed(1) + '" y1="' + a.y.toFixed(1) + '" x2="' + b.x.toFixed(1) + '" y2="' + b.y.toFixed(1) + '"></line>';
      });

      visibleIds.forEach(id => {
        const pos = positions[id];
        const n = nodeById[id];
        const type = n ? n.type : 'other';
        const isCenter = id === centerId;
        const radius = isCenter ? 11 : 6;
        const fill = MINIMAP_TYPE_FILL[type] || '#475569';
        const rawLabel = (n && n.label) || id;
        const shortLabel = rawLabel.length > 14 ? (rawLabel.slice(0, 13) + '\u2026') : rawLabel;
        const safeLabel = shortLabel.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        svg += '<g class="minimap-node-group" onclick="showDetails(\\'' + id + '\\')">' +
          '<circle class="minimap-node' + (isCenter ? ' is-center' : '') + '" cx="' + pos.x.toFixed(1) + '" cy="' + pos.y.toFixed(1) + '" r="' + radius + '" fill="' + fill + '"><title>' + id + '</title></circle>' +
          '<text class="minimap-label' + (isCenter ? ' is-center' : '') + '" x="' + pos.x.toFixed(1) + '" y="' + (pos.y + radius + 11).toFixed(1) + '">' + safeLabel + '</text>' +
          '</g>';
      });

      svg += '</svg>';
      container.innerHTML = svg;
    }

    // Show details card
    function showDetails(id) {
      const node = auditData.nodes.find(n => n.id === id);
      if (!node) return;
      
      const detailsPanel = document.getElementById('details-panel');
      detailsPanel.innerHTML = '';
      
      // Title
      const title = document.createElement('div');
      title.className = 'details-title';
      title.innerText = node.label || node.id;
      const badge = document.createElement('span');
      badge.className = 'badge badge-' + node.type;
      badge.innerText = node.type;
      title.appendChild(badge);
      detailsPanel.appendChild(title);
      
      // ID
      const detailsId = document.createElement('div');
      detailsId.className = 'details-id';
      detailsId.innerText = node.id;
      detailsPanel.appendChild(detailsId);
      
      // Meta Grid
      const metaGrid = document.createElement('div');
      metaGrid.className = 'details-meta-grid';
      metaGrid.innerHTML = '<div class="meta-item"><label>Domain</label><span>' + (node.domain === 'core' ? 'Core' : node.domain) + '</span></div>' +
        '<div class="meta-item"><label>Lifecycle Status</label><span>' + (node.status || 'production') + '</span></div>' +
        '<div class="meta-item" style="grid-column: span 2;"><label>Source File</label><span style="font-family:monospace;font-size:11px;">' + node.file + '</span></div>';
      detailsPanel.appendChild(metaGrid);
      
      // Description
      if (node.summary) {
        const desc = document.createElement('div');
        desc.className = 'details-summary';
        desc.innerText = node.summary;
        detailsPanel.appendChild(desc);
      }
      
      // Dependency mini-map (R3): a small 2-hop neighborhood subgraph
      // (selected node + direct neighbors + their direct neighbors,
      // capped at ~30 nodes) rendered as inline SVG with a deterministic
      // radial layout — additive to the existing outgoing/incoming text
      // lists below, not a replacement for them.
      const miniMapSection = document.createElement('div');
      miniMapSection.className = 'minimap-section';
      miniMapSection.innerHTML = '<h4>Dependency Mini-Map (2-hop neighborhood)</h4>';
      const miniMapWrap = document.createElement('div');
      miniMapWrap.className = 'minimap-svg-wrap';
      miniMapSection.appendChild(miniMapWrap);
      detailsPanel.appendChild(miniMapSection);
      renderMiniMap(miniMapWrap, id);
      
      // Outgoing edges
      const outgoing = auditData.edges.filter(e => e.source === id);
      const outSection = document.createElement('div');
      outSection.className = 'relation-section';
      outSection.innerHTML = '<h4>Outgoing Dependencies (References)</h4>';
      if (outgoing.length === 0) {
        outSection.innerHTML += '<div style="font-size:12px;color:var(--text-secondary);">None</div>';
      } else {
        const list = document.createElement('div');
        list.className = 'relation-list';
        outgoing.forEach(e => {
          list.innerHTML += '<div class="relation-item">' +
            '<span>' + e.relation + '</span>' +
            '<a href="#" onclick="showDetails(\\'' + e.target + '\\');return false;">' + e.target + '</a>' +
            '</div>';
        });
        outSection.appendChild(list);
      }
      detailsPanel.appendChild(outSection);
      
      // Incoming edges
      const incoming = auditData.edges.filter(e => e.target === id);
      const inSection = document.createElement('div');
      inSection.className = 'relation-section';
      inSection.innerHTML = '<h4>Incoming Dependents (Referenced By)</h4>';
      if (incoming.length === 0) {
        inSection.innerHTML += '<div style="font-size:12px;color:var(--text-secondary);">None</div>';
      } else {
        const list = document.createElement('div');
        list.className = 'relation-list';
        incoming.forEach(e => {
          list.innerHTML += '<div class="relation-item">' +
            '<a href="#" onclick="showDetails(\\'' + e.source + '\\');return false;">' + e.source + '</a>' +
            '<span>' + e.relation + '</span>' +
            '</div>';
        });
        inSection.appendChild(list);
      }
      detailsPanel.appendChild(inSection);
      
      // End-to-end Tracing path if Concept
      if (node.type === 'concept') {
        const coverageInfo = auditData.coverage.details.find(c => c.conceptId === id);
        if (coverageInfo) {
          const pathSection = document.createElement('div');
          pathSection.className = 'relation-section';
          pathSection.innerHTML = '<h4>End-to-End Tracing</h4>';
          
          if (coverageInfo.paths.length === 0) {
            pathSection.innerHTML += '<div class="alert-box warning">No execution pathways map to this concept in rules or templates.</div>';
          } else {
            coverageInfo.paths.forEach(p => {
              const statusClass = p.active ? 'active' : 'warning';
              const indicator = p.active ? '🟢 ACTIVE' : '🔴 INERT';
              pathSection.innerHTML += '<div class="alert-box ' + (p.active ? '' : 'warning') + '" style="margin-bottom:8px;">' +
                '<strong style="font-size:11px;display:block;margin-bottom:4px;">' + indicator + ' PATH</strong>' +
                '<div class="path-trace">' + p.path + '</div>' +
                '</div>';
            });
          }
          detailsPanel.appendChild(pathSection);
        }
      }
    }
    
    // Tab 2: Health Gates and Alerts
    const gates = auditData.validation.gates;
    const gatesContainer = document.getElementById('gates-container');
    
    let gatesHtml = '';
    const renderGate = (name, result) => {
      const statusText = result.passed ? 'PASSED' : 'FAILED';
      const indicatorColor = result.passed ? '#10b981' : '#ef4444';
      return '<div class="alert-box ' + (result.passed ? '' : 'warning') + '" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
        '<div>' +
        '<strong>Gate: ' + name + '</strong>' +
        '<div style="font-size:11px;color:var(--text-secondary);">Count: ' + result.count + (result.limit !== undefined ? ' (Limit: ' + result.limit + ')' : '') + '</div>' +
        '</div>' +
        '<strong style="color: ' + indicatorColor + '">' + statusText + '</strong>' +
        '</div>';
    };
    
    gatesHtml += renderGate('No Dangling References', gates.dangling);
    gatesHtml += renderGate('No Schema Violations', gates.schema);
    gatesHtml += renderGate('No Duplicate IDs', gates.duplicates);
    gatesHtml += renderGate('Graph Cycles Check', gates.cycles);
    
    gatesContainer.innerHTML = gatesHtml;
    
    // Orphans list
    const orphansContainer = document.getElementById('orphans-container');
    if (auditData.validation.orphans.length === 0) {
      orphansContainer.innerHTML = '<div style="font-size:12px;color:var(--text-secondary);">No orphan nodes detected.</div>';
    } else {
      let orphansHtml = '<table><thead><tr><th>Node ID</th><th>Type</th><th>Domain</th></tr></thead><tbody>';
      auditData.validation.orphans.forEach(o => {
        orphansHtml += '<tr>' +
          '<td><a href="#" onclick="switchTab(\\'explorer\\');showDetails(\\'' + o.id + '\\');return false;" style="color:var(--accent-color);text-decoration:none;">' + o.id + '</a></td>' +
          '<td>' + o.type + '</td>' +
          '<td>' + o.domain + '</td>' +
          '</tr>';
      });
      orphansHtml += '</tbody></table>';
      orphansContainer.innerHTML = orphansHtml;
    }
    
    // Dangling references list
    const danglingContainer = document.getElementById('dangling-container');
    if (auditData.validation.danglingReferences.length === 0) {
      danglingContainer.innerHTML = '<div style="font-size:12px;color:var(--text-secondary);">No dangling references detected.</div>';
    } else {
      let dangHtml = '<table><thead><tr><th>Source Node</th><th>Missing Target</th><th>Relation</th><th>Location</th></tr></thead><tbody>';
      auditData.validation.danglingReferences.forEach(d => {
        dangHtml += '<tr>' +
          '<td><a href="#" onclick="switchTab(\\'explorer\\');showDetails(\\'' + d.source + '\\');return false;" style="color:var(--accent-color);text-decoration:none;">' + d.source + '</a></td>' +
          '<td style="color:#ef4444;font-family:monospace;">' + d.target + '</td>' +
          '<td>' + d.relation + '</td>' +
          '<td style="font-family:monospace;font-size:11px;">' + d.file + '</td>' +
          '</tr>';
      });
      dangHtml += '</tbody></table>';
      danglingContainer.innerHTML = dangHtml;
    }
    
    // Cycles list
    const cyclesContainer = document.getElementById('cycles-container');
    if (auditData.validation.cycles.length === 0) {
      cyclesContainer.innerHTML = '<div style="font-size:12px;color:var(--text-secondary);">No graph cycles detected.</div>';
    } else {
      let cyclesHtml = '';
      auditData.validation.cycles.forEach((c, idx) => {
        cyclesHtml += '<div class="alert-box warning" style="margin-bottom:8px;">' +
          '<strong>Cycle #' + (idx + 1) + '</strong>' +
          '<div class="path-trace">' + c.join(' ──▶ ') + '</div>' +
          '</div>';
      });
      cyclesContainer.innerHTML = cyclesHtml;
    }
    
    // Tab 3: Knowledge Matrix Table
    const matrixBody = document.getElementById('matrix-table-body');
    const matrixData = {};
    const domains = new Set();
    
    auditData.nodes.forEach(n => {
      const d = n.domain || 'core';
      domains.add(d);
      matrixData[d] = matrixData[d] || {
        concept: 0, rule: 0, decision_table: 0, entity: 0, action: 0, source: 0, example: 0, template: 0, passedConcepts: 0, totalConcepts: 0
      };
      
      if (matrixData[d][n.type] !== undefined) {
        matrixData[d][n.type]++;
      }
    });
    
    auditData.coverage.details.forEach(c => {
      const d = c.domain || 'core';
      matrixData[d] = matrixData[d] || {
        concept: 0, rule: 0, decision_table: 0, entity: 0, action: 0, source: 0, example: 0, template: 0, passedConcepts: 0, totalConcepts: 0
      };
      matrixData[d].totalConcepts++;
      if (c.status === 'PASS') {
        matrixData[d].passedConcepts++;
      }
    });
    
    Array.from(domains).sort().forEach(d => {
      const counts = matrixData[d];
      const coveragePercent = counts.totalConcepts > 0 ? Math.round((counts.passedConcepts / counts.totalConcepts) * 100) : 0;
      
      const row = document.createElement('tr');
      row.innerHTML = '<td><strong>' + (d === 'core' ? 'Core' : d) + '</strong></td>' +
        '<td style="text-align:right;">' + counts.concept + '</td>' +
        '<td style="text-align:right;">' + counts.rule + '</td>' +
        '<td style="text-align:right;">' + counts.decision_table + '</td>' +
        '<td style="text-align:right;">' + counts.entity + '</td>' +
        '<td style="text-align:right;">' + counts.action + '</td>' +
        '<td style="text-align:right;">' + counts.source + '</td>' +
        '<td style="text-align:right;">' + counts.example + '</td>' +
        '<td style="text-align:right;">' + counts.template + '</td>' +
        '<td style="text-align:right;font-weight:600;color:' + (coveragePercent > 80 ? '#10b981' : (coveragePercent > 40 ? '#f59e0b' : '#ef4444')) + '">' + coveragePercent + '% (' + counts.passedConcepts + '/' + counts.totalConcepts + ')</td>';
      matrixBody.appendChild(row);
    });
    
    // Tab 4: Complexity
    const compBody = document.getElementById('domain-complexity-body');
    auditData.metrics.domainComplexity.forEach(c => {
      const row = document.createElement('tr');
      row.innerHTML = '<td><strong>' + (c.name === 'core' ? 'Core' : c.name) + '</strong></td>' +
        '<td style="text-align:right;">' + c.nodes + '</td>' +
        '<td style="text-align:right;">' + c.edges + '</td>' +
        '<td style="text-align:right;font-weight:600;color:var(--accent-color)">' + c.index + '</td>';
      compBody.appendChild(row);
    });
    
    const ruleCompBody = document.getElementById('rule-complexity-body');
    auditData.metrics.topComplexRules.forEach(r => {
      const row = document.createElement('tr');
      row.innerHTML = '<td><a href="#" onclick="switchTab(\\'explorer\\');showDetails(\\'' + r.id + '\\');return false;" style="color:var(--accent-color);text-decoration:none;font-family:monospace;">' + r.id + '</a></td>' +
        '<td>' + r.domain + '</td>' +
        '<td>' + r.status + '</td>' +
        '<td style="text-align:right;font-weight:600;">' + r.score + '</td>';
      ruleCompBody.appendChild(row);
    });
    
    // Initial Render
    filterNodes();
    
  </script>
</body>
</html>
`;
  return html;
}