"use client";

import { FormEvent, useMemo, useState } from "react";

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

function getImageValue(data: GenericResult | Record<string, unknown>, key: string) {
  const value = (data as GenericResult).images?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function getTitleValue(data: GenericResult | Record<string, unknown>, key: string, fallback: string) {
  const value = (data as GenericResult).images?.[key];
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function createState(): SectionState {
  return { loading: false, error: null, data: null };
}

function JsonBlock({ value }: { value: unknown }) {
  return <pre>{JSON.stringify(value, null, 2)}</pre>;
}

function ImageCard({ title, src }: { title: string; src?: string | null }) {
  if (!src) return null;
  return (
    <section className="card image-card">
      <h4 className="small-gap">{title}</h4>
      <img className="preview" src={src} alt={title} />
    </section>
  );
}

function SummaryCard({ title, summary }: { title: string; summary: unknown }) {
  return (
    <section className="card summary-card">
      <h3 className="small-gap">{title}</h3>
      <JsonBlock value={summary} />
    </section>
  );
}

async function postForm(path: string, formData: FormData) {
  const res = await fetch(path, {
    method: "POST",
    body: formData,
  });

  const payload = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(
      String(payload.description ?? payload.error ?? `Request failed: ${res.status}`),
    );
  }
  return payload;
}

export function PaperDebugDashboard() {
  const [paperRun, setPaperRun] = useState<SectionState>(createState);
  const [paperRerun, setPaperRerun] = useState<SectionState>(createState);
  const [licensePlate, setLicensePlate] = useState<SectionState>(createState);
  const [hidePlate, setHidePlate] = useState<SectionState>(createState);
  const [workflow, setWorkflow] = useState<SectionState>(createState);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
    path: string,
    setter: (value: SectionState) => void,
  ) {
    event.preventDefault();
    setter({ loading: true, error: null, data: null });
    try {
      const formData = new FormData(event.currentTarget);
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

  const pageDescription = useMemo(
    () => [
      "Run the same paper rebrand debug workflows from a Vercel-hosted UI.",
      "This frontend proxies requests to your backend server, which runs OCR, plate detection, and image processing.",
    ],
    [],
  );

  return (
    <main>
      <section className="card section-card">
        <h1 className="section-heading">Paper Rebrand Dashboard</h1>
        {pageDescription.map((line) => (
          <p key={line} className="hint">
            {line}
          </p>
        ))}
      </section>

      <section className="card section-card">
        <h2 className="section-heading">Run paper workflow</h2>
        <p className="hint small-gap">
          Upload one paper image to visualize OCR extraction, sensitive-region detection, and the final rebranded result.
        </p>
        <form onSubmit={(event) => void handleSubmit(event, "/api/paper-debug/run", setPaperRun)}>
          <label className="label" htmlFor="paper-run-image">
            Upload paper image
          </label>
          <input id="paper-run-image" name="image" type="file" accept=".jpg,.jpeg,.png,.webp,.bmp" required />
          <div className="actions">
            <button disabled={paperRun.loading} type="submit">
              {paperRun.loading ? "Running..." : "Run workflow"}
            </button>
          </div>
        </form>
        {paperRun.error ? <div className="error-box">{paperRun.error}</div> : null}
        {paperRun.data && "summary" in paperRun.data ? (
          <div className="result-grid">
            <SummaryCard title="Paper workflow summary" summary={paperRun.data.summary} />
            <ImageCard title="Input" src={getImageValue(paperRun.data, "input")} />
            <ImageCard title="Oriented" src={getImageValue(paperRun.data, "oriented")} />
            <ImageCard title="OCR overlay" src={getImageValue(paperRun.data, "ocr_overlay")} />
            <ImageCard title="Sensitive overlay" src={getImageValue(paperRun.data, "sensitive_overlay")} />
            <ImageCard title="Rebranded" src={getImageValue(paperRun.data, "rebranded")} />
          </div>
        ) : null}
      </section>

      <section className="card section-card">
        <h2 className="section-heading">Rerun paper workflow with manual OCR texts</h2>
        <p className="hint small-gap">
          Re-upload the paper image and provide one manual OCR text per line to force those fields into the redaction workflow.
        </p>
        <form onSubmit={(event) => void handleSubmit(event, "/api/paper-debug/rerun", setPaperRerun)}>
          <div className="form-grid">
            <div>
              <label className="label" htmlFor="paper-rerun-image">
                Upload paper image
              </label>
              <input id="paper-rerun-image" name="image" type="file" accept=".jpg,.jpeg,.png,.webp,.bmp" required />
            </div>
            <div>
              <label className="label" htmlFor="manual-texts">
                Manual OCR texts
              </label>
              <textarea
                id="manual-texts"
                name="manual_texts"
                placeholder="One line per text you want to force into the redaction workflow."
              />
            </div>
          </div>
          <div className="actions">
            <button disabled={paperRerun.loading} type="submit">
              {paperRerun.loading ? "Rerunning..." : "Rerun workflow"}
            </button>
          </div>
        </form>
        {paperRerun.error ? <div className="error-box">{paperRerun.error}</div> : null}
        {paperRerun.data && "summary" in paperRerun.data ? (
          <div className="result-grid">
            <SummaryCard title="Rerun summary" summary={paperRerun.data.summary} />
            <ImageCard title="Input" src={getImageValue(paperRerun.data, "input")} />
            <ImageCard title="Oriented" src={getImageValue(paperRerun.data, "oriented")} />
            <ImageCard title="OCR overlay" src={getImageValue(paperRerun.data, "ocr_overlay")} />
            <ImageCard title="Sensitive overlay" src={getImageValue(paperRerun.data, "sensitive_overlay")} />
            <ImageCard title="Rebranded" src={getImageValue(paperRerun.data, "rebranded")} />
          </div>
        ) : null}
      </section>

      <section className="card section-card">
        <h2 className="section-heading">Classify license plate color</h2>
        <p className="hint small-gap">
          Inspect the chosen plate bbox, expanded crop, color masks, and the final plate-color decision from the backend.
        </p>
        <form onSubmit={(event) => void handleSubmit(event, "/api/paper-debug/classify-license-plate", setLicensePlate)}>
          <label className="label" htmlFor="license-plate-image">
            Upload image
          </label>
          <input id="license-plate-image" name="image" type="file" accept=".jpg,.jpeg,.png,.webp,.bmp" required />
          <div className="actions">
            <button disabled={licensePlate.loading} type="submit">
              {licensePlate.loading ? "Classifying..." : "Classify license plate color"}
            </button>
          </div>
        </form>
        {licensePlate.error ? <div className="error-box">{licensePlate.error}</div> : null}
        {licensePlate.data && "summary" in licensePlate.data ? (
          <div className="result-grid">
            <SummaryCard title="License plate summary" summary={licensePlate.data.summary} />
            <ImageCard title="Input" src={getImageValue(licensePlate.data, "input")} />
            <ImageCard title="Detector overlay" src={getImageValue(licensePlate.data, "detection_overlay")} />
            <ImageCard title="Plate crop" src={getImageValue(licensePlate.data, "plate_crop")} />
            <ImageCard title="Yellow mask" src={getImageValue(licensePlate.data, "yellow_mask")} />
            <ImageCard title="White mask" src={getImageValue(licensePlate.data, "white_mask")} />
            <ImageCard title="Red mask" src={getImageValue(licensePlate.data, "red_mask")} />
          </div>
        ) : null}
      </section>

      <section className="card section-card">
        <h2 className="section-heading">Visualize hide license plate workflow</h2>
        <p className="hint small-gap">
          Show how the backend finds hide regions, merges detections when needed, and produces the final hidden/rebranded result.
        </p>
        <form onSubmit={(event) => void handleSubmit(event, "/api/paper-debug/hide-license-plate", setHidePlate)}>
          <label className="label" htmlFor="hide-plate-image">
            Upload image
          </label>
          <input id="hide-plate-image" name="image" type="file" accept=".jpg,.jpeg,.png,.webp,.bmp" required />
          <div className="actions">
            <button disabled={hidePlate.loading} type="submit">
              {hidePlate.loading ? "Running..." : "Hide license plate"}
            </button>
          </div>
        </form>
        {hidePlate.error ? <div className="error-box">{hidePlate.error}</div> : null}
        {hidePlate.data && "summary" in hidePlate.data ? (
          <div className="result-grid">
            <SummaryCard title="Hide license plate summary" summary={hidePlate.data.summary} />
            <ImageCard title="Input" src={getImageValue(hidePlate.data, "input")} />
            <ImageCard
              title={getTitleValue(hidePlate.data, "stage_1_title", "Stage 1")}
              src={getImageValue(hidePlate.data, "stage_1")}
            />
            <ImageCard
              title={getTitleValue(hidePlate.data, "stage_2_title", "Stage 2")}
              src={getImageValue(hidePlate.data, "stage_2")}
            />
            <ImageCard
              title={getTitleValue(hidePlate.data, "stage_3_title", "Stage 3")}
              src={getImageValue(hidePlate.data, "stage_3")}
            />
            <ImageCard title="Result" src={getImageValue(hidePlate.data, "result")} />
          </div>
        ) : null}
      </section>

      <section className="card section-card">
        <h2 className="section-heading">Check workflow state by car id</h2>
        <p className="hint small-gap">
          Query the latest saved workflow state, including rebrand, save, and dispatch timestamps for a given car id.
        </p>
        <form onSubmit={(event) => void handleSubmit(event, "/api/paper-debug/workflow", setWorkflow)}>
          <label className="label" htmlFor="car-id">
            Car id
          </label>
          <input id="car-id" name="car_id" type="text" placeholder="d37ad6c9-f852-4242-9d7e-ae1b5fae0c2a" required />
          <div className="actions">
            <button disabled={workflow.loading} type="submit">
              {workflow.loading ? "Checking..." : "Check workflow state"}
            </button>
          </div>
        </form>
        {workflow.error ? <div className="error-box">{workflow.error}</div> : null}
        {workflow.data ? (
          <div className="result-grid">
            <SummaryCard title="Workflow state" summary={workflow.data} />
          </div>
        ) : null}
      </section>
    </main>
  );
}
