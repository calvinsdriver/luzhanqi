/**
 * Shared sizing constants for the board SVG and its piece tokens. The board is
 * intentionally stretched horizontally (CELL_X > CELL_Y) - wider, not taller - so piece
 * tokens have room to be wide rectangles that can actually hold a full piece title
 * ("Brigadier General") instead of a cramped square. Node positions are otherwise on the
 * same integer grid as before; only the horizontal axis's pixels-per-unit changes.
 */
export const CELL_Y = 40;
export const HORIZONTAL_STRETCH = 1.55;
export const CELL_X = CELL_Y * HORIZONTAL_STRETCH;

export const TOKEN_WIDTH = CELL_X * 0.8;
export const TOKEN_HEIGHT = CELL_Y * 0.9;
