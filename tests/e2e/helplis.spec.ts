import { expect, test } from "@playwright/test";

test("flujo principal HelPlis MVP", async ({ page, context }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Panel administrador" })).toBeVisible();

  await page.goto("/admin/batches");
  const batchReference = `E2E-BATCH-${Date.now()}`;
  await page.getByLabel("Referencia interna").fill(batchReference);
  await page.getByLabel("Cantidad").fill("1");
  await page.getByRole("button", { name: "Crear lote y dispositivos" }).click();
  await expect(page.getByText(batchReference)).toBeVisible();

  await page.goto("/admin/imports");
  const importCode = `E2E${Date.now().toString().slice(-6)}`;
  const importUid = `04:E2:${Date.now().toString().slice(-2)}:${Math.floor(Math.random() * 90 + 10)}`;
  await page.getByLabel("CSV").fill(`${importCode},https://helplis.cl/p/${importCode},${importUid},WRISTBAND`);
  await page.getByRole("button", { name: "Validar e importar filas válidas" }).click();
  await expect(page.getByText("1 válidas")).toBeVisible();

  await page.goto("/activate/HLP009");
  await page.getByLabel("Código secreto").fill("ACT-HLP009");
  await page.getByLabel("Nombre responsable").fill("Responsable E2E");
  await page.getByLabel("Correo").fill(`e2e-${Date.now()}@example.test`);
  await page.getByLabel("Contraseña").fill("HelPlisDemo123!");
  await page.getByLabel("Nombre visible o alias").fill("Perfil E2E");
  await page.getByLabel("Contacto principal").fill("Contacto E2E");
  await page.getByLabel("Teléfono contacto").fill("+56912345678");
  await page.getByRole("button", { name: "Confirmar activación" }).click();
  await expect(page.getByRole("heading", { name: "Mis dispositivos" })).toBeVisible();
  await expect(page.getByText("HLP009")).toBeVisible();

  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: -33.45, longitude: -70.66 });
  await page.goto("/p/HLP009");
  await expect(page.getByRole("heading", { name: "Perfil E2E" })).toBeVisible();
  await page.getByRole("button", { name: "Compartir mi ubicación con el responsable" }).click();
  await expect(page.getByText("Ubicación compartida")).toBeVisible();

  await page.goto("/dashboard/devices");
  await page.getByRole("button", { name: "Marcar perdido" }).first().click();
  await expect(page.getByText("LOST")).toBeVisible();
  await page.goto("/p/HLP009");
  await expect(page.getByText("Modo perdido")).toBeVisible();

  await page.goto("/dashboard/devices");
  await page.getByRole("button", { name: "Marcar encontrado" }).first().click();
  await expect(page.getByText("FOUND")).toBeVisible();

  await page.goto("/login");
  await page.getByLabel("Correo").fill("admin@demo.helplis.cl");
  await page.getByLabel("Contraseña").fill("HelPlisDemo123!");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Panel administrador" })).toBeVisible();
  await page.goto("/admin/notifications");
  await expect(page.getByRole("heading", { name: "LOCATION_SHARED" }).first()).toBeVisible();
});
