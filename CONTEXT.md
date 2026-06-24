# Songbook

Songbook is a musician's "second brain": a place to capture, develop, and organize songs — finished or in progress — together with their lyrics, chords, tablatures, reference audio, and images, grouped into collections and synced across devices.

The canonical language of the domain (code, database, API, and this glossary) is **English**. User-facing copy is **Portuguese (PT-BR)**; each term below lists its UI label.

## Language

**Song**:
The central unit of work — one musical idea, with its metadata (title, status, key, BPM, time signature, genre, notes), lyrics, chords, tabs, and media. Owned by a single User.
_PT-BR_: Música
_Avoid_: Track, Tune, Composition

**Status** (of a Song):
Where a song sits in its creative lifecycle: `draft`, `in_progress`, or `finished`.
_PT-BR_: rascunho / em progresso / finalizada
_Avoid_: State, Stage, Phase

**LyricVersion**:
One revision of a song's lyrics, with a label and its own content. A song keeps many versions so older wordings are never lost.
_PT-BR_: Versão de letra
_Avoid_: Draft, Revision, Take

**Primary version**:
The single LyricVersion currently marked as the song's main/current lyrics (`isPrimary`). At most one per song.
_PT-BR_: Versão principal
_Avoid_: Default, Active, Main lyric

**ChordChart**:
Chords for a song stored as structured text (chords aligned to lyrics, or as a block). Rendered in a monospaced font to preserve alignment.
_PT-BR_: Cifra
_Avoid_: Chord sheet, Harmony

**Tablature**:
Instrument tab stored as monospaced ASCII text, optionally tied to an instrument.
_PT-BR_: Tablatura
_Avoid_: Tab sheet, Notation

**MediaAsset**:
An uploaded audio or image file. The binary lives in object storage; the database holds only metadata and the object key. Each asset belongs to exactly one Song or one Collection.
_PT-BR_: Mídia (áudio / imagem)
_Avoid_: File, Attachment, Upload, Blob

**Cover**:
The image MediaAsset chosen to represent a Song or a Collection (`coverMediaId`). At most one per song and per collection.
_PT-BR_: Capa
_Avoid_: Thumbnail, Artwork, Poster

**Collection**:
An ordered grouping of songs the user releases or organizes together. Has its own lifecycle status (`draft`, `in_progress`, `released`).
_PT-BR_: Coleção
_Avoid_: Playlist, Folder, Group

**Album**:
A Collection `type` for a multi-song release.
_PT-BR_: Álbum

**Single**:
A Collection `type` for a one- or two-song release. Structurally identical to an Album (same ordered membership); the distinction is a label, not a constraint.
_PT-BR_: Single

**Tag**:
A free-form user-defined label applied to songs for organization and filtering. Scoped to the owning user; unique by name per user.
_PT-BR_: Tag
_Avoid_: Label, Category, Keyword

**Trash**:
The soft-deleted state of a Song or Collection (`deletedAt` set). Items in the trash can be restored losslessly until they are permanently purged.
_PT-BR_: Lixeira
_Avoid_: Bin, Archive, Recycle
