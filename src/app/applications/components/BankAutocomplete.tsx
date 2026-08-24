'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/Input';
import { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { WorkspaceFormValues } from '@/lib/validations/workspaceSchema';

interface BankDict {
  id: string;
  bankName: string;
  branchName: string | null;
  swiftCode: string | null;
  address: string | null;
}

interface BankAutocompleteProps {
  index: number;
  disabled: boolean;
  register: UseFormRegister<WorkspaceFormValues>;
  setValue: UseFormSetValue<WorkspaceFormValues>;
  watch: UseFormWatch<WorkspaceFormValues>;
}

export function BankAutocomplete({ 
  index, 
  disabled,
  register,
  setValue,
  watch
}: BankAutocompleteProps) {
  const [query, setQuery] = useState(watch(`bankAccounts.${index}.bankName` as any) || '');
  const [results, setResults] = useState<BankDict[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const country = watch(`bankAccounts.${index}.bankCountry` as any);

  useEffect(() => {
    // Sync external changes (e.g. OCR)
    const val = watch(`bankAccounts.${index}.bankName` as any);
    if (val && val !== query) {
      setQuery(val);
    }
  }, [watch(`bankAccounts.${index}.bankName` as any)]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchBanks = async (q: string = '') => {
    try {
      const res = await fetch(`/api/banks?q=${encodeURIComponent(q)}&country=${country || 'VIETNAM'}`);
      const data = await res.json();
      if (data.success) {
        setResults(data.data);
        setIsOpen(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setValue(`bankAccounts.${index}.bankName` as any, val, { shouldDirty: true });
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchBanks(val);
    }, 250);
  };

  const selectBank = (bank: BankDict) => {
    setQuery(bank.bankName);
    setIsOpen(false);
    setValue(`bankAccounts.${index}.bankName` as any, bank.bankName, { shouldDirty: true });
    if (bank.branchName) setValue(`bankAccounts.${index}.branchName` as any, bank.branchName, { shouldDirty: true });
    if (bank.swiftCode) setValue(`bankAccounts.${index}.swiftCode` as any, bank.swiftCode, { shouldDirty: true });
    if (bank.address) setValue(`bankAccounts.${index}.bankBranchAddress` as any, bank.address, { shouldDirty: true });
  };

  return (
    <div className="relative" ref={containerRef}>
      <Input 
        value={query}
        onChange={handleInputChange}
        onFocus={() => { fetchBanks(query); }}
        disabled={disabled}
        className="h-8 py-0.5 text-xs w-full pr-7"
        placeholder="Gõ tìm hoặc chọn ngân hàng trong danh sách..." 
        autoComplete="off"
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onClick={() => {
          if (!isOpen) {
            fetchBanks(query);
          } else {
            setIsOpen(false);
          }
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
      >
        <span className="text-[10px] select-none">▼</span>
      </button>

      {isOpen && results.length > 0 && !disabled && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100">
          <div className="px-2.5 py-1 bg-slate-50 text-[10px] font-semibold text-slate-500 uppercase tracking-wider sticky top-0 border-b border-slate-200/70 z-10 flex justify-between items-center">
            <span>Danh sách ngân hàng ({results.length})</span>
            <span className="text-[9px] text-slate-400 font-normal">Nhấp để chọn & tự điền SWIFT</span>
          </div>
          {results.map(b => (
            <div 
              key={b.id} 
              onClick={() => selectBank(b)}
              className="px-3 py-2 hover:bg-indigo-50/80 cursor-pointer text-xs transition-colors flex items-center justify-between gap-2"
            >
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-800 truncate">{b.bankName}</div>
                {b.branchName && <div className="text-[10px] text-slate-500 truncate">Chi nhánh: {b.branchName}</div>}
              </div>
              {b.swiftCode && (
                <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded shrink-0">
                  SWIFT: {b.swiftCode}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
