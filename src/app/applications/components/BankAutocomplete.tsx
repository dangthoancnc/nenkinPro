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

  const fetchBanks = async (q: string) => {
    if (!q || q.length < 2) {
      setResults([]);
      return;
    }
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
    }, 300);
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
        onFocus={() => { if (results.length > 0) setIsOpen(true); }}
        disabled={disabled}
        className="h-8 py-0.5 text-xs w-full"
        placeholder="Nhập hoặc chọn tên ngân hàng..." 
        autoComplete="off"
      />
      {isOpen && results.length > 0 && !disabled && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
          {results.map(b => (
            <div 
              key={b.id} 
              onClick={() => selectBank(b)}
              className="px-3 py-2 hover:bg-indigo-50 cursor-pointer text-xs border-b last:border-b-0"
            >
              <div className="font-semibold text-slate-800">{b.bankName}</div>
              <div className="text-[10px] text-slate-500 flex gap-2 mt-0.5">
                {b.branchName && <span>CN: {b.branchName}</span>}
                {b.swiftCode && <span>SWIFT: {b.swiftCode}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
