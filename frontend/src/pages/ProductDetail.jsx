import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Heart, ShoppingBag, Zap, Truck, ShieldCheck, RotateCcw, Star,
  ChevronDown, Sparkles, PackageCheck, Leaf, Droplets,
} from 'lucide-react';
import ProductImage from '../components/product/ProductImage.jsx';
import RatingStars from '../components/ui/RatingStars.jsx';
import QuantitySelector from '../components/ui/QuantitySelector.jsx';
import { FullPageLoader } from '../components/ui/Loader.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Badge from '../components/ui/Badge.jsx';
import ProductCard from '../components/product/ProductCard.jsx';
import { apiService } from '../services/apiService.js';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatPrice } from '../utils/format.js';
import { cn } from '../utils/cn.js';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toggle, isWishlisted } = useWishlist();
  const { user } = useAuth();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [variantId, setVariantId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState('description');

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiService.getProduct(slug)
      .then(async (res) => {
        setProduct(res.data);
        setVariantId(res.data.variants[0]?.id || null);
        const [rel, rev] = await Promise.all([
          apiService.getRelatedProducts(res.data).catch(() => ({ data: [] })),
          apiService.getProductReviews(res.data.id).catch(() => ({ data: [] })),
        ]);
        setRelated(rel.data || []);
        setReviews(rev.data || []);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [slug]);

  const variant = useMemo(
    () => product?.variants.find((v) => v.id === variantId) || product?.variants[0],
    [product, variantId]
  );

  if (loading) return <FullPageLoader label="Loading product..." />;
  if (error) return <div className="max-w-3xl mx-auto"><ErrorState message={error.message} onRetry={() => window.location.reload()} /></div>;
  if (!product) return null;

  const wishlisted = isWishlisted(product.id);
  const currentPrice = variant?.price || product.sellingPrice;
  const currentMrp = variant?.mrp || product.mrp;
  const currentDiscount = Math.round(((currentMrp - currentPrice) / currentMrp) * 100);
  const inStock = (variant?.stock ?? product.stock) > 0;

  const handleAdd = () => {
    addItem(product, variantId, quantity);
    toast.show(`${product.name} added to cart`);
  };

  const handleBuyNow = () => {
    addItem(product, variantId, quantity);
    navigate('/checkout');
  };

  const specRows = [
    { label: 'Brand', value: product.brand },
    { label: 'Category', value: product.subcategory },
    { label: 'Weight', value: variant?.weight || product.weight },
    { label: 'Unit', value: variant?.unitSize || product.unit },
    { label: 'MRP', value: formatPrice(currentMrp) },
    { label: 'Selling Price', value: formatPrice(currentPrice) },
    { label: 'GST', value: `${product.tax}%` },
    { label: 'Country of Origin', value: 'India' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 space-y-6">
      <nav className="text-xs text-slate-400" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-brand-600">Home</Link> <span className="mx-1">/</span>
        <Link to={`/category/${product.category}`} className="hover:text-brand-600">{product.category.replace(/-/g, ' ')}</Link> <span className="mx-1">/</span>
        <span className="text-slate-600 font-medium">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-6 lg:gap-10">
        {/* Left: image */}
        <div className="space-y-3">
          <div className="relative">
            <ProductImage product={product} className="aspect-square w-full rounded-card shadow-card" size={120} />
            {currentDiscount > 0 && (
              <span className="absolute top-4 left-4 rounded-lg bg-danger text-white text-sm font-bold px-2.5 py-1 shadow">
                {currentDiscount}% OFF
              </span>
            )}
            <button
              onClick={() => toggle(product.id)}
              className={cn('absolute top-4 right-4 h-11 w-11 rounded-full bg-white/95 backdrop-blur shadow-card flex items-center justify-center transition active:scale-90 cursor-pointer', wishlisted ? 'text-danger' : 'text-slate-400 hover:text-danger')}
              aria-label="Toggle wishlist"
            >
              <Heart size={20} fill={wishlisted ? 'currentColor' : 'none'} />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {product.variants.slice(0, 4).map((v, i) => (
              <div key={v.id} className={cn('rounded-lg border p-1.5 text-center text-[10px] font-medium text-slate-500 bg-white', i === 0 ? 'border-brand-300 bg-brand-50' : 'border-slate-200')}>
                <span className="block text-base">{product.image ? <img src={product.image} alt={product.name} className="h-6 w-6 object-cover rounded-md mx-auto" /> : product.emoji}</span>
                {v.weight}
              </div>
            ))}
          </div>
        </div>

        {/* Right: info */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge color="violet">{product.subcategory}</Badge>
            {product.bestseller && <Badge color="green">Bestseller</Badge>}
            {product.newArrival && <Badge color="brand">New</Badge>}
          </div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{product.brand}</p>
          <h1 className="text-xl md:text-2xl font-bold mt-1">{product.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <RatingStars rating={product.rating} size={15} />
            <button onClick={() => { const el = document.getElementById('reviews'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }} className="text-xs text-brand-600 hover:underline">
              {product.reviewCount} reviews
            </button>
          </div>

          <div className="mt-4 flex items-end gap-3">
            <span className="text-3xl font-extrabold text-slate-900">{formatPrice(currentPrice)}</span>
            <span className="text-lg text-slate-400 line-through">{formatPrice(currentMrp)}</span>
            <span className="text-sm font-bold text-success bg-success/10 rounded-lg px-2 py-1">{currentDiscount}% OFF</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Inclusive of all taxes</p>

          {/* Variants */}
          {product.variants.length > 1 && (
            <div className="mt-5">
              <p className="label">Select size</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => { setVariantId(v.id); setQuantity(1); }}
                    className={cn('rounded-xl border px-4 py-2 text-sm font-medium transition cursor-pointer', variantId === v.id ? 'border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20' : 'border-slate-200 hover:border-brand-300')}
                  >
                    {v.weight}
                    <span className="block text-[11px] text-slate-400">{formatPrice(v.price)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock */}
          <div className={cn('mt-4 flex items-center gap-2 text-sm font-medium', inStock ? 'text-success' : 'text-danger')}>
            {inStock ? <PackageCheck size={17} /> : <Heart size={17} />}
            {inStock ? `In stock — ready for ${'10'} min delivery` : 'Out of stock'}
          </div>

          {/* Quantity + actions */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <QuantitySelector quantity={quantity} onChange={setQuantity} min={1} max={Math.min(product.maxQty, variant?.stock || product.stock)} />
            <button onClick={handleAdd} disabled={!inStock} className="btn-secondary flex-1 sm:flex-none px-6">
              <ShoppingBag size={17} /> Add to Cart
            </button>
            <button onClick={handleBuyNow} disabled={!inStock} className="btn-primary flex-1 sm:flex-none px-6">
              <Zap size={17} /> Buy Now
            </button>
          </div>

          {/* Delivery perks */}
          <div className="mt-6 grid grid-cols-3 gap-2">
            {[
              { icon: Truck, label: 'Delivered in', value: '10-20 min' },
              { icon: ShieldCheck, label: 'Pay securely', value: 'UPI, Cards, COD' },
              { icon: RotateCcw, label: 'Easy returns', value: '7 days return' },
            ].map((p) => (
              <div key={p.label} className="rounded-xl border border-slate-200 p-3 text-center">
                <p.icon size={18} className="mx-auto text-brand-600" />
                <p className="text-[11px] font-semibold text-slate-700 mt-1.5">{p.value}</p>
                <p className="text-[10px] text-slate-400">{p.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card overflow-hidden">
        <div className="flex border-b border-slate-100 overflow-x-auto thin-scroll">
          {[
            { id: 'description', label: 'Description' },
            { id: 'specs', label: 'Specifications' },
            { id: 'ingredients', label: 'Ingredients' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn('px-5 py-3 text-sm font-medium whitespace-nowrap transition cursor-pointer border-b-2', tab === t.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700')}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="p-5">
          {tab === 'description' && <p className="text-sm text-slate-600 leading-relaxed">{product.description}</p>}
          {tab === 'specs' && (
            <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
              {specRows.map((r) => (
                <div key={r.label} className="flex justify-between border-b border-slate-100 pb-2">
                  <dt className="text-sm text-slate-500">{r.label}</dt>
                  <dd className="text-sm font-medium text-slate-800">{r.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {tab === 'ingredients' && (
            <div className="text-sm text-slate-600 space-y-3">
              <p className="flex items-center gap-2"><Leaf size={15} className="text-success" /> {product.name} — 100% natural ingredients, no artificial colours.</p>
              <p className="flex items-center gap-2"><Droplets size={15} className="text-sky-500" /> Storage: keep in a cool, dry place. Refrigerate after opening.</p>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div id="reviews" className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Ratings & Reviews</h2>
          <button className="btn-secondary btn-sm">Write a Review</button>
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-56 shrink-0 text-center md:text-left">
            <p className="text-4xl font-extrabold">{product.rating}</p>
            <RatingStars rating={product.rating} count={product.reviewCount} className="mt-1 justify-center md:justify-start" />
            <div className="mt-4 space-y-1.5">
              {[5, 4, 3, 2, 1].map((s) => {
                const pct = s === 5 ? 62 : s === 4 ? 24 : s === 3 ? 8 : s === 2 ? 3 : 3;
                return (
                  <div key={s} className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="w-3 font-medium">{s}</span>
                    <Star size={11} className="text-amber-400" fill="currentColor" />
                    <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-7 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex-1 divide-y divide-slate-100">
            {reviews.slice(0, 4).map((r) => (
              <div key={r.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <span className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">
                    {r.user.name.split(' ').map((s) => s[0]).join('').slice(0, 2)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{r.user.name} {r.verified && <Badge color="green" className="ml-1">Verified</Badge>}</p>
                    <RatingStars rating={r.rating} size={12} />
                  </div>
                  <span className="ml-auto text-xs text-slate-400">{r.date}</span>
                </div>
                <p className="text-sm font-semibold text-slate-800 mt-2">{r.title}</p>
                <p className="text-sm text-slate-600 mt-0.5">{r.content}</p>
              </div>
            ))}
            {reviews.length === 0 && <EmptyState title="No reviews yet" description="Be the first to review this product." />}
          </div>
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-3">Related Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
            {related.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}