# Actual Budget Transformer

A browser-based tool that converts CSV exports from **Deutsche Kreditbank (DKB)** into the CSV format used by [Actual Budget](https://actualbudget.com/).

All processing happens client-side — your data never leaves your browser.

## Features

- Drag & drop CSV upload
- Automatic download of the transformed file
- Handles DKB checking, credit card, and savings account exports
- Converts German date and number formats to Actual Budget's expected format

## How It Works

| DKB Export            | Actual Budget                                  |
| --------------------- | ---------------------------------------------- |
| Semicolon-delimited   | Comma-delimited                                |
| `dd.MM.yyyy` dates    | `yyyy-MM-dd` dates                             |
| `1.234,56` amounts    | `1234.56` with separate Inflow/Outflow columns |
| German column headers | `Date`, `Payee`, `Notes`, `Outflow`, `Inflow`  |

## Getting Started

### npm

```bash
cd frontend
npm install
npm start
```

The app runs at `http://localhost:3000`.

### Docker

```bash
docker-compose up
```

The app runs at `http://localhost:42046`.

To build the image directly:

```bash
cd frontend
docker build -t my-app:latest .
```

> **Note (2026-03-08):** `react-scripts@5.0.1` does not support TypeScript 5. The Dockerfile uses `npm install --legacy-peer-deps` to work around this peer dependency conflict.

## Tech Stack

- React 19 + TypeScript
- Create React App
- Node 20 (Docker)
