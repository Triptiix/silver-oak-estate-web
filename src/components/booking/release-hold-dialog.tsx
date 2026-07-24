"use client";

import { useEffect, useRef } from "react";

type ReleaseHoldDialogProps = {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isReleasing: boolean;
  error?: string | null;
};

export function ReleaseHoldDialog({ isOpen, onConfirm, onCancel, isReleasing, error }: ReleaseHoldDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      if (!isReleasing) {
        onCancel();
      }
    };

    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onCancel, isReleasing]);

  if (!isOpen) return null;

  return (
    <dialog 
      ref={dialogRef}
      className="backdrop:bg-slate-900/50 p-0 rounded-lg shadow-xl border border-slate-200 w-full max-w-md"
    >
      <div className="p-6">
        <h3 className="text-lg font-medium text-slate-900 mb-2">Release Hold?</h3>
        <p className="text-slate-600 mb-6">
          Are you sure you want to release this date? It will immediately become available for others to book.
        </p>
        
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isReleasing}
            className="px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 rounded-md transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isReleasing}
            className="px-4 py-2 font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"
          >
            {isReleasing ? "Releasing..." : "Release Hold"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
