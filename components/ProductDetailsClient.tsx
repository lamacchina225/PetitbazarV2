'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ExternalLink } from 'lucide-react';
import AddToCartButton from '@/components/AddToCartButton';

type JsonLike = null | boolean | number | string | JsonLike[] | { [key: string]: JsonLike };

type ProductDetailsViewModel = {
  id: string;
  name: string;
  description: string | null;
  salePrice: number;
  images: string[];
  sizes: string[];
  variants: JsonLike | null;
  categoryName: string;
  sourceUrl?: string | null;
};

function uniq(values: string[]): string[] {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function stringsFromValue(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === 'string') {
    return value
      .split(/[|,/]/g)
      .map((v) => v.trim())
      .filter(Boolean);
  }
  if (typeof value === 'number') return [String(value)];
  if (Array.isArray(value)) return uniq(value.flatMap((item) => stringsFromValue(item)));
  return [];
}

function extractOptionValues(variants: unknown, keyHints: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<unknown>();

  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    if (seen.has(node)) return;
    seen.add(node);

    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }

    const obj = node as Record<string, unknown>;

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (keyHints.some((hint) => lowerKey.includes(hint))) {
        out.push(...stringsFromValue(value));
      }
    }

    const optionName = String(obj.optionName ?? obj.name ?? obj.attributeName ?? '').toLowerCase();
    if (keyHints.some((hint) => optionName.includes(hint))) {
      out.push(
        ...stringsFromValue(obj.value),
        ...stringsFromValue(obj.values),
        ...stringsFromValue(obj.optionValue),
        ...stringsFromValue(obj.optionValues),
        ...stringsFromValue(obj.label)
      );
    }

    Object.values(obj).forEach(walk);
  };

  walk(variants);

  return uniq(out);
}

function normalizeSizeLabel(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, '');
}

export default function ProductDetailsClient({ product }: { product: ProductDetailsViewModel }) {
  const { data: session } = useSession();
  const images = useMemo(
    () =>
      uniq(
        (product.images || [])
          .map((img) => String(img || '').trim())
          .filter((img) => /^https?:\/\//i.test(img))
      ),
    [product.images]
  );

  const [selectedImage, setSelectedImage] = useState(images[0] || '');

  const variantColors = useMemo(
    () => extractOptionValues(product.variants, ['color', 'colour', 'couleur']),
    [product.variants]
  );
  const variantSizes = useMemo(
    () => extractOptionValues(product.variants, ['size', 'taille']).map(normalizeSizeLabel),
    [product.variants]
  );

  const sizes = useMemo(
    () => uniq([...(product.sizes || []).map(normalizeSizeLabel), ...variantSizes]),
    [product.sizes, variantSizes]
  );

  const [selectedColor, setSelectedColor] = useState(variantColors[0] || '');
  const [selectedSize, setSelectedSize] = useState(sizes[0] || '');
  const sourceUrl = String(product.sourceUrl || '').trim();
  const canOpenSource =
    session?.user?.role === 'ADMIN' &&
    /^https?:\/\//i.test(sourceUrl) &&
    !sourceUrl.includes('example.com');

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
      <div>
        <div className="rounded-lg bg-slate-100 p-4">
          {selectedImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selectedImage} alt={product.name} className="h-[420px] w-full rounded object-cover" />
          ) : null}
        </div>
        {images.length > 1 ? (
          <div className="mt-3 grid grid-cols-5 gap-2">
            {images.map((img) => (
              <button
                key={img}
                type="button"
                onClick={() => setSelectedImage(img)}
                className={`overflow-hidden rounded border ${selectedImage === img ? 'border-slate-900' : 'border-slate-300'}`}
                aria-label="Changer image produit"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt={product.name} className="h-16 w-full object-cover" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm text-slate-500">{product.categoryName}</p>
          {canOpenSource ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer noopener"
              title="Ouvrir l'article source"
              aria-label="Ouvrir l'article source"
              className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <ExternalLink size={14} />
            </a>
          ) : null}
        </div>
        <h1 className="mb-4 text-4xl font-bold">{product.name}</h1>
        <p className="mb-6 text-slate-700">{product.description}</p>

        {variantColors.length > 0 ? (
          <div className="mb-4">
            <p className="mb-2 text-sm font-semibold text-slate-700">Couleurs</p>
            <div className="flex flex-wrap gap-2">
              {variantColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`rounded border px-3 py-1 text-xs ${selectedColor === color ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 text-slate-700'}`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {sizes.length > 0 ? (
          <div className="mb-4">
            <p className="mb-2 text-sm font-semibold text-slate-700">Tailles disponibles</p>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={`rounded border px-3 py-1 text-xs ${selectedSize === size ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 text-slate-700'}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <p className="mb-6 text-3xl font-bold">{product.salePrice.toLocaleString('fr-CI')} FCFA</p>
        <div className="flex items-center gap-3">
          <AddToCartButton productId={product.id} imageSrc={selectedImage || images[0] || undefined} />
          <Link href="/cart" className="inline-block rounded border border-slate-300 px-4 py-2 hover:bg-slate-50">
            Aller au panier
          </Link>
        </div>
      </div>
    </div>
  );
}
