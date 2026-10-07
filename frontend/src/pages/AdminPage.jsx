import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { FaShieldAlt, FaUser, FaBriefcase, FaUserTie, FaSync, FaFileUpload, FaCloudDownloadAlt, FaExternalLinkAlt } from 'react-icons/fa';

function AdminPage({ user }) {
  const navigate = useNavigate();
  const importInput = useRef(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);
  const [statsAttempt, setStatsAttempt] = useState(0);

  const [stats, setStats] = useState({
    new_jobs_url: '#',
    new_seekers_url: '#'
  });

  const [updating, setUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);
  const [syncingCsv, setSyncingCsv] = useState(false);
  const [syncCsvStatus, setSyncCsvStatus] = useState(null);


  useEffect(() => {
    fetch('/api/dashboard-stats')
      .then(res => { if (!res.ok) throw new Error('Unavailable'); return res.json(); })
      .then(data => {
        if (!data.success) throw new Error('Unavailable');
        if (data.success) {
          setStats({
            new_jobs_url: data.new_jobs_url || '#',
            new_seekers_url: data.new_seekers_url || '#'
          });
        }
      })
      .catch(err => {
        setStatsError(true);
        console.error('Error fetching dashboard stats for admin page:', err);
      }).finally(() => setStatsLoading(false));
  }, [statsAttempt]);

  const handleUpdateJobSeekerInfo = () => {
    setUpdating(true);
    setUpdateStatus(null);
    setImportStatus(null);
    setExportStatus(null);
    setSyncCsvStatus(null);
    fetch('/api/update-jobseeker-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => {
        setUpdating(false);
        if (data.success) {
          setUpdateStatus({ success: true, message: data.message });
        } else {
          setUpdateStatus({ success: false, message: data.error || 'Failed to update.' });
        }
      })
      .catch(err => {
        setUpdating(false);
        setUpdateStatus({ success: false, message: 'Network error occurred.' });
        console.error('Error updating jobseeker info:', err);
      });
  };

  const handleImportJobSeekers = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    setImportStatus(null);
    setUpdateStatus(null);
    setExportStatus(null);
    setSyncCsvStatus(null);

    const formData = new FormData();
    formData.append('file', file);

    fetch('/api/import-jobseekers', {
      method: 'POST',
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        setImporting(false);
        e.target.value = '';
        if (data.success) {
          setImportStatus({ success: true, message: data.message, url: data.url });
        } else {
          setImportStatus({ success: false, message: data.error || 'Failed to import.' });
        }
      })
      .catch(err => {
        setImporting(false);
        e.target.value = '';
        setImportStatus({ success: false, message: 'Network error occurred.' });
        console.error('Error importing job seekers:', err);
      });
  };

  const handleExportJSearchJobs = () => {
    setExporting(true);
    setExportStatus(null);
    setUpdateStatus(null);
    setImportStatus(null);
    setSyncCsvStatus(null);
    fetch('/api/export-jsearch-jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => {
        setExporting(false);
        if (data.success) {
          setExportStatus({
            success: true,
            message: data.message,
            warning: data.warning,
            jsearch_limit_exceeded: data.jsearch_limit_exceeded,
            url: data.url,
            count: data.count
          });
        } else {
          setExportStatus({
            success: false,
            message: (data.error || 'Failed to export JSearch jobs.') + (data.details ? ` (${data.details})` : ''),
            warning: data.warning,
            jsearch_limit_exceeded: data.jsearch_limit_exceeded,
            url: data.url
          });
        }
      })
      .catch(err => {
        setExporting(false);
        setExportStatus({ success: false, message: 'Network error occurred exporting jobs.' });
        console.error('Error exporting JSearch jobs:', err);
      });
  };

  const handleSyncJobSeekersCsv = () => {
    setSyncingCsv(true);
    setSyncCsvStatus(null);
    setUpdateStatus(null);
    setImportStatus(null);
    setExportStatus(null);

    fetch('/api/sync-jobseekers-csv-to-drive', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => {
        setSyncingCsv(false);
        if (data.success) {
          setSyncCsvStatus({ success: true, message: data.message, url: data.url });
        } else {
          setSyncCsvStatus({ success: false, message: data.error || 'Failed to sync JobSeeker CSV.' });
        }
      })
      .catch(err => {
        setSyncingCsv(false);
        setSyncCsvStatus({ success: false, message: 'Network error occurred while syncing JobSeeker CSV.' });
        console.error('Error syncing JobSeeker CSV:', err);
      });
  };

  return (
    <div className="app-container fade-in">
      <div className="glass-panel main-form" style={{ maxWidth: '900px' }}>
        <header className="admin-heading">
          <div className="admin-heading-icon">
            <FaShieldAlt style={{ fontSize: '2.5rem', color: 'var(--primary-color)' }} />
          </div>
          <div><h1>System Administration</h1>
          <p className="subtitle">GoodJobNet Admin Portal</p></div>
        </header>

        {/* User Session Info Card */}
        <div style={{ background: 'var(--surface-soft)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--text-dark)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaUser style={{ color: 'var(--primary-color)' }} /> Active Session Info
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: '1rem' }}>
            <div>
              <strong style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>Account Name</strong>
              <p style={{ fontWeight: '600' }}>{user?.name || 'N/A'}</p>
            </div>
            <div>
              <strong style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>System Role</strong>
              <p style={{ fontWeight: '600', color: user?.role === 'admin' ? 'var(--success)' : 'var(--text-dark)' }}>
                {user?.role === 'admin' ? 'Administrator' : user?.role || 'Standard User'}
              </p>
            </div>
          </div>
        </div>

        {/* Admin Tools Navigation Grid (Icons) */}
        <h2 style={{ fontSize: '1.2rem', color: 'var(--text-dark)', marginBottom: '1rem' }}>Admin Tools & Actions</h2>
        {statsError && <p role="alert">Review links could not be loaded. <button type="button" className="text-link" onClick={() => { setStatsLoading(true); setStatsError(false); setStatsAttempt(value => value + 1); }}>Try again</button></p>}
        <div className="nav-grid mb-2">
          {[[stats.new_jobs_url, 'Review New Job Opportunities', FaBriefcase], [stats.new_seekers_url, 'Review New Job Seekers', FaUserTie]].map(([url, title, Icon]) => url && url !== '#' ? <a key={title} href={url} target="_blank" rel="noopener noreferrer" className="nav-card"><Icon /><h3>{title}</h3><span>Open review spreadsheet (new tab)</span></a> : <button key={title} type="button" className="nav-card" disabled><Icon /><h3>{title}</h3><span>{statsLoading ? 'Loading...' : 'Review link unavailable'}</span></button>)}

          {/* Card 3: Update jobBank jobSeeker information */}
          <button
            type="button"
            onClick={handleUpdateJobSeekerInfo}
            disabled={updating}
            className="nav-card"
            style={{ opacity: updating ? 0.7 : 1 }}
          >
            <FaSync className={updating ? 'spin' : ''} />
            <h3>{updating ? 'Updating jobBank info...' : 'Update jobBank jobSeeker information'}</h3>
          </button>

          <button type="button" className="nav-card" disabled={importing} onClick={() => importInput.current.click()}><FaFileUpload /><h3>{importing ? 'Importing Job Seeker List...' : 'Import current Job Seeker List'}</h3><span>Choose an Excel file (.xlsx)</span></button>
          <input ref={importInput} type="file" accept=".xlsx" onChange={handleImportJobSeekers} disabled={importing} hidden aria-label="Import current Job Seeker List" />

          {/* Card 5: Export Jobs from JSearch */}
          <button
            type="button"
            onClick={handleExportJSearchJobs}
            disabled={exporting}
            className="nav-card"
            style={{ opacity: exporting ? 0.7 : 1 }}
          >
            <FaCloudDownloadAlt className={exporting ? 'spin' : ''} />
            <h3>{exporting ? 'Exporting Jobs (JSearch & Companies)...' : 'Export Jobs (JSearch & Featured Companies)'}</h3>
          </button>

          {/* Card 6: Sync JobSeeker CSV to Google Drive */}
          <button
            type="button"
            onClick={handleSyncJobSeekersCsv}
            disabled={syncingCsv}
            className="nav-card"
            style={{ opacity: syncingCsv ? 0.7 : 1 }}
          >
            <FaSync className={syncingCsv ? 'spin' : ''} />
            <h3>{syncingCsv ? 'Importing SharePoint CSV...' : 'Import SharePoint CSV from Drive'}</h3>
          </button>
        </div>

        {/* Operation Status Feedback */}
        {(updateStatus || importStatus || exportStatus || syncCsvStatus) && (
          <div style={{ marginTop: '1rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            <p style={{
              fontSize: '1rem',
              fontWeight: 500,
              color: (updateStatus?.success || importStatus?.success || syncCsvStatus?.success || (exportStatus?.success && !exportStatus?.jsearch_limit_exceeded)) ? 'var(--success)' : 'var(--error)',
              margin: 0
            }}>
              {updateStatus ? updateStatus.message : importStatus ? importStatus.message : exportStatus ? exportStatus.message : syncCsvStatus.message}
            </p>
            {exportStatus?.warning && (
              <p style={{ fontSize: '0.9rem', color: '#e67e22', fontWeight: 600, marginTop: '0.5rem' }}>
                ⚠️ {exportStatus.warning}
              </p>
            )}
            {importStatus?.success && importStatus?.url && (
              <div style={{ marginTop: '0.75rem' }}>
                <a
                  href={importStatus.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn secondary-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: 'auto',
                    padding: '0.5rem 1.25rem',
                    fontSize: '0.85rem',
                    background: 'var(--surface)',
                    borderColor: 'var(--primary-color)',
                    color: 'var(--primary-color)'
                  }}
                >
                  Open Merged Seeker Spreadsheet <FaExternalLinkAlt style={{ fontSize: '0.75rem' }} />
                </a>
              </div>
            )}
            {exportStatus?.url && (
              <div style={{ marginTop: '0.75rem' }}>
                <a
                  href={exportStatus.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn secondary-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: 'auto',
                    padding: '0.5rem 1.25rem',
                    fontSize: '0.85rem',
                    background: 'var(--surface)',
                    borderColor: 'var(--primary-color)',
                    color: 'var(--primary-color)'
                  }}
                >
                  Open Job Postings Sheet <FaExternalLinkAlt style={{ fontSize: '0.75rem' }} />
                </a>
              </div>
            )}
            {syncCsvStatus?.url && (
              <div style={{ marginTop: '0.75rem' }}>
                <a
                  href={syncCsvStatus.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn secondary-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: 'auto',
                    padding: '0.5rem 1.25rem',
                    fontSize: '0.85rem',
                    background: 'rgba(255,255,255,0.8)',
                    borderColor: 'var(--primary-color)',
                    color: 'var(--primary-color)'
                  }}
                >
                  Open JobSeeker List Google Drive Sheet <FaExternalLinkAlt style={{ fontSize: '0.75rem' }} />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Actions Footer */}
        <div className="actions mt-2 text-center" style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <button
            type="button"
            className="btn secondary-btn"
            style={{ maxWidth: '350px' }}
            onClick={() => navigate('/employment-dashboard')}
          >
            Back to Employment Center Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
