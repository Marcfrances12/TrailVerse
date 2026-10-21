const { z } = require("zod");

const PERMISOS = [
  "read",
  "manage_rutas",
  "manage_departures",
  "manage_hosts",
  "manage_categories",
  "manage_locations",
  "manage_users",
  "manage_roles",
  "all"
];

const idParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "ID de MongoDB no válido")
});

const createRoleSchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50)
    .regex(/^[a-z0-9_]+$/, "El nombre solo puede tener minúsculas, números y guiones bajos"),
  permissions: z.array(z.enum(PERMISOS, { error: "Permiso no válido" }), {
    error: "permissions debe ser un array de permisos"
  }).default([])
});

const updateRoleSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(50)
      .regex(/^[a-z0-9_]+$/, "El nombre solo puede tener minúsculas, números y guiones bajos")
      .optional(),
    permissions: z.array(z.enum(PERMISOS, { error: "Permiso no válido" })).optional()
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "Debes proporcionar al menos un campo para actualizar"
  );

const listRolesQuerySchema = z.object({
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === "true"))
});

module.exports = { idParamSchema, createRoleSchema, updateRoleSchema, listRolesQuerySchema, PERMISOS };
