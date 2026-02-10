import React, { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { exportIndexedDbBackup, importIndexedDbBackup } from '../db';

interface DataBackupManagerProps {
  onImported: () => Promise<void> | void;
}

export const DataBackupManager: React.FC<DataBackupManagerProps> = ({ onImported }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string>('');
  const [isBusy, setIsBusy] = useState(false);

  const handleExport = async () => {
    setIsBusy(true);
    setStatus('');

    try {
      const backup = await exportIndexedDbBackup();
      const fileName = `grosz-do-grosza-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = fileName;
      link.click();

      URL.revokeObjectURL(url);
      setStatus('Backup został wyeksportowany. Zachowaj plik JSON w bezpiecznym miejscu.');
    } catch (error) {
      console.error('Backup export failed:', error);
      setStatus('Nie udało się wyeksportować backupu. Spróbuj ponownie.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsBusy(true);
    setStatus('');

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await importIndexedDbBackup(parsed);
      await onImported();
      setStatus('Backup został zaimportowany. Dane zostały odtworzone.');
    } catch (error) {
      console.error('Backup import failed:', error);
      setStatus('Import nie powiódł się. Sprawdź format pliku JSON i spróbuj ponownie.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setIsBusy(false);
    }
  };

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">Backup i restore danych</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
        Dane aplikacji są zapisywane lokalnie w IndexedDB. Przed reinstalacją lub czyszczeniem danych przeglądarki
        wykonaj eksport do JSON.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleExport}
          disabled={isBusy}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-60"
        >
          <Download size={16} /> Eksportuj JSON
        </button>

        <button
          onClick={handleImportClick}
          disabled={isBusy}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-800 disabled:opacity-60"
        >
          <Upload size={16} /> Importuj JSON
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleImportFile}
      />

      {status && <p className="mt-4 text-sm text-slate-700 dark:text-slate-300">{status}</p>}
    </section>
  );
};
