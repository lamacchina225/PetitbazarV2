export function animateFlyToCart(options: {
  sourceEl?: HTMLElement | null;
  imageSrc?: string | null;
  size?: number;
}) {
  if (typeof window === 'undefined') return;

  const cartTargets = Array.from(
    document.querySelectorAll<HTMLElement>('[data-cart-icon]')
  );
  const cart =
    cartTargets.find((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }) || null;

  if (!cart) return;

  const cartRect = cart.getBoundingClientRect();
  const sourceRect = options.sourceEl?.getBoundingClientRect();
  const size = options.size ?? 64;

  const startX = sourceRect
    ? sourceRect.left + sourceRect.width / 2 - size / 2
    : window.innerWidth / 2 - size / 2;
  const startY = sourceRect
    ? sourceRect.top + sourceRect.height / 2 - size / 2
    : window.innerHeight / 2 - size / 2;
  const endX = cartRect.left + cartRect.width / 2 - size / 2;
  const endY = cartRect.top + cartRect.height / 2 - size / 2;

  const fly = document.createElement('div');
  fly.className = 'fly-to-cart';
  fly.style.width = `${size}px`;
  fly.style.height = `${size}px`;
  fly.style.left = `${startX}px`;
  fly.style.top = `${startY}px`;

  if (options.imageSrc) {
    fly.style.backgroundImage = `url('${options.imageSrc}')`;
    fly.style.backgroundSize = 'cover';
    fly.style.backgroundPosition = 'center';
  } else {
    fly.style.background =
      'radial-gradient(circle at 30% 30%, #e2e8f0, #475569)';
  }

  document.body.appendChild(fly);

  const deltaX = endX - startX;
  const deltaY = endY - startY;

  fly.animate(
    [
      { transform: 'translate3d(0,0,0) scale(1)', opacity: 1, offset: 0 },
      {
        transform: `translate3d(${deltaX * 0.55}px, ${deltaY * 0.35}px, 0) scale(0.7)`,
        opacity: 0.95,
        offset: 0.6,
      },
      {
        transform: `translate3d(${deltaX}px, ${deltaY}px, 0) scale(0.28)`,
        opacity: 0.15,
        offset: 1,
      },
    ],
    { duration: 700, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }
  ).onfinish = () => fly.remove();

  cart.classList.add('cart-pop');
  setTimeout(() => cart.classList.remove('cart-pop'), 420);
}

