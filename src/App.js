import { useState, useEffect, useCallback } from "react";
import { db } from "./firebase";
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { Send, Trash2, Sparkles } from "lucide-react";

function App() {
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([]);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");

  // Format time - super compact
  const formatTime = useCallback((timestamp) => {
    if (!timestamp) return "now";
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return date.toLocaleDateString();
  }, []);

  // Real-time notes
  useEffect(() => {
    const q = query(collection(db, "notes"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotes(notesData);
    });
    return () => unsubscribe();
  }, []);

  // Add global styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        background: #f5efe7;
        font-family: 'Courier New', monospace;
      }
      
      button {
        cursor: pointer;
        background: none;
        border: none;
      }
      
      ::-webkit-scrollbar {
        width: 4px;
      }
      
      ::-webkit-scrollbar-track {
        background: #e8e0d5;
      }
      
      ::-webkit-scrollbar-thumb {
        background: #d4c9bc;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, []);

  // INSTANT SAVE - appears immediately
  const saveNote = useCallback(async () => {
    if (!note.trim()) {
      setError("write something");
      setTimeout(() => setError(""), 1500);
      return;
    }

    const noteText = note.trim();
    const tempId = Date.now().toString();
    const timestamp = new Date();
    
    // INSTANT: Add to UI immediately
    setNotes(prev => [{
      id: tempId,
      text: noteText,
      timestamp: timestamp,
    }, ...prev]);
    
    setNote(""); // Clear input instantly
    setSavingId(tempId);
    setError("");
    
    // Background save
    try {
      const docRef = await addDoc(collection(db, "notes"), {
        text: noteText,
        timestamp: timestamp,
      });
      // Update the temp note with real ID
      setNotes(prev => prev.map(n => 
        n.id === tempId ? { ...n, id: docRef.id } : n
      ));
    } catch (err) {
      // Remove failed note
      setNotes(prev => prev.filter(n => n.id !== tempId));
      setError("failed");
      setTimeout(() => setError(""), 1500);
    } finally {
      setSavingId(null);
    }
  }, [note]);

  const deleteNote = useCallback(async (id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    try {
      await deleteDoc(doc(db, "notes", id));
    } catch (err) {
      console.error("Delete failed");
    }
  }, []);

  const handleKey = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveNote();
    }
  }, [saveNote]);

  // Styles object
  const styles = {
    container: {
      minHeight: "100vh",
      background: "#f5efe7",
      display: "flex",
      justifyContent: "center",
      padding: "20px",
    },
    content: {
      width: "100%",
      maxWidth: "600px",
      background: "#faf7f2",
    },
    header: {
      padding: "30px 20px 20px",
      textAlign: "center",
      borderBottom: "1px solid #e8e0d5",
    },
    title: {
      fontSize: "1.8rem",
      fontWeight: "normal",
      color: "#4a3b2c",
      marginTop: "8px",
      letterSpacing: "-0.5px",
      fontFamily: "'Courier New', monospace",
    },
    inputArea: {
      padding: "20px",
      display: "flex",
      gap: "10px",
      borderBottom: "1px solid #e8e0d5",
    },
    input: {
      flex: 1,
      padding: "10px 12px",
      fontSize: "14px",
      border: "1px solid #e0d5c8",
      background: "white",
      fontFamily: "'Courier New', monospace",
      outline: "none",
    },
    sendBtn: {
      width: "40px",
      background: "#e8e0d5",
      border: "1px solid #d4c9bc",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.2s",
    },
    error: {
      margin: "0 20px 10px",
      padding: "8px",
      background: "#fee",
      color: "#c66",
      fontSize: "12px",
      textAlign: "center",
      border: "1px solid #fcc",
      fontFamily: "'Courier New', monospace",
    },
    list: {
      padding: "20px",
      maxHeight: "calc(100vh - 220px)",
      overflowY: "auto",
    },
    empty: {
      textAlign: "center",
      padding: "60px 20px",
      color: "#b5a68f",
      fontFamily: "'Courier New', monospace",
    },
    note: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      padding: "12px 0",
      borderBottom: "1px solid #f0e8df",
    },
    noteContent: {
      flex: 1,
    },
    noteText: {
      fontSize: "14px",
      color: "#4a3b2c",
      lineHeight: "1.4",
      marginBottom: "6px",
      wordBreak: "break-word",
      fontFamily: "'Courier New', monospace",
    },
    dot: {
      marginLeft: "6px",
      fontSize: "12px",
      color: "#b5a68f",
      animation: "pulse 1s infinite",
      display: "inline-block",
    },
    time: {
      fontSize: "10px",
      color: "#cbc1b2",
      textTransform: "uppercase",
      fontFamily: "'Courier New', monospace",
    },
    delete: {
      padding: "4px",
      opacity: 0.6,
      transition: "opacity 0.2s",
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <Sparkles size={24} color="#8b7355" />
          <h1 style={styles.title}>notes</h1>
        </div>

        {/* Input */}
        <div style={styles.inputArea}>
          <input
            type="text"
            placeholder="write something..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyPress={handleKey}
            style={styles.input}
          />
          <button onClick={saveNote} style={styles.sendBtn}>
            <Send size={18} color="#4a3b2c" />
          </button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {/* Comments List */}
        <div style={styles.list}>
          {notes.length === 0 ? (
            <div style={styles.empty}>
              <p>✨ no notes yet</p>
              <small>write something above</small>
            </div>
          ) : (
            notes.map((item) => (
              <div key={item.id} style={styles.note}>
                <div style={styles.noteContent}>
                  <p style={styles.noteText}>
                    {item.text}
                    {savingId === item.id && <span style={styles.dot}>●</span>}
                  </p>
                  <span style={styles.time}>{formatTime(item.timestamp)}</span>
                </div>
                <button 
                  onClick={() => deleteNote(item.id)} 
                  style={styles.delete}
                  disabled={savingId === item.id}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                >
                  <Trash2 size={14} color="#d4c9bc" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;