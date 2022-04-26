// **********************
// burger menu javascript
// **********************

// declare variables
const burgerMenu = document.querySelector(".burger-slide-out");
const burgerCheckbox = document.querySelector("#burger-menu");

// event listener for when user clicks anywhere in the menu other than a link
burgerMenu.addEventListener("click", menuSlide);

// close slide out menu when user toggles the checkbox
function menuSlide() {
  if (burgerCheckbox.checked === true) {
    burgerCheckbox.checked = false;
  } else {
    burgerCheckbox.checked = true;
  }
}

// *************************
// formspree form javascript
// *************************
const form = document.getElementById("contact-form");

async function handleSubmit(event) {
  event.preventDefault();
  const status = document.getElementById("my-form-status");
  const data = new FormData(event.target);
  fetch(event.target.action, {
    method: form.method,
    body: data,
    headers: {
      "Accept": "application/json"
    }
  }).then(response => {
    if (response.ok) {
      status.innerHTML = "Thanks for your submission!";
      form.reset()
    } else {
      response.json().then(data => {
        if (Object.hasOwn(data, "errors")) {
          status.innerHTML = data["errors"].map(error => error["message"])
        } else {
          status.innerHTML = "Oops! There was a problem submitting your form."
        }
      })
    }
  }).catch(error => {
    status.innerHTML = "Oops! There was a problem submitting your form."
  });
}
form.addEventListener("submit", handleSubmit)


