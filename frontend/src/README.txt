LASU Lost & Found - separated React files

Copy the folders/files into your existing frontend src directory.

Expected structure:
src/
  components/
    Dialog.jsx
    ListingCard.jsx
    CreateDialog.jsx
    DetailDialog.jsx
  data/
    constants.js
  utils/
    listing.js
  api.js                 (keep your existing api.js)
  App.jsx
  main.jsx               (keep your existing main.jsx)

The existing CSS files and their imports should remain unchanged.
This refactor preserves the class names and the existing UI markup.
