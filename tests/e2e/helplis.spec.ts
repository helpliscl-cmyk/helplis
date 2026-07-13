import { expect, type Page, test } from "@playwright/test";

async function submitLead(page: Page, pack: "1" | "2" | "3", name: string, expectedPrice: string, primaryUse: string) {
  await page.goto(`/quiero-helplis?pack=${pack}&source=e2e_pack_${pack}`);
  await expect(page.getByRole("heading", { name: "Comprar HelPlis" })).toBeVisible();
  await expect(page.getByText(expectedPrice).first()).toBeVisible();
  await expect(page.getByText("Resumen final")).toBeVisible();
  await expect(page.getByText("Envio: se coordina al cierre")).toBeVisible();

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
  await expect(page.getByText("Envio: se coordina al cierre")).toBeVisible();
  await expect(page.getByRole("link", { name: "Abrir WhatsApp" })).toHaveAttribute("href", /wa\.me\/56988455230/);
}

async function loginAs(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel(/Contrase/i).fill("HelPlisDemo123!");
  await Promise.all([
    page.waitForURL(/\/(dashboard|admin)/),
    page.getByRole("button", { name: "Entrar" }).click(),
  ]);
}

test("flujo principal HelPlis MVP", async ({ page, context }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Si necesita ayuda, que sepan a quien llamar." })).toBeVisible();
  await expect(page.getByText("Desde").first()).toBeVisible();
  await expect(page.getByText("$18.000").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Elige tu HelPlis" })).toBeVisible();
  await expect(page.getByText("Tiene costo mensual?")).toBeVisible();

  await page.goto("/p/HLP010");
  await expect(page.getByRole("heading", { name: "Esta pulsera todavia no ha sido activada." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Iniciar activacion" })).toHaveAttribute("href", "/activate/HLP010");

  await page.goto("/p/HLP001");
  await expect(page.getByRole("heading", { name: "Mati" })).toBeVisible();
  await expect(page.getByText("Estoy con una pulsera HelPlis")).toBeVisible();

  await page.goto("/activate/HLP001");
  await expect(page.getByText("Esta HelPlis ya está activada.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Ver perfil de ayuda" })).toHaveAttribute("href", "/p/HLP001");
  await expect(page.getByRole("link", { name: "Administrar HelPlis" })).toHaveAttribute("href", "/dashboard/devices/HLP001");
  const activeValidation = await page.request.post("/api/activation/validate", { data: { publicCode: "HLP001" } });
  expect(activeValidation.status()).toBe(409);
  const activePayload = await activeValidation.json();
  expect(activePayload).toMatchObject({
    state: "ACTIVE",
    publicProfileUrl: "/p/HLP001",
    managementUrl: "/dashboard/devices/HLP001",
  });
  expect(JSON.stringify(activePayload)).not.toMatch(/ownerId|email|phone|productType|ACTIVATED/);

  await page.goto("/p/HLP013");
  await expect(page.getByRole("heading", { name: "Esta HelPlis no se encuentra disponible temporalmente." })).toBeVisible();
  await expect(page.getByText("No podemos mostrar informacion personal")).toBeVisible();
  await expect(page.getByRole("link", { name: "Contactar soporte" })).toBeVisible();

  await page.goto("/p/HLP014");
  await expect(page.getByRole("heading", { name: "Esta HelPlis no se encuentra disponible." })).toBeVisible();
  await expect(page.getByText("No podemos mostrar informacion personal")).toBeVisible();

  await page.goto("/activate/BAD1");
  await expect(page.getByRole("heading", { name: "No pudimos identificar esta HelPlis." })).toBeVisible();
  const invalidValidation = await page.request.post("/api/activation/validate", { data: { publicCode: "BAD1" } });
  expect(invalidValidation.status()).toBe(404);
  expect(await invalidValidation.json()).toMatchObject({ state: "INVALID" });

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
  await submitLead(page, "1", "Lead Pack 1", "$18.000", "nino");
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
  const importSuffix = `${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
  const importCode = `E2E${importSuffix}`;
  const importUid = `04:E2:${importSuffix.slice(-4, -2)}:${importSuffix.slice(-2)}`;
  await page.getByLabel("Archivo / nombre lógico").fill(`e2e-${importCode}.csv`);
  await page.locator('textarea[name="csv"]').fill(`${importCode},https://helplis.cl/p/${importCode},${importUid},WRISTBAND`);
  await page.getByRole("button", { name: "Validar e importar filas válidas" }).click();
  await expect(page.getByRole("heading", { name: `e2e-${importCode}.csv` })).toBeVisible();
  await expect(page.getByText("1 válidas")).toBeVisible();
  await expect(page.getByText(`Fila 1: ${importCode}`)).toBeVisible();

  await loginAs(page, "familia@demo.helplis.cl");
  await page.goto("/dashboard/devices/HLP001");
  await expect(page.getByRole("heading", { name: "Administrar HelPlis" })).toBeVisible();
  await expect(page.getByText("HLP001").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Asignar a otra persona" })).toBeVisible();

  await loginAs(page, "usuario@demo.helplis.cl");
  await page.goto("/dashboard/devices/HLP001");
  await expect(page.getByText("No tienes permisos para administrar esta HelPlis.")).toBeVisible();
  await expect(page.getByText("Mateo")).not.toBeVisible();

  await page.goto("/activate/HLP009");
  await page.getByLabel("Codigo secreto").fill("ACT-HLP009");
  await page.getByLabel("Nombre completo").fill("Responsable E2E");
  await page.locator('input[name="ownerPhoneLocal"]').fill("12345678");
  await page.getByLabel("Correo").fill(`e2e-${Date.now()}@example.test`);
  await page.getByLabel("Contrasena").fill("HelPlisDemo123!");
  await page.getByLabel("Acepto los terminos").check();
  await page.getByLabel("Confirmo que estoy autorizado").check();
  await page.getByRole("button", { name: "Continuar" }).click();

  await page.locator('input[type="file"]').first().setInputFiles("public/brand/optimized/helplis-social-icon.png");
  await expect(page.getByText("Foto cargada")).toBeVisible();
  await page.locator('input[name="displayName"]').fill("Perfil E2E");
  await page.getByRole("button", { name: "Continuar" }).click();

  await page.locator('input[name="contactName"]').fill("Contacto E2E");
  await page.locator('input[name="contactPhoneLocal"]').fill("12345678");
  await expect(page.locator('select[name="contactRelationshipCode"]')).toHaveValue("MOTHER");
  await page.getByRole("button", { name: "Continuar" }).click();

  await page.locator('input[name="contact2Name"]').fill("Contacto Secundario E2E");
  await page.locator('input[name="contact2PhoneLocal"]').fill("87654321");
  await expect(page.locator('select[name="contact2RelationshipCode"]')).toHaveValue("FATHER");
  await page.getByRole("button", { name: "Continuar" }).click();

  await page.getByText("Agregar informacion critica").click();
  await page.locator('textarea[name="criticalInformation"]').fill("Puede desorientarse y necesita permanecer acompanado.");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByText("Informacion importante")).not.toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Confirmar activacion" }).click();
  await expect(page.getByRole("heading", { name: "Mis dispositivos" })).toBeVisible();
  await expect(page.getByText("HLP009")).toBeVisible();
  const usedCodeValidation = await page.request.post("/api/activation/validate", { data: { publicCode: "HLP009" } });
  expect(usedCodeValidation.status()).toBe(409);
  expect(await usedCodeValidation.json()).toMatchObject({ state: "ACTIVE", publicProfileUrl: "/p/HLP009" });

  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: -33.45, longitude: -70.66 });
  await page.goto("/p/HLP009");
  await expect(page.getByRole("heading", { name: "Perfil E2E" })).toBeVisible();
  expect(await page.content()).not.toContain("+56912345678");
  expect(await page.content()).not.toContain("Puede desorientarse");
  await page.getByRole("button", { name: "Compartir mi ubicacion con el responsable" }).click();
  await expect(page.getByText("Ubicacion compartida")).toBeVisible();

  await page.goto("/dashboard/privacy");
  await page.getByLabel("Mostrar informacion critica").check();
  await page.getByRole("button", { name: "Guardar privacidad" }).click();
  await expect(page).toHaveURL(/saved=1/);
  await page.goto("/p/HLP009");
  await expect(page.getByText("Informacion importante")).toBeVisible();
  await expect(page.getByText("Puede desorientarse")).toBeVisible();

  await page.goto("/dashboard/devices/HLP009");
  await expect(page.getByRole("heading", { name: "Administrar HelPlis" })).toBeVisible();
  await expect(page.getByText("ACTIVE")).toBeVisible();
  await expect(page.getByText("04:DE:MO:009")).toBeVisible();
  await expect(page.getByText("Escaneos conservados")).toBeVisible();
  const reassignForm = page.locator("form").filter({ hasText: "Crear nuevo perfil" });
  await reassignForm.getByLabel("Nombre visible").fill("Perfil Reasignado E2E");
  await reassignForm.getByLabel("Mensaje de ayuda").fill("Esta persona usa una HelPlis reasignada.");
  await reassignForm.getByRole("button", { name: "Crear perfil y asignar" }).click();
  await expect(page).toHaveURL(/confirmation_required/);

  const confirmedReassignForm = page.locator("form").filter({ hasText: "Crear nuevo perfil" });
  await confirmedReassignForm.getByLabel("Nombre visible").fill("Perfil Reasignado E2E");
  await confirmedReassignForm.getByLabel("Mensaje de ayuda").fill("Esta persona usa una HelPlis reasignada.");
  await confirmedReassignForm.getByLabel("Motivo opcional").fill("Cambio de persona para prueba E2E.");
  await confirmedReassignForm.getByLabel("Confirmo que quiero reasignar").check();
  await confirmedReassignForm.getByRole("button", { name: "Crear perfil y asignar" }).click();
  await expect(page).toHaveURL(/reassigned=1/);
  await expect(page.getByText("Reasignacion guardada con auditoria")).toBeVisible();
  await expect(page.getByText("HLP009").first()).toBeVisible();
  await expect(page.getByText("04:DE:MO:009")).toBeVisible();
  await expect(page.getByText("REASSIGNED")).toBeVisible();
  await expect(page.getByText("Escaneos conservados")).toBeVisible();

  await page.goto("/p/HLP009");
  await expect(page.getByRole("heading", { name: "Perfil Reasignado E2E" })).toBeVisible();
  await expect(page.getByText("Esta persona usa una HelPlis reasignada.")).toBeVisible();
  expect(await page.content()).not.toContain("Puede desorientarse");

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
  await page.goto("/admin/devices");
  await page.locator("section").filter({ hasText: "HLP009" }).first().getByRole("button", { name: "Suspender" }).click();
  await expect(page).toHaveURL(/status=updated/);
  await page.goto("/p/HLP009");
  await expect(page.getByRole("heading", { name: "Esta HelPlis no se encuentra disponible temporalmente." })).toBeVisible();
  await expect(page.getByText("Perfil Reasignado E2E")).not.toBeVisible();
  await page.goto("/admin/devices");
  await page.locator("section").filter({ hasText: "HLP009" }).first().getByRole("button", { name: "Reactivar" }).click();
  await expect(page).toHaveURL(/status=updated/);
  await page.goto("/p/HLP009");
  await expect(page.getByRole("heading", { name: "Perfil Reasignado E2E" })).toBeVisible();
  await page.goto("/admin/audit");
  await expect(page.getByRole("heading", { name: "DEVICE_PROFILE_REASSIGNED" }).first()).toBeVisible();
  await expect(page.getByText("HLP009").first()).toBeVisible();
  await expect(page.getByText("DEVICE_MANAGEMENT_FORBIDDEN").first()).toBeVisible();
  await page.goto("/admin/notifications");
  await expect(page.getByRole("heading", { name: "PURCHASE_INTENT_CREATED" }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "LOCATION_SHARED" }).first()).toBeVisible();
});
