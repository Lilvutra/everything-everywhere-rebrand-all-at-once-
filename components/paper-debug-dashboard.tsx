"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";

type GenericResult = {
  summary?: Record<string, unknown>;
  images?: Record<string, string | null | undefined>;
  [key: string]: unknown;
};

type SectionState = {
  loading: boolean;
  error: string | null;
  data: GenericResult | Record<string, unknown> | null;
};

type OcrItem = {
  bbox: number[];
  text: string;
  score: number;
  poly: number[][];
};

function createState(): SectionState {
  return { loading: false, error: null, data: null };
}

function JsonBlock({ value }: { value: unknown }) {
  return <pre>{JSON.stringify(value, null, 2)}</pre>;
}

function ImageCard({ title, src, emptyText }: { title: string; src?: string | null; emptyText?: string }) {
  return (
    <section className="card">
      <h3>{title}</h3>
      {src ? <img src={src} alt={title} /> : <em>{emptyText ?? "No image available."}</em>}
    </section>
  );
}

function postForm(path: string, formData: FormData) {
  return fetch(path, {
    method: "POST",
    body: formData,
  }).then(async (res) => {
    const payload = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      throw new Error(
        String(payload.description ?? payload.error ?? `Request failed: ${res.status}`),
      );
    }
    return payload;
  });
}

function getImages(data: GenericResult | Record<string, unknown> | null) {
  return ((data as GenericResult | null)?.images ?? {}) as Record<string, string | null | undefined>;
}

function getSummary(data: GenericResult | Record<string, unknown> | null) {
  return ((data as GenericResult | null)?.summary ?? {}) as Record<string, unknown>;
}

export function PaperDebugDashboard() {
  const [paperRun, setPaperRun] = useState<SectionState>(createState);
  const [paperRerun, setPaperRerun] = useState<SectionState>(createState);
  const [licensePlate, setLicensePlate] = useState<SectionState>(createState);
  const [hidePlate, setHidePlate] = useState<SectionState>(createState);
  const [workflow, setWorkflow] = useState<SectionState>(createState);

  const [paperFile, setPaperFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [hideFile, setHideFile] = useState<File | null>(null);
  const [workflowCarId, setWorkflowCarId] = useState("");
  const [selectedOcrTexts, setSelectedOcrTexts] = useState<string[]>([]);
  const [manualExtraText, setManualExtraText] = useState("");
  const [docOrientationClassify, setDocOrientationClassify] = useState(false);
  const [docUnwarping, setDocUnwarping] = useState(false);
  const [textlineOrientation, setTextlineOrientation] = useState(false);

  const paperSummary = getSummary(paperRun.data);
  const paperImages = getImages(paperRun.data);
  const rerunSummary = getSummary(paperRerun.data);
  const rerunImages = getImages(paperRerun.data);
  const lpSummary = getSummary(licensePlate.data);
  const lpImages = getImages(licensePlate.data);
  const hideSummary = getSummary(hidePlate.data);
  const hideImages = getImages(hidePlate.data);

  const ocrItems = useMemo(() => {
    const items = paperSummary.ocr_items;
    return Array.isArray(items) ? (items as OcrItem[]) : [];
  }, [paperSummary]);

  async function handlePaperRun(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!paperFile) {
      setPaperRun({ loading: false, error: "Please choose an image.", data: null });
      return;
    }
    setPaperRun({ loading: true, error: null, data: null });
    setPaperRerun(createState());
    setSelectedOcrTexts([]);
    setManualExtraText("");
    try {
      const formData = new FormData();
      formData.append("image", paperFile);
      formData.append("doc_orientation_classify", String(docOrientationClassify));
      formData.append("doc_unwarping", String(docUnwarping));
      formData.append("textline_orientation", String(textlineOrientation));
      const data = await postForm("/api/paper-debug/run", formData);
      setPaperRun({ loading: false, error: null, data });
    } catch (error) {
      setPaperRun({
        loading: false,
        error: error instanceof Error ? error.message : "Unknown request error",
        data: null,
      });
    }
  }

  async function handlePaperRerun(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!paperFile) {
      setPaperRerun({ loading: false, error: "Run the paper workflow first so the image is available for rerun.", data: null });
      return;
    }
    setPaperRerun({ loading: true, error: null, data: null });
    try {
      const formData = new FormData();
      formData.append("image", paperFile);
      const selectedLines = selectedOcrTexts.map((line) => line.trim()).filter(Boolean);
      const extraLines = manualExtraText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      formData.append("manual_texts", [...selectedLines, ...extraLines].join("\n"));
      formData.append("doc_orientation_classify", String(docOrientationClassify));
      formData.append("doc_unwarping", String(docUnwarping));
      formData.append("textline_orientation", String(textlineOrientation));
      const data = await postForm("/api/paper-debug/rerun", formData);
      setPaperRerun({ loading: false, error: null, data });
    } catch (error) {
      setPaperRerun({
        loading: false,
        error: error instanceof Error ? error.message : "Unknown request error",
        data: null,
      });
    }
  }

  async function handleSingleFileSubmit(
    event: FormEvent<HTMLFormElement>,
    file: File | null,
    path: string,
    setter: (value: SectionState) => void,
    emptyMessage: string,
  ) {
    event.preventDefault();
    if (!file) {
      setter({ loading: false, error: emptyMessage, data: null });
      return;
    }
    setter({ loading: true, error: null, data: null });
    try {
      const formData = new FormData();
      formData.append("image", file);
      const data = await postForm(path, formData);
      setter({ loading: false, error: null, data });
    } catch (error) {
      setter({
        loading: false,
        error: error instanceof Error ? error.message : "Unknown request error",
        data: null,
      });
    }
  }

  async function handleWorkflowSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorkflow({ loading: true, error: null, data: null });
    try {
      const formData = new FormData();
      formData.append("car_id", workflowCarId);
      const data = await postForm("/api/paper-debug/workflow", formData);
      setWorkflow({ loading: false, error: null, data });
    } catch (error) {
      setWorkflow({
        loading: false,
        error: error instanceof Error ? error.message : "Unknown request error",
        data: null,
      });
    }
  }

  function toggleSelectedText(text: string, checked: boolean) {
    setSelectedOcrTexts((current) => {
      if (checked) return [...current, text];
      return current.filter((item) => item !== text);
    });
  }

  return (
    <main>
      <h1>Paper Rebrand Dashboard</h1>
      <p className="hint">Upload one paper image to run the current paper OCR/rebrand workflow and visualize each step.</p>
      <p className="hint">Input your OCR item texts that should be rebranded since we have many variants of OCR detected text for a sensitive field</p>

      {paperRun.error ? <div className="error-box">{paperRun.error}</div> : null}
      <form onSubmit={(event) => void handlePaperRun(event)}>
        <div className="hint">Run paper workflow</div>
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.bmp"
          required
          onChange={(event: ChangeEvent<HTMLInputElement>) => setPaperFile(event.target.files?.[0] ?? null)}
        />
        <br />
        <div className="hint">PaddleOCR preprocessing (off = current behavior)</div>
        <label className="checkbox-item">
          <input
            type="checkbox"
            checked={docOrientationClassify}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setDocOrientationClassify(event.target.checked)}
          />{" "}
          Doc orientation classify
        </label>
        <br />
        <label className="checkbox-item">
          <input
            type="checkbox"
            checked={docUnwarping}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setDocUnwarping(event.target.checked)}
          />{" "}
          Doc unwarping
        </label>
        <br />
        <label className="checkbox-item">
          <input
            type="checkbox"
            checked={textlineOrientation}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setTextlineOrientation(event.target.checked)}
          />{" "}
          Textline orientation
        </label>
        <br />
        <button type="submit" disabled={paperRun.loading}>{paperRun.loading ? "Running..." : "Run workflow"}</button>
      </form>

      {licensePlate.error ? <div className="error-box">{licensePlate.error}</div> : null}
      <form onSubmit={(event) => void handleSingleFileSubmit(event, licenseFile, "/api/paper-debug/classify-license-plate", setLicensePlate, "Please choose an image.") }>
        <div className="hint">Classify license plate color</div>
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.bmp"
          required
          onChange={(event: ChangeEvent<HTMLInputElement>) => setLicenseFile(event.target.files?.[0] ?? null)}
        />
        <br />
        <button type="submit" disabled={licensePlate.loading}>{licensePlate.loading ? "Classifying..." : "Classify license plate color"}</button>
      </form>

      {hidePlate.error ? <div className="error-box">{hidePlate.error}</div> : null}
      <form onSubmit={(event) => void handleSingleFileSubmit(event, hideFile, "/api/paper-debug/hide-license-plate", setHidePlate, "Please choose an image.") }>
        <div className="hint">Visualize hide license plate workflow</div>
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.bmp"
          required
          onChange={(event: ChangeEvent<HTMLInputElement>) => setHideFile(event.target.files?.[0] ?? null)}
        />
        <br />
        <button type="submit" disabled={hidePlate.loading}>{hidePlate.loading ? "Running..." : "Hide license plate"}</button>
      </form>

      {workflow.error ? <div className="error-box">{workflow.error}</div> : null}
      <form onSubmit={(event) => void handleWorkflowSubmit(event)}>
        <div className="hint">Check the latest saved rebrand workflow timestamps/state by car id.</div>
        <input
          type="text"
          placeholder="d37ad6c9-f852-4242-9d7e-ae1b5fae0c2a"
          required
          value={workflowCarId}
          onChange={(event) => setWorkflowCarId(event.target.value)}
        />
        <br />
        <br />
        <button type="submit" disabled={workflow.loading}>{workflow.loading ? "Checking..." : "Check workflow state by car id"}</button>
      </form>

      {paperRun.data ? (
        <div className="grid">
          <ImageCard title="00 Input" src={paperImages.input} />
          <ImageCard title="01 Oriented" src={paperImages.oriented} />
          <ImageCard title="02 OCR items" src={paperImages.ocr_overlay} />
          <ImageCard title="03 Sensitive regions" src={paperImages.sensitive_overlay} />
          <ImageCard title="04 Rebranded" src={paperImages.rebranded} />
          <section className="card wide">
            <h3>05 OCR comparison</h3>
            <details>
              <summary>Show / hide OCR comparison JSON</summary>
              <JsonBlock value={paperSummary.ocr_comparison ?? {}} />
            </details>
          </section>
          <section className="card wide">
            <h3>06 Select OCR texts that should have been rebranded</h3>
            <form onSubmit={(event) => void handlePaperRerun(event)}>
              <div className="checkbox-list">
                {ocrItems.length ? (
                  ocrItems.map((item) => (
                    <label className="checkbox-item" key={`${item.text}-${item.score}-${item.bbox.join("-")}`}>
                      <input
                        type="checkbox"
                        checked={selectedOcrTexts.includes(item.text)}
                        onChange={(event) => toggleSelectedText(item.text, event.target.checked)}
                      />{" "}
                      {item.text}
                    </label>
                  ))
                ) : (
                  <em>No OCR items detected.</em>
                )}
              </div>
              <label htmlFor="manual-extra-text"><strong>Additional manual texts (one per line)</strong></label>
              <textarea
                id="manual-extra-text"
                placeholder="Paste extra OCR texts that should have been redacted but were not detected or not recognized by the rules."
                value={manualExtraText}
                onChange={(event) => setManualExtraText(event.target.value)}
              />
              <br />
              <button type="submit" disabled={paperRerun.loading}>{paperRerun.loading ? "Rerunning..." : "Rerun with selected/manual OCR texts"}</button>
            </form>
          </section>
        </div>
      ) : null}

      {paperRerun.error ? <div className="error-box section-spacer">{paperRerun.error}</div> : null}
      {paperRerun.data ? (
        <div className="grid section-spacer">
          <ImageCard title="00 Input" src={rerunImages.input} />
          <ImageCard title="01 Oriented" src={rerunImages.oriented} />
          <ImageCard title="02 OCR items" src={rerunImages.ocr_overlay} />
          <ImageCard title="03 Sensitive regions" src={rerunImages.sensitive_overlay} />
          <ImageCard title="04 Rebranded" src={rerunImages.rebranded} />
          <section className="card wide">
            <h3>05 OCR comparison</h3>
            <details>
              <summary>Show / hide OCR comparison JSON</summary>
              <JsonBlock value={rerunSummary.ocr_comparison ?? {}} />
            </details>
          </section>
        </div>
      ) : null}

      {licensePlate.data ? (
        <div className="grid section-spacer">
          <section className="card wide">
            <h3>Classify license plate color summary</h3>
            <JsonBlock value={lpSummary} />
          </section>
          <ImageCard title="LP 00 Input" src={lpImages.input} />
          <ImageCard title="LP 01 Detector bbox / expanded crop" src={lpImages.detection_overlay} />
          <ImageCard title="LP 02 Plate crop" src={lpImages.plate_crop} emptyText="No crop available." />
          <ImageCard title="LP 03 Yellow mask" src={lpImages.yellow_mask} emptyText="No mask available." />
          <ImageCard title="LP 04 White mask" src={lpImages.white_mask} emptyText="No mask available." />
          <ImageCard title="LP 05 Red mask" src={lpImages.red_mask} emptyText="No mask available." />
        </div>
      ) : null}

      {hidePlate.data ? (
        <div className="grid section-spacer">
          <section className="card wide">
            <h3>Visualize hide license plate workflow summary</h3>
            <JsonBlock value={hideSummary} />
          </section>
          <ImageCard title="Hide 00 Input" src={hideImages.input} />
          {hideImages.stage_1 ? <ImageCard title={hideImages.stage_1_title ?? "Stage 1"} src={hideImages.stage_1} /> : null}
          {hideImages.stage_2 ? <ImageCard title={hideImages.stage_2_title ?? "Stage 2"} src={hideImages.stage_2} /> : null}
          {hideImages.stage_3 ? <ImageCard title={hideImages.stage_3_title ?? "Stage 3"} src={hideImages.stage_3} /> : null}
          <ImageCard title="Hide 04 Result" src={hideImages.result} />
        </div>
      ) : null}

      {workflow.data ? (
        <div className="grid section-spacer">
          <section className="card wide">
            <h3>Workflow timestamps / state</h3>
            <JsonBlock value={workflow.data} />
          </section>
        </div>
      ) : null}
    </main>
  );
}
