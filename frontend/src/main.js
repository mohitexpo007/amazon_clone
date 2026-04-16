import api from "./api.js";
import "./style.css";

const app = document.querySelector("#app");

const navigationItems = [
  "All",
  "Rufus",
  "Prime",
  "MX Player",
  "Sell",
  "Amazon Pay",
  "Gift Cards",
  "Gift Ideas",
  "Buy Again",
  "AmazonBasics",
  "Home Improvement",
];

const heroSlides = [
  "https://images-eu.ssl-images-amazon.com/images/G/31/img2020/img21/apparelGW/janart26/Rec_AFP_rec._CB783122021_.jpg",
  "https://m.media-amazon.com/images/I/71lRpmzSaVL._SX3000_.png",
  "https://images-eu.ssl-images-amazon.com/images/G/31/IMG25/Media/Books/SummerMiniEvent/PC/V1/New_class_new_books._CB783026398_.jpg",
  "https://images-eu.ssl-images-amazon.com/images/G/31/img17/AmazonPay/Siddhi/CBCC-PC_Hero_3000x1200_Prime1_sept24._CB563126190_.jpg",
];

const languageOptions = [
  { label: "English", code: "EN" },
  { label: "हिन्दी", code: "HI" },
  { label: "தமிழ்", code: "TA" },
  { label: "తెలుగు", code: "TE" },
  { label: "ಕನ್ನಡ", code: "KN" },
  { label: "മലയാളം", code: "ML" },
  { label: "বাংলা", code: "BN" },
  { label: "मराठी", code: "MR" },
];

const state = {
  products: [],
  cartItems: [],
  loadingProducts: true,
  loadingCart: true,
  addingProductId: null,
  error: "",
  heroSlideIndex: 0,
  previousHeroSlideIndex: null,
  heroSlideDirection: "next",
  languageMenuOpen: false,
  selectedLanguageCode: "EN",
};

let isRenderingScheduled = false;
let heroAutoAdvanceId = null;
let heroAnimationCleanupId = null;

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const formatPrice = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const scheduleRender = () => {
  if (isRenderingScheduled) {
    return;
  }

  isRenderingScheduled = true;
  requestAnimationFrame(() => {
    isRenderingScheduled = false;
    render();
  });
};

const getImageAttributes = (mode = "lazy") =>
  mode === "eager"
    ? `loading="eager" decoding="async" fetchpriority="high"`
    : `loading="lazy" decoding="async"`;

const getCartSummary = () =>
  state.cartItems.reduce(
    (summary, item) => {
      summary.count += item.quantity;
      summary.total += Number(item.price || 0) * item.quantity;
      return summary;
    },
    { count: 0, total: 0 }
  );

const getProducts = (count, offset = 0) => {
  if (state.products.length === 0) {
    return [];
  }

  return Array.from({ length: count }, (_, index) => {
    const productIndex = (offset + index) % state.products.length;
    return state.products[productIndex];
  });
};

const buildCardItems = (items = [], options = {}) =>
  items
    .map((item) => {
      const image = item.images?.[0] || "https://via.placeholder.com/320x240?text=Product";
      const priceMarkup = options.showPrice
        ? `<div class="tile-price-row">
            <strong>${formatPrice(item.price)}</strong>
            <button
              class="tile-cart-button"
              data-product-id="${item.id}"
              ${state.addingProductId === item.id ? "disabled" : ""}
            >
              ${state.addingProductId === item.id ? "Adding" : "Add"}
            </button>
          </div>`
        : "";

      return `
        <article class="deal-tile ${options.compact ? "deal-tile-compact" : ""}">
          <img
            src="${escapeHtml(image)}"
            alt="${escapeHtml(item.name)}"
            ${getImageAttributes(options.imageMode)}
          />
          <h3>${escapeHtml(item.name)}</h3>
          ${options.hideDescription ? "" : `<p>${escapeHtml(item.category || "Popular picks")}</p>`}
          ${priceMarkup}
        </article>
      `;
    })
    .join("");

const buildHomepageCards = () => {
  const cartDrivenItems =
    state.cartItems.length > 0
      ? state.cartItems.map((item) => ({
          id: item.product_id,
          name: item.name || `Product ${item.product_id}`,
          category: `Qty ${item.quantity}`,
          price: item.price,
          images: item.images || [],
        }))
      : getProducts(4, 0);

  return [
    {
      title: "Pick up where you left off",
      link: "See more",
      items: cartDrivenItems.slice(0, 4),
      imageOnly: true,
    },
    {
      title: "Continue shopping deals",
      link: "See more deals",
      items: getProducts(4, 4),
      imageOnly: true,
    },
    {
      title: "Buy again",
      link: "More in Buy Again",
      items: getProducts(4, 8),
      imageOnly: true,
    },
    {
      title: "Deals related to items you've saved",
      link: "See more deals",
      items: getProducts(4, 12),
      imageOnly: true,
    },
  ];
};

const buildSecondaryCards = () => {
  const featuredProduct = getProducts(1, 16)[0] || null;

  return [
    {
      title: "Revamp your home in style",
      link: "Explore all",
      items: getProducts(4, 17),
    },
    {
      title: "Up to 60% off | Footwear & handbags",
      link: "See all offers",
      items: getProducts(4, 21),
    },
    {
      title: "Up to 75% off | Headphones",
      link: "Shop Now",
      single: featuredProduct,
    },
    {
      title: "Up to 60% off | Furniture & mattresses",
      link: "Explore all",
      items: getProducts(4, 25),
    },
  ];
};

const buildTertiaryCards = () => {
  const highlightedProduct = getProducts(1, 29)[0] || null;

  return [
    {
      title: "Keep shopping for",
      link: "See more",
      items: getProducts(4, 30),
      showPrice: true,
    },
    {
      title: "Deals on popular reorders",
      link: "See more deals",
      items: getProducts(4, 34),
      showPrice: true,
    },
    {
      title: "Headphones for running",
      link: "Shop now",
      single: highlightedProduct,
    },
    {
      title: "Up to 60% off | Bestsellers from women-led brands",
      link: "See all offers",
      items: getProducts(4, 38),
    },
  ];
};

const buildWideStrip = (title, offset, count = 6) => {
  const items = getProducts(count, offset);
  const tiles = items
    .map(
      (item) => `
        <a href="/" class="strip-item" aria-label="${escapeHtml(item.name)}">
          <img
            src="${escapeHtml(item.images?.[0] || "https://via.placeholder.com/360x280?text=Product")}"
            alt="${escapeHtml(item.name)}"
            ${getImageAttributes()}
          />
        </a>
      `
    )
    .join("");

  return `
    <section class="wide-strip">
      <div class="wide-strip-header">
        <h2>${escapeHtml(title)}</h2>
        <a href="/">See all offers</a>
      </div>
      <div class="wide-strip-content">
        <button class="strip-arrow strip-arrow-left" type="button" aria-label="Previous items">&#10094;</button>
        <div class="strip-track">
          ${tiles}
        </div>
        <button class="strip-arrow strip-arrow-right" type="button" aria-label="Next items">&#10095;</button>
      </div>
    </section>
  `;
};

const buildLanguageMenu = () => `
  <div class="language-menu">
    <div class="language-menu-pointer"></div>
    <div class="language-menu-card">
      <p class="language-menu-title">Change Language</p>
      <div class="language-options">
        ${languageOptions
          .map(
            (language) => `
              <button
                type="button"
                class="language-option"
                data-language-code="${language.code}"
              >
                <span class="language-radio ${state.selectedLanguageCode === language.code ? "language-radio-selected" : ""}">
                  <span class="language-radio-dot"></span>
                </span>
                <span>${escapeHtml(language.label)} - ${escapeHtml(language.code)}</span>
              </button>
            `
          )
          .join("")}
      </div>
      <div class="language-menu-footer">
        <div class="shopping-region">
          <span class="mini-flag" aria-hidden="true">
            <span class="mini-flag-saffron"></span>
            <span class="mini-flag-white"></span>
            <span class="mini-flag-green"></span>
          </span>
          <span>You are shopping on Amazon.in</span>
        </div>
        <button type="button" class="country-link">Change country/region</button>
      </div>
    </div>
  </div>
`;

const render = () => {
  const cartSummary = getCartSummary();
  const homepageCards = buildHomepageCards();
  const secondaryCards = buildSecondaryCards();
  const tertiaryCards = buildTertiaryCards();
  const currentHeroSlide = heroSlides[state.heroSlideIndex];
  const previousHeroSlide =
    state.previousHeroSlideIndex === null ? null : heroSlides[state.previousHeroSlideIndex];
  const heroStatus =
    state.loadingProducts || state.loadingCart
      ? `<div class="loading-pill">Loading fresh deals...</div>`
      : "";
  const hasProducts = state.products.length > 0;

  const homeCardMarkup =
    state.loadingProducts && state.products.length === 0
      ? `<article class="deal-card status-shell">Loading homepage modules...</article>`
      : homepageCards
          .map(
            (card) => `
                <article class="deal-card">
                <h2>${escapeHtml(card.title)}</h2>
                <div class="deal-tile-grid">
                  ${
                    card.imageOnly
                      ? card.items
                          .map((item) => {
                            const image =
                              item.images?.[0] || "https://via.placeholder.com/320x240?text=Product";

                            return `
                              <a href="/" class="hero-image-tile" aria-label="${escapeHtml(item.name)}">
                                <img
                                  src="${escapeHtml(image)}"
                                  alt="${escapeHtml(item.name)}"
                                  ${getImageAttributes("eager")}
                                />
                              </a>
                            `;
                          })
                          .join("")
                      : buildCardItems(card.items, {
                          showPrice: card.showPrice,
                          imageMode: "eager",
                          hideDescription: card.hideDescription,
                        })
                  }
                </div>
                <a class="deal-link" href="/">${escapeHtml(card.link)}</a>
              </article>
            `
          )
          .join("");

  const secondaryCardMarkup = !hasProducts
    ? `
        <article class="deal-card status-shell">Loading home collections...</article>
        <article class="deal-card status-shell">Loading fashion and footwear...</article>
        <article class="deal-card status-shell">Loading featured audio deal...</article>
        <article class="deal-card status-shell">Loading furniture deals...</article>
      `
    : secondaryCards
    .map((card) => {
      if (card.single) {
        const image =
          card.single.images?.[0] || "https://via.placeholder.com/420x320?text=Product";

        return `
            <article class="deal-card">
            <h2>${escapeHtml(card.title)}</h2>
            <div class="single-feature">
              <img
                src="${escapeHtml(image)}"
                alt="${escapeHtml(card.single.name)}"
                ${getImageAttributes()}
              />
              <div class="single-feature-copy">
                <p>${escapeHtml(card.single.name)}</p>
                <button
                  class="primary-add-button"
                  data-product-id="${card.single.id}"
                  ${state.addingProductId === card.single.id ? "disabled" : ""}
                >
                  ${state.addingProductId === card.single.id ? "Adding..." : "Add to cart"}
                </button>
              </div>
            </div>
            <a class="deal-link" href="/">${escapeHtml(card.link)}</a>
          </article>
        `;
      }

      return `
        <article class="deal-card">
          <h2>${escapeHtml(card.title)}</h2>
          <div class="deal-tile-grid">
            ${buildCardItems(card.items || [], { compact: true, imageMode: "lazy" })}
          </div>
          <a class="deal-link" href="/">${escapeHtml(card.link)}</a>
        </article>
      `;
    })
    .join("");

  const tertiaryCardMarkup = !hasProducts
    ? `
        <article class="deal-card status-shell">Loading more picks...</article>
        <article class="deal-card status-shell">Loading reorder deals...</article>
        <article class="deal-card status-shell">Loading headphones collection...</article>
        <article class="deal-card status-shell">Loading bestseller offers...</article>
      `
    : tertiaryCards
        .map((card) => {
          if (card.single) {
            const image =
              card.single.images?.[0] || "https://via.placeholder.com/420x320?text=Product";

            return `
                <article class="deal-card">
                <h2>${escapeHtml(card.title)}</h2>
                <div class="single-feature">
                  <img
                    src="${escapeHtml(image)}"
                    alt="${escapeHtml(card.single.name)}"
                    ${getImageAttributes()}
                  />
                  <div class="single-feature-copy">
                    <p>${escapeHtml(card.single.name)}</p>
                    <button
                      class="primary-add-button"
                      data-product-id="${card.single.id}"
                      ${state.addingProductId === card.single.id ? "disabled" : ""}
                    >
                      ${state.addingProductId === card.single.id ? "Adding..." : "Add to cart"}
                    </button>
                  </div>
                </div>
                <a class="deal-link" href="/">${escapeHtml(card.link)}</a>
              </article>
            `;
          }

          return `
            <article class="deal-card">
              <h2>${escapeHtml(card.title)}</h2>
              <div class="deal-tile-grid">
                ${buildCardItems(card.items || [], {
                  showPrice: card.showPrice,
                  imageMode: "lazy",
                })}
              </div>
              <a class="deal-link" href="/">${escapeHtml(card.link)}</a>
            </article>
          `;
        })
        .join("");

  app.innerHTML = `
    <div class="site-shell">
      <header class="header-shell">
        <div class="header-top">
          <div class="logo-block">
            <div class="amazon-logo-wrap">
              <div class="amazon-logo">
                <span class="amazon-word">amazon</span><span class="amazon-domain">.in</span>
              </div>
              <div class="amazon-smile"></div>
              <div class="prime-logo">prime</div>
            </div>
          </div>

          <div class="delivery-block">
            <span>Deliver to Mohit</span>
            <strong>Butibori ... 441122</strong>
          </div>

          <form class="search-shell">
            <label class="search-category" for="search-input">All</label>
            <input
              id="search-input"
              class="search-input"
              type="text"
              placeholder="Search Amazon.in"
            />
            <button class="search-button" type="submit" aria-label="Search">
              &#128269;
            </button>
          </form>

          <div class="header-actions">
            <div class="header-link language-link ${state.languageMenuOpen ? "language-link-open" : ""}">
              <button type="button" class="language-trigger" data-language-trigger="true">
                <span class="language-row">
                  <span class="flag-box" aria-hidden="true">
                    <span class="flag-saffron"></span>
                    <span class="flag-white"></span>
                    <span class="flag-green"></span>
                  </span>
                  ${escapeHtml(state.selectedLanguageCode)}
                </span>
                <span class="header-caret">▼</span>
              </button>
              <strong>India</strong>
              ${buildLanguageMenu()}
            </div>
            <div class="header-link">
              <span>Hello, Mohit</span>
              <strong>Account & Lists <span class="header-caret">▼</span></strong>
            </div>
            <div class="header-link">
              <span>Returns</span>
              <strong>& Orders</strong>
            </div>
            <div class="cart-badge">
              <span class="cart-count">${cartSummary.count}</span>
              <strong>Cart</strong>
            </div>
          </div>
        </div>

        <nav class="header-subnav">
          <div class="header-subnav-links">
            ${navigationItems
              .map((item, index) => {
                const linkClass = [
                  index === 0 ? "all-link" : "",
                  item === "Rufus" ? "rufus-pill" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return `
                  <a href="/" class="${linkClass}">
                    ${index === 0 ? "&#9776; " : ""}${escapeHtml(item)}
                  </a>
                `;
              })
              .join("")}
          </div>
          <a href="/" class="subnav-promo">
            <span class="promo-badge">SUMMER ESCAPE SALE</span>
            <strong>Save 13% on flights</strong>
            <span class="promo-pay">pay</span>
          </a>
        </nav>
      </header>

      <div class="page-dim-overlay"></div>

      <main class="homepage-shell">
        <section class="hero-banner">
          <div class="hero-banner-stage">
            ${
              previousHeroSlide
                ? `
                  <div
                    class="hero-banner-slide hero-banner-slide-out hero-banner-slide-out-${state.heroSlideDirection}"
                    aria-hidden="true"
                    style="background-image: linear-gradient(180deg, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.18)), url('${escapeHtml(previousHeroSlide)}');"
                  ></div>
                `
                : ""
            }
            <div
              class="hero-banner-slide ${previousHeroSlide ? `hero-banner-slide-in hero-banner-slide-in-${state.heroSlideDirection}` : ""}"
              aria-hidden="false"
              style="background-image: linear-gradient(180deg, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.18)), url('${escapeHtml(currentHeroSlide)}');"
            ></div>
          </div>
          <button
            class="hero-arrow hero-arrow-left"
            type="button"
            aria-label="Previous slide"
            data-hero-direction="prev"
          >
            &#10094;
          </button>
          <div class="hero-copy">
            <div class="hero-copy-overlay">
              <div class="hero-indicators">
                ${heroSlides
                  .map(
                    (_, index) => `
                      <button
                        class="hero-dot ${index === state.heroSlideIndex ? "hero-dot-active" : ""}"
                        type="button"
                        aria-label="Go to slide ${index + 1}"
                        data-hero-index="${index}"
                      ></button>
                    `
                  )
                  .join("")}
              </div>
              <div class="hero-tags">
                <span>Amazon-inspired hero slider</span>
                <span>${state.heroSlideIndex + 1} / ${heroSlides.length}</span>
              </div>
              ${heroStatus}
            </div>
          </div>
          <button
            class="hero-arrow hero-arrow-right"
            type="button"
            aria-label="Next slide"
            data-hero-direction="next"
          >
            &#10095;
          </button>

          <section class="deal-grid hero-embedded-grid">
            ${homeCardMarkup}
          </section>
        </section>

        ${state.error ? `<p class="error-banner">${escapeHtml(state.error)}</p>` : ""}

        <section class="deal-grid secondary-grid">
          ${secondaryCardMarkup}
        </section>

        ${buildWideStrip("Up to 40% off | Headphones and earbuds", 14, 6)}
        ${buildWideStrip("More top picks for you", 20, 6)}

        <section class="deal-grid secondary-grid">
          ${tertiaryCardMarkup}
        </section>

        ${buildWideStrip("Based on your cart", 26, 6)}
        ${buildWideStrip("Trending audio accessories", 32, 6)}

        <section class="cart-summary-strip">
          <div>
            <p class="summary-label">Cart snapshot</p>
            <h2>${cartSummary.count} item${cartSummary.count === 1 ? "" : "s"} in cart</h2>
          </div>
          <strong>${formatPrice(cartSummary.total)}</strong>
        </section>
      </main>
    </div>
  `;
};

const fetchProducts = async () => {
  state.error = "";

  try {
    const response = await api.get("/api/products");
    state.products = response.data;
  } catch (error) {
    console.error("Error fetching products:", error);
    state.error = "Unable to load products right now.";
  } finally {
    state.loadingProducts = false;
  }
};

const fetchCart = async () => {
  try {
    const response = await api.get("/api/cart");
    state.cartItems = response.data;
  } catch (error) {
    console.error("Error fetching cart:", error);
    state.error = "Unable to load cart data right now.";
  } finally {
    state.loadingCart = false;
  }
};

const addToCart = async (productId) => {
  state.addingProductId = productId;
  state.error = "";
  scheduleRender();

  try {
    await api.post("/api/cart", {
      product_id: productId,
      quantity: 1,
    });
    const response = await api.get("/api/cart");
    state.cartItems = response.data;
  } catch (error) {
    console.error("Error adding item to cart:", error);
    state.error =
      error.response?.data?.message || "Unable to add this item to the cart.";
  } finally {
    state.addingProductId = null;
    scheduleRender();
  }
};

const setHeroSlide = (nextIndex, direction = "next") => {
  if (nextIndex === state.heroSlideIndex) {
    return;
  }

  if (heroAnimationCleanupId) {
    clearTimeout(heroAnimationCleanupId);
  }

  state.previousHeroSlideIndex = state.heroSlideIndex;
  state.heroSlideIndex = nextIndex;
  state.heroSlideDirection = direction;
  scheduleRender();

  heroAnimationCleanupId = window.setTimeout(() => {
    state.previousHeroSlideIndex = null;
    scheduleRender();
  }, 720);
};

const changeHeroSlide = (direction) => {
  const lastIndex = heroSlides.length - 1;
  const nextIndex =
    direction === "prev"
      ? state.heroSlideIndex === 0
        ? lastIndex
        : state.heroSlideIndex - 1
      : state.heroSlideIndex === lastIndex
        ? 0
        : state.heroSlideIndex + 1;

  setHeroSlide(nextIndex, direction);
};

const startHeroAutoplay = () => {
  if (heroAutoAdvanceId) {
    clearInterval(heroAutoAdvanceId);
  }

  heroAutoAdvanceId = window.setInterval(() => {
    changeHeroSlide("next");
  }, 3000);
};

app.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-product-id]");
  const heroArrow = event.target.closest("[data-hero-direction]");
  const heroDot = event.target.closest("[data-hero-index]");
  const languageTrigger = event.target.closest("[data-language-trigger]");
  const languageOption = event.target.closest("[data-language-code]");
  const languageMenu = event.target.closest(".language-menu");

  if (addButton) {
    addToCart(Number(addButton.dataset.productId));
    return;
  }

  if (languageTrigger) {
    state.languageMenuOpen = !state.languageMenuOpen;
    scheduleRender();
    return;
  }

  if (languageOption) {
    state.selectedLanguageCode = languageOption.dataset.languageCode;
    state.languageMenuOpen = false;
    scheduleRender();
    return;
  }

  if (heroArrow) {
    changeHeroSlide(heroArrow.dataset.heroDirection);
    return;
  }

  if (heroDot) {
    const nextIndex = Number(heroDot.dataset.heroIndex);
    const direction = nextIndex < state.heroSlideIndex ? "prev" : "next";
    setHeroSlide(nextIndex, direction);
    return;
  }

  let shouldRender = false;

  if (!languageMenu) {
    shouldRender = state.languageMenuOpen;
    state.languageMenuOpen = false;
  }

  if (event.target.closest(".strip-arrow") || event.target.closest(".hero-arrow")) {
    event.preventDefault();
  }

  if (shouldRender) {
    scheduleRender();
  }
});

app.addEventListener("submit", (event) => {
  if (event.target.closest(".search-shell")) {
    event.preventDefault();
  }
});

const bootstrap = async () => {
  state.loadingProducts = true;
  state.loadingCart = true;
  render();
  startHeroAutoplay();
  await Promise.allSettled([fetchProducts(), fetchCart()]);
  render();
};

bootstrap();
