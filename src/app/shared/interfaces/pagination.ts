export interface Page<T> {
    content: T[];
    page: {
        totalElements: number;
        totalPages: number;
        size: number;
        number: number;
    };
}
