import Link from "next/link";
import { notFound } from "next/navigation";
import { BookSheet, pageCountLabel } from "@/components/kdp/BookSheet";
import { getBookIds, loadBook } from "@/lib/kdpBooks";
import { formatInches, type BookGeometry } from "@/lib/kdpSizes";
import { lowContentUploadNotes } from "@/lib/kdpTemplates";
import type { BookManifest, RenderedPage } from "@/types/kdp";

export function generateStaticParams() {
  return getBookIds().map((bookId) => ({ bookId }));
}

export async function generateMetadata({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const book = loadBook(bookId);
  return {
    title: book?.manifest ? `${book.manifest.kdp.title} — wireframe` : "KDP wireframe",
  };
}

export default async function KdpBookPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const book = loadBook(bookId);
  if (!book) notFound();

  const geometry = book.geometry;
  const scale = geometry ? 440 / geometry.pageWidthPx : 1;

  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/kdp" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← KDP wireframes
        </Link>
        {geometry && book.manifest ? (
          <Link href={`/kdp/${book.id}/print`} className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
            Open print sheets →
          </Link>
        ) : null}
      </div>

      <h1 className="mt-2 text-2xl font-semibold">{book.manifest?.kdp.title ?? book.id}</h1>
      {book.manifest ? (
        <p className="mt-1 max-w-2xl text-neutral-600">{book.manifest.kdp.subtitle}</p>
      ) : (
        <p className="mt-1 text-neutral-600">This manifest did not validate.</p>
      )}

      {book.errors.length > 0 ? (
        <ul className="mt-4 list-disc space-y-1 rounded-lg border border-neutral-300 bg-white p-4 text-sm text-neutral-800">
          {book.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}
      {book.warnings.length > 0 ? (
        <ul className="mt-4 list-disc space-y-1 rounded-lg border border-neutral-200 bg-neutral-100 p-4 text-sm text-neutral-700">
          {book.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}

      {book.manifest && geometry ? (
        <dl className="mt-6 grid max-w-3xl grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          <Spec term="Trim" value={`${geometry.trim.label}${geometry.largeTrim ? " · large trim" : ""}`} />
          <Spec
            term="Bleed page"
            value={`${formatInches(geometry.pageWidthIn)} × ${formatInches(geometry.pageHeightIn)} (${geometry.pageWidthPt} × ${geometry.pageHeightPt} pt)`}
          />
          <Spec term="Pages" value={pageCountLabel(geometry.pageCount)} />
          <Spec term="Gutter" value={formatInches(geometry.gutterIn)} />
          <Spec term="Outside margin" value={`${formatInches(geometry.outsideMarginIn)} from the trim`} />
          <Spec term="Paper / ink" value={`${book.manifest.paper} / ${book.manifest.ink}`} />
          <Spec term="Interior" value={book.manifest.content === "low-content" ? "Low-content" : "Standard"} />
          {book.manifest.content === "low-content" ? (
            <Spec
              term="ISBN choice"
              value={book.manifest.isbn === "none" ? "Publish without an ISBN" : "Use my own ISBN"}
            />
          ) : null}
          <div className="sm:col-span-2">
            <dt className="text-neutral-500">Keywords</dt>
            <dd className="text-neutral-900">{book.manifest.kdp.keywords.join(" · ")}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-neutral-500">Categories</dt>
            <dd className="text-neutral-900">
              {book.manifest.kdp.categories.map((category) => category.label).join(" · ")}
            </dd>
          </div>
        </dl>
      ) : null}

      {book.manifest?.content === "low-content" ? (
        <ul className="mt-4 max-w-3xl list-disc space-y-1 rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-700">
          {lowContentUploadNotes(book.manifest.isbn).map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}

      {book.manifest && geometry ? (
        <SheetList manifest={book.manifest} pages={book.pages} geometry={geometry} scale={scale} />
      ) : null}
    </>
  );
}

function SheetList({
  manifest,
  pages,
  geometry,
  scale,
}: {
  manifest: BookManifest;
  pages: RenderedPage[];
  geometry: BookGeometry;
  scale: number;
}) {
  return (
    <ul className="mt-8 flex flex-col gap-8">
      {pages.map((page, index) => {
        const pageNumber = index + 1;
        return (
          <li key={pageNumber}>
            <p className="mb-2 text-xs font-medium text-neutral-500">
              Page {pageNumber}
              {pageNumber % 2 === 1 ? " · recto" : " · verso"}
            </p>
            <div style={{ width: geometry.pageWidthPx * scale, height: geometry.pageHeightPx * scale }}>
              <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
                <BookSheet
                  manifest={manifest}
                  page={page}
                  pageNumber={pageNumber}
                  geometry={geometry}
                  mode="preview"
                />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Spec({ term, value }: { term: string; value: string }) {
  return (
    <div>
      <dt className="text-neutral-500">{term}</dt>
      <dd className="text-neutral-900">{value}</dd>
    </div>
  );
}
