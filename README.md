# Segment Todo
A simple live Todo list for group projects.

[![GitHub issues](https://img.shields.io/github/issues/zhangtianli2006/segment-todo)](https://github.com/zhangtianli2006/segment-todo/issues)
[![GitHub license](https://img.shields.io/github/license/zhangtianli2006/segment-todo)](https://github.com/zhangtianli2006/segment-todo/blob/master/LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/zhangtianli2006/segment-todo)](https://github.com/zhangtianli2006/segment-todo/)
[![Repo Size](https://img.shields.io/github/repo-size/zhangtianli2006/segment-todo)](https://github.com/zhangtianli2006/segment-todo/)

![demo](https://s3.ax1x.com/2021/02/05/yGFTyt.png)

## Getting started
1. Install Node.js 24 LTS (Node.js >=24.15.0 is required by the built-in SQLite driver)

2. Clone the repo
  ```sh
  git clone https://github.com/zhangtianli2006/segment-todo
  ```

3. Build the frontend
  ```sh
  cd frontend
  npm ci
  npm run build
  ```

4. Start the backend
  ```sh
  cd ../backend
  npm ci
  HOST=0.0.0.0 PORT=3000 DB_PATH=/var/lib/segment-todo/todo.sqlite node index.js
  ```
  The default host is `127.0.0.1`; use `HOST=0.0.0.0` only when the backend is
  intentionally exposed on the LAN. `DB_PATH` should point to a writable
  SQLite database outside the source tree.

The application stores data only in SQLite and does not read or migrate the
old `todo.json` format. On first start, the SQLite schema is created
automatically.

The backend serves the production frontend from `frontend/dist`. For a
production deployment, run the process under systemd or a container and put
TLS, access control, and network restrictions in front of it. Back up the
SQLite database with SQLite's online backup mechanism or a filesystem snapshot;
do not copy only the main file while WAL mode is active.
