import { Route, Routes } from "react-router-dom";
import Shell from "./components/Shell";
import AlbumDetailPage from "./screens/AlbumDetailPage";
import AlbumsPage from "./screens/AlbumsPage";
import CreateSongPage from "./screens/CreateSongPage";
import EditLyricsPage from "./screens/EditLyricsPage";
import HomePage from "./screens/HomePage";
import SongDetailPage from "./screens/SongDetailPage";
import SongsPage from "./screens/SongsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/songs" element={<SongsPage />} />
        <Route path="/favorites" element={<SongsPage favoritesOnly />} />
        <Route path="/albums" element={<AlbumsPage />} />
        <Route path="/albums/:id" element={<AlbumDetailPage />} />
      </Route>
      {/* chrome-less flows (own top bars) */}
      <Route path="/songs/new" element={<CreateSongPage />} />
      <Route path="/songs/:id" element={<SongDetailPage />} />
      <Route path="/songs/:id/edit" element={<EditLyricsPage />} />
    </Routes>
  );
}
