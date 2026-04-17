import { useEffect, useMemo, useState } from 'react';
import {
  FaBuilding,
  FaChartBar,
  FaDownload,
  FaChevronLeft,
  FaChevronRight,
  FaCog,
  FaEdit,
  FaHistory,
  FaInfoCircle,
  FaLayerGroup,
  FaMoon,
  FaPlus,
  FaBolt,
  FaMapMarkerAlt,
  FaSearch,
  FaSun,
  FaTrash,
  FaTimes,
  FaUniversity,
  FaWarehouse
} from 'react-icons/fa';

const PAGE_SIZE = 6;

const seedAssets = [
  { id: 1001, name: 'Main Lecture Hall', type: 'Facility', location: 'Block A' },
  { id: 1002, name: 'Computer Lab PC-21', type: 'Asset', location: 'Lab 3' },
  { id: 1003, name: 'Projector Unit X12', type: 'Asset', location: 'Auditorium' },
  { id: 1004, name: 'Innovation Hub', type: 'Facility', location: 'Block C' },
  { id: 1005, name: 'Security Camera Node', type: 'Asset', location: 'Gate 2' },
  { id: 1006, name: 'Exam Center', type: 'Facility', location: 'Block D' },
  { id: 1007, name: 'Air Conditioner 3T', type: 'Asset', location: 'Server Room' },
  { id: 1008, name: 'Seminar Room East', type: 'Facility', location: 'Block B' }
];

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [activityLog, setActivityLog] = useState([]);

  const [form, setForm] = useState({
    name: '',
    type: 'Asset',
    location: ''
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setAssets(seedAssets);
      setSelectedAssetId(seedAssets[0]?.id ?? null);
      setActivityLog([
        { id: 1, text: 'Demo catalog loaded successfully.', time: 'Now' },
        { id: 2, text: 'Smart search and filters are active.', time: 'Just now' },
        { id: 3, text: 'Catalog health scan completed.', time: 'Just now' }
      ]);
      setLoading(false);
    }, 900);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    return () => document.body.classList.remove('dark-mode');
  }, [darkMode]);

  const summary = useMemo(() => {
    const totalAssets = assets.filter((item) => item.type === 'Asset').length;
    const totalFacilities = assets.filter((item) => item.type === 'Facility').length;
    const uniqueLocations = new Set(assets.map((item) => item.location.toLowerCase())).size;
    const duplicateNames = assets.length - new Set(assets.map((item) => item.name.toLowerCase())).size;
    const balanceGap = Math.abs(totalAssets - totalFacilities);
    const healthScore = assets.length
      ? Math.max(52, Math.min(100, 100 - duplicateNames * 10 - balanceGap * 4))
      : 0;
    return {
      total: assets.length,
      totalAssets,
      totalFacilities,
      uniqueLocations,
      duplicateNames,
      healthScore
    };
  }, [assets]);

  const selectedAsset = useMemo(
    () => assets.find((item) => item.id === selectedAssetId) ?? assets[0] ?? null,
    [assets, selectedAssetId]
  );

  const filteredAssets = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return assets.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        String(item.id).includes(q);
      const matchesType = typeFilter === 'All' || item.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [assets, searchTerm, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAssets.length / PAGE_SIZE));

  const paginatedAssets = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAssets.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredAssets]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!loading && assets.length && !selectedAssetId) {
      setSelectedAssetId(assets[0].id);
    }
  }, [assets, loading, selectedAssetId]);

  const pushToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
  };

  const pushActivity = (text) => {
    setActivityLog((prev) => {
      const item = {
        id: Date.now() + Math.random(),
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      return [item, ...prev].slice(0, 5);
    });
  };

  const clearForm = () => {
    setForm({ name: '', type: 'Asset', location: '' });
    setEditingId(null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const payload = {
      name: form.name.trim(),
      type: form.type,
      location: form.location.trim()
    };

    if (!payload.name || !payload.location) {
      pushToast('Please complete all fields.', 'warning');
      return;
    }

    if (editingId) {
      setAssets((prev) => prev.map((item) => (item.id === editingId ? { ...item, ...payload } : item)));
      pushToast('Asset updated successfully.', 'success');
      pushActivity(`Updated ${payload.name} at ${payload.location}.`);
    } else {
      const newItem = {
        id: Math.max(1000, ...assets.map((item) => item.id)) + 1,
        ...payload
      };
      setAssets((prev) => [newItem, ...prev]);
      pushToast('Asset added successfully.', 'success');
      pushActivity(`Added ${payload.name} as a new ${payload.type.toLowerCase()}.`);
    }

    clearForm();
  };

  const handleEdit = (item) => {
    setForm({
      name: item.name,
      type: item.type,
      location: item.location
    });
    setEditingId(item.id);
    setSelectedAssetId(item.id);
    pushToast(`Editing record #${item.id}`, 'info');
  };

  const handleSelectAsset = (item) => {
    setSelectedAssetId(item.id);
  };

  const handleExportCsv = () => {
    const rows = [['ID', 'Name', 'Type', 'Location'], ...filteredAssets.map((item) => [item.id, item.name, item.type, item.location])];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'facility-asset-catalog.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    pushToast('CSV export created.', 'success');
    pushActivity('Exported the filtered catalog as CSV.');
  };

  const restoreDemoData = () => {
    setAssets(seedAssets);
    setSearchTerm('');
    setTypeFilter('All');
    setCurrentPage(1);
    setSelectedAssetId(seedAssets[0]?.id ?? null);
    clearForm();
    setLoading(false);
    pushToast('Demo data restored.', 'info');
    pushActivity('Restored the original demo dataset.');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('All');
    setCurrentPage(1);
    pushToast('Filters cleared.', 'info');
  };

  const openDeleteModal = (id) => {
    setPendingDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    const removedAsset = assets.find((item) => item.id === pendingDeleteId);
    setAssets((prev) => prev.filter((item) => item.id !== pendingDeleteId));
    setShowDeleteModal(false);
    setPendingDeleteId(null);
    pushToast('Record deleted.', 'danger');
    if (removedAsset) {
      pushActivity(`Deleted ${removedAsset.name} from ${removedAsset.location}.`);
    }
  };

  return (
    <div className="catalog-shell">
      <div className="bg-orb orb-a" />
      <div className="bg-orb orb-b" />

      <aside className="sidebar-panel glass-card fade-in-up">
        <div className="brand-row">
          <div className="brand-mark"><FaUniversity /></div>
          <div>
            <h2>Smart Campus</h2>
            <small>Admin Console</small>
          </div>
        </div>
        <nav className="menu-list">
          <button className="menu-item active"><FaChartBar /> Dashboard</button>
          <button className="menu-item"><FaWarehouse /> Assets</button>
          <button className="menu-item"><FaCog /> Settings</button>
        </nav>
      </aside>

      <main className="content-area">
        <header className="top-nav glass-card fade-in-up">
          <div>
            <h1>Facility &amp; Asset Catalog System</h1>
            <p>Professional catalog control for university operations</p>
          </div>
          <button
            className="theme-toggle"
            type="button"
            onClick={() => setDarkMode((prev) => !prev)}
          >
            {darkMode ? <FaSun /> : <FaMoon />}
            {darkMode ? 'Light' : 'Dark'}
          </button>
        </header>

        <section className="summary-grid">
          <article className="summary-card glass-card fade-in-up delay-1">
            <span className="summary-icon"><FaWarehouse /></span>
            <div>
              <p>Total Records</p>
              <h3>{summary.total}</h3>
            </div>
          </article>
          <article className="summary-card glass-card fade-in-up delay-2">
            <span className="summary-icon"><FaBuilding /></span>
            <div>
              <p>Total Facilities</p>
              <h3>{summary.totalFacilities}</h3>
            </div>
          </article>
          <article className="summary-card glass-card fade-in-up delay-3">
            <span className="summary-icon"><FaChartBar /></span>
            <div>
              <p>Total Assets</p>
              <h3>{summary.totalAssets}</h3>
            </div>
          </article>
          <article className="summary-card glass-card fade-in-up delay-3">
            <span className="summary-icon"><FaBolt /></span>
            <div>
              <p>Catalog Health</p>
              <h3>{summary.healthScore}%</h3>
            </div>
          </article>
        </section>

        <section className="panel-grid">
          <article className="glass-card panel-card fade-in-up delay-2">
            <div className="panel-head">
              <h2>{editingId ? `Update Record #${editingId}` : 'Add New Asset'}</h2>
            </div>
            <form className="asset-form" onSubmit={handleSubmit}>
              <label className="input-group">
                <span>Asset Name</span>
                <div className="input-wrap">
                  <FaWarehouse />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Smart Board A1"
                  />
                </div>
              </label>

              <label className="input-group">
                <span>Type</span>
                <div className="input-wrap">
                  <FaBuilding />
                  <select
                    value={form.type}
                    onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="Facility">Facility</option>
                    <option value="Asset">Asset</option>
                  </select>
                </div>
              </label>

              <label className="input-group">
                <span>Location</span>
                <div className="input-wrap">
                  <FaUniversity />
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g. Block C, Floor 1"
                  />
                </div>
              </label>

              <div className="form-actions">
                <button className="btn-primary-glow" type="submit">
                  <FaPlus />
                  {editingId ? 'Update Asset' : 'Add Asset'}
                </button>
                {editingId ? (
                  <button className="btn-ghost" type="button" onClick={clearForm}>Cancel</button>
                ) : null}
              </div>
            </form>
          </article>

          <article className="glass-card panel-card fade-in-up delay-3">
            <div className="panel-head with-tools">
              <div>
                <h2>Catalog Records</h2>
                <p className="panel-subtitle">Live search, filtering, export, and record spotlighting</p>
              </div>
              <div className="tool-row">
                <label className="search-box">
                  <FaSearch />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Live search by name, location, ID"
                  />
                </label>
                <select
                  className="filter-select"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="All">All Types</option>
                  <option value="Facility">Facility</option>
                  <option value="Asset">Asset</option>
                </select>
                <button className="quick-action" type="button" onClick={clearFilters}>
                  <FaTimes /> Clear
                </button>
                <button className="quick-action" type="button" onClick={restoreDemoData}>
                  <FaHistory /> Reset Demo
                </button>
                <button className="quick-action primary" type="button" onClick={handleExportCsv}>
                  <FaDownload /> Export CSV
                </button>
              </div>
            </div>

            <div className="insight-strip">
              <div className="insight-tile">
                <FaLayerGroup />
                <div>
                  <span>Unique Locations</span>
                  <strong>{summary.uniqueLocations}</strong>
                </div>
              </div>
              <div className="insight-tile">
                <FaMapMarkerAlt />
                <div>
                  <span>Top Risk</span>
                  <strong>{summary.duplicateNames > 0 ? `${summary.duplicateNames} duplicates` : 'No duplicates'}</strong>
                </div>
              </div>
              <div className="insight-tile">
                <FaInfoCircle />
                <div>
                  <span>Smart Status</span>
                  <strong>{summary.healthScore >= 85 ? 'Excellent' : summary.healthScore >= 70 ? 'Healthy' : 'Review needed'}</strong>
                </div>
              </div>
            </div>

            <div className="spotlight-card">
              <div className="spotlight-head">
                <div>
                  <span>Record Spotlight</span>
                  <h3>{selectedAsset ? selectedAsset.name : 'No record selected'}</h3>
                </div>
                {selectedAsset ? (
                  <span className={`pill ${selectedAsset.type === 'Facility' ? 'facility' : 'asset'}`}>
                    {selectedAsset.type}
                  </span>
                ) : null}
              </div>
              {selectedAsset ? (
                <div className="spotlight-body">
                  <div>
                    <small>ID</small>
                    <strong>#{selectedAsset.id}</strong>
                  </div>
                  <div>
                    <small>Location</small>
                    <strong>{selectedAsset.location}</strong>
                  </div>
                  <div>
                    <small>Status</small>
                    <strong>Ready for API sync</strong>
                  </div>
                </div>
              ) : (
                <div className="spotlight-empty">Select a row to inspect more details.</div>
              )}
            </div>

            {loading ? (
              <div className="loading-wrap">
                <span className="spinner" />
                <p>Loading facility and asset data...</p>
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="empty-wrap">
                <FaWarehouse />
                <h4>No matching records found</h4>
                <p>Try changing search keywords or filter options.</p>
              </div>
            ) : (
              <>
                <div className="table-wrap">
                  <table className="asset-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Location</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedAssets.map((item) => (
                        <tr
                          key={item.id}
                          className={selectedAssetId === item.id ? 'selected-row' : ''}
                          onClick={() => handleSelectAsset(item)}
                        >
                          <td>#{item.id}</td>
                          <td>{item.name}</td>
                          <td>
                            <span className={`pill ${item.type === 'Facility' ? 'facility' : 'asset'}`}>
                              {item.type}
                            </span>
                          </td>
                          <td>{item.location}</td>
                          <td>
                            <div className="action-row" onClick={(event) => event.stopPropagation()}>
                              <button
                                className="icon-btn edit"
                                type="button"
                                onClick={() => handleEdit(item)}
                                aria-label={`Edit ${item.name}`}
                                data-tooltip="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button
                                className="icon-btn delete"
                                type="button"
                                onClick={() => openDeleteModal(item.id)}
                                aria-label={`Delete ${item.name}`}
                                data-tooltip="Delete"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pagination-row">
                  <p>Showing {paginatedAssets.length} of {filteredAssets.length} records</p>
                  <div className="pager-buttons">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <FaChevronLeft /> Prev
                    </button>
                    <span>Page {currentPage} / {totalPages}</span>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next <FaChevronRight />
                    </button>
                  </div>
                </div>

                <div className="activity-panel">
                  <div className="activity-head">
                    <h3>Recent Activity</h3>
                    <span>Auto-updated</span>
                  </div>
                  <div className="activity-list">
                    {activityLog.map((item) => (
                      <div key={item.id} className="activity-item">
                        <span className="activity-dot" />
                        <div>
                          <p>{item.text}</p>
                          <small>{item.time}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </article>
        </section>
      </main>

      {showDeleteModal ? (
        <div className="modal-backdrop">
          <div className="confirm-modal">
            <h4>Delete this record?</h4>
            <p>This action cannot be undone.</p>
            <div className="modal-actions">
              <button type="button" className="btn-ghost" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button type="button" className="btn-danger-solid" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="toast-stack">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-item ${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
