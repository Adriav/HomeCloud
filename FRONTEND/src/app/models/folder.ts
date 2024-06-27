export interface Folder {
    _id?: string;
    name: string;
    owner: string;
    parent: string;
    public: boolean;
    createdAt?: string;
    updatedAt?: string;
}