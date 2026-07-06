/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CollectionListDto = {
    items: Array<{
        id: string;
        type: 'album' | 'single';
        title: string;
        description: string | null;
        status: 'draft' | 'in_progress' | 'released';
        coverMediaId: string | null;
        createdAt: string;
        updatedAt: string;
        deletedAt: string | null;
    }>;
    total: number;
    page: number;
    pageSize: number;
};

