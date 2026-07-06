/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SongListDto = {
    items: Array<{
        id: string;
        title: string;
        status: 'draft' | 'in_progress' | 'finished';
        key: string | null;
        bpm: number | null;
        timeSignature: string | null;
        genre: string | null;
        notes: string | null;
        isFavorite: boolean;
        coverMediaId: string | null;
        createdAt: string;
        updatedAt: string;
        deletedAt: string | null;
    }>;
    total: number;
    page: number;
    pageSize: number;
};

