import React, { useEffect } from 'react';
import { Box, Text, useApp } from 'ink';
import type { SubscriptionData, PaygData, FlowRateData } from '../lib/api';

export interface AccountResult {
  name: string;
  isActive: boolean;
  sub: SubscriptionData | null;
  payg: PaygData | null;
  fr: FlowRateData | null;
  subError: string | null;
  paygError: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  healthy: 'green',
  monitored: 'yellow',
  abusive: 'red',
  suspended: 'red',
  banned: 'red',
};

function formatResetIn(isoDate: string): string {
  const diff = new Date(isoDate).getTime() - Date.now();
  if (diff <= 0) return 'now';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function ProgressBar({ pct }: { pct: number }) {
  const filled = Math.round(Math.min(pct, 1) * 20);
  return (
    <Text>
      <Text color="cyan">{'█'.repeat(filled)}</Text>
      <Text color="gray">{'░'.repeat(20 - filled)}</Text>
    </Text>
  );
}

function AccountCard({ name, isActive, sub, payg, fr, subError, paygError }: AccountResult) {
  const tier = sub ? sub.plan.tier.charAt(0).toUpperCase() + sub.plan.tier.slice(1) : '';
  const statusColor = sub ? (STATUS_COLORS[sub.account_status] ?? 'white') : 'white';
  const flowRate = fr ? fr.effective_usd_per_flow : sub?.effective_usd_per_flow;

  return (
    <Box
      borderStyle="round"
      borderColor={isActive ? 'green' : 'gray'}
      flexDirection="column"
      paddingX={1}
      marginBottom={1}
    >
      {/* ── Header ── */}
      <Box>
        <Text color={isActive ? 'green' : 'gray'}>{isActive ? '● ' : '○ '}</Text>
        <Text bold>{name}</Text>
        {isActive && <Text dimColor> (active)</Text>}
      </Box>

      {subError ? (
        <Text color="red">subscription unavailable: {subError}</Text>
      ) : sub ? (
        <>
          {/* Plan line */}
          <Box>
            <Text color="cyan">ZenMux {tier}</Text>
            <Text color="gray">  ·  {sub.quota_5_hour.max_flows} Flows/5h  ·  </Text>
            <Text color={statusColor}>[{sub.account_status}]</Text>
          </Box>

          {/* Billing line */}
          <Box>
            {sub.quota_monthly.max_value_usd ? (
              <>
                <Text color="gray">Worth </Text>
                <Text bold color="white">${sub.quota_monthly.max_value_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo</Text>
                <Text color="gray">  ·  </Text>
              </>
            ) : null}
            <Text color="gray">${sub.plan.amount_usd}/month  ·  Renews {formatDate(sub.plan.expires_at)}</Text>
          </Box>

          {/* ── Three columns ── */}
          <Box marginTop={1}>
            {/* 5-Hour Window */}
            <Box flexDirection="column" marginRight={4}>
              <Text bold>5-Hour Window</Text>
              <Text dimColor>Resets in {formatResetIn(sub.quota_5_hour.resets_at)}</Text>
              <ProgressBar pct={sub.quota_5_hour.usage_percentage} />
              <Text>
                <Text color="yellow">{(sub.quota_5_hour.usage_percentage * 100).toFixed(2)}%</Text>
                <Text color="gray">  {sub.quota_5_hour.used_flows.toFixed(1)} / {sub.quota_5_hour.max_flows} flows</Text>
              </Text>
            </Box>

            {/* Current Week */}
            <Box flexDirection="column" marginRight={4}>
              <Text bold>Current Week</Text>
              <Text dimColor>Resets {formatDate(sub.quota_7_day.resets_at)}</Text>
              <ProgressBar pct={sub.quota_7_day.usage_percentage} />
              <Text>
                <Text color="yellow">{(sub.quota_7_day.usage_percentage * 100).toFixed(2)}%</Text>
                <Text color="gray">  {sub.quota_7_day.used_flows.toFixed(1)} / {sub.quota_7_day.max_flows} flows</Text>
              </Text>
            </Box>

            {/* PAYG + Flow */}
            <Box flexDirection="column">
              <Text bold>PAYG Balance</Text>
              {paygError ? (
                <Text color="red">unavailable</Text>
              ) : payg ? (
                <>
                  <Text bold color="white">${payg.total_credits.toFixed(2)}</Text>
                  <Text dimColor>top-up  ${payg.top_up_credits.toFixed(2)}</Text>
                  <Text dimColor>bonus   ${payg.bonus_credits.toFixed(2)}</Text>
                </>
              ) : null}
              {flowRate !== undefined && (
                <Text dimColor>${flowRate} / Flow</Text>
              )}
            </Box>
          </Box>
        </>
      ) : null}
    </Box>
  );
}

export function StatusDisplay({ results }: { results: AccountResult[] }) {
  const { exit } = useApp();

  useEffect(() => {
    exit();
  }, []);

  return (
    <Box flexDirection="column">
      {results.map((r) => (
        <AccountCard key={r.name} {...r} />
      ))}
    </Box>
  );
}
