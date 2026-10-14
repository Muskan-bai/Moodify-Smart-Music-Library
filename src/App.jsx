
import { useState, useEffect } from 'react'
import './App.css'


function getFolderEmoji(name){
  const text = name.toLowerCase()

  if(text.includes('soft') || text.includes('chill') || text.includes('relax'))
    return '🌙'

  if(text.includes('rock') || text.includes('metal'))
    return '🎸'

  if(text.includes('romantic') || text.includes('love'))
    return '💕'

  if(text.includes('religious') || text.includes('bhajan') || text.includes('devotional') || text.includes('nasheed') || text.includes('naat'))
    return '🙏'

  if(text.includes('party') || text.includes('dance'))
    return '🎉'

  if(text.includes('sad') || text.includes('emotional'))
    return '💔'

  if(text.includes('gym') || text.includes('workout'))
    return '💪'

  if(text.includes('study') || text.includes('focus'))
    return '📚'

  const emojis = ['🎵', '🎧', '🎶', '🎼', '💜', '✨']

  return emojis[Math.floor(Math.random() * emojis.length)]
}


function App(){
  
const [folders, setFolders] = useState(() => {
  const saved = localStorage.getItem('moodify-folders')
  return saved ? JSON.parse(saved) : []
})

  const [folderName, setFolderName] = useState('')
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [activePage, setActivePage] = useState('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [selectedSong, setSelectedSong] = useState(null)
  const [selectedFolderIds, setSelectedFolderIds] = useState([])
  const [folderSongs, setFolderSongs] = useState(() => {
  const saved = localStorage.getItem('moodify-songs')
  return saved ? JSON.parse(saved) : {}
  })
  const [playingId, setPlayingId] = useState(null)

  useEffect(() => {
  localStorage.setItem('moodify-folders', JSON.stringify(folders))
  }, [folders])
  
  useEffect(() => {
  localStorage.setItem('moodify-songs', JSON.stringify(folderSongs))
  }, [folderSongs])

  useEffect(() => {
  if(searchQuery.trim() === ''){
    setSongs([])
    setLoading(false)
    setSearchError('')
    return
  }

  const controller = new AbortController()

  const timer = setTimeout(async () => {
    setLoading(true)
    setSearchError('')

    try {
      const response = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&entity=song&limit=20`,
        { signal: controller.signal }
      )

      if(!response.ok){
        throw new Error('Music search failed')
      }

      const data = await response.json()
      setSongs(data.results || [])
    } catch(error) {
      if(error.name !== 'AbortError'){
        setSearchError('Could not load songs. Please try again.')
        setSongs([])
      }
    } finally {
      if(!controller.signal.aborted){
        setLoading(false)
      }
    }
  }, 500)
  
  return () => {
    clearTimeout(timer)
    controller.abort()
  }
}, [searchQuery])


function playSong(song){
  const audio = document.getElementById('music-player')

  if(!song.previewUrl){
    alert('Preview is not available for this song.')
    return
  }

  if(playingId === song.trackId){
    audio.pause()
    setPlayingId(null)
  } else {
    audio.pause()
    audio.src = song.previewUrl
    console.log('Song:', song.trackName)
    console.log('Preview URL:', song.previewUrl)

    audio.play()
      .then(() => setPlayingId(song.trackId))
      .catch((error) => {
  console.error('Audio playback error:', error)
  setPlayingId(null)
  alert('Unable to play this preview.')
  })
  }
}


  function createFolder(){
    if(folderName.trim() === ''){
      alert('Please enter a folder name')
      return
    }

   
const newFolder = {
  id: Date.now(),
  name: folderName.trim(),
  emoji: getFolderEmoji(folderName)
}


    setFolders([...folders, newFolder])
    setFolderName('')
  }

  function deleteFolder(id){
    setFolders(folders.filter(folder => folder.id !== id))

    if(selectedFolder?.id === id){
      setSelectedFolder(null)
    }
  }
  
function toggleFolder(id){
  if(selectedFolderIds.includes(id)){
    setSelectedFolderIds(selectedFolderIds.filter(folderId => folderId !== id))
  } else {
    setSelectedFolderIds([...selectedFolderIds, id])
  }
}


function saveSongToFolders(){
  if(selectedFolderIds.length === 0){
    alert('Please select at least one folder')
    return
  }

  if(!selectedSong) return

  setFolderSongs(prev => {
    const updated = {...prev}

    selectedFolderIds.forEach(id => {
      const existingSongs = updated[id] || []

      if(!existingSongs.some(song => song.trackId === selectedSong.trackId)){
        updated[id] = [...existingSongs, selectedSong]
      }
    })

    console.log('Updated folder songs:', updated)
    return updated
  })

  setSelectedFolderIds([])
  setSelectedSong(null)
  alert('Song saved successfully!')
}

  
function removeSong(folderId, trackId){
  setFolderSongs(prev => ({
    ...prev,
    [folderId]: (prev[folderId] || []).filter(
      song => song.trackId !== trackId
    )
  }))
}


  return (
    <div className="dashboard">
      <aside className="sidebar">
        <h2>🎧 Moodify</h2>

        
<nav>
  <p onClick={() => {
    setActivePage('home')
    setSelectedFolder(null)
  }}>
    🏠 Home
  </p>

  <p onClick={() => setActivePage('search')}>
    🔍 Search
  </p>

  <p>❤️ Liked Songs</p>

  <p onClick={() => {
    setActivePage('home')
    setSelectedFolder(null)
  }}>
    📁 My Folders
  </p>
</nav>

      </aside>

      <main className="main-content">
        
{activePage === 'search' ? (
  <div className="search-page">
    <h1>🔍 Search Music</h1>
    <p>Discover songs and organize your favorites.</p>

    <input
      type="text"
      placeholder="Search for songs or artists..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="search-input"
    />

    
{loading && <p className="search-message">Searching songs...</p>}

{searchError && <p className="search-message">{searchError}</p>}

{!loading && !searchError && searchQuery.trim() && songs.length === 0 && (
  <p className="search-message">No songs found.</p>
)}

<div className="song-results">
  {songs.map(song => (
    <div className="song-card" key={song.trackId}>
      <img
        src={song.artworkUrl100}
        alt={song.trackName}
      />

      <div className="song-info">
        <h3>{song.trackName}</h3>
        <p>{song.artistName}</p>
      </div>

      
<div className="song-actions">
  <button
    className="play-btn"
    onClick={() => playSong(song)}
  >
    {playingId === song.trackId ? '⏸ Pause' : '▶ Play'}
  </button>

  <button
    className="add-song-btn"
    onClick={() => setSelectedSong(song)}
  >
    + Add
  </button>
  </div>

    </div>
  ))}
</div>

  </div>
) : (
  <>

{selectedFolder ? (
    <div>
        <button onClick={() => setSelectedFolder(null)}>
            ← Back
        </button>

        <h1>📁 {selectedFolder.name}</h1>
            
{(folderSongs[selectedFolder.id] || []).length === 0 ? (
  <p>No songs added yet.</p>
) : (
  <div className="song-results">
    {(folderSongs[selectedFolder.id] || []).map(song => (
      <div className="song-card" key={song.trackId}>
        <img
          src={song.artworkUrl100}
          alt={song.trackName}
        />

        <div className="song-info">
          <h3>{song.trackName}</h3>
          <p>{song.artistName}</p>
        </div>

        <button
          className="play-btn"
          onClick={() => playSong(song)}
        >
          {playingId === song.trackId ? '⏸ Pause' : '▶ Play'}
        </button>
   
        <button
         className="remove-song-btn"
         onClick={() => removeSong(selectedFolder.id, song.trackId)}
        >
        Remove
        </button>

      </div>
    ))}
  </div>
)}

        </div>
        ) : (
          <>
      <h1>Welcome to Moodify!</h1>
        <p>Your Music, Your Mood, Your Library.</p>

      <h2>Your Music Folders</h2>

            <div className="create-folder">
              <input
                type="text"
                placeholder="Enter folder name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
              />

              <button onClick={createFolder}>
                + Create Folder
              </button>
            </div>

            <div className="folders">
              {folders.map(folder => (
                <div className="folder" key={folder.id}>
                  <h3 onClick={() => setSelectedFolder(folder)}>
                    {folder.emoji || '🎵'} {folder.name}
                  </h3>

                  <button
                    className="delete-btn"
                    onClick={() => deleteFolder(folder.id)}
                  >
                    Delete
                  </button>
                </div>
              ))
              }
            </div>

            {folders.length === 0 && (
              <p>No folders yet. Create your first music folder!</p>
            )}
          </>
        )}
          </>
      )}
      </main>
      
{selectedSong && (
  <div className="modal-overlay">
    <div className="folder-modal">
      <h2>💜 Add to Folders</h2>

      <p>{selectedSong.trackName}</p>

      {folders.length === 0 ? (
        <p>Create a folder first!</p>
      ) : (
        
      folders.map(folder => (
        <label className="folder-option" key={folder.id}>
         <input
          type="checkbox"
          checked={selectedFolderIds.includes(folder.id)}
          onChange={() => toggleFolder(folder.id)}
      />
      {folder.emoji || '🎵'} {folder.name}
        </label>
      ))

      )}

     
<button
  className="save-folder-btn"
  onClick={saveSongToFolders}
>
  Save to Folders
</button>

<button
  className="close-modal"
  onClick={() => {
    setSelectedSong(null)
    setSelectedFolderIds([])
  }}
>
  Cancel
</button>


      </div>
    </div>
    )}
    <audio id="music-player" onEnded={() => setPlayingId(null)} />

    </div>
  )
}

export default App
