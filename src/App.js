import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { Trash2, Send, Sparkles } from "lucide-react";

function App() {
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // Fetch notes in real-time
  useEffect(() => {
    const q = query(collection(db, "notes"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotes(notesData);
    }, (error) => {
      console.error("Error fetching notes:", error);
      setError("Failed to load notes");
    });

    return () => unsubscribe();
  }, []);

  // Add global styles
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        background-color: #f5efe7;
        font-family: 'Courier New', 'Monaco', 'Menlo', monospace;
      }
      
      input:focus {
        border-color: #c2b5a4 !important;
        outline: none;
      }
      
      button:hover:not(:disabled) {
        background-color: #e8e0d5 !important;
        border-color: #b5a68f !important;
        transform: translateY(-1px);
      }
      
      button:active:not(:disabled) {
        transform: translateY(0px);
      }
      
      .note-card:hover {
        background-color: #fefaf5 !important;
        border-color: #d4c9bc !important;
      }
      
      ::-webkit-scrollbar {
        width: 8px;
      }
      
      ::-webkit-scrollbar-track {
        background: #e8e0d5;
      }
      
      ::-webkit-scrollbar-thumb {
        background: #d4c9bc;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: #c2b5a4;
      }
    `;
    document.head.appendChild(styleSheet);
    
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  const saveNote = async () => {
    if (!note.trim()) {
      setError("Please enter a note");
      return;
    }

    setIsSaving(true);
    setError("");
    
    try {
      await addDoc(collection(db, "notes"), {
        text: note,
        timestamp: new Date(),
      });
      setNote("");
    } catch (error) {
      console.error("Error saving note:", error);
      setError("Failed to save note. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteNote = async (id) => {
    try {
      await deleteDoc(doc(db, "notes", id));
    } catch (error) {
      console.error("Error deleting note:", error);
      setError("Failed to delete note");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveNote();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <Sparkles style={styles.headerIcon} size={32} />
          <h1 style={styles.title}>Notes App</h1>
          <p style={styles.subtitle}>Share your thoughts with the world</p>
        </div>

        {/* Input Section */}
        <div style={styles.inputSection}>
          <div style={styles.inputWrapper}>
            <input
              type="text"
              placeholder="What's on your mind?..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyPress={handleKeyPress}
              style={styles.input}
              disabled={isSaving}
            />
            <button 
              onClick={saveNote} 
              style={{...styles.saveButton, ...(isSaving ? styles.saveButtonDisabled : {})}}
              disabled={isSaving}
            >
              {isSaving ? (
                <div style={styles.spinner} />
              ) : (
                <Send size={20} />
              )}
              <span style={styles.buttonText}>
                {isSaving ? "Saving..." : "Post"}
              </span>
            </button>
          </div>
          
          {error && (
            <div style={styles.errorMessage}>
              {error}
            </div>
          )}
        </div>

        {/* Live Comments Section */}
        <div style={styles.notesSection}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              Live Comments
              {notes.length > 0 && <span style={styles.noteCount}>({notes.length})</span>}
            </h2>
          </div>

          <div style={styles.notesList}>
            {notes.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>💭</div>
                <p style={styles.emptyText}>No comments yet. Be the first to share!</p>
              </div>
            ) : (
              notes.map((note) => (
                <div key={note.id} style={styles.noteCard}>
                  <div style={styles.noteContent}>
                    <div style={styles.noteText}>{note.text}</div>
                    <div style={styles.noteMeta}>
                      <span style={styles.timestamp}>
                        {note.timestamp?.toDate 
                          ? new Date(note.timestamp.toDate()).toLocaleString()
                          : "Just now"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteNote(note.id)}
                    style={styles.deleteButton}
                    title="Delete note"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f5efe7",
    padding: "0",
    margin: "0",
    fontFamily: "'Courier New', 'Monaco', 'Menlo', monospace",
  },
  content: {
    maxWidth: "900px",
    margin: "0 auto",
    backgroundColor: "#faf7f2",
    boxShadow: "none",
    overflow: "visible",
    minHeight: "100vh",
  },
  header: {
    backgroundColor: "#e8e0d5",
    color: "#4a3b2c",
    padding: "60px 30px",
    textAlign: "center",
    borderBottom: "2px solid #d4c9bc",
  },
  headerIcon: {
    marginBottom: "15px",
    display: "inline-block",
    color: "#8b7355",
  },
  title: {
    margin: "0",
    fontSize: "2.8em",
    fontWeight: "normal",
    letterSpacing: "-0.5px",
    fontFamily: "'Courier New', 'Monaco', 'Menlo', monospace",
    color: "#4a3b2c",
  },
  subtitle: {
    margin: "12px 0 0",
    opacity: "0.8",
    fontSize: "1.1em",
    fontFamily: "'Courier New', 'Monaco', 'Menlo', monospace",
    color: "#6b5a48",
  },
  inputSection: {
    padding: "40px 30px",
    borderBottom: "2px solid #e8e0d5",
    backgroundColor: "#faf7f2",
  },
  inputWrapper: {
    display: "flex",
    gap: "15px",
    alignItems: "flex-start",
  },
  input: {
    flex: 1,
    padding: "14px 18px",
    fontSize: "16px",
    border: "2px solid #d4c9bc",
    borderRadius: "0px",
    outline: "none",
    transition: "all 0.3s ease",
    fontFamily: "'Courier New', 'Monaco', 'Menlo', monospace",
    backgroundColor: "#ffffff",
    color: "#4a3b2c",
  },
  saveButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "14px 28px",
    backgroundColor: "#d4c9bc",
    color: "#4a3b2c",
    border: "2px solid #c2b5a4",
    borderRadius: "0px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "normal",
    transition: "all 0.3s ease",
    fontFamily: "'Courier New', 'Monaco', 'Menlo', monospace",
  },
  saveButtonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  buttonText: {
    marginLeft: "4px",
  },
  spinner: {
    width: "20px",
    height: "20px",
    border: "2px solid rgba(74, 59, 44, 0.3)",
    borderTop: "2px solid #4a3b2c",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  errorMessage: {
    marginTop: "15px",
    padding: "12px",
    backgroundColor: "#f5e6e6",
    color: "#8b5a5a",
    borderRadius: "0px",
    fontSize: "14px",
    textAlign: "center",
    border: "2px solid #e0c9c9",
    fontFamily: "'Courier New', 'Monaco', 'Menlo', monospace",
  },
  notesSection: {
    padding: "40px 30px",
    backgroundColor: "#faf7f2",
  },
  sectionHeader: {
    marginBottom: "30px",
    paddingBottom: "15px",
    borderBottom: "2px solid #e8e0d5",
  },
  sectionTitle: {
    margin: "0",
    fontSize: "1.8em",
    color: "#4a3b2c",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontWeight: "normal",
    fontFamily: "'Courier New', 'Monaco', 'Menlo', monospace",
  },
  noteCount: {
    fontSize: "0.8em",
    color: "#8b7355",
    fontWeight: "normal",
    marginLeft: "8px",
  },
  notesList: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    maxHeight: "600px",
    overflowY: "auto",
  },
  noteCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "24px",
    backgroundColor: "#ffffff",
    transition: "all 0.3s ease",
    border: "2px solid #e8e0d5",
    borderRadius: "0px",
  },
  noteContent: {
    flex: 1,
  },
  noteText: {
    fontSize: "16px",
    color: "#4a3b2c",
    lineHeight: "1.6",
    marginBottom: "12px",
    fontFamily: "'Courier New', 'Monaco', 'Menlo', monospace",
  },
  noteMeta: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },
  timestamp: {
    fontSize: "12px",
    color: "#b5a68f",
    fontFamily: "'Courier New', 'Monaco', 'Menlo', monospace",
  },
  deleteButton: {
    padding: "8px",
    backgroundColor: "transparent",
    border: "2px solid #e8e0d5",
    borderRadius: "0px",
    cursor: "pointer",
    color: "#b5a68f",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "12px",
  },
  emptyState: {
    textAlign: "center",
    padding: "80px 20px",
    backgroundColor: "#ffffff",
    border: "2px solid #e8e0d5",
  },
  emptyIcon: {
    fontSize: "64px",
    marginBottom: "20px",
    opacity: 0.7,
  },
  emptyText: {
    fontSize: "16px",
    color: "#b5a68f",
    fontFamily: "'Courier New', 'Monaco', 'Menlo', monospace",
  },
};

export default App;