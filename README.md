# Actual Budget Transformer

A browser-based tool that converts CSV exports from **Deutsche Kreditbank (DKB)** and **Deutsche Bank** credit cards into the CSV format used by [Actual Budget](https://actualbudget.com/).

All processing happens client-side — your data never leaves your browser.

## Features

- Drag & drop CSV upload
- Automatic download of the transformed file
- Handles DKB checking, credit card, and savings account exports
- Handles Deutsche Bank credit card exports
- Converts German date and number formats to Actual Budget's expected format

## Supported Formats

The processor automatically detects and handles:

| Source                    | Format                              | Date Format           | Number Format     |
| ------------------------- | ----------------------------------- | --------------------- | ----------------- |
| DKB Checking Account      | Semicolon-delimited, column headers | dd.MM.yyyy (dd.MM.yy) | German (1.234,56) |
| DKB Credit Card           | Semicolon-delimited, column headers | dd.MM.yyyy (dd.MM.yy) | German (1.234,56) |
| DKB Savings Account       | Semicolon-delimited, column headers | dd.MM.yyyy (dd.MM.yy) | German (1.234,56) |
| Deutsche Bank Credit Card | Semicolon-delimited, Excel export   | M/D/YYYY              | Standard (16.42)  |

## Transformation Details

| DKB Export              | Actual Budget                                  |
| ----------------------- | ---------------------------------------------- |
| Semicolon-delimited     | Comma-delimited                                |
| Various date formats    | `yyyy-MM-dd` dates                             |
| German/Standard amounts | `1234.56` with separate Inflow/Outflow columns |
| German column headers   | `Date`, `Payee`, `Notes`, `Outflow`, `Inflow`  |

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
