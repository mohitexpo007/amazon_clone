import { useEffect, useMemo, useRef, useState } from "react";
import { CartItemModel, CartSummaryModel } from "./models/CartModels.js";
import api from "./api.js";
import "./style.css";

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
  { label: "Hindi", code: "HI" },
  { label: "Tamil", code: "TA" },
  { label: "Telugu", code: "TE" },
  { label: "Kannada", code: "KN" },
  { label: "Malayalam", code: "ML" },
  { label: "Bangla", code: "BN" },
  { label: "Marathi", code: "MR" },
];

const productCategories = ["All", "Electronics", "Fashion", "Home", "Books", "Grocery"];
const priceFilterOptions = [
  { label: "Up to Rs. 1,000", min: "", max: "1000" },
  { label: "Rs. 1,000 - Rs. 5,000", min: "1000", max: "5000" },
  { label: "Rs. 5,000 - Rs. 15,000", min: "5000", max: "15000" },
  { label: "Rs. 15,000 - Rs. 30,000", min: "15000", max: "30000" },
  { label: "Rs. 30,000 & Above", min: "30000", max: "" },
];
const ratingFilterOptions = [
  { label: "4 Stars & Up", value: "4" },
  { label: "3 Stars & Up", value: "3" },
  { label: "2 Stars & Up", value: "2" },
];

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

const getBrandFromName = (name = "") => cleanTextForUi(name).split(" ").slice(0, 2).join(" ");

const cleanTextForUi = (value = "") =>
  String(value)
    .replace(/\s+/g, " ")
    .trim();

const truncateToWordCount = (value = "", wordCount = 3) => {
  const words = cleanTextForUi(value).split(" ").filter(Boolean);
  if (words.length <= wordCount) {
    return words.join(" ");
  }

  return `${words.slice(0, wordCount).join(" ")}...`;
};

const buildDescriptionPoints = (description = "") => {
  const normalized = cleanTextForUi(description);

  if (!normalized) {
    return ["No description available for this product yet."];
  }

  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => cleanTextForUi(sentence))
    .filter(Boolean);

  if (sentences.length > 0) {
    return sentences.slice(0, 5);
  }

  return [normalized];
};

const getImageAttributes = (mode = "lazy") =>
  mode === "eager"
    ? `loading="eager" decoding="async" fetchpriority="high"`
    : `loading="lazy" decoding="async"`;

const defaultCheckoutAddress = {
  fullName: "Mohit",
  addressLine1: "A-802 Vedhariya Apartments",
  addressLine2: "Butibori, Nagpur",
  state: "Maharashtra",
  postalCode: "441122",
  country: "India",
  phone: "9876543210",
};

const AUTH_STORAGE_KEY = "amazonclone-current-user";

const formatAddressForApi = (address) =>
  [
    address.fullName,
    address.addressLine1,
    address.addressLine2,
    address.state,
    address.postalCode,
    address.country,
    `Phone: ${address.phone}`,
  ]
    .filter(Boolean)
    .join(", ");

const formatAddressForDisplay = (address) =>
  [
    address.addressLine1,
    address.addressLine2,
    address.state,
    address.postalCode,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");

const getHeaderAddressPreview = (address = "") => {
  const compact = cleanTextForUi(address);
  if (!compact) {
    return "Add address";
  }

  const words = compact.split(",")[0].split(" ").filter(Boolean);
  return words.slice(0, 2).join(" ");
};

function App() {
  const [allProducts, setAllProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");
  const [appliedCategory, setAppliedCategory] = useState("All");
  const [appliedMinPrice, setAppliedMinPrice] = useState("");
  const [appliedMaxPrice, setAppliedMaxPrice] = useState("");
  const [appliedMinRating, setAppliedMinRating] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHomeProducts, setLoadingHomeProducts] = useState(true);
  const [loadingCart, setLoadingCart] = useState(true);
  const [cartActionItemId, setCartActionItemId] = useState(null);
  const [addingProductId, setAddingProductId] = useState(null);
  const [error, setError] = useState("");
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const [previousHeroSlideIndex, setPreviousHeroSlideIndex] = useState(null);
  const [heroSlideDirection, setHeroSlideDirection] = useState("next");
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [selectedLanguageCode, setSelectedLanguageCode] = useState("EN");
  const [currentView, setCurrentView] = useState("home");
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const storedUser = window.localStorage.getItem(AUTH_STORAGE_KEY);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  const [authMode, setAuthMode] = useState("signup");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [productDetail, setProductDetail] = useState(null);
  const [loadingProductDetail, setLoadingProductDetail] = useState(false);
  const [selectedProductImageIndex, setSelectedProductImageIndex] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("cod");
  const [savedCheckoutAddress, setSavedCheckoutAddress] = useState(defaultCheckoutAddress);
  const [isEditingCheckoutAddress, setIsEditingCheckoutAddress] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderConfirmation, setOrderConfirmation] = useState(null);
  const [loadingOrderConfirmation, setLoadingOrderConfirmation] = useState(false);

  const heroSlideIndexRef = useRef(0);
  const heroAnimationCleanupRef = useRef(null);
  const isHeaderSearchFocusedRef = useRef(false);
  const headerSearchDraftRef = useRef("");
  const checkoutAddressDraftRef = useRef(defaultCheckoutAddress);
  const authDraftRef = useRef({
    name: "",
    email: "",
    address: "",
    password: "",
  });

  useEffect(() => {
    heroSlideIndexRef.current = heroSlideIndex;
  }, [heroSlideIndex]);

  useEffect(() => {
    headerSearchDraftRef.current = searchTerm;
  }, [searchTerm]);

  useEffect(() => {
    try {
      if (currentUser) {
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
      } else {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch {
      // Ignore storage failures and keep the in-memory session.
    }
  }, [currentUser]);

  const getCartSummary = () =>
    new CartSummaryModel(cartItems.map((item) => new CartItemModel(item)));

  const featuredHomepageProducts = useMemo(() => {
    if (allProducts.length === 0) {
      return [];
    }

    const fashionProducts = allProducts.filter((product) =>
      /fashion|shirt|shoe|watch|bag|women|men|clothing|wear/i.test(product.category || product.name)
    );
    const electronicsProducts = allProducts.filter((product) =>
      /electronics|headphone|earbud|speaker|laptop|mobile|charger|camera|smart|tech/i.test(
        product.category || product.name
      )
    );
    const remainingProducts = allProducts.filter(
      (product) =>
        !fashionProducts.some((item) => item.id === product.id) &&
        !electronicsProducts.some((item) => item.id === product.id)
    );

    const mixedProducts = [];
    const maxMixedLength = Math.max(fashionProducts.length, electronicsProducts.length);

    for (let index = 0; index < maxMixedLength; index += 1) {
      if (fashionProducts[index]) {
        mixedProducts.push(fashionProducts[index]);
      }

      if (electronicsProducts[index]) {
        mixedProducts.push(electronicsProducts[index]);
      }
    }

    return [...mixedProducts, ...remainingProducts];
  }, [allProducts]);

  const getProducts = (count, offset = 0) => {
    if (featuredHomepageProducts.length === 0) {
      return [];
    }

    return Array.from({ length: count }, (_, index) => {
      const productIndex = (offset + index) % featuredHomepageProducts.length;
      return featuredHomepageProducts[productIndex];
    });
  };

  useEffect(() => {
    const loadHomeProducts = async () => {
      try {
        const response = await api.get("/api/products");
        setAllProducts(response.data);
      } catch (fetchError) {
        console.error("Error fetching homepage products:", fetchError);
        setError("Unable to load products right now.");
      } finally {
        setLoadingHomeProducts(false);
      }
    };

    loadHomeProducts();
  }, []);

  useEffect(() => {
    const loadCart = async () => {
      try {
        const response = await api.get("/api/cart");
        setCartItems(response.data);
      } catch (fetchError) {
        console.error("Error fetching cart:", fetchError);
        setError("Unable to load cart data right now.");
      } finally {
        setLoadingCart(false);
      }
    };

    loadCart();
  }, []);

  const fetchFilteredProducts = async (
    searchValue = "",
    categoryValue = "All",
    minPriceValue = "",
    maxPriceValue = "",
    minRatingValue = ""
  ) => {
    setLoading(true);

    try {
      const params = {};

      if (searchValue.trim()) {
        params.search = searchValue.trim();
      }

      if (categoryValue !== "All") {
        params.category = categoryValue;
      }

      if (minPriceValue) {
        params.minPrice = minPriceValue;
      }

      if (maxPriceValue) {
        params.maxPrice = maxPriceValue;
      }

      if (minRatingValue) {
        params.minRating = minRatingValue;
      }

      const response = await api.get("/api/products", { params });
      setProducts(response.data);
      setAppliedSearchTerm(searchValue.trim());
      setAppliedCategory(categoryValue);
      setAppliedMinPrice(minPriceValue);
      setAppliedMaxPrice(maxPriceValue);
      setAppliedMinRating(minRatingValue);
    } catch (fetchError) {
      console.error("Error fetching filtered products:", fetchError);
      setError("Unable to load filtered products right now.");
    } finally {
      setLoading(false);
    }
  };

  const fetchProductById = async (productId) => {
    setLoadingProductDetail(true);

    try {
      const response = await api.get(`/api/products/${productId}`);
      setProductDetail(response.data);
      setSelectedProductId(productId);
      setSelectedProductImageIndex(0);
    } catch (fetchError) {
      console.error("Error fetching product detail:", fetchError);
      setError("Unable to load product detail right now.");
      setProductDetail(null);
    } finally {
      setLoadingProductDetail(false);
    }
  };

  const fetchOrderById = async (orderId) => {
    setLoadingOrderConfirmation(true);

    try {
      const response = await api.get(`/api/orders/${orderId}`);
      setOrderConfirmation(response.data);
    } catch (fetchError) {
      console.error("Error fetching order confirmation:", fetchError);
      setError("Unable to load order confirmation right now.");
      setOrderConfirmation(null);
    } finally {
      setLoadingOrderConfirmation(false);
    }
  };

  useEffect(() => {
    const syncViewFromUrl = () => {
      const { pathname, search } = window.location;

      if (pathname === "/signin") {
        setAuthMode("signin");
        setCurrentView("signin");
        return;
      }

      if (pathname === "/signup") {
        setAuthMode("signup");
        setCurrentView("signup");
        return;
      }

      if (!currentUser) {
        setAuthMode("signup");
        setCurrentView("signup");
        if (pathname !== "/signup") {
          navigateTo("/signup");
        }
        return;
      }

      if (pathname === "/checkout") {
        setCurrentView("checkout");
        return;
      }

      if (pathname === "/cart") {
        setCurrentView("cart");
        return;
      }

      if (pathname.startsWith("/order/")) {
        const orderId = Number(pathname.split("/order/")[1]);

        if (Number.isInteger(orderId) && orderId > 0) {
          setCurrentView("confirmation");
          fetchOrderById(orderId);
        } else {
          setCurrentView("home");
        }
        return;
      }

      if (pathname.startsWith("/product/")) {
        const productId = Number(pathname.split("/product/")[1]);

        if (Number.isInteger(productId) && productId > 0) {
          setCurrentView("detail");
          fetchProductById(productId);
        } else {
          setCurrentView("home");
        }

        return;
      }

      if (pathname.startsWith("/search")) {
        const params = new URLSearchParams(search);
        const searchValue = params.get("search") || "";
        const categoryValue = params.get("category") || "All";
        const minPriceValue = params.get("minPrice") || "";
        const maxPriceValue = params.get("maxPrice") || "";
        const minRatingValue = params.get("minRating") || "";

        setSearchTerm(searchValue);
        headerSearchDraftRef.current = searchValue;
        setSelectedCategory(categoryValue);
        setCurrentView("results");
        fetchFilteredProducts(
          searchValue,
          categoryValue,
          minPriceValue,
          maxPriceValue,
          minRatingValue
        );
        return;
      }

      setCurrentView("home");
      setSelectedProductId(null);
      setProductDetail(null);
      setOrderConfirmation(null);
    };

    syncViewFromUrl();
    window.addEventListener("popstate", syncViewFromUrl);

    return () => {
      window.removeEventListener("popstate", syncViewFromUrl);
    };
  }, [currentUser]);

  useEffect(() => {
    if (currentView !== "home") {
      return undefined;
    }

    const autoplayId = window.setInterval(() => {
      if (isHeaderSearchFocusedRef.current) {
        return;
      }

      const currentIndex = heroSlideIndexRef.current;
      const nextIndex = currentIndex === heroSlides.length - 1 ? 0 : currentIndex + 1;
      setHeroSlide(nextIndex, "next");
    }, 3000);

    return () => {
      clearInterval(autoplayId);
      if (heroAnimationCleanupRef.current) {
        clearTimeout(heroAnimationCleanupRef.current);
      }
    };
  }, [currentView]);

  const setHeroSlide = (nextIndex, direction = "next") => {
    if (nextIndex === heroSlideIndexRef.current) {
      return;
    }

    if (heroAnimationCleanupRef.current) {
      clearTimeout(heroAnimationCleanupRef.current);
    }

    setPreviousHeroSlideIndex(heroSlideIndexRef.current);
    setHeroSlideIndex(nextIndex);
    setHeroSlideDirection(direction);

    heroAnimationCleanupRef.current = window.setTimeout(() => {
      setPreviousHeroSlideIndex(null);
    }, 720);
  };

  const changeHeroSlide = (direction) => {
    const currentIndex = heroSlideIndexRef.current;
    const nextIndex =
      direction === "prev"
        ? currentIndex === 0
          ? heroSlides.length - 1
          : currentIndex - 1
        : currentIndex === heroSlides.length - 1
          ? 0
          : currentIndex + 1;

    setHeroSlide(nextIndex, direction);
  };

  const addToCart = async (productId) => {
    setAddingProductId(productId);
    setError("");

    try {
      await api.post("/api/cart", {
        product_id: productId,
        quantity: 1,
      });

      const response = await api.get("/api/cart");
      setCartItems(response.data);
    } catch (requestError) {
      console.error("Error adding item to cart:", requestError);
      setError(requestError.response?.data?.message || "Unable to add this item to the cart.");
    } finally {
      setAddingProductId(null);
    }
  };

  const refreshCartItems = async () => {
    const response = await api.get("/api/cart");
    setCartItems(response.data);
  };

  const openAuthPage = (mode = "signin") => {
    const nextPath = mode === "signup" ? "/signup" : "/signin";
    setError("");
    navigateTo(nextPath);
    setAuthMode(mode);
    setCurrentView(mode);
  };

  const signOut = () => {
    setCurrentUser(null);
    setAuthMode("signin");
    setLanguageMenuOpen(false);
    setAccountMenuOpen(false);
    navigateTo("/signin");
    setCurrentView("signin");
  };

  const submitAuthForm = async (mode, formElement) => {
    const formData = new FormData(formElement);
    const name = cleanTextForUi(formData.get("name"));
    const email = cleanTextForUi(formData.get("email"));
    const address = cleanTextForUi(formData.get("address"));
    const password = String(formData.get("password") || "");

    authDraftRef.current = { name, email, address, password };

    if (!email || !password || (mode === "signup" && (!name || !address))) {
      setError("Please fill in all required fields.");
      return;
    }

    setAuthSubmitting(true);
    setError("");

    try {
      const response = await api.post(`/api/auth/${mode}`, {
        name,
        email,
        address,
        password,
      });

      setCurrentUser(response.data.user);
      authDraftRef.current = { name: "", email: "", address: "", password: "" };
      if (response.data.user?.address) {
        setSavedCheckoutAddress((currentValue) => ({
          ...currentValue,
          fullName: response.data.user.name || currentValue.fullName,
          addressLine1: response.data.user.address,
        }));
      }
      navigateTo("/");
      setCurrentView("home");
    } catch (requestError) {
      console.error(`Error during ${mode}:`, requestError);
      setError(requestError.response?.data?.message || "Unable to continue right now.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  const updateCartItemQuantity = async (cartItemId, quantity) => {
    if (quantity <= 0) {
      await removeCartItem(cartItemId);
      return;
    }

    setCartActionItemId(cartItemId);
    setError("");

    try {
      await api.put(`/api/cart/${cartItemId}`, { quantity });
      await refreshCartItems();
    } catch (requestError) {
      console.error("Error updating cart item:", requestError);
      setError(
        requestError.response?.data?.message || "Unable to update this item right now."
      );
    } finally {
      setCartActionItemId(null);
    }
  };

  const removeCartItem = async (cartItemId) => {
    setCartActionItemId(cartItemId);
    setError("");

    try {
      await api.delete(`/api/cart/${cartItemId}`);
      await refreshCartItems();
    } catch (requestError) {
      console.error("Error removing cart item:", requestError);
      setError(
        requestError.response?.data?.message || "Unable to remove this item right now."
      );
    } finally {
      setCartActionItemId(null);
    }
  };

  const navigateTo = (path) => {
    window.history.pushState({}, "", path);
  };

  const openSearchResults = async (
    searchValue,
    categoryValue,
    minPriceValue = "",
    maxPriceValue = "",
    minRatingValue = ""
  ) => {
    const params = new URLSearchParams();

    if (searchValue.trim()) {
      params.set("search", searchValue.trim());
    }

    if (categoryValue !== "All") {
      params.set("category", categoryValue);
    }

    if (minPriceValue) {
      params.set("minPrice", minPriceValue);
    }

    if (maxPriceValue) {
      params.set("maxPrice", maxPriceValue);
    }

    if (minRatingValue) {
      params.set("minRating", minRatingValue);
    }

    const path = params.toString() ? `/search?${params.toString()}` : "/search";
    navigateTo(path);
    setCurrentView("results");
    setSearchTerm(searchValue.trim());
    headerSearchDraftRef.current = searchValue.trim();
    setSelectedCategory(categoryValue);
    await fetchFilteredProducts(
      searchValue,
      categoryValue,
      minPriceValue,
      maxPriceValue,
      minRatingValue
    );
  };

  const openProductDetail = async (productId) => {
    navigateTo(`/product/${productId}`);
    setCurrentView("detail");
    await fetchProductById(productId);
  };

  const openCartPage = () => {
    navigateTo("/cart");
    setCurrentView("cart");
  };

  const openCheckoutPage = () => {
    navigateTo("/checkout");
    setCurrentView("checkout");
  };

  const openAddressEditor = () => {
    checkoutAddressDraftRef.current = savedCheckoutAddress;
    openCheckoutPage();
    setIsEditingCheckoutAddress(true);
  };

  const openOrderConfirmationPage = async (orderId) => {
    navigateTo(`/order/${orderId}`);
    setCurrentView("confirmation");
    await fetchOrderById(orderId);
  };

  const handleBuyNow = async (productId) => {
    await addToCart(productId);
    openCheckoutPage();
  };

  const saveCheckoutAddressFromForm = (formElement) => {
    const formData = new FormData(formElement);
    const nextAddress = {
      fullName: cleanTextForUi(formData.get("fullName")),
      addressLine1: cleanTextForUi(formData.get("addressLine1")),
      addressLine2: cleanTextForUi(formData.get("addressLine2")),
      state: cleanTextForUi(formData.get("state")),
      postalCode: cleanTextForUi(formData.get("postalCode")),
      country: cleanTextForUi(formData.get("country")),
      phone: cleanTextForUi(formData.get("phone")),
    };

    checkoutAddressDraftRef.current = nextAddress;
    setSavedCheckoutAddress(nextAddress);
    setCurrentUser((currentValue) =>
      currentValue
        ? {
            ...currentValue,
            name: nextAddress.fullName || currentValue.name,
            address: formatAddressForDisplay(nextAddress),
          }
        : currentValue
    );
    setIsEditingCheckoutAddress(false);
  };

  const placeOrder = async () => {
    setPlacingOrder(true);
    setError("");

    try {
      const response = await api.post("/api/orders", {
        address: formatAddressForApi(savedCheckoutAddress),
      });

      await refreshCartItems();
      await openOrderConfirmationPage(response.data.orderId);
    } catch (requestError) {
      console.error("Error placing order:", requestError);
      setError(requestError.response?.data?.message || "Unable to place your order right now.");
    } finally {
      setPlacingOrder(false);
    }
  };

  const cartSummary = useMemo(() => getCartSummary(), [cartItems]);
  const activePriceFilterLabel =
    priceFilterOptions.find(
      (option) => option.min === appliedMinPrice && option.max === appliedMaxPrice
    )?.label || "";

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
                ${addingProductId === item.id ? "disabled" : ""}
              >
                ${addingProductId === item.id ? "Adding" : "Add"}
              </button>
            </div>`
          : "";

        return `
          <article
            class="deal-tile ${options.compact ? "deal-tile-compact" : ""}"
            data-product-link="${item.id}"
          >
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
      cartItems.length > 0
        ? cartItems.map((item) => ({
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
          <a
            href="/product/${item.id}"
            class="strip-item"
            aria-label="${escapeHtml(item.name)}"
            data-product-link="${item.id}"
          >
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
                  <span class="language-radio ${selectedLanguageCode === language.code ? "language-radio-selected" : ""}">
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

  const buildAccountMenu = () => `
    <div class="account-menu">
      <div class="account-menu-pointer"></div>
      <div class="account-menu-card">
        <div class="account-menu-grid">
          <aside class="account-menu-buy-again">
            <h3>Buy it again</h3>
            <a href="/" class="account-menu-manage-link">View All & Manage</a>
            ${getProducts(4, 12)
              .map((item) => {
                const image = item.images?.[0] || "https://via.placeholder.com/120x120?text=Product";

                return `
                  <article class="account-repeat-item">
                    <img src="${escapeHtml(image)}" alt="${escapeHtml(item.name)}" ${getImageAttributes()} />
                    <div>
                      <a href="/product/${item.id}" data-product-link="${item.id}" class="account-repeat-title">
                        ${escapeHtml(truncateToWordCount(item.name, 3))}
                      </a>
                      <p class="account-repeat-price">${formatPrice(item.price)}</p>
                      <p class="account-repeat-prime">prime</p>
                      <button type="button" class="account-repeat-button" data-product-id="${item.id}">
                        ${addingProductId === item.id ? "Adding" : "Add to cart"}
                      </button>
                    </div>
                  </article>
                `;
              })
              .join("")}
          </aside>

          <section class="account-menu-main">
            <div class="account-menu-banner">
              <span>Who is shopping? Select a profile.</span>
              <button type="button" class="account-menu-manage-button">Manage Profiles</button>
            </div>

            <div class="account-menu-columns">
              <div class="account-menu-column">
                <h3>Your Lists</h3>
                <a href="/">Shopping List</a>
                <a href="/">Create a Wish List</a>
                <a href="/">Wish from Any Website</a>
                <a href="/">Baby Wishlist</a>
                <a href="/">Discover Your Style</a>
                <a href="/">Explore Showroom</a>
              </div>

              <div class="account-menu-column account-menu-column-account">
                <h3>Your Account</h3>
                <a href="/">Switch Accounts</a>
                <a href="/">Your Account</a>
                <a href="/">Your Orders</a>
                <a href="/">Your Wish List</a>
                <a href="/">Keep shopping for</a>
                <a href="/">Your Recommendations</a>
                <a href="/">Returns</a>
                <a href="/">Your Prime Membership</a>
                <a href="/">Devices</a>
                <button type="button" class="account-menu-signout" data-open-auth="signout">
                  Sign Out
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  `;

  const sharedHeaderMarkup = `
    <header class="header-shell">
      <div class="header-top">
        <div class="logo-block">
          <a href="/" class="header-logo-image-link" aria-label="Amazon India home">
            <img
              src="/amazon-in-prime-logo.svg"
              alt="Amazon India Prime"
              class="header-logo-image"
              loading="eager"
              decoding="async"
            />
          </a>
        </div>

        <button type="button" class="delivery-block delivery-edit-trigger" data-edit-address-header="true">
          <span>Deliver to ${escapeHtml(currentUser?.name || savedCheckoutAddress.fullName)}</span>
          <strong>${escapeHtml(
            getHeaderAddressPreview(currentUser?.address || formatAddressForDisplay(savedCheckoutAddress))
          )}</strong>
        </button>

        <form class="search-shell">
          <select class="search-category" data-header-category="true" aria-label="Select category">
            ${productCategories
              .map(
                (category) => `
                  <option value="${escapeHtml(category)}" ${selectedCategory === category ? "selected" : ""}>
                    ${escapeHtml(category)}
                  </option>
                `
              )
              .join("")}
          </select>
          <input
            id="search-input"
            class="search-input"
            type="text"
            placeholder="Search Amazon.in"
            value="${escapeHtml(headerSearchDraftRef.current)}"
          />
          <button class="search-button" type="submit" aria-label="Search">
            &#128269;
          </button>
        </form>

        <div class="header-actions">
          <div class="header-link language-link ${languageMenuOpen ? "language-link-open" : ""}">
            <button type="button" class="language-trigger" data-language-trigger="true">
              <span class="language-row">
                <span class="flag-box" aria-hidden="true">
                  <span class="flag-saffron"></span>
                  <span class="flag-white"></span>
                  <span class="flag-green"></span>
                </span>
                ${escapeHtml(selectedLanguageCode)}
              </span>
              <span class="header-caret">▼</span>
            </button>
            <strong>India</strong>
            ${buildLanguageMenu()}
          </div>
          <div class="header-link account-link ${accountMenuOpen ? "account-link-open" : ""}">
            <span>Hello, ${escapeHtml(currentUser?.name || "guest")}</span>
            <strong>
              <button type="button" class="account-trigger" data-account-trigger="true">
                Account & Lists <span class="header-caret">▼</span>
              </button>
            </strong>
            ${buildAccountMenu()}
          </div>
          <div class="header-link">
            <span>${currentUser ? "Signed in as" : "Already a member?"}</span>
            <strong data-open-auth="${currentUser ? "signout" : "signin"}">${escapeHtml(currentUser ? currentUser.email : "Login")}</strong>
          </div>
          <button type="button" class="cart-badge" data-go-cart="true">
            <span class="cart-count">${cartSummary.itemCount}</span>
            <strong>Cart</strong>
          </button>
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
  `;

  const secureCheckoutHeaderMarkup = `
    <header class="secure-checkout-header">
      <a href="/" class="secure-checkout-logo">
        <span class="amazon-word">amazon</span><span class="amazon-domain">.in</span>
        <span class="prime-logo">prime</span>
      </a>
      <h1>Secure checkout <span class="header-caret">▼</span></h1>
      <button type="button" class="cart-badge secure-cart-button" data-go-cart="true">
        <span class="cart-count">${cartSummary.itemCount}</span>
        <strong>Cart</strong>
      </button>
    </header>
  `;

  const authPageMarkup = `
    <main class="auth-shell">
      <section class="auth-form-panel">
        <div class="auth-form-wrap">
          <img
            src="/amazon-in-prime-logo.svg"
            alt="Amazon"
            class="auth-brand"
            loading="eager"
            decoding="async"
          />

          <form class="auth-form-card" data-auth-form="${escapeHtml(authMode)}">
            <h1>${authMode === "signup" ? "Create account" : "Sign in"}</h1>
            <p class="auth-form-subtitle">
              ${authMode === "signup" ? "Unpack happiness with your own Amazon account." : "Welcome back. Sign in to continue shopping."}
            </p>

            ${error ? `<p class="auth-error-banner">${escapeHtml(error)}</p>` : ""}

            ${
              authMode === "signup"
                ? `
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter Your Name"
                    value="${escapeHtml(authDraftRef.current.name)}"
                    autocomplete="name"
                  />
                  <input
                    type="text"
                    name="address"
                    placeholder="Enter Your Address"
                    value="${escapeHtml(authDraftRef.current.address)}"
                    autocomplete="street-address"
                  />
                `
                : ""
            }

            <input
              type="email"
              name="email"
              placeholder="E-mail ID"
              value="${escapeHtml(authDraftRef.current.email)}"
              autocomplete="email"
            />

            <input
              type="password"
              name="password"
              placeholder="${authMode === "signup" ? "Create Password" : "Enter Password"}"
              value="${escapeHtml(authDraftRef.current.password)}"
              autocomplete="${authMode === "signup" ? "new-password" : "current-password"}"
            />

            <p class="auth-terms">
              by signing in you agree to our <span>Terms and Conditions</span>
            </p>

            <button type="submit" class="auth-submit-button" ${authSubmitting ? "disabled" : ""}>
              ${authSubmitting ? "Please wait..." : authMode === "signup" ? "Sign up" : "Sign in"}
            </button>

            <p class="auth-switch-line">
              ${authMode === "signup" ? "already a member?" : "don't have an account?"}
              <button type="button" class="auth-switch-button" data-open-auth="${
                authMode === "signup" ? "signin" : "signup"
              }">
                ${authMode === "signup" ? "login" : "sign up"}
              </button>
            </p>
          </form>
        </div>
      </section>

      <aside class="auth-visual-panel">
        <div class="auth-visual-inner">
          <p class="auth-visual-kicker">◈ Unpack!</p>
          <h2>Happiness</h2>
          <div class="auth-bag-graphic" aria-hidden="true">
            <div class="auth-bag-handle"></div>
            <div class="auth-bag-body">
              <span></span>
              <span></span>
            </div>
            <div class="auth-bag-smile"></div>
          </div>
        </div>
      </aside>
    </main>
  `;

  const homepageMarkup = useMemo(() => {
    const homepageCards = buildHomepageCards();
    const secondaryCards = buildSecondaryCards();
    const tertiaryCards = buildTertiaryCards();
    const currentHeroSlide = heroSlides[heroSlideIndex];
    const previousHeroSlide =
      previousHeroSlideIndex === null ? null : heroSlides[previousHeroSlideIndex];
    const heroStatus =
      loadingHomeProducts || loadingCart
        ? `<div class="loading-pill">Loading fresh deals...</div>`
        : "";
    const hasProducts = allProducts.length > 0;

    const homeCardMarkup =
      loadingHomeProducts && allProducts.length === 0
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
                                item.images?.[0] ||
                                "https://via.placeholder.com/320x240?text=Product";

                              return `
                                <a
                                  href="/product/${item.id}"
                                  class="hero-image-tile"
                                  aria-label="${escapeHtml(item.name)}"
                                  data-product-link="${item.id}"
                                >
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
                    <a href="/product/${card.single.id}" data-product-link="${card.single.id}">
                      <img
                        src="${escapeHtml(image)}"
                        alt="${escapeHtml(card.single.name)}"
                        ${getImageAttributes()}
                      />
                    </a>
                    <div class="single-feature-copy">
                      <a href="/product/${card.single.id}" data-product-link="${card.single.id}">
                        <p>${escapeHtml(card.single.name)}</p>
                      </a>
                      <button
                        class="primary-add-button"
                        data-product-id="${card.single.id}"
                        ${addingProductId === card.single.id ? "disabled" : ""}
                      >
                        ${addingProductId === card.single.id ? "Adding..." : "Add to cart"}
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
                    <a href="/product/${card.single.id}" data-product-link="${card.single.id}">
                      <img
                        src="${escapeHtml(image)}"
                        alt="${escapeHtml(card.single.name)}"
                        ${getImageAttributes()}
                      />
                    </a>
                    <div class="single-feature-copy">
                      <a href="/product/${card.single.id}" data-product-link="${card.single.id}">
                        <p>${escapeHtml(card.single.name)}</p>
                      </a>
                      <button
                        class="primary-add-button"
                        data-product-id="${card.single.id}"
                        ${addingProductId === card.single.id ? "disabled" : ""}
                      >
                        ${addingProductId === card.single.id ? "Adding..." : "Add to cart"}
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

    return `
      <div class="site-shell">
        ${sharedHeaderMarkup}

        <div class="page-dim-overlay"></div>

        <main class="homepage-shell">
          <section class="hero-banner">
            <div class="hero-banner-stage">
              ${
                previousHeroSlide
                  ? `
                    <div
                      class="hero-banner-slide hero-banner-slide-out hero-banner-slide-out-${heroSlideDirection}"
                      aria-hidden="true"
                      style="background-image: linear-gradient(180deg, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.18)), url('${escapeHtml(previousHeroSlide)}');"
                    ></div>
                  `
                  : ""
              }
              <div
                class="hero-banner-slide ${previousHeroSlide ? `hero-banner-slide-in hero-banner-slide-in-${heroSlideDirection}` : ""}"
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
                          class="hero-dot ${index === heroSlideIndex ? "hero-dot-active" : ""}"
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
                  <span>${heroSlideIndex + 1} / ${heroSlides.length}</span>
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

          ${error ? `<p class="error-banner">${escapeHtml(error)}</p>` : ""}

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
              <h2>${cartSummary.itemCount} item${cartSummary.itemCount === 1 ? "" : "s"} in cart</h2>
            </div>
            <strong>${formatPrice(cartSummary.total)}</strong>
          </section>
        </main>
      </div>
    `;
  }, [
    addingProductId,
    allProducts,
    cartSummary,
    cartItems,
    error,
    heroSlideDirection,
    heroSlideIndex,
    accountMenuOpen,
    currentUser,
    languageMenuOpen,
    loadingCart,
    loadingHomeProducts,
    previousHeroSlideIndex,
    searchTerm,
    selectedCategory,
    selectedLanguageCode,
  ]);

  const searchResultsMarkup = useMemo(() => {
    const resultsMarkup = loading
      ? `<div class="listing-status-card">Loading products...</div>`
      : products.length === 0
        ? `<div class="listing-status-card">No products found for this search.</div>`
        : products
            .map((product) => {
              const image =
                product.images?.[0] || "https://via.placeholder.com/420x420?text=Product";

              return `
                <article class="search-result-card">
                  <a href="/product/${product.id}" class="search-result-image-wrap" data-product-link="${product.id}">
                    <img
                      src="${escapeHtml(image)}"
                      alt="${escapeHtml(product.name)}"
                      ${getImageAttributes()}
                    />
                  </a>
                  <div class="search-result-copy">
                    <p class="search-result-sponsored">Sponsored</p>
                    <p class="search-result-brand">${escapeHtml(product.category)}</p>
                    <a href="/product/${product.id}" class="search-result-title" data-product-link="${product.id}">
                      <h3>${escapeHtml(product.name)}</h3>
                    </a>
                    <p class="search-result-meta">
                      ${Number(product.rating || 0).toFixed(1)} ????? (${Number(
                        product.rating_count || 0
                      ).toLocaleString("en-IN")})
                    </p>
                    <p class="search-result-price">${formatPrice(product.price)}</p>
                    <p class="search-result-delivery">FREE delivery by Amazon clone</p>
                    <button
                      class="search-result-cart-button"
                      data-product-id="${product.id}"
                      ${addingProductId === product.id ? "disabled" : ""}
                    >
                      ${addingProductId === product.id ? "Adding..." : "Add to cart"}
                    </button>
                  </div>
                </article>
              `;
            })
            .join("");

    return `
      <div class="site-shell">
        ${sharedHeaderMarkup}

        <div class="page-dim-overlay"></div>

        <main class="search-results-shell">
          <div class="search-results-summary">
            <p>
              Results for <span>"${escapeHtml(appliedSearchTerm || "all products")}"</span>
            </p>
            <button type="button" class="results-sort-pill">Sort by: Featured ?</button>
          </div>

          <div class="results-layout">
            <aside class="results-sidebar">
              <section class="results-filter-card">
                <h2>Popular Shopping Ideas</h2>
                <a href="/search?search=earbuds" data-go-results="true">Earbuds</a>
                <a href="/search?search=wireless%20charger" data-go-results="true">Wireless Charger</a>
                <a href="/search?search=smartwatch" data-go-results="true">Smartwatch</a>
                <a href="/search?search=bluetooth%20speaker" data-go-results="true">Bluetooth Speaker</a>
              </section>

              <section class="results-filter-card">
                <h2>Category</h2>
                ${productCategories
                  .map(
                    (category) => `
                      <label class="results-filter-option results-filter-option-clickable">
                        <input type="radio" name="results-category" ${
                          appliedCategory === category ? "checked" : ""
                        } />
                        <span>${escapeHtml(category)}</span>
                        <button
                          type="button"
                          class="results-filter-hitbox"
                          data-results-category="${escapeHtml(category)}"
                          aria-label="Filter by ${escapeHtml(category)}"
                        ></button>
                      </label>
                    `
                  )
                  .join("")}
              </section>

              <section class="results-filter-card">
                <h2>Price</h2>
                ${priceFilterOptions
                  .map(
                    (option) => `
                      <button
                        type="button"
                        class="results-filter-link ${
                          appliedMinPrice === option.min && appliedMaxPrice === option.max
                            ? "results-filter-link-active"
                            : ""
                        }"
                        data-price-min="${option.min}"
                        data-price-max="${option.max}"
                      >
                        ${escapeHtml(option.label)}
                      </button>
                    `
                  )
                  .join("")}
              </section>

              <section class="results-filter-card">
                <h2>Customer Reviews</h2>
                ${ratingFilterOptions
                  .map(
                    (option) => `
                      <button
                        type="button"
                        class="results-filter-link ${
                          appliedMinRating === option.value ? "results-filter-link-active" : ""
                        }"
                        data-min-rating="${option.value}"
                      >
                        ${escapeHtml(option.label)}
                      </button>
                    `
                  )
                  .join("")}
                <button
                  type="button"
                  class="results-filter-link ${!appliedMinRating ? "results-filter-link-active" : ""}"
                  data-min-rating=""
                >
                  All ratings
                </button>
              </section>
            </aside>

            <section class="results-main">
              <div class="results-hero-banner">
                <div class="results-hero-image">
                  <img
                    src="https://m.media-amazon.com/images/I/71lRpmzSaVL._SX3000_.png"
                    alt="Search hero banner"
                    ${getImageAttributes("eager")}
                  />
                </div>
                <div class="results-hero-copy">
                  <h2>${escapeHtml(appliedSearchTerm || appliedCategory || "Amazon search")}</h2>
                  <p>Shop products in an Amazon-style search results layout.</p>
                </div>
              </div>

              <div class="results-header-block">
                <h2>Results</h2>
                <p>${escapeHtml(
                  [
                    appliedCategory !== "All" ? appliedCategory : "",
                    activePriceFilterLabel,
                    appliedMinRating ? `${appliedMinRating}+ stars` : "",
                  ]
                    .filter(Boolean)
                    .join(" ? ") || "Check each product page for other buying options."
                )}</p>
              </div>

              <div class="results-list">
                ${resultsMarkup}
              </div>
            </section>
          </div>
        </main>
      </div>
    `;
  }, [
    addingProductId,
    appliedCategory,
    appliedMaxPrice,
    appliedMinPrice,
    appliedMinRating,
    appliedSearchTerm,
    loading,
    products,
    searchTerm,
    selectedCategory,
    selectedLanguageCode,
    accountMenuOpen,
    currentUser,
    languageMenuOpen,
    cartSummary.itemCount,
    activePriceFilterLabel,
  ]);

  const productDetailMarkup = useMemo(() => {
    const activeProduct = productDetail;
    const productImages = activeProduct?.images?.length
      ? activeProduct.images
      : ["https://via.placeholder.com/800x800?text=Product"];
    const safeImageIndex = Math.min(selectedProductImageIndex, productImages.length - 1);
    const mainImage = productImages[safeImageIndex];
    const descriptionPoints = buildDescriptionPoints(activeProduct?.description);
    const specifications = activeProduct
      ? [
          ["Brand", getBrandFromName(activeProduct.name)],
          ["Category", activeProduct.category],
          ["Price", formatPrice(activeProduct.price)],
          ["Availability", activeProduct.stock > 0 ? "In stock" : "Currently unavailable"],
          ["Stock", `${activeProduct.stock} units`],
          ["Image Count", `${productImages.length}`],
        ]
      : [];

    const detailContent = loadingProductDetail
      ? `<div class="listing-status-card product-detail-status">Loading product details...</div>`
      : !activeProduct
        ? `<div class="listing-status-card product-detail-status">Product not found.</div>`
        : `
          <div class="product-detail-breadcrumbs">
            <a href="/">Home</a>
            <span>›</span>
            <a href="/search" data-go-results="true">${escapeHtml(activeProduct.category)}</a>
            <span>›</span>
            <span>${escapeHtml(activeProduct.name)}</span>
          </div>

          <section class="product-detail-grid">
            <div class="product-detail-thumbnails">
              ${productImages
                .map(
                  (image, index) => `
                    <button
                      class="product-thumb ${index === safeImageIndex ? "product-thumb-active" : ""}"
                      type="button"
                      data-product-image-index="${index}"
                    >
                      <img src="${escapeHtml(image)}" alt="Thumbnail ${index + 1}" ${getImageAttributes(index === 0 ? "eager" : "lazy")} />
                    </button>
                  `
                )
                .join("")}
            </div>

            <div class="product-detail-gallery">
              <div class="product-detail-main-image">
                <img src="${escapeHtml(mainImage)}" alt="${escapeHtml(activeProduct.name)}" ${getImageAttributes("eager")} />
              </div>
              <p class="product-detail-full-view">Click to see full view</p>
            </div>

            <div class="product-detail-info">
              <h1>${escapeHtml(activeProduct.name)}</h1>
              <a href="/" class="product-detail-store-link">${escapeHtml(getBrandFromName(activeProduct.name))} Store</a>
              <div class="product-detail-rating-row">
                <span>4.4 ★★★★☆</span>
                <span>Search this page</span>
              </div>
              <div class="product-detail-price-row">
                <span class="product-detail-discount">-14%</span>
                <strong>${formatPrice(activeProduct.price)}</strong>
              </div>
              <p class="product-detail-tax-line">Inclusive of all taxes</p>

              <div class="product-detail-offers">
                <article class="product-offer-card">
                  <h3>Cashback</h3>
                  <p>Save extra on eligible payment methods.</p>
                </article>
                <article class="product-offer-card">
                  <h3>No Cost EMI</h3>
                  <p>Flexible monthly options for higher priced products.</p>
                </article>
                <article class="product-offer-card">
                  <h3>Bank Offer</h3>
                  <p>Extra discount on select cards and partner offers.</p>
                </article>
              </div>

              <div class="product-detail-specs">
                ${specifications
                  .map(
                    ([label, value]) => `
                      <div class="product-spec-row">
                        <strong>${escapeHtml(label)}</strong>
                        <span>${escapeHtml(value)}</span>
                      </div>
                    `
                  )
                  .join("")}
              </div>

              <section class="product-detail-about">
                <h2>About this item</h2>
                <ul>
                  ${descriptionPoints
                    .map((point) => `<li>${escapeHtml(point)}</li>`)
                    .join("")}
                </ul>
              </section>
            </div>

            <aside class="product-buy-box">
              <p class="product-buy-price">${formatPrice(activeProduct.price)}</p>
              <p class="product-buy-delivery">FREE delivery by Amazon clone</p>
              <p class="product-buy-stock ${activeProduct.stock > 0 ? "in-stock" : "out-of-stock"}">
                ${activeProduct.stock > 0 ? "In stock" : "Out of stock"}
              </p>
              <button
                class="search-result-cart-button product-buy-cart-button"
                data-product-id="${activeProduct.id}"
                ${addingProductId === activeProduct.id ? "disabled" : ""}
              >
                ${addingProductId === activeProduct.id ? "Adding..." : "Add to cart"}
              </button>
              <button class="product-buy-now-button" type="button" data-buy-now="${activeProduct.id}">Buy Now</button>
            </aside>
          </section>
        `;

    return `
      <div class="site-shell">
        ${sharedHeaderMarkup}
        <div class="page-dim-overlay"></div>

        <nav class="detail-department-nav">
          <a href="/">Electronics</a>
          <a href="/">Mobiles & Accessories</a>
          <a href="/">Audio</a>
          <a href="/">Fashion</a>
          <a href="/">Office & Stationery</a>
        </nav>

        <main class="product-detail-shell">
          ${error && !activeProduct ? `<p class="error-banner">${escapeHtml(error)}</p>` : ""}
          ${detailContent}
        </main>
      </div>
    `;
  }, [
    addingProductId,
    error,
    loadingProductDetail,
    productDetail,
    searchTerm,
    selectedCategory,
    selectedLanguageCode,
    accountMenuOpen,
    currentUser,
    languageMenuOpen,
    selectedProductImageIndex,
    cartSummary.itemCount,
  ]);

  const cartPageMarkup = useMemo(() => {
    const cartModels = cartItems.map((item) => new CartItemModel(item));
    const recommendedItems = getProducts(4, 52);

    const cartItemsMarkup =
      cartModels.length === 0
        ? `<div class="listing-status-card cart-empty-card">Your cart is empty.</div>`
        : cartModels
            .map(
              (item) => `
                <article class="cart-page-item">
                  <div class="cart-page-checkbox">
                    <input type="checkbox" checked disabled />
                  </div>
                  <a href="/product/${item.productId}" class="cart-page-item-image" data-product-link="${item.productId}">
                    <img src="${escapeHtml(item.primaryImage)}" alt="${escapeHtml(item.name)}" ${getImageAttributes()} />
                  </a>
                  <div class="cart-page-item-copy">
                    <a href="/product/${item.productId}" class="cart-page-item-title" data-product-link="${item.productId}">
                      ${escapeHtml(item.name)}
                    </a>
                    <p class="cart-page-stock">${item.inStockLabel}</p>
                    <p class="cart-page-delivery">FREE delivery by Amazon clone</p>
                    <p class="cart-page-meta"><strong>Category:</strong> ${escapeHtml(item.category)}</p>
                    <div class="cart-page-controls">
                      <div class="cart-quantity-pill">
                        <button
                          type="button"
                          class="cart-quantity-button"
                          data-cart-decrease="${item.id}"
                          ${cartActionItemId === item.id ? "disabled" : ""}
                        >
                          −
                        </button>
                        <span>${item.quantity}</span>
                        <button
                          type="button"
                          class="cart-quantity-button"
                          data-cart-increase="${item.id}"
                          ${cartActionItemId === item.id ? "disabled" : ""}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        class="cart-inline-link"
                        data-cart-remove="${item.id}"
                        ${cartActionItemId === item.id ? "disabled" : ""}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div class="cart-page-item-price">
                    <strong>${formatPrice(item.lineTotal)}</strong>
                    <span>${formatPrice(item.price)} each</span>
                  </div>
                </article>
              `
            )
            .join("");

    const recommendationsMarkup = recommendedItems
      .map((product) => {
        const image = product.images?.[0] || "https://via.placeholder.com/220x220?text=Product";

        return `
          <article class="cart-recommendation-card">
            <a href="/product/${product.id}" data-product-link="${product.id}">
              <img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}" ${getImageAttributes()} />
            </a>
            <a href="/product/${product.id}" class="cart-recommendation-title" data-product-link="${product.id}">
              ${escapeHtml(product.name)}
            </a>
            <p class="cart-recommendation-price">${formatPrice(product.price)}</p>
            <button
              type="button"
              class="search-result-cart-button cart-recommendation-button"
              data-product-id="${product.id}"
              ${addingProductId === product.id ? "disabled" : ""}
            >
              ${addingProductId === product.id ? "Adding..." : "Add to cart"}
            </button>
          </article>
        `;
      })
      .join("");

    return `
      <div class="site-shell">
        ${sharedHeaderMarkup}
        <div class="page-dim-overlay"></div>

        <main class="cart-page-shell">
          <section class="cart-page-main">
            <div class="cart-page-list-card">
              <div class="cart-page-header">
                <div>
                  <h1>Shopping Cart</h1>
                  <p>View all items added to cart</p>
                </div>
                <span class="cart-page-header-price">Price</span>
              </div>

              ${cartItemsMarkup}

              <div class="cart-page-footer-subtotal">
                Subtotal (${cartSummary.itemCount} items): <strong>${formatPrice(cartSummary.subtotal)}</strong>
              </div>
            </div>

            <section class="cart-page-section">
              <h2>Your Items</h2>
              <div class="cart-recommendations-grid">
                ${recommendationsMarkup}
              </div>
            </section>
          </section>

          <aside class="cart-page-sidebar">
            <div class="cart-summary-card">
              <p class="cart-summary-card-subtotal">
                Subtotal (${cartSummary.itemCount} items): <strong>${formatPrice(cartSummary.subtotal)}</strong>
              </p>
              <label class="cart-gift-row">
                <input type="checkbox" />
                <span>This order contains a gift</span>
              </label>
              <button type="button" class="cart-proceed-button" data-open-checkout="true">Proceed to Buy</button>
            </div>

            <div class="cart-summary-card">
              <h3>Cart Summary</h3>
              <div class="cart-summary-line">
                <span>Subtotal</span>
                <strong>${formatPrice(cartSummary.subtotal)}</strong>
              </div>
              <div class="cart-summary-line">
                <span>Total</span>
                <strong>${formatPrice(cartSummary.total)}</strong>
              </div>
            </div>

            <div class="cart-summary-card">
              <h3>Deals on popular reorders</h3>
              <div class="cart-sidebar-recommendations">
                ${recommendationsMarkup}
              </div>
            </div>
          </aside>
        </main>
      </div>
    `;
  }, [
    addingProductId,
    allProducts,
    cartActionItemId,
    cartItems,
    cartSummary.itemCount,
    cartSummary.subtotal,
    cartSummary.total,
    accountMenuOpen,
    currentUser,
    languageMenuOpen,
    selectedCategory,
    selectedLanguageCode,
  ]);

  const checkoutMarkup = useMemo(() => {
    const cartModels = cartItems.map((item) => new CartItemModel(item));
    const isCartEmpty = cartModels.length === 0;
    const reviewMarkup = cartModels
      .map(
        (item) => `
          <article class="checkout-review-item">
            <img src="${escapeHtml(item.primaryImage)}" alt="${escapeHtml(item.name)}" ${getImageAttributes()} />
            <div>
              <h3>${escapeHtml(item.name)}</h3>
              <p>Qty: ${item.quantity}</p>
            </div>
            <strong>${formatPrice(item.lineTotal)}</strong>
          </article>
        `
      )
      .join("");

    const paymentOptions = [
      ["card", "Credit or debit card", "Visa, Mastercard, Amex, Diners, Maestro and RuPay accepted."],
      ["netbanking", "Net Banking", "Choose your bank and continue with secure bank authentication."],
      ["upi", "Scan and Pay with UPI", "You will need to scan the QR code on the payment page to complete the payment."],
      ["emi", "EMI", "Monthly installment options are available on eligible orders."],
      ["cod", "Cash on Delivery/Pay on Delivery", "Cash, UPI and Cards accepted on delivery."],
    ];

    return `
      <div class="site-shell checkout-site-shell">
        ${secureCheckoutHeaderMarkup}

        <main class="checkout-shell">
          <section class="checkout-main">
            <div class="checkout-address-card">
              <div class="checkout-card-head">
                <div>
                  <h2>Delivering to ${escapeHtml(savedCheckoutAddress.fullName)}</h2>
                  <p>${escapeHtml(formatAddressForDisplay(savedCheckoutAddress))}</p>
                  <p>Phone: ${escapeHtml(savedCheckoutAddress.phone)}</p>
                </div>
                <button type="button" class="checkout-inline-button" data-edit-address="true">
                  ${isEditingCheckoutAddress ? "Close" : "Change"}
                </button>
              </div>

              ${
                isEditingCheckoutAddress
                  ? `
                    <form class="checkout-address-form" data-checkout-address-form="true">
                      <div class="checkout-form-grid">
                        <label>
                          Full name
                          <input name="fullName" data-checkout-field="fullName" value="${escapeHtml(checkoutAddressDraftRef.current.fullName)}" />
                        </label>
                        <label>
                          Phone number
                          <input name="phone" data-checkout-field="phone" value="${escapeHtml(checkoutAddressDraftRef.current.phone)}" />
                        </label>
                        <label class="checkout-field-span">
                          Address line 1
                          <input name="addressLine1" data-checkout-field="addressLine1" value="${escapeHtml(checkoutAddressDraftRef.current.addressLine1)}" />
                        </label>
                        <label class="checkout-field-span">
                          Address line 2
                          <input name="addressLine2" data-checkout-field="addressLine2" value="${escapeHtml(checkoutAddressDraftRef.current.addressLine2)}" />
                        </label>
                        <label>
                          State
                          <input name="state" data-checkout-field="state" value="${escapeHtml(checkoutAddressDraftRef.current.state)}" />
                        </label>
                        <label>
                          Postal code
                          <input name="postalCode" data-checkout-field="postalCode" value="${escapeHtml(checkoutAddressDraftRef.current.postalCode)}" />
                        </label>
                        <label>
                          Country
                          <input name="country" data-checkout-field="country" value="${escapeHtml(checkoutAddressDraftRef.current.country)}" />
                        </label>
                      </div>
                      <button type="submit" class="checkout-save-address-button">Save address</button>
                    </form>
                  `
                  : `<button type="button" class="checkout-link-row">Add delivery instructions</button>`
              }
            </div>

            <div class="checkout-payment-card">
              <h2>Payment method</h2>
              <div class="checkout-payment-panel">
                <section class="checkout-payment-balance">
                  <h3>Your available balance</h3>
                  <div class="checkout-balance-note">Use your Amazon Pay Balance</div>
                  <p>Insufficient balance. Know More</p>
                </section>

                <section class="checkout-payment-options">
                  <h3>Another payment method</h3>
                  ${paymentOptions
                    .map(
                      ([value, label, description]) => `
                        <label class="checkout-payment-option">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="${value}"
                            data-payment-method="true"
                            ${selectedPaymentMethod === value ? "checked" : ""}
                          />
                          <div>
                            <strong>${label}</strong>
                            <p>${description}</p>
                          </div>
                        </label>
                      `
                    )
                    .join("")}
                </section>
              </div>
            </div>

            <section class="checkout-review-card">
              <h2>Order summary review</h2>
              ${
                isCartEmpty
                  ? `<div class="listing-status-card">Your cart is empty. Add items before checkout.</div>`
                  : reviewMarkup
              }
            </section>
          </section>

          <aside class="checkout-sidebar">
            <div class="checkout-summary-card">
              <button
                type="button"
                class="checkout-place-button"
                data-place-order="true"
                ${isCartEmpty || placingOrder ? "disabled" : ""}
              >
                ${placingOrder ? "Placing order..." : "Use this payment method"}
              </button>

              <div class="checkout-summary-lines">
                <div><span>Items:</span><strong>${formatPrice(cartSummary.subtotal)}</strong></div>
                <div><span>Delivery:</span><strong>--</strong></div>
              </div>

              <div class="checkout-order-total">
                <span>Order Total:</span>
                <strong>${formatPrice(cartSummary.total)}</strong>
              </div>
            </div>
          </aside>
        </main>
      </div>
    `;
  }, [
    cartItems,
    cartSummary.itemCount,
    cartSummary.subtotal,
    cartSummary.total,
    isEditingCheckoutAddress,
    placingOrder,
    savedCheckoutAddress,
    selectedPaymentMethod,
  ]);

  const orderConfirmationMarkup = useMemo(() => {
    const confirmationItems =
      orderConfirmation?.items?.map(
        (item) => `
          <article class="confirmation-item">
            <img
              src="${escapeHtml(item.images?.[0] || "https://via.placeholder.com/220x220?text=Product")}"
              alt="${escapeHtml(item.name)}"
              ${getImageAttributes()}
            />
            <div>
              <h3>${escapeHtml(item.name)}</h3>
              <p>Qty: ${item.quantity}</p>
              <p>${escapeHtml(item.category || "Product")}</p>
            </div>
            <strong>${formatPrice(Number(item.price) * Number(item.quantity))}</strong>
          </article>
        `
      ).join("") || "";

    return `
      <div class="site-shell checkout-site-shell">
        ${secureCheckoutHeaderMarkup}

        <main class="confirmation-shell">
          ${
            loadingOrderConfirmation
              ? `<div class="listing-status-card">Loading order confirmation...</div>`
              : !orderConfirmation
                ? `<div class="listing-status-card">Order confirmation not available.</div>`
                : `
                  <section class="confirmation-card">
                    <p class="confirmation-eyebrow">Order placed successfully</p>
                    <h1>Thank you for shopping with Amazon clone</h1>
                    <p class="confirmation-id">Order ID: <strong>#${orderConfirmation.id}</strong></p>
                    <p class="confirmation-address">Shipping to: ${escapeHtml(orderConfirmation.address)}</p>
                    <div class="checkout-order-total confirmation-total">
                      <span>Total paid</span>
                      <strong>${formatPrice(orderConfirmation.total)}</strong>
                    </div>
                    <div class="confirmation-items">
                      ${confirmationItems}
                    </div>
                    <div class="confirmation-actions">
                      <button type="button" class="checkout-place-button" data-go-home="true">Continue shopping</button>
                      <button type="button" class="checkout-secondary-button" data-go-cart="true">Open cart</button>
                    </div>
                  </section>
                `
          }
        </main>
      </div>
    `;
  }, [loadingOrderConfirmation, orderConfirmation, cartSummary.itemCount]);

  const handleHomepageClick = (event) => {
    const addButton = event.target.closest("[data-product-id]");
    const cartNav = event.target.closest("[data-go-cart]");
    const homeNav = event.target.closest("[data-go-home]");
    const authAction = event.target.closest("[data-open-auth]");
    const buyNowButton = event.target.closest("[data-buy-now]");
    const openCheckoutButton = event.target.closest("[data-open-checkout]");
    const editAddressHeaderButton = event.target.closest("[data-edit-address-header]");
    const placeOrderButton = event.target.closest("[data-place-order]");
    const editAddressButton = event.target.closest("[data-edit-address]");
    const resultsCategoryButton = event.target.closest("[data-results-category]");
    const priceFilterButton = event.target.closest("[data-price-min], [data-price-max]");
    const ratingFilterButton = event.target.closest("[data-min-rating]");
    const cartIncrease = event.target.closest("[data-cart-increase]");
    const cartDecrease = event.target.closest("[data-cart-decrease]");
    const cartRemove = event.target.closest("[data-cart-remove]");
    const productLink = event.target.closest("[data-product-link]");
    const imageThumb = event.target.closest("[data-product-image-index]");
    const heroArrow = event.target.closest("[data-hero-direction]");
    const heroDot = event.target.closest("[data-hero-index]");
    const resultsLink = event.target.closest("[data-go-results]");
    const languageTrigger = event.target.closest("[data-language-trigger]");
    const languageOption = event.target.closest("[data-language-code]");
    const accountTrigger = event.target.closest("[data-account-trigger]");
    const languageMenu = event.target.closest(".language-menu");
    const accountMenu = event.target.closest(".account-menu");

    if (event.target.closest(".strip-arrow")) {
      event.preventDefault();
      return;
    }

    if (authAction) {
      event.preventDefault();
      if (authAction.dataset.openAuth === "signout") {
        signOut();
      } else {
        openAuthPage(authAction.dataset.openAuth);
      }
      return;
    }

    if (homeNav) {
      event.preventDefault();
      navigateTo("/");
      setCurrentView("home");
      return;
    }

    if (cartNav) {
      event.preventDefault();
      openCartPage();
      return;
    }

    if (buyNowButton) {
      event.preventDefault();
      handleBuyNow(Number(buyNowButton.dataset.buyNow));
      return;
    }

    if (editAddressHeaderButton) {
      event.preventDefault();
      openAddressEditor();
      return;
    }

    if (openCheckoutButton) {
      event.preventDefault();
      openCheckoutPage();
      return;
    }

    if (placeOrderButton) {
      event.preventDefault();
      placeOrder();
      return;
    }

    if (editAddressButton) {
      event.preventDefault();
      setIsEditingCheckoutAddress((currentValue) => !currentValue);
      return;
    }

    if (cartIncrease) {
      event.preventDefault();
      const cartItem = cartItems.find(
        (item) => item.id === Number(cartIncrease.dataset.cartIncrease)
      );

      if (cartItem) {
        updateCartItemQuantity(cartItem.id, Number(cartItem.quantity) + 1);
      }
      return;
    }

    if (cartDecrease) {
      event.preventDefault();
      const cartItem = cartItems.find(
        (item) => item.id === Number(cartDecrease.dataset.cartDecrease)
      );

      if (cartItem) {
        updateCartItemQuantity(cartItem.id, Number(cartItem.quantity) - 1);
      }
      return;
    }

    if (cartRemove) {
      event.preventDefault();
      removeCartItem(Number(cartRemove.dataset.cartRemove));
      return;
    }

    if (addButton) {
      event.preventDefault();
      addToCart(Number(addButton.dataset.productId));
      return;
    }

    if (productLink) {
      event.preventDefault();
      openProductDetail(Number(productLink.dataset.productLink));
      return;
    }

    if (resultsCategoryButton) {
      event.preventDefault();
      openSearchResults(
        appliedSearchTerm,
        resultsCategoryButton.dataset.resultsCategory,
        appliedMinPrice,
        appliedMaxPrice,
        appliedMinRating
      );
      return;
    }

    if (priceFilterButton) {
      event.preventDefault();
      openSearchResults(
        appliedSearchTerm,
        appliedCategory,
        priceFilterButton.dataset.priceMin || "",
        priceFilterButton.dataset.priceMax || "",
        appliedMinRating
      );
      return;
    }

    if (ratingFilterButton) {
      event.preventDefault();
      openSearchResults(
        appliedSearchTerm,
        appliedCategory,
        appliedMinPrice,
        appliedMaxPrice,
        ratingFilterButton.dataset.minRating || ""
      );
      return;
    }

    if (imageThumb) {
      event.preventDefault();
      setSelectedProductImageIndex(Number(imageThumb.dataset.productImageIndex));
      return;
    }

    if (resultsLink) {
      event.preventDefault();
      const linkUrl = new URL(resultsLink.getAttribute("href"), window.location.origin);
      openSearchResults(
        linkUrl.searchParams.get("search") || appliedSearchTerm,
        linkUrl.searchParams.get("category") || appliedCategory,
        linkUrl.searchParams.get("minPrice") || appliedMinPrice,
        linkUrl.searchParams.get("maxPrice") || appliedMaxPrice,
        linkUrl.searchParams.get("minRating") || appliedMinRating
      );
      return;
    }

    if (languageTrigger) {
      event.preventDefault();
      setAccountMenuOpen(false);
      setLanguageMenuOpen((currentValue) => !currentValue);
      return;
    }

    if (languageOption) {
      event.preventDefault();
      setSelectedLanguageCode(languageOption.dataset.languageCode);
      setLanguageMenuOpen(false);
      return;
    }

    if (accountTrigger) {
      event.preventDefault();
      setLanguageMenuOpen(false);
      setAccountMenuOpen((currentValue) => !currentValue);
      return;
    }

    if (heroArrow) {
      event.preventDefault();
      changeHeroSlide(heroArrow.dataset.heroDirection);
      return;
    }

    if (heroDot) {
      event.preventDefault();
      const nextIndex = Number(heroDot.dataset.heroIndex);
      const direction = nextIndex < heroSlideIndex ? "prev" : "next";
      setHeroSlide(nextIndex, direction);
      return;
    }

    if (!languageMenu && languageMenuOpen) {
      setLanguageMenuOpen(false);
    }

    if (!accountMenu && !accountTrigger && accountMenuOpen) {
      setAccountMenuOpen(false);
    }
  };

  const handleHomepageSubmit = (event) => {
    if (event.target.matches("[data-auth-form='signin'], [data-auth-form='signup']")) {
      event.preventDefault();
      submitAuthForm(event.target.dataset.authForm, event.target);
      return;
    }

    if (event.target.closest(".search-shell")) {
      event.preventDefault();
      const submittedSearchTerm = headerSearchDraftRef.current.trim();

      setSearchTerm(submittedSearchTerm);
      openSearchResults(submittedSearchTerm, selectedCategory);
      return;
    }

    if (event.target.matches("[data-checkout-address-form='true']")) {
      event.preventDefault();
      saveCheckoutAddressFromForm(event.target);
    }
  };

  const handleHomepageInput = (event) => {
    if (event.target.matches("[name='name'], [name='email'], [name='password']")) {
      if (currentView === "signin" || currentView === "signup") {
        setError("");
      }

      authDraftRef.current = {
        ...authDraftRef.current,
        [event.target.name]: event.target.value,
      };
      return;
    }

    if (event.target.id === "search-input") {
      headerSearchDraftRef.current = event.target.value;
      return;
    }

    if (event.target.matches("[data-header-category='true']")) {
      setSelectedCategory(event.target.value);
      return;
    }

    if (event.target.matches("[data-payment-method='true']")) {
      setSelectedPaymentMethod(event.target.value);
      return;
    }

    const checkoutField = event.target.dataset.checkoutField;
    if (checkoutField) {
      checkoutAddressDraftRef.current = {
        ...checkoutAddressDraftRef.current,
        [checkoutField]: event.target.value,
      };
    }
  };

  const handleHomepageFocus = (event) => {
    if (event.target.id === "search-input" || event.target.matches("[data-header-category='true']")) {
      isHeaderSearchFocusedRef.current = true;
    }
  };

  const handleHomepageBlur = (event) => {
    if (event.target.id === "search-input" || event.target.matches("[data-header-category='true']")) {
      isHeaderSearchFocusedRef.current = false;
    }
  };

  return (
    <div className="react-storefront">
      <div
        onClick={handleHomepageClick}
        onSubmit={handleHomepageSubmit}
        onInput={handleHomepageInput}
        onChange={handleHomepageInput}
        onFocusCapture={handleHomepageFocus}
        onBlurCapture={handleHomepageBlur}
        dangerouslySetInnerHTML={{
          __html:
            currentView === "signin" || currentView === "signup"
              ? authPageMarkup
              : currentView === "detail"
              ? productDetailMarkup
              : currentView === "results"
                ? searchResultsMarkup
                : currentView === "cart"
                  ? cartPageMarkup
                  : currentView === "checkout"
                    ? checkoutMarkup
                    : currentView === "confirmation"
                      ? orderConfirmationMarkup
                      : homepageMarkup,
        }}
      />
    </div>
  );
}

export default App;
