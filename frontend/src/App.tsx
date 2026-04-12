import React, { useState, useEffect, useCallback } from 'react';
import { DamlLedger, useParty, useStreamQueries, useLedger } from '@c7/react';
import { VestingSchedule } from '@daml.js/canton-token-vesting-0.1.0/lib/Vesting';
import { ContractId } from '@daml/types';
import { claimVestedTokens, revokeVesting } from './vestingService';
import { httpUrl, wsUrl } from './ledgerClient';
import './App.css';

const lsKey = "canton-vesting-app-credentials";

type Credentials = {
  party: string;
  token: string;
}

/**
 * Calculates the vested amount at a given point in time.
 * This logic should mirror the logic in the Daml smart contract.
 */
const calculateVestedAmount = (schedule: VestingSchedule, now: Date): number => {
  const { totalAllocation, startDate, cliffDate, endDate } = schedule;

  const start = new Date(startDate).getTime();
  const cliff = new Date(cliffDate).getTime();
  const end = new Date(endDate).getTime();
  const nowTime = now.getTime();

  if (nowTime < cliff) {
    return 0.0;
  }
  if (nowTime >= end) {
    return parseFloat(totalAllocation);
  }

  const duration = end - start;
  // Avoid division by zero if start and end are the same
  if (duration <= 0) {
    return parseFloat(totalAllocation);
  }

  const elapsed = nowTime - start;
  const vestedRatio = elapsed / duration;
  const vestedRaw = parseFloat(totalAllocation) * vestedRatio;

  // Ensure vested amount doesn't exceed total allocation due to floating point math
  return Math.min(vestedRaw, parseFloat(totalAllocation));
};

const formatAmount = (amount: string | number): string => {
  return parseFloat(amount.toString()).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const VestingScheduleCard: React.FC<{ contract: { contractId: ContractId<VestingSchedule>, payload: VestingSchedule } }> = ({ contract }) => {
  const { contractId, payload } = contract;
  const { grantor, beneficiary, token, totalAllocation, claimedAmount, startDate, cliffDate, endDate } = payload;
  const ledger = useLedger();
  const party = useParty();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const vestedAmount = calculateVestedAmount(payload, currentTime);
  const claimableAmount = vestedAmount - parseFloat(claimedAmount);
  const isGrantor = party === grantor;

  const handleClaim = async () => {
    setIsBusy(true);
    setError(null);
    try {
      await claimVestedTokens(ledger, contractId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred during claim.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleRevoke = async () => {
    setIsBusy(true);
    setError(null);
    try {
      await revokeVesting(ledger, contractId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred during revocation.");
    } finally {
      setIsBusy(false);
    }
  };

  const progressPercent = (parseFloat(claimedAmount) / parseFloat(totalAllocation)) * 100;
  const vestedPercent = (vestedAmount / parseFloat(totalAllocation)) * 100;

  return (
    <div className="card">
      <div className="card-header">
        <h3>Vesting Schedule for {beneficiary}</h3>
        <span className="token-symbol">{token.symbol}</span>
      </div>
      <div className="card-body">
        <div className="details-grid">
          <div>Grantor:</div><div>{grantor}</div>
          <div>Beneficiary:</div><div>{beneficiary}</div>
          <div>Total Allocation:</div><div>{formatAmount(totalAllocation)} {token.symbol}</div>
          <div>Claimed Amount:</div><div>{formatAmount(claimedAmount)} {token.symbol}</div>
          <div>Vested Amount:</div><div>{formatAmount(vestedAmount)} {token.symbol}</div>
          <div>Claimable Amount:</div><div className="claimable">{formatAmount(claimableAmount)} {token.symbol}</div>
          <div>Start Date:</div><div>{formatDate(startDate)}</div>
          <div>Cliff Date:</div><div>{formatDate(cliffDate)}</div>
          <div>End Date:</div><div>{formatDate(endDate)}</div>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar-vested" style={{ width: `${vestedPercent}%` }}></div>
          <div className="progress-bar-claimed" style={{ width: `${progressPercent}%` }}></div>
          <div className="progress-bar-labels">
            <span>Vested: {vestedPercent.toFixed(2)}%</span>
            <span>Claimed: {progressPercent.toFixed(2)}%</span>
          </div>
        </div>
      </div>
      <div className="card-footer">
        {error && <div className="error-message">{error}</div>}
        <div className="actions">
          <button
            onClick={handleClaim}
            disabled={isBusy || claimableAmount <= 0.0001}
            className="button-primary"
          >
            {isBusy ? "Claiming..." : "Claim Vested Tokens"}
          </button>
          {isGrantor && (
            <button
              onClick={handleRevoke}
              disabled={isBusy}
              className="button-danger"
            >
              {isBusy ? "Revoking..." : "Revoke"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};


const Dashboard: React.FC = () => {
  const party = useParty();
  const { contracts, loading } = useStreamQueries(VestingSchedule);

  if (loading) {
    return <div className="loading-spinner">Loading vesting schedules...</div>;
  }

  const mySchedules = contracts.filter(c => c.payload.grantor === party || c.payload.beneficiary === party);

  return (
    <div className="dashboard">
      <h1>My Vesting Schedules</h1>
      {mySchedules.length === 0 ? (
        <p>You are not a party to any active vesting schedules.</p>
      ) : (
        <div className="card-container">
          {mySchedules.map(contract => (
            <VestingScheduleCard key={contract.contractId} contract={contract} />
          ))}
        </div>
      )}
    </div>
  );
};

const LoginScreen: React.FC<{ onLogin: (creds: Credentials) => void }> = ({ onLogin }) => {
  const [party, setParty] = useState('');
  const [token, setToken] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (party && token) {
      onLogin({ party, token });
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <h2>Canton Vesting Dashboard</h2>
        <p>Please provide your Party ID and a valid JWT token to continue.</p>
        <div className="form-group">
          <label htmlFor="party">Party ID</label>
          <input
            id="party"
            type="text"
            value={party}
            onChange={(e) => setParty(e.target.value)}
            placeholder="e.g., Alice::1220..."
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="token">Ledger JWT Token</label>
          <input
            id="token"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter your token"
            required
          />
        </div>
        <button type="submit" className="button-primary">Login</button>
      </form>
    </div>
  );
};


const App: React.FC = () => {
  const [credentials, setCredentials] = useState<Credentials | null>(() => {
    const saved = localStorage.getItem(lsKey);
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = useCallback((creds: Credentials) => {
    localStorage.setItem(lsKey, JSON.stringify(creds));
    setCredentials(creds);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem(lsKey);
    setCredentials(null);
  }, []);

  if (!credentials) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <DamlLedger
      token={credentials.token}
      party={credentials.party}
      httpBaseUrl={httpUrl}
      wsBaseUrl={wsUrl}
    >
      <div className="app-container">
        <header className="app-header">
          <h2>Vesting Dashboard</h2>
          <div className="header-info">
            <span>Logged in as: <strong>{credentials.party}</strong></span>
            <button onClick={handleLogout} className="button-secondary">Logout</button>
          </div>
        </header>
        <main className="app-main">
          <Dashboard />
        </main>
      </div>
    </DamlLedger>
  );
};

export default App;