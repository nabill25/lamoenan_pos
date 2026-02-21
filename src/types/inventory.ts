export interface IngredientCategory {
    id: string;
    name: string;
    created_at: string;
}

export interface Ingredient {
    id: string;
    name: string;
    unit: string;
    min_stock: number;
    current_stock: number;
    category_id: string | null;
    created_at: string;
    category?: IngredientCategory; // For joined queries
}

export interface StockMovement {
    id: string;
    ingredient_id: string;
    type: 'in' | 'out' | 'adjustment';
    quantity: number;
    notes: string | null;
    created_at: string;
    created_by: string | null;
    ingredient?: Ingredient; // For joined queries
}
