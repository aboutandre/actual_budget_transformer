import React, { useCallback, useState, DragEvent } from "react";
import { processDkbCsv } from "../lib/dkbCsvProcessor";

type Status = "idle" | "transforming" | "done" | "error";

const DragDropArea: React.FC = () => {
    const [status, setStatus] = useState<Status>("idle");
    const [message, setMessage] = useState("");
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [downloadName, setDownloadName] = useState("");
    const [dragOver, setDragOver] = useState(false);

    const handleFile = useCallback(async (file: File) => {
        try {
            setStatus("transforming");
            setMessage(`Transforming ${file.name}…`);
            setDownloadUrl(null);

            const text = await file.text();
            const transformed = processDkbCsv(text);
            const blob = new Blob([transformed], { type: "text/csv" });
            const blobUrl = URL.createObjectURL(blob);
            const fileName = "transformed_" + file.name;

            setDownloadName(fileName);
            setDownloadUrl(blobUrl);
            setStatus("done");
            setMessage(`Ready: ${fileName}`);

            // Auto-trigger download
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (err: any) {
            setStatus("error");
            setMessage(err.message || "Something went wrong");
        }
    }, []);

    const onDrop = useCallback(
        (e: DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
        },
        [handleFile]
    );

    const onFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
        },
        [handleFile]
    );

    return (
        <div
            onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            style={{
                border: `3px dashed ${dragOver ? "#4a90d9" : "#ccc"}`,
                borderRadius: 16,
                padding: 48,
                textAlign: "center",
                background: dragOver ? "#eaf2fb" : "#fafafa",
                transition: "all 0.2s",
                maxWidth: 520,
                margin: "40px auto",
            }}
        >
            <p style={{ fontSize: 18, marginBottom: 16 }}>
                Drag &amp; drop a DKB CSV file here
            </p>

            <label
                style={{
                    display: "inline-block",
                    padding: "10px 24px",
                    background: "#4a90d9",
                    color: "#fff",
                    borderRadius: 8,
                    cursor: "pointer",
                }}
            >
                Or choose file
                <input
                    type="file"
                    accept=".csv"
                    onChange={onFileInput}
                    style={{ display: "none" }}
                />
            </label>

            {status !== "idle" && (
                <p
                    style={{
                        marginTop: 24,
                        color: status === "error" ? "red" : "#333",
                    }}
                >
                    {message}
                </p>
            )}

            {downloadUrl && (
                <a
                    href={downloadUrl}
                    download={downloadName}
                    style={{
                        display: "inline-block",
                        marginTop: 16,
                        padding: "10px 24px",
                        background: "#27ae60",
                        color: "#fff",
                        borderRadius: 8,
                        textDecoration: "none",
                    }}
                >
                    Download transformed CSV
                </a>
            )}
        </div>
    );
};

export default DragDropArea;

