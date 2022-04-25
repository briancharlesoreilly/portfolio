// declare variables
const burgerMenu = document.querySelector(".burger-slide-out");
const burgerCheckbox = document.querySelector("#burger-menu");

// event listener for when user clicks anywhere int he menu other than a link
burgerMenu.addEventListener("click", menuSlide);

// close slide out menu when user toggles the checkbox
function menuSlide() {
  if (burgerCheckbox.checked === true) {
    burgerCheckbox.checked = false;
  } else {
    burgerCheckbox.checked = true;
  }
}

