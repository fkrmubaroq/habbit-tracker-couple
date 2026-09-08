import { Router } from "express";
import {
  getGroceryItems,
  createGroceryItem,
  updateGroceryItem,
  toggleGroceryItem,
  deleteGroceryItem,
  clearCompletedGroceryItems,
} from "./grocery.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  createGroceryItemSchema,
  updateGroceryItemSchema,
  toggleGroceryItemSchema,
  groceryIdParamSchema,
} from "./grocery.schema.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getGroceryItems);
router.post("/", validate(createGroceryItemSchema), createGroceryItem);
router.put("/:id", validate(updateGroceryItemSchema), updateGroceryItem);
router.patch("/:id/toggle", validate(toggleGroceryItemSchema), toggleGroceryItem);
router.delete("/:id", validate(groceryIdParamSchema), deleteGroceryItem);
router.post("/clear-completed", clearCompletedGroceryItems);

export default router;
