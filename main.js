import "./src/input.css";
import "./utils/api.js";

const dialog = document.getElementById("myModal");
const openButton = document.getElementById("openModal");
const closeButton = document.getElementById("closeModal");

openButton.addEventListener("click", () => {
  dialog.showModal();
});

closeButton.addEventListener("click", () => {
  dialog.close();
});
