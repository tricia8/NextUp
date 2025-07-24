export type Event = {
    id: string,
    sublistId?: string,
    ownerId: string,
    title: string;
    description: string;
    categories: string[];      
    deadline: string;          
    isCompleted: boolean;      
    createdAt: string;         
}