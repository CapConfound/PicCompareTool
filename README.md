# PicCompareTool

A local web app for curating trip photos from two phones — group, compare, and rank your shots without ever uploading anything.

## What it does

Photos from two phones (e.g. Galaxy S25 + Pixel 6) sit on your Mac. The app reads them directly from disk and walks you through three stages:

1. **Group** — browse each phone's photos and assign them to named groups (e.g. by location or moment). Photos are shown in a scrollable grid; you can shift-click to select ranges and add them to a group in one go.

2. **Compare** — for each group, view the best candidates from both phones side by side and pick one winner per phone.

3. **Rank** — the winners from both phones go head-to-head, one group at a time. Pick the better photo from each pair. When you're done, see the final score and which phone came out on top.

All data is stored locally in `data/groups.json`. Nothing is uploaded anywhere.

## Stack

- **Backend** — Node.js + Express + TypeScript. Uses macOS `sips` to decode DNG/HEIC/JPEG and generate JPEG thumbnails (cached in `data/thumbnails/`).
- **Frontend** — Vite + React + TypeScript + Tailwind CSS v4. Virtualised photo grids via `@tanstack/react-virtual`.

## Getting started

```bash
make install   # install all dependencies (first time only)
make run       # start server + client in the background
make logs      # follow live output
make stop      # kill both processes
```

Open **http://localhost:5173**, point the app at your photo folders, and start grouping.

> Requires macOS (for `sips`). Tested with DNG, HEIC, and JPEG files.
