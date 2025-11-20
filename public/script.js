let readyStatus = document.querySelector('#readyStatus')
let notReadyStatus = document.querySelector('#notReadyStatus')
let myForm = document.querySelector('#myForm')
let contentArea = document.querySelector('#content')

// New form controls
const imageInput = document.getElementById('image')
const imagePreview = document.getElementById('imagePreview')
const brandInput = document.getElementById('brandInput')
const tagsContainer = document.getElementById('tagsContainer')
const occasionSelect = document.getElementById('occasionSelect')
const occasionOther = document.getElementById('occasionOther')
const starRating = document.getElementById('starRating')
const saveButton = document.getElementById('saveButton')

let tags = []
let imageDataUrl = null
let rating = 0

// Image preview
imageInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) {
        imagePreview.textContent = 'No image'
        imagePreview.innerHTML = 'No image'
        imageDataUrl = null
        return
    }
    const reader = new FileReader()
    reader.onload = () => {
        imageDataUrl = reader.result
        imagePreview.innerHTML = ''
        const img = document.createElement('img')
        img.src = imageDataUrl
        imagePreview.appendChild(img)
    }
    reader.readAsDataURL(file)
})

// Tags (brands) handling
function renderTags() {
    tagsContainer.innerHTML = ''
    tags.forEach((t, i) => {
        const span = document.createElement('span')
        span.className = 'tag'
        span.textContent = t
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.title = 'Remove tag'
        btn.textContent = '×'
        btn.addEventListener('click', () => {
            tags.splice(i, 1)
            renderTags()
        })
        span.appendChild(btn)
        tagsContainer.appendChild(span)
    })
}

function addTag(value) {
    const v = value.trim()
    if (!v) return
    if (!tags.includes(v)) {
        tags.push(v)
        renderTags()
    }
}

brandInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault()
        addTag(brandInput.value)
        brandInput.value = ''
    }
    else if (e.key === ',') {
        e.preventDefault()
        addTag(brandInput.value.replace(',', ''))
        brandInput.value = ''
    }
})

brandInput.addEventListener('blur', () => {
    if (brandInput.value.trim() !== '') {
        addTag(brandInput.value)
        brandInput.value = ''
    }
})

// Occasion: show 'Other' input when selected
occasionSelect.addEventListener('change', () => {
    if (occasionSelect.value === 'Other') {
        occasionOther.style.display = 'block'
    } else {
        occasionOther.style.display = 'none'
    }
})

// Star rating
starRating.addEventListener('click', (e) => {
    const btn = e.target.closest('.star')
    if (!btn) return
    rating = Number(btn.dataset.value)
    updateStars()
})

function updateStars() {
    const starButtons = starRating.querySelectorAll('.star')
    starButtons.forEach(btn => {
        const val = Number(btn.dataset.value)
        if (val <= rating) {
            btn.classList.add('active')
            btn.textContent = '★'
        } else {
            btn.classList.remove('active')
            btn.textContent = '☆'
        }
    })
}

// listen for form submissions
myForm.addEventListener('submit', event => {
    event.preventDefault()
    // handle reset button: when user clicked the reset control
    if (event.submitter && event.submitter.classList.contains('reset')) {
        tags = []
        imageDataUrl = null
        rating = 0
        renderTags()
        imagePreview.innerHTML = 'No image'
        updateStars()
        myForm.reset()
        return
    }

    // validation: name required
    const nameField = myForm.querySelector('#name')
    if (!nameField.checkValidity()) {
        alert('Please provide a title/name for the entry.')
        return
    }

    // assemble JSON data
    const data = {}
    data.name = nameField.value.trim()
    const dateVal = myForm.querySelector('#date').value
    data.date = dateVal ? new Date(dateVal).toISOString() : null
    data.brands = tags.slice()
    const occ = occasionSelect.value
    data.occasion = (occ === 'Other') ? (occasionOther.value.trim() || null) : (occ || null)
    data.rating = rating
    data.notes = myForm.querySelector('#notes').value.trim() || null
    data.image = imageDataUrl // data URL or null

    console.log('Submitting entry:', data)
    createItem(data)
})


// Given some JSON data, send the data to the API
// NOTE: "async" makes it possible to use "await" 
// See also: https://mdn.io/Statements/async_function
const createItem = async (myData) => {
    // The save operation is nested in a Try/Catch statement
    // See also: https://mdn.io/Statements/try...catch
    try {
        // Let's send the data to the /item endpoint
        // we'll add the data to the body of the request. 
        // https://mdn.io/Fetch_API/Using_Fetch#body

        // We will use the POST method to signal that we want to create a new item
        // Let's also add headers to tell the server we're sending JSON
        // The data is sent in serialized form (via JSON.stringify) 

        const response = await fetch('/data', {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(myData)
        })
        // Check if the response status is OK 
        if (!response.ok) {
            try {
                console.error(await response.json())
            }
            catch (err) {
                console.error(response.statusText)
            }
            throw new Error(response.statusText)
        }
        // If all goes well we will recieve back the submitted data
        // along with a new _id field added by MongoDB
        const result = await response.json()
        alert('Data Sent to MongoDB via API. Details are in the console. To see all persisted data, visit the /data endpoint in another tab.');
        // log the result 
        console.log(result)
        // refresh the data list
        getData()
    }
    catch (err) {
        // Log any errors
        console.error(err)
    }
} // end of save function


// fetch items from API endpoint and populate the content div
const getData = async () => {
    const response = await fetch('/data')
    if (response.ok) {
        readyStatus.style.display = 'block'
        const data = await response.json()
        console.log(data)
        if (data.length == 0) {
            contentArea.innerHTML += '<p><i>No data found in the database.</i></p>'
            return
        }
        else {
            contentArea.innerHTML = '<h2>🐈 Noteworthy Cats</h2>'
            data.forEach(item => {
                let div = document.createElement('div')
                div.innerHTML = `<h3>${item.name}</h3>
            <p>${item.microchip || '<i>No Microchip Found</i>'}</p>
            <p>${item.description || '<i>No Description Found</i>'}</p>
            `
                contentArea.appendChild(div)
            })
        }

    }
    else {

        notReadyStatus.style.display = 'block'

    }

}

getData()
