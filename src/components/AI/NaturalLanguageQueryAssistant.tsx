import React, { useState } from 'react';
import { NaturalLanguageQueryResult } from '../../types';
import { Bot, Sparkles, Send, Table, ArrowRight, RefreshCw } from 'lucide-react';

export const NaturalLanguageQueryAssistant: React.FC = () => {
  const [queryInput, setQueryInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<NaturalLanguageQueryResult | null>(null);

  const PRESET_QUERIES = [
    'Show pending applications in Northern region older than 10 days',
    'Which statutory documents expire in the next 30 days?',
    'List all applications with EVC inspections scheduled',
    'Show regional pendency bottleneck summary across all desks',
  ];

  const handleRunQuery = async (queryToRun: string) => {
    if (!queryToRun.trim()) return;
    setIsLoading(true);
    setQueryResult(null);

    try {
      const res = await fetch('/api/ai/nl-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryToRun }),
      });

      const data = await res.json();
      if (res.ok) {
        setQueryResult(data.result);
      }
    } catch (err) {
      console.error('NL Query execution error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleRunQuery(queryInput);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm transition-colors flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span>Natural Language Reporting &amp; Intelligence Assistant</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Query statutory application pendencies, EVC queues, and document expirations in plain English.
          </p>
        </div>
        <span className="text-xs bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-500/30 font-semibold hidden sm:inline-block">
          Gemini 3.8 Flash
        </span>
      </div>

      {/* Query Search Form & Presets */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm transition-colors space-y-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            required
            placeholder="Ask anything (e.g. 'Which applications in North region are past SLA target?')..."
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 font-medium"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center space-x-2 shrink-0"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Execute Query</span>
              </>
            )}
          </button>
        </form>

        {/* Presets */}
        <div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-2">Suggested Statutory Analytical Queries:</span>
          <div className="flex flex-wrap gap-2">
            {PRESET_QUERIES.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setQueryInput(q);
                  handleRunQuery(q);
                }}
                className="text-[11px] bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition flex items-center space-x-1"
              >
                <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                <span>{q}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Query Result Card */}
      {queryResult && (
        <div className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/60 rounded-2xl p-6 shadow-xl space-y-5 animate-fadeIn">
          
          {/* Intent Header */}
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center space-x-2 text-purple-700 dark:text-purple-400 text-xs font-bold mb-1">
              <Sparkles className="w-4 h-4" />
              <span>INTERPRETED QUERY INTENT</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{queryResult.interpretedIntent}</p>
          </div>

          {/* AI Analytical Summary */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
            {queryResult.summaryText}
          </div>

          {/* Metric KPI Cards */}
          {queryResult.metrics && queryResult.metrics.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {queryResult.metrics.map((m, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{m.label}</div>
                  <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">{m.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Data Table Results */}
          {queryResult.dataRows && queryResult.dataRows.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-3 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-900 dark:text-white flex items-center space-x-2">
                <Table className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Structured Result Records ({queryResult.dataRows.length})</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Title / Record</th>
                      <th className="p-3">Region</th>
                      <th className="p-3">Stage / Status</th>
                      <th className="p-3">Days Pending</th>
                      <th className="p-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                    {queryResult.dataRows.map((row, i) => (
                      <tr key={i} className="hover:bg-white dark:hover:bg-slate-900/50 transition">
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">{row.title}</td>
                        <td className="p-3 text-slate-500 dark:text-slate-400">{row.region}</td>
                        <td className="p-3">
                          <span className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded text-[11px] border border-slate-300 dark:border-slate-700">
                            {row.stageOrStatus}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">{row.daysPending || 0}d</td>
                        <td className="p-3 text-slate-500 dark:text-slate-400 text-[11px] max-w-xs truncate">{row.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Suggested Followups */}
          {queryResult.suggestedFollowups && queryResult.suggestedFollowups.length > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-2">Suggested Analytical Follow-up Queries:</span>
              <div className="flex flex-wrap gap-2">
                {queryResult.suggestedFollowups.map((f, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setQueryInput(f);
                      handleRunQuery(f);
                    }}
                    className="text-[11px] bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-lg border border-amber-300 dark:border-amber-500/20 hover:border-amber-500/40 transition flex items-center space-x-1"
                  >
                    <span>{f}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
