import { useState } from "react";
import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";
function App() {
const [note, setNote] = useState("");
const saveNote = async () => {
await addDoc(collection(db, "notes"), {
text: note
});
alert("Saved to backend!");
};
return (
<div style={{ textAlign: "center", marginTop: "50px" }}>
<h1>Frontend + Backend</h1>
<input
type="text"
placeholder="Enter note..."
value={note}
onChange={(e) => setNote(e.target.value)}
/>
<br /><br />
<button onClick={saveNote}>
Save to Firebase
</button>
</div>
);
}
export default App;