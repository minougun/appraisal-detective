(() => {
  const data = window.APPRAISAL_CASE_DATA;
  if (!data) return;

  function addCase(spec) {
    const ids = {
      price: `${spec.prefix}PricePoint`,
      subject: `${spec.prefix}Subject`,
      method: `${spec.prefix}Method`,
      adjustment: `${spec.prefix}Adjustment`,
    };
    const spotIds = spec.spots.map((spot) => spot.id);
    const docIds = spec.documents.map((doc) => doc.id);

    Object.assign(data.evidenceCatalog, {
      [ids.price]: {
        term: "価格時点",
        title: spec.priceTitle,
        detail: spec.priceDetail,
        scores: { appraisal: 6, ethics: 4 },
      },
      [ids.subject]: {
        term: "対象不動産の確定",
        title: spec.subjectTitle,
        detail: spec.subjectDetail,
        scores: { appraisal: 7, reasoning: 2 },
      },
      [ids.method]: {
        term: spec.methodTerm,
        title: spec.methodTitle,
        detail: spec.methodDetail,
        scores: { appraisal: 12, reasoning: 6 },
      },
      [ids.adjustment]: {
        term: spec.adjustmentTerm,
        title: spec.adjustmentTitle,
        detail: spec.adjustmentDetail,
        scores: { appraisal: 12, reasoning: 5, ethics: 3 },
      },
    });

    spec.spots.forEach((spot) => {
      data.evidenceCatalog[spot.id] = {
        term: spot.term,
        title: spot.title,
        detail: spot.detail,
        scores: spot.scores ?? { investigation: 8, appraisal: 4 },
      };
    });
    spec.documents.forEach((doc) => {
      data.evidenceCatalog[doc.id] = {
        term: doc.term,
        title: doc.evidenceTitle ?? doc.title,
        detail: doc.detail,
        scores: doc.scores ?? { reasoning: 9, appraisal: 7, ethics: 2 },
      };
    });

    data.caseHotspots[spec.caseId] = spec.spots.map((spot, index) => ({
      id: spot.id,
      label: String(index + 1),
      x: spot.x,
      y: spot.y,
    }));
    data.caseDecoyHotspots[spec.caseId] = spec.decoySpots;
    data.caseDocumentPanels[spec.caseId] = spec.panels;
    data.caseDocumentIssues[spec.caseId] = spec.documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      detail: doc.detail,
    }));
    data.caseDocumentDecoys[spec.caseId] = spec.decoyDocuments;
    data.caseMechanics[spec.caseId] = spec.mechanic;
    data.caseDefinitions[spec.caseId] = {
      number: `案件 ${spec.number}`,
      title: `${spec.shortTitle} / ${spec.subtitle}`,
      shortTitle: spec.shortTitle,
      subtitle: spec.subtitle,
      type: spec.type,
      badge: spec.badge,
      description: spec.description,
      mentorStart: spec.mentorStart,
      difficulty: spec.difficulty ?? {
        label: spec.badge?.split(" / ")[0] ?? "商用編",
        code: classCodeFromBadge(spec.badge),
        summary: spec.description,
      },
      image: spec.image,
      fallbackImage: spec.fallbackImage,
      imageAlt: spec.imageAlt,
      assetRefs: {
        fieldImage: assetRefFromPath(spec.image),
        clientPortrait: spec.client?.portrait ? assetRefFromPath(spec.client.portrait) : portraitAssetForClass(spec.client?.portraitClass),
      },
      client: spec.client,
      intake: spec.intake,
      intakeEvidence: {
        pricePoint: ids.price,
        subject: ids.subject,
        priceMessage: spec.priceMessage,
        subjectMessage: spec.subjectMessage,
      },
      evidenceIds: [ids.price, ids.subject, ...spotIds, ...docIds, ids.method, ids.adjustment],
      requiredReport: [docIds[0], docIds[1], ids.adjustment],
      reportStructure: {
        fact: [docIds[0], spotIds[0], spotIds[1], ids.subject],
        analysis: [docIds[1], docIds[2], ids.method, spotIds[2]],
        conclusion: [ids.adjustment, ids.price, spotIds[3], spotIds[4]],
      },
      highValueCards: [docIds[0], docIds[1], docIds[2], ids.method, ids.adjustment, spotIds[0], spotIds[2]],
      appraisalEvidence: {
        method: ids.method,
        adjustment: ids.adjustment,
        methodMessage: spec.methodMessage,
        adjustmentMessage: spec.adjustmentMessage,
      },
      appraisalCopy: spec.appraisalCopy,
      adjustmentBands: makeAdjustmentBands(spec, ids, spotIds, docIds),
      rebuttalOptions: makeRebuttalOptions(spec, docIds),
      clientRebuttals: spec.clientRebuttals,
      reportPressure: spec.reportPressure,
      marketScenarios: spec.marketScenarios,
      hbuMatrix: spec.hbuMatrix ?? makeHbuMatrix(spec),
      auditCriteria: spec.auditCriteria ?? makeAuditCriteria(spec, ids, spotIds, docIds),
      tutorials: spec.tutorials,
      replayGoal: spec.replayGoal,
    };
  }

  function classCodeFromBadge(badge = "") {
    if (badge.includes("エキスパート")) return "Expert";
    if (badge.includes("ハード")) return "Hard";
    if (badge.includes("ノーマル")) return "Normal";
    return "Commercial";
  }

  function assetRefFromPath(value = "") {
    return String(value).replace(/^\.\//, "");
  }

  function portraitAssetForClass(portraitClass = "") {
    const map = {
      "portrait-ehara": "assets/ehara-client.generated.png",
      "portrait-kubo": "assets/kubo-client.generated.png",
      "portrait-segawa": "assets/segawa-client.generated.png",
      "portrait-tachibana": "assets/tachibana-client.generated.png",
      "portrait-hayami": "assets/hayami-client.generated.png",
      "portrait-onuki": "assets/onuki-client.generated.png",
      "portrait-kanzaki": "assets/kanzaki-client.generated.png",
    };
    return map[portraitClass] ?? "";
  }

  function makeHbuMatrix(spec) {
    const manual = manualHbuMatrix(spec);
    if (manual) return manual;
    const topic = spec.topic ?? spec.shortTitle;
    const riskTerm = spec.adjustmentTerm ?? "価格形成要因";
    return {
      title: "最有効使用の前提確認",
      lead: `${spec.shortTitle}では、${topic}として成立する用途・権利・運営前提を確認してから価格手法へ進む。`,
      rows: [
        ["法的可能性", `${spec.type}として扱うため、契約・規制・権利制限を先に閉じる。`],
        ["物理的可能性", `${spec.spots?.[0]?.title ?? spec.spots?.[0] ?? "現地で拾った制約"}を、利用可能性と費用負担に反映する。`],
        ["市場性", `${spec.description} 市場参加者が見る買主層・処分期間・運営安定性を確認する。`],
        ["収益性・経済合理性", `${spec.methodTerm}と${riskTerm}を関連づけ、依頼者説明ではなく実現可能な利用を前提にする。`],
      ],
      conclusion: `結論: ${topic}としての最有効使用を前提に、${spec.methodTitle}を主軸として${riskTerm}を価格判断へ接続する。`,
    };
  }

  function makeAuditCriteria(spec, ids, spotIds, docIds) {
    const manual = manualAuditCriteria(spec, ids, spotIds, docIds);
    if (manual) return manual;
    return {
      focus: `${spec.topic ?? spec.shortTitle}で、${spec.methodTerm}と${spec.adjustmentTerm}が事実・分析・結論の順に接続しているか。`,
      risk: `依頼者の「${spec.pressureWord ?? "希望"}」へ寄せ、${spec.adjustmentTitle}を注記だけで済ませていないか。`,
      comment: `監査では、${docIds[0]}を事実、${docIds[1]}を分析、${ids.adjustment}を結論として提示できたかを見る。`,
      requiredEvidence: [docIds[0], docIds[1], ids.adjustment],
      supportingEvidence: [spotIds[0], spotIds[2], ids.method],
    };
  }

  function manualHbuMatrix(spec) {
    const matrices = {
      case004: {
        title: "担保評価の最有効使用と処分可能性",
        lead: "港北工場跡地では、工場継続・更地化・物流転用のうち、汚染調査と接道条件を前提に市場で実現可能な利用を選別する。",
        rows: [
          ["法的可能性", "工業系用途は可能だが、土壌汚染対策と近隣住宅への操業影響を無視した用途は採れない。"],
          ["物理的可能性", "地下埋設物、旧タンク、搬入口の片側一方向制約により、大型物流転用は改修費を伴う。"],
          ["市場性", "更地化済み工場地の成約が中心で、調査未了物件は買主が限定され処分期間が伸びやすい。"],
          ["収益性・経済合理性", "正常価格を先に置き、担保余力は掛目と処分リスクとして別枠で説明する。"],
        ],
        conclusion: "結論: 土壌調査未了の工場地として継続・更地化両面を見つつ、担保評価では正常価格と換金性リスクを分離する。",
      },
      case005: {
        title: "借地権付建物の最有効使用と譲渡可能性",
        lead: "青葉台借地権付建物では、所有権戸建てではなく、借地契約・譲渡承諾・増改築制限を前提に利用可能性を判断する。",
        rows: [
          ["法的可能性", "譲渡承諾、更新、増改築承諾が必要で、未承諾増築を普通の戸建て同様には扱えない。"],
          ["物理的可能性", "建物老朽化、私道通行、増築部の状態により、買主が改修・再建築を自由に選べない。"],
          ["市場性", "借地権付建物の買主層は、地主交渉と住宅ローン条件を受け入れる層に限定される。"],
          ["収益性・経済合理性", "借地権割合だけでなく、承諾料・地代・残存契約条件を価格に接続する。"],
        ],
        conclusion: "結論: 借地契約上の制約を前提に、譲渡承諾と市場性減価を織り込んだ利用が最有効使用となる。",
      },
      case006: {
        title: "底地の最有効使用と買主限定性",
        lead: "白浜通り底地では、更地としての自由利用ではなく、地代収受権と借地人交渉を前提に保有・売却可能性を評価する。",
        rows: [
          ["法的可能性", "借地契約が存続し、所有者が自由に更地化・再開発できる前提は採れない。"],
          ["物理的可能性", "借地人建物、境界塀、私道負担があり、土地所有者だけで物理的利用を変更しにくい。"],
          ["市場性", "買主は借地人、隣接所有者、底地投資家に限定され、一般更地市場より流動性が低い。"],
          ["収益性・経済合理性", "地代収入、更新料可能性、買取交渉コストを関連づけて底地価格を説明する。"],
        ],
        conclusion: "結論: 地代収受を前提にした保有または限定市場での売却が中心で、市場性減価を明示する。",
      },
      case007: {
        title: "区分所有の最有効使用と管理状態",
        lead: "朝霧タワー区分所有では、専有部分の眺望だけでなく、共用部管理と修繕積立を前提に居住利用としての市場性を判断する。",
        rows: [
          ["法的可能性", "管理規約、民泊禁止、駐車場利用規約により、投資・短期貸し用途の自由度は限定される。"],
          ["物理的可能性", "外壁タイル、機械式駐車場、共用設備の修繕負担が専有部分の見た目以上に効く。"],
          ["市場性", "同一棟成約、階数、方位、眺望阻害計画により、買主が比較する価格帯が変わる。"],
          ["収益性・経済合理性", "修繕積立不足を戸当たり負担へ落とし、眺望プレミアムとの相殺を説明する。"],
        ],
        conclusion: "結論: 居住用区分所有としての継続利用を前提に、管理・修繕・眺望リスクを個別的要因として調整する。",
      },
      case008: {
        title: "ホテルの最有効使用と安定運営NOI",
        lead: "湖畔リゾートホテルでは、繁忙期の印象ではなく、年間を通じた宿泊・宴会・改装負担を前提に事業用不動産として評価する。",
        rows: [
          ["法的可能性", "旅館業・運営委託契約・解約条項を前提に、所有者が自由に用途転換できるわけではない。"],
          ["物理的可能性", "客室棟、ボイラー、従業員寮、FF&E更新費が継続運営に必要な投資額を左右する。"],
          ["市場性", "湖畔眺望は強みだが、宴会場稼働低下と季節変動により買主の見方は選別的になる。"],
          ["収益性・経済合理性", "繁忙期NOIを年換算せず、閑散期・改装費・運営契約を標準化して収益価格に接続する。"],
        ],
        conclusion: "結論: ホテル継続運営を前提に、安定NOIと更新投資を織り込む利用が最有効使用となる。",
      },
      case009: {
        title: "物流倉庫の最有効使用と再賃貸リスク",
        lead: "湾岸物流倉庫では、満床表示ではなく、床荷重・接車・BCP・テナント集中を前提に物流用途としての継続性を判断する。",
        rows: [
          ["法的可能性", "倉庫用途は継続可能だが、浸水想定や保険条件、賃貸借契約の解約条項を無視できない。"],
          ["物理的可能性", "接車制限、床荷重、太陽光屋根の賃貸範囲が再賃貸可能なテナント層を狭める。"],
          ["市場性", "新築倉庫との競争で、旧仕様区画は賃料水準と空室期間に劣後しやすい。"],
          ["収益性・経済合理性", "WALE、主力テナント退去リスク、BCP費用を収益価格とリスク調整に接続する。"],
        ],
        conclusion: "結論: 物流倉庫としての継続利用を前提に、テナント集中と機能劣後を反映した収益判断を行う。",
      },
      case010: {
        title: "海外案件の最有効使用とレビュー前提",
        lead: "シンガポール海外案件では、日本式評価額を作るのではなく、IVS・現地権利・為替時点を照合したレビューとして判断する。",
        rows: [
          ["法的可能性", "現地規制、借地残存期間、鑑定書の限定条件を前提に、日本の所有権感覚へ置き換えない。"],
          ["物理的可能性", "洪水対策設備、周辺再開発、既存建物の仕様が現地市場での利用可能性を左右する。"],
          ["市場性", "現地投資家の利回り、借地期間、為替リスクにより、円建て表示だけでは市場性を説明できない。"],
          ["収益性・経済合理性", "現地価格と為替換算を分け、採用時点とレビュー範囲を明示して判断する。"],
        ],
        conclusion: "結論: 現地基準の前提を尊重し、為替・借地残存・限定条件を監査可能にした海外評価レビューが最有効の扱いとなる。",
      },
    };
    return matrices[spec.caseId] ?? null;
  }

  function manualAuditCriteria(spec, ids, spotIds, docIds) {
    const criteria = {
      case004: {
        focus: "担保評価で、正常価格・土壌調査未了・換金性リスクを混同せずに説明したか。",
        risk: "融資希望額に寄せ、担保余力と正常価格を同じ数字として扱っていないか。",
        comment: `監査では、${docIds[0]}で環境リスク、${docIds[1]}で流動性、${ids.adjustment}で担保留意点を接続できたかを見る。`,
        requiredEvidence: [docIds[0], docIds[1], ids.adjustment],
        supportingEvidence: [spotIds[0], spotIds[2], ids.method],
      },
      case005: {
        focus: "借地権評価で、譲渡承諾・地代・増改築制限を所有権価格と分けて説明したか。",
        risk: "普通の戸建てに近い見せ方を優先し、地主承諾と契約制限を軽視していないか。",
        comment: `監査では、${docIds[0]}を契約制限、${docIds[1]}を承諾料、${ids.adjustment}を権利調整の結論として提示できたかを見る。`,
        requiredEvidence: [docIds[0], docIds[1], ids.adjustment],
        supportingEvidence: [spotIds[0], spotIds[2], ids.method],
      },
      case006: {
        focus: "底地評価で、地代収受権・借地人交渉・流動性減価を更地価格から独立して説明したか。",
        risk: "満額に近い売却前提を優先し、買主限定性と交渉不調を注記だけで済ませていないか。",
        comment: `監査では、${docIds[0]}を地代、${docIds[1]}を交渉リスク、${ids.adjustment}を市場性減価として提示できたかを見る。`,
        requiredEvidence: [docIds[0], docIds[1], ids.adjustment],
        supportingEvidence: [spotIds[0], spotIds[4], ids.method],
      },
      case007: {
        focus: "区分所有評価で、専有部分の印象と共用部・修繕積立・管理規約を関連づけたか。",
        risk: "眺望プレミアムだけを強調し、積立不足や同一棟比較の弱さを見落としていないか。",
        comment: `監査では、${docIds[0]}を修繕、${docIds[1]}を同一棟比較、${ids.adjustment}を個別的要因比較として提示できたかを見る。`,
        requiredEvidence: [docIds[0], docIds[1], ids.adjustment],
        supportingEvidence: [spotIds[0], spotIds[2], ids.method],
      },
      case008: {
        focus: "ホテル評価で、繁忙期実績ではなく年間安定NOI・FF&E・運営契約を標準化したか。",
        risk: "繁忙期ベースのNOIを年換算し、改装費や閑散期を後回しにしていないか。",
        comment: `監査では、${docIds[0]}を稼働、${docIds[1]}をFF&E、${ids.adjustment}を事業収益リスクとして提示できたかを見る。`,
        requiredEvidence: [docIds[0], docIds[1], ids.adjustment],
        supportingEvidence: [spotIds[2], spotIds[3], ids.method],
      },
      case009: {
        focus: "物流倉庫評価で、WALE・接車機能・床荷重・BCP費用を収益判断に接続したか。",
        risk: "満床前提だけで価格を作り、主力テナント退去と機能劣後を過小評価していないか。",
        comment: `監査では、${docIds[0]}をテナント集中、${docIds[1]}を市場賃料、${ids.adjustment}を物流機能リスクとして提示できたかを見る。`,
        requiredEvidence: [docIds[0], docIds[1], ids.adjustment],
        supportingEvidence: [spotIds[0], spotIds[3], ids.method],
      },
      case010: {
        focus: "海外評価レビューで、IVS前提・為替時点・借地残存期間を日本向け説明に正しく接続したか。",
        risk: "円建てで高く見せるため、現地鑑定の限定条件と為替採用時点を混ぜていないか。",
        comment: `監査では、${docIds[0]}を現地前提、${docIds[1]}を為替時点、${ids.adjustment}を為替・権利期間調整として提示できたかを見る。`,
        requiredEvidence: [docIds[0], docIds[1], ids.adjustment],
        supportingEvidence: [spotIds[0], spotIds[3], ids.method],
      },
    };
    return criteria[spec.caseId] ?? null;
  }

  function makeAdjustmentBands(spec, ids, spotIds, docIds) {
    return [
      {
        id: "thin",
        label: spec.bands.thin.label,
        detail: spec.bands.thin.detail,
        correct: false,
        supportEvidence: [spotIds[3], ids.method],
        supportPrompt: spec.bands.thin.prompt,
        scores: { appraisal: -4, ethics: -1 },
        lesson: spec.bands.thin.lesson,
      },
      {
        id: "balanced",
        label: spec.bands.balanced.label,
        detail: spec.bands.balanced.detail,
        correct: true,
        supportEvidence: [docIds[0], docIds[1], docIds[2], spotIds[0], spotIds[2]],
        supportPrompt: spec.bands.balanced.prompt,
        scores: { appraisal: 7, reasoning: 2 },
        mentor: spec.bands.balanced.mentor,
      },
      {
        id: "severe",
        label: spec.bands.severe.label,
        detail: spec.bands.severe.detail,
        correct: false,
        supportEvidence: [docIds[1], spotIds[2]],
        supportPrompt: spec.bands.severe.prompt,
        scores: { appraisal: -3 },
        lesson: spec.bands.severe.lesson,
      },
    ];
  }

  function makeRebuttalOptions(spec, docIds) {
    return [
      {
        id: spec.rebuttal.id,
        label: spec.rebuttal.label,
        detail: spec.rebuttal.detail,
        requiredEvidence: docIds[0],
        correct: true,
      },
      {
        id: "clientConvenience",
        label: spec.rebuttal.wrongLabel,
        detail: spec.rebuttal.wrongDetail,
        requiredEvidence: docIds[2],
        correct: false,
        lesson: spec.rebuttal.lesson,
      },
    ];
  }

  addCase({
    caseId: "case004",
    prefix: "mortgage",
    number: "004",
    shortTitle: "港北工場跡地",
    subtitle: "担保評価",
    type: "担保評価",
    badge: "ノーマル / 担保 / 10分",
    description: "融資担保として、土壌汚染、換金性、担保掛目を切り分ける。",
    difficulty: { label: "ノーマル", code: "Normal", summary: "担保評価。価格だけでなく、処分可能性とリスクを読む。" },
    image: "./assets/kohoku-factory.generated.png",
    fallbackImage: "./assets/ekimae-commercial.svg",
    imageAlt: "港北の工場跡地。古い舗装、搬入口、薬品倉庫、隣接住宅、道路幅員が見える。",
    client: { name: "江原亮", initial: "江", portraitClass: "portrait-ehara", tension: "追加融資を急ぐ製造会社社長。担保余力を強めに見せたい。" },
    mentorStart: "「担保評価は貸し手の都合で高くするものじゃない。正常価格と処分リスクを分けて説明しろ。」",
    priceTitle: "融資実行前の価格時点を固定",
    priceDetail: "市況と土壌調査の判明状況を、価格時点で切り分ける。",
    subjectTitle: "工場跡地の土地建物と残置物",
    subjectDetail: "評価対象に建物、残置設備、地中リスクが含まれるかを確定する。",
    priceMessage: "価格時点を固定した。融資希望額ではなく、市場で処分できる前提を置く。",
    subjectMessage: "担保対象の範囲を確定した。残置物と土壌リスクは別途検証が必要だ。",
    intake: {
      chip: "依頼目的",
      title: "追加融資のための担保評価",
      body: "港北工業団地の旧工場を担保に、運転資金の追加融資を受けたいという依頼。社長は早期回答を求めている。",
      clientLine: "銀行提出用なので、担保余力が出るように<span class=\"pressure-word\">少し強め</span>に見られませんか。",
      mentorLine: "担保は換金できて初めて意味がある。正常価格と処分リスクを混ぜるな。",
      issues: ["価格の種類: 正常価格と担保評価上の留意点", "対象不動産: 土地建物、残置設備、地中リスク", "依頼者圧力: 融資希望額への誘導", "確認軸: 土壌汚染、流動性、接道"],
      professionalTitle: "正常価格を軸に受任し、担保リスクを別枠で整理する",
      professionalDetail: "融資希望ではなく、処分可能性と市場参加者のリスクを根拠化する。",
      pressureTitle: "担保余力が出る前提で進める",
      pressureDetail: "融資には近づくが、土壌・流動性リスクを過小に見る危険がある。",
    },
    spots: [
      { id: "mortgageSoilStain", term: "土壌汚染リスク", title: "舗装下に油染みの痕跡", detail: "土壌調査未了の工場跡地は、買主が調査費と浄化費を織り込む。", x: 39, y: 58, scores: { investigation: 10, appraisal: 6 } },
      { id: "mortgageTruckGate", term: "接道条件", title: "大型車搬入口が片側一方向", detail: "物流・工場用途の市場性は搬入動線に左右される。", x: 76, y: 73, scores: { investigation: 7, appraisal: 5 } },
      { id: "mortgageOldTank", term: "地下埋設物", title: "旧薬品タンクの記録", detail: "地下埋設物は撤去費と売却期間のリスクになる。", x: 23, y: 37, scores: { investigation: 9, reasoning: 4 } },
      { id: "mortgageNeighborHomes", term: "地域要因", title: "隣接住宅地との用途混在", detail: "騒音・操業制限の懸念は用途の幅を狭める。", x: 84, y: 35, scores: { investigation: 6, appraisal: 4 } },
      { id: "mortgageVacantYard", term: "市場性", title: "長期空き区画が隣接", detail: "同種物件の滞留は換金性判断に影響する。", x: 53, y: 82, scores: { investigation: 7, reasoning: 3 } },
    ],
    decoySpots: [
      { id: "mortgageFreshPaint", label: "D1", x: 18, y: 22, title: "塗り直された門扉", lesson: "外観の新しさは担保価値の中心ではない。処分時に買主が見るリスクを優先する。" },
      { id: "mortgageCompanySign", label: "D2", x: 62, y: 26, title: "社名看板", lesson: "営業中の印象ではなく、不動産としての市場性とリスクを読む。" },
    ],
    panels: [
      { title: "担保依頼資料", items: ["融資希望額: 1億8,000万円", "社長説明: 土壌問題は聞いていない", "現況: 旧メッキ工場、操業停止から2年"] },
      { title: "市場・調査資料", items: ["近隣工場地成約: 更地化済みが中心", "土壌概況調査: 未実施", "銀行メモ: 早期処分時は掛目を保守的に見る"] },
    ],
    documents: [
      { id: "mortgageSoilReport", term: "環境リスク", title: "土壌調査未了を確認", evidenceTitle: "旧工場用途で土壌調査が未了", detail: "土壌調査未了のまま担保余力を強く見ると、処分リスクを過小評価する。" },
      { id: "mortgageLiquidity", term: "市場性修正", title: "処分期間と買主層を確認", evidenceTitle: "同種工場地の売却期間が長い", detail: "換金に時間を要する市場では、担保評価上の留意点が強くなる。" },
      { id: "mortgageLoanPressure", term: "依頼者圧力", title: "融資希望額との距離を確認", evidenceTitle: "融資希望額が市場レンジを上回る", detail: "融資希望額から逆算すると、正常価格の説明が崩れる。" },
    ],
    decoyDocuments: [{ id: "mortgageMachineList", title: "機械設備リスト", detail: "製造設備の帳簿価格一覧。", lesson: "動産設備の帳簿価格は不動産の正常価格とは分ける。担保対象かも別確認が必要。" }],
    mechanic: {
      term: "担保掛目",
      title: "正常価格と担保余力を分ける",
      prompt: "正常価格1億6,000万円に対し、処分リスクを見た70%掛目なら担保余力はいくらか。",
      input: { id: "mortgageMargin", label: "担保余力を概算入力", suffix: "万円", placeholder: "例: 11200", min: 11000, max: 11400, formula: "16,000万円 × 70% = 11,200万円", success: "正常価格と担保余力を分けられた。評価額そのものを融資希望へ寄せない判断につながる。", lesson: "担保掛目を価格そのものと混同すると、正常価格と金融判断が混ざる。", scores: { reasoning: 6, appraisal: 4 }, penalty: { reasoning: -4, appraisal: -3 } },
      choices: [
        { id: "marketFirst", label: "正常価格を先に置き、担保留意点を別記する", detail: "市場価格と金融機関の掛目判断を混ぜない。", correct: true, scores: { reasoning: 7, appraisal: 5 }, mentor: "正常価格と担保判断を分けた。評価書として筋が通る。" },
        { id: "loanFirst", label: "融資希望額を満たす価格レンジへ寄せる", detail: "依頼者には有利だが、担保評価の説明が崩れる。", correct: false, scores: { appraisal: -5, ethics: -4 }, lesson: "担保評価でも鑑定評価額は融資希望額から逆算しない。" },
      ],
    },
    methodTerm: "原価法・取引事例比較法",
    methodTitle: "工場地の市場性を主軸に査定",
    methodDetail: "同種工場地の取引と再調達・解体負担を関連づける。",
    adjustmentTerm: "担保評価上の留意点",
    adjustmentTitle: "土壌・換金性リスクを別枠で反映",
    adjustmentDetail: "正常価格の判断と担保掛目のリスク説明を分ける。",
    methodMessage: "工場地の取引と原価的検討を関連づけた。担保余力とは別に正常価格を説明する。",
    adjustmentMessage: "土壌・換金性・用途混在リスクを担保評価上の留意点として整理した。",
    appraisalCopy: {
      methodTerm: "取引事例比較法・原価法",
      methodTitle: "担保目的でも正常価格を先に査定",
      methodBody: "融資希望額ではなく、同種工場地の市場性と再調達・解体負担を関連づける。",
      methodChoices: [
        { id: "A", label: "工場地の市場事例を主採用", detail: "土壌調査未了と処分期間を前提に、市場参加者の見方で査定する。" },
        { id: "B", label: "帳簿価格を主採用", detail: "会社の設備投資額に近いが、市場性の説明が弱い。" },
        { id: "C", label: "融資希望額から逆算", detail: "担保余力は作れるが、正常価格ではなくなる。" },
      ],
      adjustmentTerm: "担保評価上の留意点",
      adjustmentTitle: "換金性と環境リスクを反映",
      adjustmentBody: "土壌調査未了、地下埋設物、売却期間を根拠カードで支える。",
      adjustmentChoices: [
        { id: "risk", label: "土壌・換金性リスクを反映", detail: "正常価格と担保上の留意点を分けて説明する。" },
        { id: "soft", label: "担保余力を優先し軽微扱い", detail: "融資には寄るが、処分リスクを説明できない。" },
      ],
    },
    bands: {
      thin: { label: "薄い調整 -4%", detail: "工業団地内の需要を重視し、土壌リスクを注記に留める。", prompt: "薄い調整なら、買主層と操業継続性の根拠が必要。", lesson: "土壌調査未了のまま薄く扱うと、処分リスクを過小に見る。" },
      balanced: { label: "担保留意調整 -10%", detail: "土壌・埋設物・処分期間を市場参加者のリスクとして反映する。", prompt: "担保留意調整を支える環境・市場性カードを2枚選ぶ。", mentor: "正常価格と担保リスクを分けた調整だ。銀行説明にも耐える。" },
      severe: { label: "処分困難調整 -25%", detail: "土壌リスクを重大視し、買主がほぼ限定されると見る。", prompt: "処分困難まで下げるなら、決定的な汚染資料が必要。", lesson: "調査未了だけで処分困難級まで落とすと、根拠を超える。" },
    },
    rebuttal: { id: "soilAndLiquidity", label: "土壌未了と換金性で再反論", detail: "土壌調査未了を根拠に、担保余力だけを強く見られないと返す。", wrongLabel: "銀行の事情に合わせて表現を丸める", wrongDetail: "融資実行のため、担保余力の表現を曖昧にする。", lesson: "金融機関の都合は正常価格の根拠にならない。" },
    clientRebuttals: { defaultLine: "担保だから、多少強めでも銀行は分かってくれますよね。", rules: [{ evidence: "mortgageSoilReport", line: "土壌調査は後でやればいい話ではありませんか。" }, { evidence: "mortgageLiquidity", line: "売却期間は銀行内部の話で、評価額とは別では。" }] },
    reportPressure: { client: "融資が止まると資金繰りが厳しいんです。担保余力をもう少し出せませんか。", mentor: "社長の資金繰りは聞け。ただし、正常価格と担保リスクは混ぜるな。" },
    marketScenarios: [
      { id: "factoryOversupply", title: "旧工場地の売却期間が長期化", detail: "近隣で更地化済み物件も成約に時間を要している。", appraisalHint: "市場性と処分期間を支える根拠にする。", supportEvidence: ["mortgageLiquidity", "mortgageVacantYard"] },
      { id: "environmentWatch", title: "環境調査要求が厳格化", detail: "買主側が旧工場地に土壌概況調査を求める傾向。", appraisalHint: "土壌調査未了と地下埋設物を支える根拠にする。", supportEvidence: ["mortgageSoilReport", "mortgageOldTank"] },
      { id: "neighborUseConflict", title: "住宅隣接地の操業許容が低下", detail: "物流・工場用途の買主が近隣説明と出入口条件をより慎重に見る。", appraisalHint: "隣接住宅と大型車出入口を報告根拠に入れる。", supportEvidence: ["mortgageNeighborHomes", "mortgageTruckGate"] },
    ],
    tutorials: {},
    replayGoal: "次周目標: 土壌調査未了、換金性、担保留意点を事実→分析→結論で並べる。",
  });

  addCase({
    caseId: "case005",
    prefix: "leasehold",
    number: "005",
    shortTitle: "青葉台借地権付建物",
    subtitle: "借地権評価",
    type: "借地権",
    badge: "ハード / 権利編 / 11分",
    description: "地代、契約更新、増改築承諾、借地権割合を読む。",
    difficulty: { label: "ハード", code: "Hard", summary: "借地権。契約条件と市場性を合わせて判断する。" },
    image: "./assets/aobadai-leasehold.generated.png",
    fallbackImage: "./assets/kawabe-estate.svg",
    imageAlt: "青葉台の借地権付建物。古い住宅、地主宅、境界、増築部、私道が見える。",
    client: { name: "久保麻衣", initial: "久", portraitClass: "portrait-kubo", tension: "借地権付建物を売却したい相続人。地主との関係悪化を隠したい。" },
    mentorStart: "「借地権は土地の一部を買う話じゃない。契約と承諾可能性が価格を動かす。」",
    priceTitle: "借地権付建物の価格時点を固定",
    priceDetail: "契約更新と承諾料の見込みを価格時点で整理する。",
    subjectTitle: "借地権、建物、契約上の制約",
    subjectDetail: "借地権の範囲、建物の増改築、譲渡承諾の要否を確定する。",
    priceMessage: "価格時点を固定した。地主交渉の願望ではなく、契約条件から読む。",
    subjectMessage: "評価対象を借地権付建物として確定した。所有権価格とは分けて扱う。",
    intake: {
      chip: "依頼目的",
      title: "相続した借地権付建物の売却価格把握",
      body: "青葉台の借地権付建物を売りたい依頼。地主との更新協議が止まっている。",
      clientLine: "買主には普通の戸建てに近く見せたいので、地主の件は<span class=\"pressure-word\">軽め</span>に扱えますか。",
      mentorLine: "借地権は権利の束だ。地代、期間、譲渡承諾、増改築制限を飛ばすな。",
      issues: ["価格の種類: 借地権付建物としての正常価格", "対象不動産: 借地権、建物、契約制限", "依頼者圧力: 所有権価格への寄せ", "確認軸: 地代、更新、承諾料、増改築"],
      professionalTitle: "借地契約を前提に受任し、所有権価格と分ける",
      professionalDetail: "地主承諾と契約条件を価格形成要因として扱う。",
      pressureTitle: "普通の戸建てに近い前提で進める",
      pressureDetail: "見た目は売りやすいが、借地権の制約を過小に見る。",
    },
    spots: [
      { id: "leaseholdOldExtension", term: "増改築制限", title: "未承諾らしい増築部", detail: "増改築承諾の有無は買主リスクと承諾料に影響する。", x: 42, y: 48, scores: { investigation: 9, appraisal: 5 } },
      { id: "leaseholdPrivateRoad", term: "接道条件", title: "私道通行承諾の記録が薄い", detail: "通行・掘削承諾は市場性に影響する。", x: 72, y: 79, scores: { investigation: 8, reasoning: 4 } },
      { id: "leaseholdLandlordGate", term: "権利関係", title: "地主宅が隣接し交渉関係が近い", detail: "譲渡承諾の現実性と交渉コストを読む必要がある。", x: 84, y: 38, scores: { investigation: 7, appraisal: 5 } },
      { id: "leaseholdAgingHouse", term: "建物状態", title: "建物老朽化と修繕滞留", detail: "建物価値と借地権価格の分離に影響する。", x: 36, y: 32, scores: { investigation: 7, appraisal: 3 } },
      { id: "leaseholdBoundaryFence", term: "対象確定", title: "借地範囲と塀位置がずれる", detail: "借地範囲の確定は対象不動産の前提になる。", x: 22, y: 73, scores: { investigation: 8, reasoning: 4 } },
    ],
    decoySpots: [
      { id: "leaseholdGardenTree", label: "D1", x: 18, y: 24, title: "庭木の手入れ", lesson: "庭の印象より、契約上の使用収益制限を優先する。" },
      { id: "leaseholdMailbox", label: "D2", x: 64, y: 42, title: "新しい郵便受け", lesson: "小修繕は価格形成の中心ではない。借地契約の承諾可能性を読む。" },
    ],
    panels: [
      { title: "借地契約", items: ["契約残存: 7年", "地代: 月額6.5万円、近隣水準より低い", "譲渡承諾: 地主承諾が必要", "増改築: 事前承諾条項あり"] },
      { title: "市場資料", items: ["所有権戸建て事例: 4,900万円前後", "借地権付建物成約: 承諾料控除後で弱含み", "地主回答: 更新料と譲渡承諾料を要求"] },
    ],
    documents: [
      { id: "leaseholdContract", term: "借地契約", title: "譲渡承諾条項を確認", evidenceTitle: "譲渡には地主承諾が必要", detail: "借地権の譲渡可能性と承諾料が価格に直接効く。" },
      { id: "leaseholdGroundRent", term: "地代", title: "地代水準と更新料を照合", evidenceTitle: "地代が低く更新料要求あり", detail: "地代が低いほど借地権価値に効くが、更新料・承諾料で調整が必要。" },
      { id: "leaseholdConsentFee", term: "名義書換料", title: "譲渡承諾料の見込みを確認", evidenceTitle: "名義書換料の控除が必要", detail: "買主が負担する承諾料は市場価格に織り込まれる。" },
    ],
    decoyDocuments: [{ id: "leaseholdInteriorPhoto", title: "室内写真アルバム", detail: "内装が綺麗に見える写真。", lesson: "内装状態は参考だが、借地権の譲渡承諾や地代条件より優先しない。" }],
    mechanic: {
      term: "借地権割合",
      title: "所有権価格から借地権付建物へ落とす",
      prompt: "所有権土地建物4,900万円、借地権割合60%、承諾料300万円なら概算はいくらか。",
      input: { id: "leaseholdValue", label: "借地権付価格を概算入力", suffix: "万円", placeholder: "例: 2640", min: 2550, max: 2730, formula: "4,900万円 × 60% - 300万円 ≒ 2,640万円", success: "所有権価格から借地権割合と承諾料を分けて落とせた。", lesson: "所有権価格をそのまま使うと、借地権の制約と承諾料を見落とす。", scores: { reasoning: 6, appraisal: 4 }, penalty: { reasoning: -4, appraisal: -3 } },
      choices: [
        { id: "contractFirst", label: "契約条件と承諾料を反映する", detail: "借地権割合だけでなく、譲渡承諾の実現性を価格へ落とす。", correct: true, scores: { reasoning: 7, appraisal: 5 }, mentor: "借地権の価格形成要因を契約から読めている。" },
        { id: "ownershipLike", label: "所有権戸建て事例に近づける", detail: "売りやすいが、権利制限を過小に見る。", correct: false, scores: { appraisal: -5, ethics: -3 }, lesson: "借地権付建物を所有権価格へ寄せると誤学習になる。" },
      ],
    },
    methodTerm: "借地権価格",
    methodTitle: "借地権割合と契約条件を関連づける",
    methodDetail: "所有権価格、借地権割合、承諾料、地代を比較考量する。",
    adjustmentTerm: "権利調整",
    adjustmentTitle: "譲渡承諾・更新料・増改築制限を反映",
    adjustmentDetail: "契約上の制限を市場価格に落とし込む。",
    methodMessage: "借地権価格を所有権価格から切り離し、契約条件と関連づけた。",
    adjustmentMessage: "譲渡承諾、更新料、増改築制限を権利調整として反映した。",
    appraisalCopy: {
      methodTerm: "借地権価格",
      methodTitle: "所有権価格から借地権付建物へ調整",
      methodBody: "所有権事例をそのまま使わず、借地権割合、地代、承諾料を関連づける。",
      methodChoices: [
        { id: "A", label: "借地権割合と契約条件で査定", detail: "所有権価格を土台に、地代と承諾料を調整する。" },
        { id: "B", label: "所有権戸建て事例を主採用", detail: "比較しやすいが、借地権制約が薄い。" },
        { id: "C", label: "依頼者希望の売却額を採る", detail: "売主には近いが、地主承諾リスクが消える。" },
      ],
      adjustmentTerm: "権利調整",
      adjustmentTitle: "承諾可能性と契約制限を反映",
      adjustmentBody: "譲渡承諾、更新料、増改築、通行承諾を根拠カードで支える。",
      adjustmentChoices: [
        { id: "risk", label: "譲渡承諾・更新料を反映", detail: "借地権の市場性を契約条件から説明する。" },
        { id: "soft", label: "地主承諾は問題ない前提", detail: "売主希望には近いが、買主リスクを見落とす。" },
      ],
    },
    bands: {
      thin: { label: "薄い権利調整 -5%", detail: "地主承諾は得られると見て、所有権価格に近づける。", prompt: "薄い調整なら、承諾可能性を強く支える根拠が必要。", lesson: "承諾条項があるのに薄く扱うと、借地権の市場性を過大に見る。" },
      balanced: { label: "契約条件調整 -14%", detail: "譲渡承諾料、更新料、増改築制限を価格へ反映する。", prompt: "契約条件調整を支える地代・承諾・現地カードを2枚選ぶ。", mentor: "契約条件を市場性に落とした調整だ。借地権評価らしい。" },
      severe: { label: "譲渡困難調整 -30%", detail: "地主協議が難航すると見て、買主を大きく限定する。", prompt: "譲渡困難級なら、承諾拒否に近い資料が必要。", lesson: "関係悪化だけで譲渡困難級まで落とすと根拠を超える。" },
    },
    rebuttal: { id: "contractConstraint", label: "譲渡承諾条項で再反論", detail: "契約条項を根拠に、所有権価格へ寄せられないと返す。", wrongLabel: "地主とは後で調整すると説明", wrongDetail: "売却後に地主と話せばよいと扱う。", lesson: "承諾が必要な権利を後回しにすると、対象不動産の確定が崩れる。" },
    clientRebuttals: { defaultLine: "古い契約ですし、普通の戸建てとして売れませんか。", rules: [{ evidence: "leaseholdContract", line: "地主さんとは昔からの付き合いです。承諾条項をそんなに重く見ますか。" }, { evidence: "leaseholdGroundRent", line: "地代が安いなら、むしろ高く評価できるのでは。" }] },
    reportPressure: { client: "買主に借地権だと強く言うと値切られます。表現をやわらげられませんか。", mentor: "やわらげるのは説明の順序だけだ。権利制限は消すな。" },
    marketScenarios: [
      { id: "landlordStrict", title: "地主の承諾姿勢が厳格化", detail: "近隣で譲渡承諾料の要求が上がっている。", appraisalHint: "譲渡承諾条項と承諾料を支える根拠にする。", supportEvidence: ["leaseholdContract", "leaseholdConsentFee"] },
      { id: "leaseholdDemand", title: "借地権付戸建ての買主層が縮小", detail: "住宅ローン審査で借地契約条件を細かく見る傾向。", appraisalHint: "市場性と契約制限を支える根拠にする。", supportEvidence: ["leaseholdContract", "leaseholdPrivateRoad"] },
      { id: "privateRoadConcern", title: "私道・増改築承諾への警戒", detail: "買主が通行承諾と増改築履歴をセットで確認する局面。", appraisalHint: "私道と増改築承諾を報告根拠に入れる。", supportEvidence: ["leaseholdPrivateRoad", "leaseholdOldExtension"] },
    ],
    tutorials: {},
    replayGoal: "次周目標: 譲渡承諾、地代、権利調整を事実→分析→結論でつなぐ。",
  });

  const compactCases = [
    {
      caseId: "case006",
      prefix: "leasedland",
      number: "006",
      shortTitle: "白浜通り底地",
      subtitle: "底地評価",
      type: "底地",
      badge: "ハード / 権利編 / 12分",
      description: "地代収受権、借地人交渉、流動性減価を評価する。",
      image: "./assets/shirahama-leasedland.generated.png",
      fallbackImage: "./assets/kawabe-estate.svg",
      clientName: "瀬川俊介",
      portraitClass: "portrait-segawa",
      tension: "底地を売却したい地主。借地人との交渉難を軽く見せたい。",
      pressureWord: "満額に近く",
      topic: "底地売却価格",
      methodTerm: "底地価格",
      methodTitle: "地代収受権と市場流動性を査定",
      adjustmentTerm: "市場性減価",
      adjustmentTitle: "借地人限定市場と交渉リスクを反映",
      mechanicTerm: "地代利回り",
      mechanicTitle: "地代収入から底地価格を概算",
      mechanicPrompt: "年地代120万円、底地利回り4%なら収益的価格はいくらか。",
      input: { id: "leasedlandIncome", label: "底地の収益価格を概算入力", suffix: "万円", placeholder: "例: 3000", min: 2880, max: 3120, formula: "120万円 ÷ 4% = 3,000万円", success: "地代収入から底地の収益性を概算できた。", lesson: "地代収入を見ずに更地価格からだけ見ると、底地の市場性を誤る。" },
      spots: ["地代改定協議の掲示", "借地人建物の老朽化", "境界塀の越境疑い", "私道通行の負担", "売地看板の長期掲示"],
      docs: ["地代が近隣水準より低い", "借地人買取交渉が不調", "更新料収受の履歴が曖昧"],
    },
    {
      caseId: "case007",
      prefix: "condo",
      number: "007",
      shortTitle: "朝霧タワー区分所有",
      subtitle: "マンション評価",
      type: "区分所有",
      badge: "ノーマル / 区分所有 / 10分",
      description: "専有部分、共用部、修繕積立金、管理状態を読む。",
      image: "./assets/asagiri-condo.generated.png",
      fallbackImage: "./assets/ekimae-commercial.svg",
      clientName: "立花仁",
      portraitClass: "portrait-tachibana",
      tension: "区分所有マンションを高値売却したい所有者。修繕積立不足を言いたがらない。",
      pressureWord: "眺望プレミアム",
      topic: "区分所有マンション価格",
      methodTerm: "取引事例比較法",
      methodTitle: "同一棟・同一需給圏の成約を比較",
      adjustmentTerm: "個別的要因比較",
      adjustmentTitle: "階数・方位・管理状態・積立不足を反映",
      mechanicTerm: "修繕積立金",
      mechanicTitle: "積立不足を戸当たりで概算",
      mechanicPrompt: "大規模修繕不足額6,000万円、全60戸なら戸当たり不足はいくらか。",
      input: { id: "condoReserve", label: "戸当たり不足額を概算入力", suffix: "万円", placeholder: "例: 100", min: 95, max: 105, formula: "6,000万円 ÷ 60戸 = 100万円/戸", success: "積立不足を戸当たりに落とせた。管理状態を価格に接続できる。", lesson: "共用部の積立不足を見ないと、専有部分だけの印象に引っ張られる。" },
      spots: ["外壁タイルの浮き", "眺望を遮る新築計画", "機械式駐車場の故障", "エントランス管理掲示", "上階騒音の注意文"],
      docs: ["修繕積立金が長期計画を下回る", "同一棟成約は低層階中心", "管理規約で民泊禁止"],
    },
    {
      caseId: "case008",
      prefix: "hotel",
      number: "008",
      shortTitle: "湖畔リゾートホテル",
      subtitle: "ホテル評価",
      type: "ホテル",
      badge: "ハード / ホテル / 13分",
      description: "ADR、稼働率、FF&E、運営委託、季節変動を評価する。",
      image: "./assets/lakeside-hotel.generated.png",
      fallbackImage: "./assets/minamiguchi-redevelopment.svg",
      clientName: "早見怜",
      portraitClass: "portrait-hayami",
      tension: "ホテル売却を急ぐ運営会社役員。繁忙期の数字だけを見せたい。",
      pressureWord: "繁忙期ベース",
      topic: "ホテル事業用不動産価格",
      methodTerm: "収益還元法",
      methodTitle: "安定運営NOIを標準化",
      adjustmentTerm: "事業収益リスク",
      adjustmentTitle: "季節変動・改装費・運営契約を反映",
      mechanicTerm: "GOP/NOI確認",
      mechanicTitle: "年間NOIを繁忙期から標準化",
      mechanicPrompt: "繁忙期NOI月600万円が4か月、閑散期NOI月180万円が8か月なら年間NOIはいくらか。",
      input: { id: "hotelNoi", label: "年間NOIを概算入力", suffix: "万円", placeholder: "例: 3840", min: 3740, max: 3940, formula: "600万円×4 + 180万円×8 = 3,840万円", success: "繁忙期だけでなく年間NOIに標準化できた。", lesson: "繁忙期NOIだけを年換算するとホテル収益を過大に見る。" },
      spots: ["客室改装の遅れ", "宴会場の稼働低下", "湖畔眺望の強み", "設備更新が近いボイラー", "従業員寮の老朽化"],
      docs: ["ADRは上昇だが稼働率が低下", "FF&E更新費が未計上", "運営委託契約の解約条項が重い"],
    },
    {
      caseId: "case009",
      prefix: "logistics",
      number: "009",
      shortTitle: "湾岸物流倉庫",
      subtitle: "物流倉庫評価",
      type: "物流倉庫",
      badge: "ハード / 物流 / 13分",
      description: "賃貸借、天井高、床荷重、BCP、テナント集中を読む。",
      image: "./assets/bay-logistics.generated.png",
      fallbackImage: "./assets/ekimae-commercial.svg",
      clientName: "大貫咲",
      portraitClass: "portrait-onuki",
      tension: "売却前の物流会社担当者。大型テナントの退去リスクを伏せたい。",
      pressureWord: "満床前提",
      topic: "物流倉庫の収益価格",
      methodTerm: "DCF法・直接還元法",
      methodTitle: "安定賃料と再賃貸リスクを査定",
      adjustmentTerm: "物流機能リスク",
      adjustmentTitle: "床荷重・接車・テナント集中を反映",
      mechanicTerm: "WALE確認",
      mechanicTitle: "平均残存賃貸期間を概算",
      mechanicPrompt: "賃料比率70%の主力テナント残存2年、30%の区画残存5年ならWALEはいくらか。",
      input: { id: "logisticsWale", label: "WALEを概算入力", suffix: "年", placeholder: "例: 2.9", min: 2.8, max: 3.0, formula: "2年×70% + 5年×30% = 2.9年", success: "賃料比率で残存期間を重み付けできた。", lesson: "面積だけでなく賃料比率で残存期間を見ると、収益安定性が見える。" },
      spots: ["一部バースの接車制限", "床荷重表示の古さ", "大型テナント専用区画", "浸水想定区域の掲示", "太陽光屋根の賃貸範囲"],
      docs: ["主力テナント解約通知権あり", "市場賃料は新築倉庫に劣後", "保険料とBCP費用が上昇"],
    },
    {
      caseId: "case010",
      prefix: "overseas",
      number: "010",
      shortTitle: "シンガポール海外案件",
      subtitle: "海外評価レビュー",
      type: "海外案件",
      badge: "エキスパート / 海外 / 14分",
      description: "IVS、為替、借地期間、現地規制、資料信頼性を読む。",
      image: "./assets/singapore-overseas.generated.png",
      fallbackImage: "./assets/minamiguchi-redevelopment.svg",
      clientName: "神崎エマ",
      portraitClass: "portrait-kanzaki",
      tension: "海外ファンド担当者。円換算の見栄えと現地鑑定との差を気にする。",
      pressureWord: "円建てで高く",
      topic: "海外不動産の評価レビュー",
      methodTerm: "IVSレビュー",
      methodTitle: "現地基準と日本の説明責任を接続",
      adjustmentTerm: "為替・権利期間調整",
      adjustmentTitle: "為替、借地残存、現地規制を反映",
      mechanicTerm: "為替感応度",
      mechanicTitle: "為替変動による円換算価格を概算",
      mechanicPrompt: "現地価格2,000万SGD、1SGD=110円なら円換算はいくらか。",
      input: { id: "overseasFx", label: "円換算価格を概算入力", suffix: "億円", placeholder: "例: 22", min: 21.5, max: 22.5, formula: "2,000万SGD × 110円 = 22億円", success: "現地価格と為替を分けて円換算できた。", lesson: "円建て表示だけを見ると、現地価格変動と為替変動が混ざる。" },
      spots: ["借地期間の残存表示", "現地管理会社の掲示", "洪水対策設備", "周辺再開発の工事", "空室募集の現地看板"],
      docs: ["現地鑑定書の前提条件が限定的", "為替レートの採用時点がずれる", "借地残存期間が価格に影響"],
    },
  ];

  compactCases.forEach((item) => {
    const spotIds = ["A", "B", "C", "D", "E"].map((suffix) => `${item.prefix}Spot${suffix}`);
    const docIds = ["A", "B", "C"].map((suffix) => `${item.prefix}Doc${suffix}`);
    addCase({
      caseId: item.caseId,
      prefix: item.prefix,
      number: item.number,
      shortTitle: item.shortTitle,
      subtitle: item.subtitle,
      type: item.type,
      badge: item.badge,
      description: item.description,
      difficulty: item.difficulty,
      image: item.image,
      fallbackImage: item.fallbackImage,
      imageAlt: `${item.shortTitle}の現地写真。${item.spots.join("、")}が見える。`,
      client: { name: item.clientName, initial: item.clientName.slice(0, 1), portraitClass: item.portraitClass, tension: item.tension },
      mentorStart: `「${item.methodTerm}は言葉だけで使うな。資料、現地、契約をつないで説明しろ。」`,
      priceTitle: `${item.topic}の価格時点を固定`,
      priceDetail: "価格時点で判明している市場条件と契約条件を固定する。",
      subjectTitle: `${item.shortTitle}の対象範囲を確定`,
      subjectDetail: "土地、建物、権利、契約上の制限を評価対象として切り分ける。",
      priceMessage: "価格時点を固定した。依頼者の見せたい数字から切り離して進める。",
      subjectMessage: "対象不動産を確定した。権利と契約条件を先に閉じる。",
      intake: {
        chip: "依頼目的",
        title: `${item.topic}の把握`,
        body: `${item.shortTitle}について、依頼者の利害が強く出る評価依頼。資料の見せ方に偏りがある。`,
        clientLine: `今回は事情があるので、できれば<span class=\"pressure-word\">${item.pressureWord}</span>見ていただけると助かります。`,
        mentorLine: "依頼者の都合は聞く。ただし、評価額は根拠と前提条件からしか組み立てない。",
        issues: ["価格の種類: 正常価格として扱えるか", `対象不動産: ${item.topic}の権利・契約条件`, "依頼者圧力: 数字の見せ方への誘導", `確認軸: ${item.methodTerm}と${item.adjustmentTerm}`],
        professionalTitle: "正常価格を軸に受任し、前提条件を固定する",
        professionalDetail: "依頼者の事情ではなく、現地・資料・市場条件で説明する。",
        pressureTitle: "依頼者の見せたい前提を重く見る",
        pressureDetail: "短期的には通しやすいが、評価書の説明責任が弱くなる。",
      },
      spots: item.spots.map((title, index) => ({
        id: spotIds[index],
        term: ["価格形成要因", "個別的要因", "契約リスク", "市場性", "運営リスク"][index],
        title,
        detail: `${title}は、${item.topic}の価格判断に影響する。`,
        x: [35, 66, 24, 78, 52][index],
        y: [42, 30, 68, 75, 56][index],
        scores: { investigation: index < 3 ? 8 : 6, appraisal: 4, reasoning: index === 2 ? 4 : 2 },
      })),
      decoySpots: [
        { id: `${item.prefix}DecoyA`, label: "D1", x: 18, y: 26, title: "新しい案内看板", lesson: "新しい表示や営業上の印象は、価格形成要因として直接効く根拠とは限らない。" },
        { id: `${item.prefix}DecoyB`, label: "D2", x: 84, y: 48, title: "清掃された外観", lesson: "見た目の清潔感より、継続的な収益・権利・市場性の根拠を優先する。" },
      ],
      panels: [
        { title: "依頼者提出資料", items: [`依頼者説明: ${item.pressureWord}見せたい`, `評価対象: ${item.topic}`, "価格時点: 2026-05-05", "未確認事項: 契約条件と市場資料"] },
        { title: "照合資料", items: item.docs.map((doc) => `確認事項: ${doc}`) },
      ],
      documents: item.docs.map((doc, index) => ({
        id: docIds[index],
        term: [item.methodTerm, item.adjustmentTerm, "前提条件"][index],
        title: `${doc}を確認`,
        evidenceTitle: doc,
        detail: `${doc}。依頼者説明だけではなく、資料照合で価格への影響を判断する。`,
      })),
      decoyDocuments: [{ id: `${item.prefix}DecoyDoc`, title: "販売パンフレット", detail: "魅力的な写真と強いコピーの販売資料。", lesson: "販売資料は訴求であり、価格形成要因そのものではない。契約・収益・市場資料で裏取りする。" }],
      mechanic: {
        term: item.mechanicTerm,
        title: item.mechanicTitle,
        prompt: item.mechanicPrompt,
        input: { ...item.input, scores: { reasoning: 6, appraisal: 4 }, penalty: { reasoning: -4, appraisal: -3 } },
        choices: [
          { id: "evidenceBased", label: "検算結果を価格判断に反映する", detail: "資料の数字を市場性と契約条件へ接続する。", correct: true, scores: { reasoning: 7, appraisal: 5 }, mentor: "数値を根拠カードに接続できた。専門職シムとして強い判断だ。" },
          { id: "clientNarrative", label: "依頼者説明を優先して丸める", detail: "見せたい数字には近づくが、検算の意味が消える。", correct: false, scores: { appraisal: -5, ethics: -3 }, lesson: "検算をしたのに依頼者説明へ戻すと、専門用語がただの飾りになる。" },
        ],
      },
      methodTerm: item.methodTerm,
      methodTitle: item.methodTitle,
      methodDetail: `${item.topic}では、${item.methodTerm}を市場資料と契約条件に接続する。`,
      adjustmentTerm: item.adjustmentTerm,
      adjustmentTitle: item.adjustmentTitle,
      adjustmentDetail: `${item.adjustmentTerm}を価格レンジの調整理由として反映する。`,
      methodMessage: `${item.methodTerm}を主軸に、資料と現地を関連づけた。`,
      adjustmentMessage: `${item.adjustmentTerm}を価格形成要因として反映した。`,
      appraisalCopy: {
        methodTerm: item.methodTerm,
        methodTitle: item.methodTitle,
        methodBody: `${item.topic}の判断は、依頼者説明ではなく市場資料と契約条件をつなぐ。`,
        methodChoices: [
          { id: "A", label: `${item.methodTerm}を主軸に査定`, detail: "現地、資料、契約条件を関連づけて価格を組み立てる。" },
          { id: "B", label: "見た目の近い事例を主採用", detail: "比較しやすいが、権利・収益・契約条件が薄い。" },
          { id: "C", label: "依頼者提示資料を主採用", detail: "説明は速いが、独立性が弱い。" },
        ],
        adjustmentTerm: item.adjustmentTerm,
        adjustmentTitle: item.adjustmentTitle,
        adjustmentBody: "選んだ調整幅を、証拠カードと市場条件で支える。",
        adjustmentChoices: [
          { id: "risk", label: `${item.adjustmentTerm}を反映`, detail: "価格形成要因として説明できる範囲で反映する。" },
          { id: "soft", label: "依頼者説明を尊重し軽微扱い", detail: "通しやすいが、調査結果と価格の接続が弱くなる。" },
        ],
      },
      bands: {
        thin: { label: "薄い調整 -5%", detail: "依頼者説明を重く見て、リスクを注記に留める。", prompt: "薄い調整なら、強い市場性を支える根拠が必要。", lesson: "見落としたリスクを注記だけにすると、価格への反映が弱い。" },
        balanced: { label: "標準調整 -12%", detail: `${item.adjustmentTerm}を市場参加者の判断として反映する。`, prompt: `${item.adjustmentTerm}を支える資料・現地カードを2枚選ぶ。`, mentor: "現地と資料が調整幅につながった。説明責任がある。" },
        severe: { label: "過度調整 -28%", detail: "リスクを重大視し、買主層を大きく限定する。", prompt: "過度調整なら決定的な資料が必要。", lesson: "不確実性はあるが、取得資料だけで過度に下げると根拠を超える。" },
      },
      rebuttal: { id: `${item.prefix}EvidenceReply`, label: `${item.docs[0]}で再反論`, detail: "依頼者の反論に、最初の重要資料を根拠として返す。", wrongLabel: "依頼者の事情を条件付きで採る", wrongDetail: "価格前提に依頼者説明を残す。", lesson: "依頼者事情は聞くが、評価額を支える根拠とは分ける。" },
      clientRebuttals: { defaultLine: "そこまで厳しく見ると、こちらの事情が反映されません。", rules: [{ evidence: docIds[0], line: `${item.docs[0]}は、そこまで価格に効くものですか。` }, { evidence: docIds[1], line: "それは一時的な問題として扱えませんか。" }] },
      reportPressure: { client: `今回は${item.pressureWord}見せたいんです。表現だけでも調整できませんか。`, mentor: "表現は変えられる。根拠は変えるな。事実、分析、結論の順に返せ。" },
      marketScenarios: [
        { id: `${item.prefix}Risk`, title: `${item.adjustmentTerm}への警戒が上昇`, detail: "市場参加者が契約・運営・権利リスクを強く見る局面。", appraisalHint: "重要資料と現地リスクを支える根拠にする。", supportEvidence: [docIds[0], spotIds[0]] },
        { id: `${item.prefix}Demand`, title: "買主層が選別的に変化", detail: "表面利回りや見た目より、裏付け資料の精度が重視されている。", appraisalHint: "資料照合と検算結果を支える根拠にする。", supportEvidence: [docIds[1], docIds[2]] },
        { id: `${item.prefix}Disclosure`, title: "重要事項の開示要求が上昇", detail: "買主・監査側が契約条件、運営実績、権利調整の説明責任を強く求めている。", appraisalHint: "現地リスクと最終資料を組み合わせて報告する。", supportEvidence: [spotIds[1], docIds[2]] },
      ],
      tutorials: {},
      replayGoal: `次周目標: ${item.methodTerm}、${item.adjustmentTerm}、重要資料を事実→分析→結論で提示する。`,
    });
  });
})();
