import React, { useState, useEffect, useCallback, CSSProperties } from 'react';
import {
  getActiveVestingAgreements,
  exerciseClaim,
  exerciseRevoke,
  VestingAgreement,
} from './vestingService';

// --- STYLES ---
const styles: { [key: string]: CSSProperties } = {
  container: {
    fontFamily: 'Arial, sans-serif',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    color: '#333',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    borderBottom: '2px solid #eee',
    paddingBottom: '10px',
  },
  title: {
    fontSize: '2em',
    color: '#003366',
  },
  controls: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    marginBottom: '30px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: '5px',
    fontSize: '0.9em',
    fontWeight: 'bold',
  },
  input: {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    width: '250px',
  },
  button: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#00529B',
    color: 'white',
    cursor: 'pointer',
    fontSize: '1em',
    alignSelf: 'flex-end',
  },
  buttonDisabled: {
    backgroundColor: '#aaa',
    cursor: 'not-allowed',
  },
  actionButton: {
    padding: '5px 10px',
    fontSize: '0.9em',
    marginRight: '5px'
  },
  revokeButton: {
    backgroundColor: '#D9534F',
  },
  message: {
    textAlign: 'center',
    padding: '20px',
    fontSize: '1.1em',
    borderRadius: '8px',
  },
  error: {
    backgroundColor: '#f2dede',
    color: '#a94442',
    border: '1px solid #ebccd1',
  },
  loading: {
    color: '#31708f',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
  },
  th: {
    backgroundColor: '#f2f2f2',
    border: '1px solid #ddd',
    padding: '12px',
    textAlign: 'left',
    fontWeight: 'bold',
  },
  td: {
    border: '1px solid #ddd',
    padding: '12px',
  },
  tr: {
    '&:nth-child(even)': {
      backgroundColor: '#f9f9f9',
    },
  },
};

// --- COMPONENT ---
const App: React.FC = () => {
  const [party, setParty] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [agreements, setAgreements] = useState<VestingAgreement[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgreements = useCallback(async () => {
    if (!party || !token) {
      setError("Please provide a Party and Auth Token to view vesting agreements.");
      setAgreements([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fetchedAgreements = await getActiveVestingAgreements(party, token);
      setAgreements(fetchedAgreements);
      if (fetchedAgreements.length === 0) {
        setError("No active vesting agreements found for this party.");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred while fetching data.";
      console.error("Fetch error:", err);
      setError(`Failed to fetch agreements: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [party, token]);

  const handleClaim = async (contractId: string, claimableAmount: string) => {
    if (parseFloat(claimableAmount) <= 0) return;
    try {
      await exerciseClaim(party, token, contractId);
      alert('Claim successful!');
      fetchAgreements(); // Refresh data after action
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error.";
      alert(`Claim failed: ${errorMessage}`);
    }
  };

  const handleRevoke = async (contractId: string) => {
    if (!window.confirm("Are you sure you want to revoke this vesting agreement? This action cannot be undone.")) {
      return;
    }
    try {
      await exerciseRevoke(party, token, contractId);
      alert('Revocation successful!');
      fetchAgreements(); // Refresh data after action
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error.";
      alert(`Revocation failed: ${errorMessage}`);
    }
  };

  const formatNumber = (numStr: string) => {
    return parseFloat(numStr).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Canton Token Vesting Dashboard</h1>
      </header>

      <div style={styles.controls}>
        <div style={styles.inputGroup}>
          <label htmlFor="party-input" style={styles.label}>Party ID</label>
          <input
            id="party-input"
            type="text"
            value={party}
            onChange={(e) => setParty(e.target.value)}
            placeholder="Enter Party ID (e.g., Alice)"
            style={styles.input}
          />
        </div>
        <div style={styles.inputGroup}>
          <label htmlFor="token-input" style={styles.label}>Auth Token (JWT)</label>
          <input
            id="token-input"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter your auth token"
            style={styles.input}
          />
        </div>
        <button
          onClick={fetchAgreements}
          disabled={!party || !token || loading}
          style={{ ...styles.button, ...((!party || !token || loading) && styles.buttonDisabled) }}
        >
          {loading ? 'Loading...' : 'Fetch Agreements'}
        </button>
      </div>

      {error && <div style={{ ...styles.message, ...styles.error }}>{error}</div>}

      {agreements.length > 0 && (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Grantor</th>
              <th style={styles.th}>Grantee</th>
              <th style={styles.th}>Start Date</th>
              <th style={styles.th}>Cliff Date</th>
              <th style={styles.th}>End Date</th>
              <th style={styles.th}>Total Tokens</th>
              <th style={styles.th}>Vested Tokens</th>
              <th style={styles.th}>Claimable Tokens</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {agreements.map(({ contractId, payload }) => {
              const isGrantor = party === payload.grantor;
              const isGrantee = party === payload.grantee;
              const claimable = parseFloat(payload.claimableAmount) > 0;

              return (
                <tr key={contractId} style={styles.tr}>
                  <td style={styles.td}>{payload.grantor}</td>
                  <td style={styles.td}>{payload.grantee}</td>
                  <td style={styles.td}>{payload.schedule.startDate}</td>
                  <td style={styles.td}>{payload.schedule.cliffDate}</td>
                  <td style={styles.td}>{payload.schedule.endDate}</td>
                  <td style={styles.td}>{formatNumber(payload.schedule.totalAmount)}</td>
                  <td style={styles.td}>{formatNumber(payload.vestedAmount)}</td>
                  <td style={styles.td}>{formatNumber(payload.claimableAmount)}</td>
                  <td style={styles.td}>
                    <button
                      onClick={() => handleClaim(contractId, payload.claimableAmount)}
                      disabled={!isGrantee || !claimable}
                      style={{ ...styles.button, ...styles.actionButton, ...((!isGrantee || !claimable) && styles.buttonDisabled) }}
                    >
                      Claim
                    </button>
                    <button
                      onClick={() => handleRevoke(contractId)}
                      disabled={!isGrantor}
                      style={{ ...styles.button, ...styles.actionButton, ...styles.revokeButton, ...(!isGrantor && styles.buttonDisabled) }}
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default App;