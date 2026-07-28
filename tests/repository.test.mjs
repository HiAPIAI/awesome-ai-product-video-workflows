import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateRepository } from "../scripts/validate-repository.mjs";

const workflows = JSON.parse(
  await readFile(new URL("../data/workflows.json", import.meta.url), "utf8"),
).workflows;
const projects = JSON.parse(
  await readFile(new URL("../data/projects.json", import.meta.url), "utf8"),
).projects;

test("repository validation passes", async () => {
  const result = await validateRepository();
  assert.equal(result.ok, true, result.errors.join("\n"));
});

test("the production path covers six distinct search intents", () => {
  assert.equal(workflows.length, 6);
  assert.equal(new Set(workflows.map((workflow) => workflow.slug)).size, 6);
  assert.equal(new Set(workflows.map((workflow) => workflow.keyword_en)).size, 6);
});

test("every workflow is fully bilingual and has five reviewable steps", () => {
  for (const workflow of workflows) {
    assert.ok(workflow.title_en);
    assert.ok(workflow.title_zh);
    assert.ok(workflow.description_en);
    assert.ok(workflow.description_zh);
    assert.equal(workflow.steps.length, 5);
    for (const step of workflow.steps) {
      assert.ok(step.title_en && step.body_en && step.title_zh && step.body_zh);
    }
  }
});

test("open-source research records licenses and adoption boundaries", () => {
  assert.ok(projects.length >= 10);
  assert.ok(projects.some((project) => project.stars > 50_000));
  for (const project of projects) {
    assert.match(project.url, /^https:\/\/github\.com\//);
    assert.ok(project.license);
    assert.ok(["workflow-reference", "method-only"].includes(project.adoption));
  }
});

test("the public product brief keeps rights, cost, and publication unconfirmed", async () => {
  const brief = JSON.parse(
    await readFile(
      new URL("../templates/product-brief.example.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(brief.rights.product_media_authorized, false);
  assert.equal(brief.rights.brand_assets_authorized, false);
  assert.equal(brief.cost_confirmation, false);
  assert.equal(brief.publication_authorized, false);
});
