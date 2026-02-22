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
    cost_per_unit: number;
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

export interface Recipe {
    id: string;
    menu_item_id: string;
    ingredient_id: string;
    quantity_required: number;
    created_at: string;
    ingredient?: Ingredient; // In case we join `ingredients`
}
