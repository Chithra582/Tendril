import React, { useState } from 'react';
import {
  Folder,
  FileText,
  Upload,
  Plus,
  Trash2,
  Eye,
  Shield,
  Hash,
  Database,
  X,
  CheckCircle2,
  FileCode,
  File
} from 'lucide-react';
import { VAULTS, DocumentItem, VaultCategory } from '../engine/sample-vaults';
import { MossRetrievalEngine } from '../engine/moss-engine';
import { DocumentChunk } from '../engine/content-extractor';

interface Props {
  activeVaultId: string;
  onSelectVault: (vaultId: string) => void;
  onDocumentCountChange?: () => void;
}

export const DocumentVaultManager: React.FC<Props> = ({
  activeVaultId,
  onSelectVault,
  onDocumentCountChange,
}) => {
  const engine = MossRetrievalEngine.getInstance();
  const [documents, setDocuments] = useState<DocumentItem[]>(engine.getAllDocuments());
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [selectedDocChunks, setSelectedDocChunks] = useState<DocumentChunk[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Custom Note');
  const [newSensitivity, setNewSensitivity] = useState<'Confidential' | 'Internal' | 'Public' | 'Restricted'>('Confidential');

  const filteredDocs =
    activeVaultId === 'all'
      ? documents
      : documents.filter((d) => d.vaultId === activeVaultId);

  const handleInspectDoc = (doc: DocumentItem) => {
    setSelectedDoc(doc);
    const chunks = engine.getChunksByVault(doc.vaultId).filter((c) => c.docId === doc.id);
    setSelectedDocChunks(chunks);
  };

  const handleDeleteDoc = (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    engine.deleteDocument(docId);
    setDocuments(engine.getAllDocuments());
    onDocumentCountChange?.();
  };

  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const targetVault = activeVaultId === 'all' ? 'yc-rfs-2026' : activeVaultId;
    const newDoc: DocumentItem = {
      id: `doc-custom-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      vaultId: targetVault,
      filename: `${newTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}.md`,
      content: newContent.trim(),
      tags: ['user-upload', 'local-first', 'custom'],
      updatedAt: new Date().toISOString().split('T')[0],
      sensitivity: newSensitivity,
    };

    engine.addDocument(newDoc);
    setDocuments(engine.getAllDocuments());
    onDocumentCountChange?.();

    // Reset form
    setNewTitle('');
    setNewContent('');
    setIsAddModalOpen(false);

    // Notify telemetry of local indexing event (0 bytes egress)
    fetch('/api/telemetry/local-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'LOCAL_INDEX',
        queryPreview: `Indexed local doc: ${newDoc.filename}`,
      }),
    }).catch(() => {});
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const targetVault = activeVaultId === 'all' ? 'yc-rfs-2026' : activeVaultId;
      const uploadedDoc: DocumentItem = {
        id: `upload-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        category: 'Uploaded File',
        vaultId: targetVault,
        filename: file.name,
        content: text,
        tags: ['file-upload', file.name.split('.').pop() || 'doc'],
        updatedAt: new Date().toISOString().split('T')[0],
        sensitivity: 'Confidential',
      };

      engine.addDocument(uploadedDoc);
      setDocuments(engine.getAllDocuments());
      onDocumentCountChange?.();

      fetch('/api/telemetry/local-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'LOCAL_INDEX',
          queryPreview: `Indexed uploaded file: ${uploadedDoc.filename}`,
        }),
      }).catch(() => {});
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-[#121814] border border-[#233327] rounded-xl p-5 shadow-lg flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center">
            <Folder className="w-4 h-4 mr-2 text-emerald-400" />
            Isolated Multi-Index Vaults
          </h3>
          <p className="text-xs text-slate-400">
            PRD Section 5.1: Multi-index separation guarantees strict privacy boundaries
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <label className="cursor-pointer flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a251e] hover:bg-[#233327] text-slate-200 border border-[#2e4032] text-xs transition-colors">
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Upload File</span>
            <input
              type="file"
              accept=".txt,.md,.json,.ts,.py"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-semibold text-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Doc</span>
          </button>
        </div>
      </div>

      {/* Vault Category Pills */}
      <div className="flex space-x-1.5 overflow-x-auto pb-2 mb-3">
        <button
          onClick={() => onSelectVault('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
            activeVaultId === 'all'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
              : 'bg-[#162119] text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>All Vaults ({documents.length})</span>
        </button>

        {VAULTS.map((vault) => {
          const count = documents.filter((d) => d.vaultId === vault.id).length;
          return (
            <button
              key={vault.id}
              onClick={() => onSelectVault(vault.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
                activeVaultId === vault.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                  : 'bg-[#162119] text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <span>{vault.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 text-slate-400">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[380px]">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            onClick={() => handleInspectDoc(doc)}
            className="p-3 rounded-lg bg-[#162119]/70 hover:bg-[#1c2920] border border-[#233327] hover:border-emerald-500/40 transition-all cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-start space-x-3 overflow-hidden">
              <div className="p-2 rounded bg-[#101712] border border-[#233327] text-emerald-400 flex-shrink-0 mt-0.5">
                {doc.filename.endsWith('.md') ? (
                  <FileText className="w-4 h-4" />
                ) : (
                  <FileCode className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="text-xs font-medium text-slate-200 truncate group-hover:text-emerald-300">
                    {doc.title}
                  </h4>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                      doc.sensitivity === 'Restricted'
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-800/40'
                        : doc.sensitivity === 'Confidential'
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-800/40'
                        : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40'
                    }`}
                  >
                    {doc.sensitivity}
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-[10px] text-slate-400 mt-1 font-mono">
                  <span>{doc.filename}</span>
                  <span>•</span>
                  <span>{doc.category}</span>
                  <span>•</span>
                  <span>{doc.updatedAt}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleInspectDoc(doc);
                }}
                className="p-1.5 text-slate-400 hover:text-emerald-400 rounded"
                title="Inspect Chunks & Embeddings"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => handleDeleteDoc(doc.id, e)}
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded"
                title="Delete Document"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Document Inspector Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#111713] border border-[#233327] rounded-xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => setSelectedDoc(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 rounded bg-emerald-950 border border-emerald-500/30 text-emerald-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">{selectedDoc.title}</h3>
                <p className="text-xs text-slate-400 font-mono">
                  {selectedDoc.filename} • {selectedDoc.vaultId} • {selectedDocChunks.length} Semantic Chunks
                </p>
              </div>
            </div>

            {/* Chunks Tabs */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Extracted Semantic Chunks (Moss On-Device Vector Index)
              </div>

              {selectedDocChunks.map((chunk, idx) => (
                <div
                  key={chunk.id}
                  className="p-3 rounded-lg bg-[#162119] border border-[#233327] text-xs font-mono"
                >
                  <div className="flex justify-between items-center text-[10px] text-emerald-400/90 mb-1.5">
                    <span>
                      Chunk #{idx + 1} ({chunk.text.length} chars)
                    </span>
                    <span className="text-slate-400">{chunk.heading || 'Main Body'}</span>
                  </div>
                  <p className="text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">
                    {chunk.text}
                  </p>
                  <div className="mt-2 pt-2 border-t border-[#233327] flex items-center justify-between text-[10px] text-slate-500">
                    <span>Embedding: 128-dim Normalized Dense Vector</span>
                    <span className="text-emerald-400 flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Ready for Sub-10ms Retrieval
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-[#233327] flex justify-end">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-1.5 bg-[#233327] hover:bg-[#344c3b] text-slate-200 rounded text-xs transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Document Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#111713] border border-[#233327] rounded-xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-semibold text-white mb-1">Index New Local Document</h3>
            <p className="text-xs text-slate-400 mb-4">
              Content is chunked, embedded, and stored locally with zero external network traffic.
            </p>

            <form onSubmit={handleCreateDocument} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Series A Term Sheet Clause"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#162119] border border-[#233327] text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Category</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#162119] border border-[#233327] text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Sensitivity Tier</label>
                  <select
                    value={newSensitivity}
                    onChange={(e: any) => setNewSensitivity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#162119] border border-[#233327] text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Confidential">Confidential</option>
                    <option value="Restricted">Restricted</option>
                    <option value="Internal">Internal</option>
                    <option value="Public">Public</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Document Content</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Paste Markdown or text here..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#162119] border border-[#233327] text-white focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-[#1a251e] text-slate-300 hover:bg-[#233327]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-semibold"
                >
                  Index Document (0 B)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
