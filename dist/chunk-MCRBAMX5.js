// node_modules/nanostores/clean-stores/index.js
var clean = /* @__PURE__ */ Symbol("clean");

// node_modules/nanostores/atom/index.js
var listenerQueue = [];
var atom = (initialValue, level) => {
  let listeners = [];
  let $atom = {
    get() {
      if (!$atom.lc) {
        $atom.listen(() => {
        })();
      }
      return $atom.value;
    },
    l: level || 0,
    lc: 0,
    listen(listener, listenerLevel) {
      $atom.lc = listeners.push(listener, listenerLevel || $atom.l) / 2;
      return () => {
        let index = listeners.indexOf(listener);
        if (~index) {
          listeners.splice(index, 2);
          if (!--$atom.lc) $atom.off();
        }
      };
    },
    notify(oldValue, changedKey) {
      let runListenerQueue = !listenerQueue.length;
      for (let i = 0; i < listeners.length; i += 2) {
        listenerQueue.push(
          listeners[i],
          listeners[i + 1],
          $atom.value,
          oldValue,
          changedKey
        );
      }
      if (runListenerQueue) {
        for (let i = 0; i < listenerQueue.length; i += 5) {
          let skip;
          for (let j = i + 1; !skip && (j += 5) < listenerQueue.length; ) {
            if (listenerQueue[j] < listenerQueue[i + 1]) {
              skip = listenerQueue.push(
                listenerQueue[i],
                listenerQueue[i + 1],
                listenerQueue[i + 2],
                listenerQueue[i + 3],
                listenerQueue[i + 4]
              );
            }
          }
          if (!skip) {
            listenerQueue[i](
              listenerQueue[i + 2],
              listenerQueue[i + 3],
              listenerQueue[i + 4]
            );
          }
        }
        listenerQueue.length = 0;
      }
    },
    /* It will be called on last listener unsubscribing.
       We will redefine it in onMount and onStop. */
    off() {
    },
    set(newValue) {
      let oldValue = $atom.value;
      if (oldValue !== newValue) {
        $atom.value = newValue;
        $atom.notify(oldValue);
      }
    },
    subscribe(listener, listenerLevel) {
      let unbind = $atom.listen(listener, listenerLevel);
      listener($atom.value);
      return unbind;
    },
    value: initialValue
  };
  if (process.env.NODE_ENV !== "production") {
    $atom[clean] = () => {
      listeners = [];
      $atom.lc = 0;
      $atom.off();
    };
  }
  return $atom;
};

// node_modules/nanostores/map/index.js
var map = (initial = {}) => {
  let $map = atom(initial);
  $map.setKey = function(key, value) {
    let oldMap = $map.value;
    if (typeof value === "undefined" && key in $map.value) {
      $map.value = { ...$map.value };
      delete $map.value[key];
      $map.notify(oldMap, key);
    } else if ($map.value[key] !== value) {
      $map.value = {
        ...$map.value,
        [key]: value
      };
      $map.notify(oldMap, key);
    }
  };
  return $map;
};

// src/core/state.ts
var $state = map({});
var STORAGE_KEY = "lander-engine-state";
function isBrowser() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}
function persistState() {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify($state.get()));
  } catch (err) {
    console.warn("lander-engine: failed to persist state", err);
  }
}
function loadPersistedState() {
  if (!isBrowser()) return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn("lander-engine: failed to load persisted state", err);
    return null;
  }
}
var persisted = loadPersistedState();
if (persisted) {
  $state.set(persisted);
}
function hydrateState(initialData) {
  $state.set(initialData);
  persistState();
}
function setState(key, value) {
  $state.setKey(key, value);
  persistState();
}
function toggleState(key) {
  const current = $state.get()[key];
  $state.setKey(key, !current);
  persistState();
}
function getState(key) {
  const current = $state.get()[key];
  if (current !== void 0) {
    return current;
  }
  const fromStorage = loadPersistedState();
  return fromStorage ? fromStorage[key] : void 0;
}

// src/core/registry.ts
var Registry = class {
  components = {};
  actions = {};
  registerComponent(name, component) {
    this.components[name] = component;
  }
  registerComponents(components) {
    this.components = { ...this.components, ...components };
  }
  getComponent(name) {
    return this.components[name];
  }
  registerAction(name, handler) {
    this.actions[name] = handler;
  }
  registerActions(actions) {
    this.actions = { ...this.actions, ...actions };
  }
  getAction(name) {
    return this.actions[name];
  }
  getAllComponents() {
    return this.components;
  }
  getAllActions() {
    return this.actions;
  }
};
var registry = new Registry();

// src/core/loading.ts
function getRestLoadingKey(loadingKey, stateKey) {
  return loadingKey || `loading_${stateKey || "request"}`;
}
function extractActionKeys(actions) {
  const loadingKeys = /* @__PURE__ */ new Set();
  const stateKeys = /* @__PURE__ */ new Set();
  const walk = (action) => {
    if (!action || typeof action !== "object") return;
    const loadingKey = action.payload?.loadingKey;
    if (loadingKey) {
      loadingKeys.add(loadingKey);
    } else if (action.type === "rest") {
      loadingKeys.add(getRestLoadingKey(action.payload?.loadingKey, action.payload?.stateKey));
    }
    const stateKey = action.payload?.stateKey;
    if (stateKey) {
      stateKeys.add(stateKey);
    }
    if (action.type === "sequence" && Array.isArray(action.payload?.actions)) {
      action.payload.actions.forEach(walk);
    }
    if (action.type === "conditional") {
      if (Array.isArray(action.payload?.onTrue)) action.payload.onTrue.forEach(walk);
      if (Array.isArray(action.payload?.onFalse)) action.payload.onFalse.forEach(walk);
    }
  };
  if (Array.isArray(actions)) {
    actions.forEach(walk);
  }
  return { loadingKeys: Array.from(loadingKeys), stateKeys: Array.from(stateKeys) };
}
function watchLoadingAction(actions = null, callback, explicitLoadingKeys = []) {
  let { loadingKeys, stateKeys } = extractActionKeys(
    Array.isArray(actions) ? actions : actions ? [actions] : []
  );
  loadingKeys = Array.from(/* @__PURE__ */ new Set([...loadingKeys, ...explicitLoadingKeys]));
  const updateState = () => {
    const current = $state.get();
    const isLoading = loadingKeys.some((k) => Boolean(current[k]));
    const values = {};
    stateKeys.forEach((key) => {
      if (current[key] !== void 0) {
        values[key] = current[key];
      }
    });
    callback({ isLoading, values });
  };
  updateState();
  const unsubscribe = $state.listen(updateState);
  return unsubscribe;
}
function getLoadingActionState(actions = null, explicitLoadingKeys = []) {
  let { loadingKeys, stateKeys } = extractActionKeys(
    Array.isArray(actions) ? actions : actions ? [actions] : []
  );
  loadingKeys = Array.from(/* @__PURE__ */ new Set([...loadingKeys, ...explicitLoadingKeys]));
  const current = $state.get();
  const isLoading = loadingKeys.some((k) => Boolean(current[k]));
  const values = {};
  stateKeys.forEach((key) => {
    if (current[key] !== void 0) {
      values[key] = current[key];
    }
  });
  return { isLoading, values };
}

// src/core/dispatcher.ts
var ActionDispatcher = class {
  /**
   * Dispatches a single action or an array of actions.
   */
  async dispatch(action) {
    if (Array.isArray(action)) {
      for (const a of action) {
        await this.executeAction(a);
      }
    } else {
      await this.executeAction(action);
    }
  }
  /**
   * Resolves an internal step path to the correct variant+mobile URL.
   *
   * Accepts a bare step name ("secondary"), an absolute step path
   * ("/campaign/secondary"), or an already-suffixed path.  Reads
   * __landerCampaignConfigs (registered by the Astro template) and the stored
   * variant from localStorage, plus the current user-agent, to produce the
   * canonical URL the router should navigate to.
   */
  resolveInternalUrl(to) {
    const toParts = to.replace(/^\//, "").split("/").filter(Boolean);
    if (toParts.length === 1) {
      const campaign = window.location.pathname.split("/").filter(Boolean)[0];
      if (campaign) toParts.unshift(campaign);
    }
    if (toParts.length < 2) return to;
    const configs = window.__landerCampaignConfigs ?? {};
    const campaignId = toParts[0];
    const config = configs[campaignId];
    if (!config) return to;
    const { variants, hasMobileRoute } = config;
    let stepSlug = toParts[toParts.length - 1];
    const slugNoMobile = stepSlug.endsWith(".mobile") ? stepSlug.slice(0, -7) : stepSlug;
    let baseSlug = slugNoMobile;
    for (const v of variants) {
      if (slugNoMobile.endsWith("." + v)) {
        baseSlug = slugNoMobile.slice(0, -(v.length + 1));
        break;
      }
    }
    let targetVariant = null;
    if (variants.length > 0) {
      const stored = localStorage.getItem(`lander-variant-${campaignId}`);
      if (stored && variants.includes(stored)) {
        targetVariant = stored;
      } else {
        targetVariant = variants[Math.floor(Math.random() * variants.length)];
        localStorage.setItem(`lander-variant-${campaignId}`, targetVariant);
      }
    }
    const isMobile = hasMobileRoute && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent || navigator.vendor || window.opera || ""
    );
    let targetSlug = baseSlug;
    if (targetVariant) targetSlug += "." + targetVariant;
    if (isMobile) targetSlug += ".mobile";
    toParts[toParts.length - 1] = targetSlug;
    return "/" + toParts.join("/");
  }
  /** Navigate internally using Astro's SPA router when available. */
  navigateTo(path, replace = false) {
    const nav = window.__landerNavigate;
    if (nav) {
      nav(path);
    } else if (replace) {
      window.location.replace(path);
    } else {
      window.location.href = path;
    }
  }
  /**
   * Evaluates a condition string against the current state.
   */
  evaluateCondition(condition) {
    const currentState = $state.get();
    try {
      if (Object.prototype.hasOwnProperty.call(currentState, condition)) {
        return !!currentState[condition];
      }
      return new Function("state", `with(state) { return ${condition}; }`)(currentState);
    } catch (e) {
      console.error(`Failed to evaluate condition: ${condition}`, e);
      return false;
    }
  }
  /**
   * Core logic for executing a single action.
   */
  async executeAction(action) {
    switch (action.type) {
      case "setState":
        setState(action.payload.key, action.payload.value);
        break;
      case "toggleState":
        toggleState(action.payload.key);
        break;
      case "rest": {
        const { url, method = "GET", headers, body, onSuccess, onError, stateKey, loadingKey } = action.payload;
        const loadKey = getRestLoadingKey(loadingKey, stateKey);
        try {
          setState(loadKey, true);
          const response = await fetch(url, {
            method,
            headers: {
              "Content-Type": "application/json",
              ...headers
            },
            body: body ? JSON.stringify(body) : void 0
          });
          if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
          const data = await response.json();
          if (stateKey) {
            setState(stateKey, data);
          }
          setState(loadKey, false);
          if (onSuccess) await this.dispatch(onSuccess);
        } catch (error) {
          console.error(`REST Action failed: ${url}`, error);
          setState(loadKey, false);
          if (onError) await this.dispatch(onError);
        }
        break;
      }
      case "navigation": {
        const { to, type, replace } = action.payload;
        if (type === "external") {
          if (replace) {
            window.location.replace(to);
          } else {
            window.location.href = to;
          }
        } else {
          const corrected = this.resolveInternalUrl(to);
          this.navigateTo(corrected, replace);
        }
        break;
      }
      case "sequence":
        await this.dispatch(action.payload.actions);
        break;
      case "conditional":
        if (this.evaluateCondition(action.payload.condition)) {
          await this.dispatch(action.payload.onTrue);
        } else if (action.payload.onFalse) {
          await this.dispatch(action.payload.onFalse);
        }
        break;
      case "ui":
        this.handleUIAction(action.payload.operation, action.payload.params);
        break;
      default: {
        const customAction = registry.getAction(action.type);
        if (customAction) {
          await customAction(action.payload);
        } else {
          console.warn(`Unknown action type: ${action.type}`);
        }
      }
    }
  }
  handleUIAction(operation, params) {
    switch (operation) {
      case "scrollTo":
        window.scrollTo({
          top: params?.top || 0,
          behavior: params?.behavior || "smooth"
        });
        break;
      case "copyToClipboard":
        if (params?.text) {
          navigator.clipboard.writeText(params.text);
        }
        break;
      case "openPopup": {
        const popupId = params?.popupId;
        if (!popupId) {
          console.warn("openPopup requires popupId in params");
          return;
        }
        const modal = document.getElementById(`modal-${popupId}`);
        if (modal) {
          modal.classList.remove("modal-hidden");
        } else {
          console.warn(`Modal with id 'modal-${popupId}' not found`);
        }
        break;
      }
      case "closePopup": {
        const popupId = params?.popupId;
        if (!popupId) {
          console.warn("closePopup requires popupId in params");
          return;
        }
        const modal = document.getElementById(`modal-${popupId}`);
        if (modal) {
          modal.classList.add("modal-hidden");
        }
        break;
      }
      case "goToNextStep": {
        const nextStep = params?.next;
        let targetPath = "/";
        if (typeof nextStep === "string") {
          const currentPathParts = window.location.pathname.split("/").filter(Boolean);
          const campaign = params?.campaignId || currentPathParts[0];
          if (campaign) {
            targetPath = `/${campaign}/${nextStep}`;
          } else {
            console.warn("goToNextStep: cannot infer campaign, defaulting to /");
            targetPath = `/${nextStep}`;
          }
        } else {
          console.warn("goToNextStep requires next step string in params.next");
        }
        this.navigateTo(this.resolveInternalUrl(targetPath));
        break;
      }
    }
  }
};
var dispatcher = new ActionDispatcher();

export {
  $state,
  hydrateState,
  setState,
  toggleState,
  getState,
  registry,
  watchLoadingAction,
  getLoadingActionState,
  ActionDispatcher,
  dispatcher
};
//# sourceMappingURL=chunk-MCRBAMX5.js.map