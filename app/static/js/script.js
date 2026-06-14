// On load reset the UI (clear errors and results)
window.addEventListener("load", resetUI);

// When the form is submitted
document.getElementById("house-info-form").addEventListener("submit", async function (e) {
    // Ignore the default behaviour
    e.preventDefault();

    // Clear all previous errors
    document.querySelectorAll(".error").forEach((error) => {
        error.classList.remove("active");
        error.innerText = "";
    });

    // Get the loader element
    const loader = document.querySelector(".loaderDiv");

    // Get the values from the form inputs
    const lat = parseFloat(document.querySelector("[name='lat']").value.trim());
    const long = parseFloat(document.querySelector("[name='long']").value.trim());
    const bedrooms = parseInt(document.querySelector("[name='bedrooms']").value.trim());
    const bathrooms = parseFloat(document.querySelector("[name='bathrooms']").value.trim());
    const sqft_living = parseInt(document.querySelector("[name='sqft_living']").value.trim());

    // Create a JSON payload of the input data
    const formData = {
        lat: lat,
        long: long,
        bedrooms: bedrooms,
        bathrooms: bathrooms,
        sqft_living: sqft_living,
    };

    // Ensure the numerical inputs are numerical, error if not
    for (const [field, value] of Object.entries(formData)) {
        if (Number.isNaN(value)) {
            showFieldError(field, "Please enter a valid number.");
            return;
        }
    }

    // Ensure values are positive, error if not (excludes lat and long fields)
    for (const [field, value] of Object.entries(formData)) {
        if (value <= 0 && field !== "lat" && field !== "long") {
            showFieldError(field, "Must be a positive value.");
            return;
        }
    }

    // Only accept locations within King County
    if (lat < 47.1 || lat > 47.8){
        showFieldError("lat", "This location is outside of the supported region.");
        return;
    }
    if (long < -122.6 || long > -121.3){
        showFieldError("long", "This location is outside of the supported region.");
        return;
    }

    try {
        // Show the loader while waiting for the response
        loader.classList.add("active");

        const result = await predictHousePrice(formData);

        showResult(result.predicted_price_usd);
    } 
    // Show a form error if anything goes wrong with the request
    catch (error) {
        showFormError("Something went wrong calling the backend.");
        console.error(error);
    }
    // Always hide the loader, at the end, regardless of whether or not there are errors
    finally {
        loader.classList.remove("active");
    }
});

async function predictHousePrice(payload) {
    // Send a request to the backend including the json payload
    const response = await fetch("/predict-house-price/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    // If the response is anything but "OK-200", throw the error to the UI
    if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
    }

    // return the price prediction from the backend
    return response.json();
}

function showResult(price) {
    // Get the result card and the element where the result amount will be displayed
    const resultCard = document.getElementById("result");
    const resultAmount =  document.getElementById("resultAmount");

    // Round the price to the nearest $500
    const roundedPrice = roundToNearest500(price);

    // Get the locale of the user e.g."en-GB" (fallback to en-US)
    const locale = navigator.language || "en-US";

    // Format the number based on the locale (, or . thousands separators)
    // Don't show decimals
    const formattedPrice = new Intl.NumberFormat(locale, {
        maximumFractionDigits: 0
    }).format(roundedPrice);

    // Display the formatted price prediction
    // Note that the currency is always USD because the model predictions are in USD
    resultAmount.innerText = `$${formattedPrice}`;

    // Show the result card
    resultCard.classList.add("active");
}

function roundToNearest500(value) {
    return Math.round(value / 500) * 500;
}

// Get the form-error element, insert the message and set it to be visible
function showFormError(message){
    const formError = document.getElementById("form-error");
    formError.innerText = message;
    formError.classList.add("active");
}

// Get the input with the given name and within the field, get the error div
// Populate the error message and set to active
function showFieldError(inputName, message) {
    const input = document.querySelector(`[name="${inputName}"]`);
    const field = input.closest(".field");
    const errorDiv = field.querySelector(".error");

    errorDiv.innerText = message;
    errorDiv.classList.add("active");
}

// To reset the UI, hide the errors and the results
function resetUI() {
    document.querySelectorAll(".error").forEach(e => {
        e.classList.remove("active");
        e.innerText = "";
    });
    document.getElementById("result").classList.remove("active");
}


// ------------------------------------ M A P ------------------------------------
// Create a map instance of King County WA
const map = L.map('map', {
    maxBounds: [[47.1, -122.6], [47.8, -121.3]],    // Prevent the user from panning out of the region
    maxBoundsViscosity: 1.0,                        // Solid boundary, no pullback effect
    minZoom: 10                                     // Prevent zooming out too far
}).setView([47.6, -122.3], 10);                     // Default to a view of the centre of the region (zoom level 10)

// Get the map tiles from Open Street Map and add them to the map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Create a marker/pin for the map
let marker;

// If the user clicks the map
map.on('click', function (e) {
    // Get the coordinates of where they clicked
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    // Update lat&long input field values to the selected location
    document.getElementById("lat").value = lat.toFixed(6);
    document.getElementById("long").value = lng.toFixed(6);

    // Place/move the map marker to that location
    if (marker) {
        marker.setLatLng(e.latlng);
    } else {
        marker = L.marker(e.latlng).addTo(map);
    }
});