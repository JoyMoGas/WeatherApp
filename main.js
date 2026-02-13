import "./src/input.css";
import "./utils/api.js";

const dialog = document.getElementById("myModal");
const openButton = document.getElementById("openModal");
const closeButton = document.getElementById("closeModal");

// "Open Modal" button opens the dialog modally
openButton.addEventListener("click", () => {
  dialog.showModal(); // Use show() for non-modal dialogs
});

// "Close" button closes the dialog
closeButton.addEventListener("click", () => {
  dialog.close();
});