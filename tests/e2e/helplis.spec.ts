import { expect, type Page, test } from "@playwright/test";

async function submitLead(page: Page, pack: "1" | "2" | "3", name: string, expectedPrice: string, primaryUse: string) {
  await page.goto(`/quiero-helplis?pack=${pack}&source=e2e_pack_${pack}`);
  await expect(page.getByRole("heading", { name: "Comprar HelPlis" })).toBeVisible();
  await expect(page.getByText(expectedPrice).first()).toBeVisible();
  await expect(page.getByText("Resumen final")).toBeVisible();
  await expect(page.getByText("Envío: se informa por separado")).toBeVisible();

  await page.getByLabel("Nombre").fill(name);
  await page.getByRole("textbox", { name: "WhatsApp" }).fill("+56912340000");
  await page.getByLabel("Correo opcional").fill(`lead-${pack}-${Date.now()}@example.test`);
  await page.getByLabel("Comuna").fill("Santiago");
  await page.getByLabel("Región").fill("Región Metropolitana");
  await page.getByLabel("Uso principal").selectOption(primaryUse);
  await page.getByLabel("Acepto que HelPlis me contacte").check();
  await page.getByRole("button", { name: "Enviar solicitud de compra" }).click();

  await expect(page.getByText("Solicitud registrada")).toBeVisible();
  await expect(page.getByText(expectedPrice).first()).toBeVisible();
  await expect(page.getByText("Envío: pendiente por separado")).toBeVisible();
  await expect(page.getByRole("link", { name: "Abrir WhatsApp" })).toHaveAttribute("href", /wa\.me\/56988455230/);
}

test("flujo principal HelPlis MVP", async ({ page, context }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Si se pierde, ayúdale a volver." })).toBeVisible();
  await expect(page.getByText("Desde").first()).toBeVisible();
  await expect(page.getByText("$18.000").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Elige tu HelPlis" })).toBeVisible();
  await expect(page.getByText("¿Tiene costo mensual?")).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Comprar", exact: true })).toBeVisible();
  await page.locator("summary").click();
  await expect(page.getByRole("link", { name: "Activar", exact: true })).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto("/");
  await page.getByRole("link", { name: "Elegir pack de 2" }).click();
  await expect(page).toHaveURL(/pack=2/);
  await expect(page.getByText("Pack 2 HelPlis").first()).toBeVisible();
  await expect(page.getByText("$28.000").first()).toBeVisible();

  await submitLead(page, "2", "Lead Pack 2", "$28.000", "adulto_mayor");
  await submitLead(page, "1", "Lead Pack 1", "$18.000", "niño");
  await submitLead(page, "3", "Lead Pack 3", "$35.000", "persona_asistencia");

  await page.goto("/login");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Panel administrador" })).toBeVisible();

  await page.goto("/admin/leads");
  await expect(page.getByRole("heading", { name: "Leads comerciales" })).toBeVisible();
  await expect(page.getByText("Lead Pack 3")).toBeVisible();
  await expect(page.getByText("Pack 3 HelPlis").first()).toBeVisible();
  await expect(page.getByText("Pendiente").first()).toBeVisible();

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
  await expect(page.getByRole("heading", { name: "PURCHASE_INTENT_CREATED" }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "LOCATION_SHARED" }).first()).toBeVisible();
});
