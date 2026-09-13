import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import { FileText, Upload, Trash2, ExternalLink, File, FileImage, ShieldAlert, AlertCircle, FileArchive } from 'lucide-react';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'documents'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDocuments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    setUploadError('');
    setProgress(0);

    try {
      // 1. Upload to Storage
      const storageRef = ref(storage, `documents/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const p = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setProgress(p);
        },
        (error) => {
          console.error("Storage upload failed:", error);
          setUploadError('Failed to upload file to Storage. Please check Firebase Rules.');
          setUploading(false);
        },
        async () => {
          // 2. Get URL and Save Metadata to Firestore
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await addDoc(collection(db, 'documents'), {
            name: file.name,
            type: file.type,
            size: file.size,
            url: downloadURL,
            storagePath: uploadTask.snapshot.ref.fullPath,
            createdAt: serverTimestamp(),
          });
          setUploading(false);
          setProgress(0);
        }
      );
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(error.message);
      setUploading(false);
    }
  };

  const handleDelete = async (docId, storagePath) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    
    try {
      // Delete from Storage
      if (storagePath) {
        const storageRef = ref(storage, storagePath);
        await deleteObject(storageRef);
      }
      // Delete from Firestore
      await deleteDoc(doc(db, 'documents', docId));
    } catch (error) {
      console.error("Delete error:", error);
      alert('Failed to delete document: ' + error.message);
    }
  };

  const getFileIcon = (type) => {
    if (type.includes('image')) return <FileImage size={24} className="text-primary" />;
    if (type.includes('pdf')) return <FileText size={24} className="text-danger" />;
    if (type.includes('zip') || type.includes('rar')) return <FileArchive size={24} className="text-warning" />;
    return <File size={24} className="text-text-muted" />;
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-text-primary">Document Vault</h1>
          <p className="mt-1 text-sm text-text-secondary">Securely store and manage financial documents</p>
        </div>
        
        <div className="relative">
          <input 
            type="file" 
            id="file-upload" 
            className="hidden" 
            onChange={handleFileUpload} 
            disabled={uploading}
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
          />
          <label 
            htmlFor="file-upload" 
            className={`btn-primary gap-2 cursor-pointer inline-flex ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {uploading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Upload size={16} />
            )}
            {uploading ? `Uploading ${progress}%` : 'Upload Document'}
          </label>
        </div>
      </div>

      {uploadError && (
        <div className="flex items-center gap-3 rounded-xl border border-danger/20 bg-danger-soft p-4 text-sm text-danger">
          <AlertCircle size={18} className="shrink-0" />
          <p>{uploadError}</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-xl bg-surface-secondary animate-pulse" />)}
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border-default bg-surface py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-secondary mb-4">
            <ShieldAlert size={32} className="text-text-muted" />
          </div>
          <h3 className="font-semibold text-text-primary">Vault is empty</h3>
          <p className="mt-1 text-sm text-text-secondary max-w-sm">
            Upload loan agreements, KYC documents, and receipts to store them securely.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {documents.map(doc => (
            <div key={doc.id} className="group flex flex-col rounded-xl border border-border-default bg-surface p-5 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-secondary">
                  {getFileIcon(doc.type)}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a 
                    href={doc.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-1.5 text-text-muted hover:text-primary transition-colors rounded-md hover:bg-primary-soft"
                    title="Open Document"
                  >
                    <ExternalLink size={16} />
                  </a>
                  <button 
                    onClick={() => handleDelete(doc.id, doc.storagePath)}
                    className="p-1.5 text-text-muted hover:text-danger transition-colors rounded-md hover:bg-danger-soft"
                    title="Delete Document"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-text-primary truncate" title={doc.name}>{doc.name}</h3>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{doc.type.split('/')[1] || 'FILE'}</p>
                  <p className="text-xs text-text-muted">{formatSize(doc.size)}</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-border-default">
                <p className="text-[10px] text-text-muted">
                  Added {doc.createdAt?.toDate?.() ? doc.createdAt.toDate().toLocaleDateString('en-IN') : 'Just now'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Documents;
