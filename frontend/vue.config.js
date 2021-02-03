module.exports = {
  pages: {
    index: {
      entry: 'src/main.js',
      title: 'Segment Todo',
      template: 'public/index.html',
      filename: 'index.html',
      chunks: ['chunk-vendors', 'chunk-common', 'index',],
    },
  },
};
