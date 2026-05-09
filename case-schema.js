(() => {
  const REQUIRED_CASE_FIELDS = [
    "number",
    "title",
    "shortTitle",
    "type",
    "difficulty",
    "image",
    "imageAlt",
    "assetRefs",
    "client",
    "evidenceIds",
    "requiredReport",
    "reportStructure",
    "hbuMatrix",
    "auditCriteria",
    "adjustmentBands",
    "rebuttalOptions",
    "marketScenarios",
  ];

  const REQUIRED_PHASE_COLLECTIONS = [
    "caseHotspots",
    "caseDecoyHotspots",
    "caseDocumentPanels",
    "caseDocumentIssues",
    "caseDocumentDecoys",
    "caseMechanics",
  ];

  const REQUIRED_HBU_ROWS = ["法的可能性", "物理的可能性", "市場性", "収益性・経済合理性"];

  function validateCaseData(data, manifest = null, options = {}) {
    const errors = [];
    const mode = options.mode ?? "production";
    const caseDefinitions = data?.caseDefinitions ?? {};
    const evidenceCatalog = data?.evidenceCatalog ?? {};
    const manifestAssets = manifest?.assets ? new Map(manifest.assets.map((asset) => [asset.file, asset])) : null;

    for (const collection of REQUIRED_PHASE_COLLECTIONS) {
      if (!data?.[collection]) errors.push(`${collection} is missing`);
    }

    validateManifest(manifest, errors);

    for (const [caseId, info] of Object.entries(caseDefinitions)) {
      for (const field of REQUIRED_CASE_FIELDS) {
        if (info[field] === undefined) errors.push(`${caseId}.${field} is missing`);
      }
      if (!nonEmptyString(info.imageAlt)) errors.push(`${caseId}.imageAlt must be a non-empty string`);
      validateAssetRefs(caseId, info, manifestAssets, mode, errors);
      validateClient(caseId, info.client, errors);
      validateReportStructure(caseId, info.reportStructure, errors);
      validateHbuMatrix(caseId, info.hbuMatrix, errors);
      validateAuditCriteria(caseId, info.auditCriteria, errors);
      for (const id of info.evidenceIds ?? []) {
        if (!evidenceCatalog[id]) errors.push(`${caseId}.evidenceIds references missing evidence ${id}`);
      }
      for (const id of info.requiredReport ?? []) {
        if (!evidenceCatalog[id]) errors.push(`${caseId}.requiredReport references missing evidence ${id}`);
      }
      if (!Array.isArray(info.adjustmentBands) || info.adjustmentBands.length < 2) {
        errors.push(`${caseId}.adjustmentBands must include at least two choices`);
      }
      if (!Array.isArray(info.rebuttalOptions) || info.rebuttalOptions.length < 2) {
        errors.push(`${caseId}.rebuttalOptions must include at least two choices`);
      }
    }

    return {
      ok: errors.length === 0,
      errors,
      caseCount: Object.keys(caseDefinitions).length,
    };
  }

  function validateClient(caseId, client, errors) {
    if (!client || typeof client !== "object") {
      errors.push(`${caseId}.client must be an object`);
      return;
    }
    if (!nonEmptyString(client.name)) errors.push(`${caseId}.client.name must be a non-empty string`);
    if (!nonEmptyString(client.portrait) && !nonEmptyString(client.portraitClass)) {
      errors.push(`${caseId}.client must include portrait or portraitClass`);
    }
  }

  function validateAssetRefs(caseId, info, manifestAssets, mode, errors) {
    const refs = info.assetRefs;
    if (!refs || typeof refs !== "object") {
      errors.push(`${caseId}.assetRefs must be an object`);
      return;
    }
    for (const key of ["fieldImage", "clientPortrait"]) {
      if (!nonEmptyString(refs[key])) errors.push(`${caseId}.assetRefs.${key} must be a non-empty string`);
      else if (manifestAssets && !manifestAssets.has(refs[key])) errors.push(`${caseId}.assetRefs.${key} missing from assets-manifest.json: ${refs[key]}`);
    }
    const imageRef = normalizeAssetRef(info.image);
    if (mode === "production" && refs.fieldImage && !imageRef.startsWith("assets/")) {
      errors.push(`${caseId}.image must reference a local assets/ file in production mode: ${info.image}`);
    }
    if (refs.fieldImage && imageRef.startsWith("assets/") && refs.fieldImage !== imageRef) {
      errors.push(`${caseId}.assetRefs.fieldImage must match image (${refs.fieldImage} !== ${imageRef})`);
    }
  }

  function validateManifest(manifest, errors) {
    if (!manifest?.assets) return;
    for (const asset of manifest.assets) {
      if (!nonEmptyString(asset.file)) errors.push("assets-manifest asset.file must be a non-empty string");
      if (!nonEmptyString(asset.sha256) || !/^[a-f0-9]{64}$/.test(asset.sha256)) {
        errors.push(`${asset.file ?? "unknown asset"}.sha256 must be a 64-character lowercase hex digest`);
      }
      for (const key of ["width", "height", "bytes"]) {
        if (!Number.isInteger(asset[key]) || asset[key] <= 0) errors.push(`${asset.file}.${key} must be a positive integer`);
      }
      for (const key of ["reviewStatus", "reviewedAt", "reviewer", "aiDisclosureCategory"]) {
        if (!nonEmptyString(asset[key])) errors.push(`${asset.file}.${key} must be a non-empty string`);
      }
      for (const key of ["generationPath", "promptHash", "selectedBy", "selectionReason"]) {
        if (!nonEmptyString(asset[key])) errors.push(`${asset.file}.${key} must be a non-empty string`);
      }
      if (asset.prompt !== undefined) errors.push(`${asset.file}.prompt must not be present in public assets-manifest.json`);
      if (asset.sourceArtifactPath !== undefined) {
        errors.push(`${asset.file}.sourceArtifactPath must not be present in public assets-manifest.json`);
      }
      if (typeof asset.storeUseAllowed !== "boolean") errors.push(`${asset.file}.storeUseAllowed must be boolean`);
    }
  }

  function validateReportStructure(caseId, structure, errors) {
    if (!structure || typeof structure !== "object") {
      errors.push(`${caseId}.reportStructure must be an object`);
      return;
    }
    for (const key of ["fact", "analysis", "conclusion"]) {
      if (!Array.isArray(structure[key]) || structure[key].length === 0) {
        errors.push(`${caseId}.reportStructure.${key} must include at least one evidence id`);
      }
    }
  }

  function validateHbuMatrix(caseId, matrix, errors) {
    if (!matrix || typeof matrix !== "object") {
      errors.push(`${caseId}.hbuMatrix must be an object`);
      return;
    }
    if (!nonEmptyString(matrix.title)) errors.push(`${caseId}.hbuMatrix.title must be a non-empty string`);
    if (!nonEmptyString(matrix.lead)) errors.push(`${caseId}.hbuMatrix.lead must be a non-empty string`);
    if (!nonEmptyString(matrix.conclusion)) errors.push(`${caseId}.hbuMatrix.conclusion must be a non-empty string`);
    const labels = new Set((matrix.rows ?? []).map((row) => row?.[0]));
    for (const label of REQUIRED_HBU_ROWS) {
      if (!labels.has(label)) errors.push(`${caseId}.hbuMatrix.rows must include ${label}`);
    }
  }

  function validateAuditCriteria(caseId, criteria, errors) {
    if (!criteria || typeof criteria !== "object") {
      errors.push(`${caseId}.auditCriteria must be an object`);
      return;
    }
    for (const key of ["focus", "risk", "comment"]) {
      if (!nonEmptyString(criteria[key])) errors.push(`${caseId}.auditCriteria.${key} must be a non-empty string`);
    }
    if (!Array.isArray(criteria.requiredEvidence) || criteria.requiredEvidence.length === 0) {
      errors.push(`${caseId}.auditCriteria.requiredEvidence must include at least one evidence id`);
    }
  }

  function normalizeAssetRef(value = "") {
    return String(value).replace(/^\.\//, "");
  }

  function nonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  window.APPRAISAL_CASE_SCHEMA = {
    REQUIRED_CASE_FIELDS,
    REQUIRED_HBU_ROWS,
    validateCaseData,
  };
})();
