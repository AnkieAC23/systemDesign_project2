// outfits.js — page logic for outfits view
const datePicker = document.getElementById('datePicker')
const dateSelect = document.getElementById('dateSelect')
const loadDateBtn = document.getElementById('loadDate')
const editBtn = document.getElementById('editEntry')
const deleteBtn = document.getElementById('deleteEntry')
const outfitContainer = document.getElementById('outfitContainer')
const prevDate = document.getElementById('prevDate')
const nextDate = document.getElementById('nextDate')

let outfits = []
let availableDates = [] // array of YYYY-MM-DD strings
let currentDate = null

function isoDateOnly(dt) {
  if (!dt) return null
  const d = new Date(dt)
  if (isNaN(d)) return null
  return d.toISOString().slice(0,10)
}

async function loadAll() {
  const res = await fetch('/outfits')
  if (!res.ok) return
  outfits = await res.json()
  // normalize date keys
  const dates = new Set()
  outfits.forEach(o => {
    const d = isoDateOnly(o.date)
    if (d) dates.add(d)
  })
  availableDates = Array.from(dates).sort()
  renderDateSelect()
  // set currentDate to selected or today
  const today = new Date().toISOString().slice(0,10)
  currentDate = availableDates.includes(today) ? today : (availableDates[0] || today)
  datePicker.value = currentDate
  dateSelect.value = currentDate
  renderForDate(currentDate)
}

function renderDateSelect() {
  dateSelect.innerHTML = ''
  // add blank option
  const opt = document.createElement('option')
  opt.value = ''
  opt.textContent = '-- select a date --'
  dateSelect.appendChild(opt)
  availableDates.forEach(d => {
    const o = document.createElement('option')
    o.value = d
    o.textContent = d
    dateSelect.appendChild(o)
  })
}

function renderForDate(dateStr) {
  currentDate = dateStr
  datePicker.value = dateStr
  dateSelect.value = dateStr
  outfitContainer.querySelectorAll('.outfit-card, .empty-card').forEach(n => n.remove())

  const matches = outfits.filter(o => isoDateOnly(o.date) === dateStr)
  if (!matches || matches.length === 0) {
    const empty = document.createElement('div')
    empty.className = 'empty-card'
    empty.innerHTML = `<div class="empty-content">Your wardrobe is empty. Start by adding an outfit!</div>`
    outfitContainer.appendChild(empty)
    outfitContainer.style.background = '#fdf2e0'
    return
  }

  outfitContainer.style.background = 'transparent'
  matches.forEach(item => {
    const card = document.createElement('article')
    card.className = 'outfit-card'
    const imgHtml = item.photoURL ? `<img src="${item.photoURL}" alt="${item.title || 'Outfit'}"/>` : `<div class="no-photo">No image</div>`
    const tagsHtml = (item.brands && item.brands.length) ? `<div class="card-tags">${item.brands.map(b=>`<span class="tag">${b}</span>`).join('')}</div>` : ''
    const stars = item.rating != null ? '★'.repeat(item.rating) + '☆'.repeat(5-item.rating) : '<i>No rating</i>'
    card.innerHTML = `
      <div class="card-left">${imgHtml}${tagsHtml}</div>
      <div class="card-right">
        <h3 class="card-title">${item.title || 'Untitled'}</h3>
        <div class="card-date">${isoDateOnly(item.date) || 'No date'}</div>
        <div class="card-rating">${stars}</div>
        <div class="card-notes">${item.notes || '<i>No notes</i>'}</div>
      </div>
    `
    card.dataset.id = item.id
    outfitContainer.appendChild(card)
  })
}

function setDateTo(idx) {
  if (!availableDates.length) return
  if (idx < 0) idx = 0
  if (idx >= availableDates.length) idx = availableDates.length -1
  renderForDate(availableDates[idx])
}

function gotoPrevDate() {
  const idx = availableDates.indexOf(currentDate)
  if (idx > 0) setDateTo(idx-1)
}
function gotoNextDate() {
  const idx = availableDates.indexOf(currentDate)
  if (idx < availableDates.length-1) setDateTo(idx+1)
}

loadDateBtn.addEventListener('click', () => {
  const val = datePicker.value || dateSelect.value
  if (!val) return
  // if date is new, add it to availableDates
  if (!availableDates.includes(val)) availableDates.push(val)
  availableDates.sort()
  renderDateSelect()
  renderForDate(val)
})

dateSelect.addEventListener('change', (e) => {
  const v = e.target.value
  if (v) renderForDate(v)
})

datePicker.addEventListener('change', (e) => {
  const v = e.target.value
  if (v) dateSelect.value = v
})

prevDate.addEventListener('click', gotoPrevDate)
nextDate.addEventListener('click', gotoNextDate)

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') gotoPrevDate()
  if (e.key === 'ArrowRight') gotoNextDate()
})

deleteBtn.addEventListener('click', async () => {
  // delete all entries for currentDate (confirm)
  if (!currentDate) return
  const matches = outfits.filter(o => isoDateOnly(o.date) === currentDate)
  if (!matches.length) return alert('No outfits to delete for this date.')
  if (!confirm(`Delete ${matches.length} outfit(s) for ${currentDate}?`)) return
  for (const it of matches) {
    await fetch(`/outfits/${it.id}`, { method: 'DELETE' })
  }
  await loadAll()
  alert('Deleted.')
})

editBtn.addEventListener('click', async () => {
  // If exactly one outfit exists for the date, open an inline editor
  const matches = outfits.filter(o => isoDateOnly(o.date) === currentDate)
  if (matches.length === 0) return alert('No outfit to edit for this date.')
  if (matches.length > 1) return alert('Multiple outfits found for this date; please select one from the list to edit (not implemented).')
  const item = matches[0]
  // Simple prompt-based edit: allow editing title and notes
  const newTitle = prompt('Edit title', item.title || '')
  if (newTitle == null) return
  const newNotes = prompt('Edit notes', item.notes || '')
  const payload = { title: newTitle, notes: newNotes }
  const res = await fetch(`/outfits/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  if (res.ok) {
    await loadAll()
    alert('Updated')
  } else alert('Update failed')
})

// initialize
loadAll()

export {}
