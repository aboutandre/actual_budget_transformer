import React from "react";
import "./App.css";
import DragDropArea from "./components/DragDropArea";

const App: React.FC = () => {
    return (
        <div className="App">
            <header className="App-header">
                <h1 style={{ fontSize: 28, marginBottom: 8 }}>DKB CSV Transformer</h1>
                <p style={{ fontSize: 14, opacity: 0.7, marginBottom: 0 }}>
                    Convert DKB bank exports to Actual Budget format
                </p>
            </header>
            <main>
                <DragDropArea />
            </main>
        </div>
    );
};

export default App;

