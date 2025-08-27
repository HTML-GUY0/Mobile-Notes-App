const STORAGE_KEY = 'minimal_notes_v1';
let notes = [];
let currentEditId = null;

const searchInput = document.getElementById('search');
const newTitleInput = document.getElementById('new-title');
const newContentInput = document.getElementById('new-content');
const addNoteBtn = document.getElementById('addNoteBtn');
const notesGrid = document.getElementById('notesGrid');
const sortOrderSel = document.getElementById('sortOrder');
const editModal = document.getElementById('editModal');
const editTitleInput = document.getElementById('edit-title');
const editContentInput = document.getElementById('edit-content');
const saveEditBtn = document.getElementById('saveEditBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

const escapeHTML = (s) => { const div = document.createElement('div'); div.textContent = s; return div.innerHTML; };
const formatDate = (iso) => { try { return new Date(iso).toLocaleString(); } catch { return iso; } };
const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const saveNotes = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
const loadNotes = () => { const raw = localStorage.getItem(STORAGE_KEY); notes = raw ? JSON.parse(raw) : []; };

const downloadNote = (note) => {
  const titleLine = note.title ? `# ${note.title}\n\n` : "";
  const blob = new Blob([`${titleLine}${note.content}`], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${note.title || "note"}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const renderNotes = () => {
  const query = (searchInput.value || '').toLowerCase().trim();
  const sort = sortOrderSel.value;
  let list = notes.filter(n => n.title.toLowerCase().includes(query));
  list.sort((a, b) => {
    if (a.pinned !== b.pinned) return b.pinned - a.pinned;
    return sort === 'newest' ? new Date(b.timestamp) - new Date(a.timestamp) : new Date(a.timestamp) - new Date(b.timestamp);
  });

  notesGrid.innerHTML = '';
  if (list.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'No notes yet. Create your first note above.';
    notesGrid.appendChild(empty);
    return;
  }

  list.forEach(n => {
    const card = document.createElement('article');
    card.className = 'note-card';
    card.dataset.id = n.id;

    const header = document.createElement('div');
    header.className = 'note-header';
    const title = document.createElement('h3');
    title.className = 'note-title';
    title.innerHTML = escapeHTML(n.title);
    const pinBtn = document.createElement('button');
    pinBtn.className = 'pin-btn';
    pinBtn.textContent = n.pinned ? 'Unpin' : 'Pin';

    header.appendChild(title);
    header.appendChild(pinBtn);

    const content = document.createElement('div');
    content.className = 'note-content';
    content.innerHTML = escapeHTML(n.content).replace(/\n/g, '<br>');

    const footer = document.createElement('div');
    footer.className = 'note-footer';
    const ts = document.createElement('span');
    ts.textContent = formatDate(n.timestamp);
    const actions = document.createElement('div');
    actions.className = 'actions';
    ['Edit', 'Delete', 'Download'].forEach(text => {
      const btn = document.createElement('button');
      btn.textContent = text;
      actions.appendChild(btn);
    });

    footer.appendChild(ts);
    footer.appendChild(actions);

    card.appendChild(header);
    card.appendChild(content);
    card.appendChild(footer);

    card.addEventListener('click', (ev) => {
      const target = ev.target;
      if (target.closest('.pin-btn')) togglePin(n.id);
      else if (target.closest('button') && target.parentElement.classList.contains('actions')) {
        if (target.textContent === 'Edit') openEdit(n.id);
        else if (target.textContent === 'Delete') deleteNote(n.id);
        else if (target.textContent === 'Download') downloadNote(n);
      }
    });

    notesGrid.appendChild(card);
  });
};

const addNote = () => {
  const title = newTitleInput.value.trim();
  const content = newContentInput.value.trim();
  if (!title && !content) { alert('Note cannot be empty.'); return; }
  notes.push({ id: generateId(), title, content, timestamp: new Date().toISOString(), pinned: false });
  saveNotes();
  newTitleInput.value = '';
  newContentInput.value = '';
  renderNotes();
};

const togglePin = (id) => {
  const idx = notes.findIndex(n => n.id === id);
  if (idx >= 0) { notes[idx].pinned = !notes[idx].pinned; saveNotes(); renderNotes(); }
};
const openEdit = (id) => { currentEditId = id; const n = notes.find(x => x.id === id); if (!n) return; editTitleInput.value = n.title; editContentInput.value = n.content; editModal.classList.add('is-open'); };
const closeEdit = () => { currentEditId = null; editModal.classList.remove('is-open'); };
const saveEdit = () => { if (!currentEditId) return; const idx = notes.findIndex(n => n.id === currentEditId); if (idx < 0) return; const newTitle = editTitleInput.value.trim(); const newContent = editContentInput.value.trim(); if (!newTitle && !newContent) { alert('Note cannot be empty.'); return; } notes[idx].title = newTitle; notes[idx].content = newContent; notes[idx].timestamp = new Date().toISOString(); saveNotes(); closeEdit(); renderNotes(); };
const deleteNote = (id) => { const idx = notes.findIndex(n => n.id === id); if (idx < 0) return; if (!confirm('Delete this note?')) return; notes.splice(idx, 1); saveNotes(); renderNotes(); };

addNoteBtn.addEventListener('click', addNote);
saveEditBtn.addEventListener('click', saveEdit);
cancelEditBtn.addEventListener('click', closeEdit);
searchInput.addEventListener('input', renderNotes);
sortOrderSel.addEventListener('change', renderNotes);

loadNotes();
renderNotes();