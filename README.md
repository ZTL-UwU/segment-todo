# Segment Todo
A simple live Todo list for group projects.

[![GitHub issues](https://img.shields.io/github/issues/zhangtianli2006/segment-todo)](https://github.com/zhangtianli2006/segment-todo/issues)
[![GitHub license](https://img.shields.io/github/license/zhangtianli2006/segment-todo)](https://github.com/zhangtianli2006/segment-todo/blob/master/LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/zhangtianli2006/segment-todo)](https://github.com/zhangtianli2006/segment-todo/)
[![Repo Size](https://img.shields.io/github/repo-size/zhangtianli2006/segment-todo)](https://github.com/zhangtianli2006/segment-todo/)

![demo](https://s3.ax1x.com/2021/02/05/yGFTyt.png)

## Getting started
1. Install nodejs & npm

2. Clone the repo
  ```sh
  git clone https://github.com/zhangtianli2006/segment-todo
  ```

3. Build the frontend
  ```sh
  cd frontend
  npm install
  npm run build
  ```

4. Start the backend
  ```sh
  cd ../backend
  npm install
  node -e 'process.env.PORT = <YOUR PORT>' index.js
  ```
  (default serving port is 3000)
